import fs from 'fs';
import path from 'path';
import process from 'process';
import http from 'http';
import https from 'https';
import yaml from 'js-yaml';
import { utility } from './utility.mjs';
import { logger } from './logger.mjs';
import { database } from './database.mjs';
import { tallyConfig, tableConfigYAML } from './definition.mjs';

interface CompanyConfig {
    company_id: string;
    company_name: string;
    divisions: DivisionConfig[];
}

interface DivisionConfig {
    division_id: string;
    division_name: string;
    tally_url: string;
}

interface MultiCompanyConfig {
    database: any;
    companies: CompanyConfig[];
    tally: {
        definition: string;
        fromdate: string;
        todate: string;
        sync: string;
        frequency: number;
    };
}

class _tallyMultiCompany {

    config: MultiCompanyConfig;
    lastAlterIdMaster: number = 0;
    lastAlterIdTransaction: number = 0;

    private lstTableMaster: tableConfigYAML[] = [];
    private lstTableTransaction: tableConfigYAML[] = [];

    //hidden commandline flags
    private importMaster = true;
    private importTransaction = true;
    private truncateTable = true;

    constructor() {
        try {
            // No .env file loading - using configuration file values only
            logger.logMessage('Using configuration file values only (no .env file)');

            // Initialize with default config - will be overridden by updateCommandlineConfig
            this.config = {
                database: {},
                companies: [],
                tally: {
                    definition: 'tally-export-config.yaml',
                    fromdate: 'auto',
                    todate: 'auto',
                    sync: 'incremental',
                    frequency: 0
                }
            };
        } catch (err) {
            logger.logError('tallyMultiCompany()', err);
            throw err;
        }
    }

    updateCommandlineConfig(lstConfigs: Map<string, string>): void {
        try {
            // Load config file if specified via command line
            if (lstConfigs.has('config')) {
                let configFile = lstConfigs.get('config') || '';
                if (fs.existsSync(configFile)) {
                    let configContent = fs.readFileSync(configFile, 'utf8');
                    this.config = JSON.parse(configContent);
                    logger.logMessage(`Tally config loaded from: ${configFile}`);
                } else {
                    throw new Error(`Configuration file not found: ${configFile}`);
                }
            } else {
                throw new Error('No configuration file specified. Use --config <config-file> to specify a configuration file.');
            }

            // Override with individual command line parameters if provided
            if (lstConfigs.has('tally-definition')) this.config.tally.definition = lstConfigs.get('tally-definition') || '';
            if (lstConfigs.has('tally-fromdate') && lstConfigs.has('tally-todate')) {
                let fromDate = lstConfigs.get('tally-fromdate') || '';
                let toDate = lstConfigs.get('tally-todate') || '';
                this.config.tally.fromdate = /^\d{4}-?\d{2}-?\d{2}$/g.test(fromDate) ? fromDate : 'auto';
                this.config.tally.todate = /^\d{4}-?\d{2}-?\d{2}$/g.test(toDate) ? toDate : 'auto';
            }
            if (lstConfigs.has('tally-sync')) this.config.tally.sync = lstConfigs.get('tally-sync') || 'full';
            if (lstConfigs.has('tally-frequency')) this.config.tally.frequency = parseInt(lstConfigs.get('tally-frequency') || '0');

            //flags
            if (lstConfigs.has('tally-master')) this.importMaster = lstConfigs.get('tally-master') == 'true';
            if (lstConfigs.has('tally-transaction')) this.importTransaction = lstConfigs.get('tally-transaction') == 'true';
            if (lstConfigs.has('tally-truncate')) this.truncateTable = lstConfigs.get('tally-truncate') == 'true';
        } catch (err) {
            logger.logError('tallyMultiCompany.updateCommandlineConfig()', err);
            throw err;
        }
    }

    importData(): Promise<void> {
        return new Promise<void>(async (resolve, reject) => {
            try {
                logger.logMessage('Multi-Company Tally to Database | version: 1.0.37');

                //Load YAML export definition file
                let pathTallyExportDefinition = this.config.tally.definition;
                if (fs.existsSync(`./${pathTallyExportDefinition}`)) {
                    let objYAML: any = yaml.load(fs.readFileSync(`./${pathTallyExportDefinition}`, 'utf-8'));
                    this.lstTableMaster = objYAML['master'];
                    this.lstTableTransaction = objYAML['transaction'];
                }
                else {
                    logger.logMessage('Tally export definition file specified does not exists or is invalid');
                    resolve();
                    return;
                }

                // Update database configuration with multi-company config
                database.config = this.config.database;
                await database.openConnectionPool();

                // Process each company and division
                for (const company of this.config.companies) {
                    logger.logMessage('Processing Company: %s', company.company_name);
                    
                    for (const division of company.divisions) {
                        logger.logMessage('  Processing Division: %s', division.division_name);
                        
                        try {
                            await this.processDivision(company, division);
                        } catch (err) {
                            logger.logError(`Error processing division ${division.division_name}`, err);
                            // Continue with next division instead of failing completely
                        }
                    }
                }

                resolve();
            } catch (err) {
                logger.logError('tallyMultiCompany.importData()', err);
                reject(err);
            } finally {
                await database.closeConnectionPool();
            }
        });
    }

    private async processDivision(company: CompanyConfig, division: DivisionConfig): Promise<void> {
        try {
            // Set the current Tally URL for this division
            const originalServer = database.config.server;
            database.config.server = division.tally_url;

            if (this.config.tally.sync == 'incremental') {
                await this.processIncrementalSync(company, division);
            } else {
                await this.processFullSync(company, division);
            }

            // Restore original server
            database.config.server = originalServer;
        } catch (err) {
            logger.logError(`Error in processDivision for ${division.division_name}`, err);
            throw err;
        }
    }

    private async processIncrementalSync(company: CompanyConfig, division: DivisionConfig): Promise<void> {
        if (!/^(mssql|mysql|postgres)$/g.test(database.config.technology)) {
            logger.logMessage('Incremental Sync is supported only for SQL Server / MySQL / PostgreSQL');
            return;
        }

        //set mandatory config required for incremental sync
        this.config.tally.fromdate = 'auto';
        this.config.tally.todate = 'auto';

        //delete and re-create CSV folder
        if (fs.existsSync('./csv'))
            fs.rmSync('./csv', { recursive: true });
        fs.mkdirSync('./csv');

        //acquire last AlterID of master & transaction from last sync version of Database
        logger.logMessage('Acquiring last AlterID from database for %s - %s', company.company_name, division.division_name);
        
        let lastAlterIdMasterDatabase = await database.executeScalar<number>(`
            select coalesce(max(cast(split_part(value, '_', 1) as ${database.config.technology == 'mysql' ? 'unsigned int' : 'int'})),0) x 
            from config 
            where name = 'Last AlterID Master' 
            and value like '%${company.company_id}%${division.division_id}%'
        `);
        let lastAlterIdTransactionDatabase = await database.executeScalar<number>(`
            select coalesce(max(cast(split_part(value, '_', 1) as ${database.config.technology == 'mysql' ? 'unsigned int' : 'int'})),0) x 
            from config 
            where name = 'Last AlterID Transaction' 
            and value like '%${company.company_id}%${division.division_id}%'
        `);

        //update active company information before starting import
        logger.logMessage('Updating company information configuration table for %s - %s', company.company_name, division.division_name);
        await this.saveCompanyInfo(company, division);

        //prepare substitution list of runtime values to reflected in TDL XML
        let configTallyXML = new Map<string, any>();
        configTallyXML.set('fromDate', utility.Date.parse(this.config.tally.fromdate, 'yyyy-MM-dd'));
        configTallyXML.set('toDate', utility.Date.parse(this.config.tally.todate, 'yyyy-MM-dd'));
        configTallyXML.set('targetCompany', '##SVCurrentCompany');

        logger.logMessage('Performing incremental sync for %s - %s', company.company_name, division.division_name);

        await this.updateLastAlterId(division.tally_url); //Update last alter ID
        let lastAlterIdMasterTally = this.lastAlterIdMaster;
        let lastAlterIdTransactionTally = this.lastAlterIdTransaction;

        //calculate flags to determine what changed
        let flgIsMasterChanged = lastAlterIdMasterTally != lastAlterIdMasterDatabase;
        let flgIsTransactionChanged = lastAlterIdTransactionTally != lastAlterIdTransactionDatabase;

        //terminate sync if nothing has changed
        if (!flgIsMasterChanged && !flgIsTransactionChanged) {
            logger.logMessage('  No change found for %s - %s', company.company_name, division.division_name);
            return;
        }

        // Process master tables
        if (flgIsMasterChanged) {
            for (let i = 0; i < this.lstTableMaster.length; i++) {
                let activeTable = this.lstTableMaster[i];

                //add AlterID filter
                if (!Array.isArray(activeTable.filters))
                    activeTable.filters = [];
                activeTable.filters.push(`$AlterID > ${lastAlterIdMasterDatabase}`);

                let targetTable = activeTable.name;
                await this.processReport(targetTable, activeTable, configTallyXML, company, division);
                await this.bulkLoadWithCompanyDivision(path.join(process.cwd(), `./csv/${targetTable}.data`), targetTable, activeTable.fields.map(p => p.type), company, division);
                fs.unlinkSync(path.join(process.cwd(), `./csv/${targetTable}.data`)); //delete raw file
                logger.logMessage('  syncing table %s for %s - %s', targetTable, company.company_name, division.division_name);
            }
        }

        // Process transaction tables
        if (flgIsTransactionChanged) {
            for (let i = 0; i < this.lstTableTransaction.length; i++) {
                let activeTable = this.lstTableTransaction[i];

                //add AlterID filter
                if (!Array.isArray(activeTable.filters))
                    activeTable.filters = [];
                activeTable.filters.push(`$AlterID > ${lastAlterIdTransactionDatabase}`);

                let targetTable = activeTable.name;
                await this.processReport(targetTable, activeTable, configTallyXML, company, division);
                await this.bulkLoadWithCompanyDivision(path.join(process.cwd(), `./csv/${targetTable}.data`), targetTable, activeTable.fields.map(p => p.type), company, division);
                fs.unlinkSync(path.join(process.cwd(), `./csv/${targetTable}.data`)); //delete raw file
                logger.logMessage('  syncing table %s for %s - %s', targetTable, company.company_name, division.division_name);
            }
        }

        // Update Last AlterID after successful incremental sync
        if (flgIsMasterChanged || flgIsTransactionChanged) {
            logger.logMessage('Updating Last AlterID after incremental sync for %s - %s', company.company_name, division.division_name);
            await this.saveCompanyInfo(company, division);
        }
    }

    private async processFullSync(company: CompanyConfig, division: DivisionConfig): Promise<void> {
        let lstTables: tableConfigYAML[] = [];
        if (this.importMaster) {
            lstTables.push(...this.lstTableMaster);
        }
        if (this.importTransaction) {
            lstTables.push(...this.lstTableTransaction);
        }

        //delete and re-create CSV folder
        if (fs.existsSync('./csv')) {
            fs.rmSync('./csv', { recursive: true });
        }
        fs.mkdirSync('./csv');

        if (/^(mssql|mysql|postgres|bigquery|csv)$/g.test(database.config.technology)) {
            //update active company information before starting import
            logger.logMessage('Updating company information configuration table for %s - %s', company.company_name, division.division_name);
            await this.saveCompanyInfo(company, division);
        }

        //prepare substitution list of runtime values to reflected in TDL XML
        let configTallyXML = new Map<string, any>();
        configTallyXML.set('fromDate', utility.Date.parse(this.config.tally.fromdate, 'yyyy-MM-dd'));
        configTallyXML.set('toDate', utility.Date.parse(this.config.tally.todate, 'yyyy-MM-dd'));
        configTallyXML.set('targetCompany', '##SVCurrentCompany');

        //dump data exported from Tally to CSV file required for bulk import
        logger.logMessage('Generating CSV files from Tally for %s - %s', company.company_name, division.division_name);
        for (let i = 0; i < lstTables.length; i++) {
            let timestampBegin = Date.now();
            let targetTable = lstTables[i].name;
            await this.processReport(targetTable, lstTables[i], configTallyXML, company, division);
            let timestampEnd = Date.now();
            let elapsedSecond = utility.Number.round((timestampEnd - timestampBegin) / 1000, 3);
            logger.logMessage('  saving file %s.csv for %s - %s [%f sec]', targetTable, company.company_name, division.division_name, elapsedSecond);
        }

        if (this.truncateTable) {
            if (/^(mssql|mysql|postgres)$/g.test(database.config.technology)) {
                // Only truncate tables for this specific company/division
                await this.truncateTablesForCompanyDivision(lstTables.map(p => p.name), company, division);
            }
        }

        if (/^(mssql|mysql|postgres)$/g.test(database.config.technology)) {
            //perform CSV file based bulk import into database
            logger.logMessage('Loading CSV files to database tables for %s - %s', company.company_name, division.division_name);
            for (let i = 0; i < lstTables.length; i++) {
                let targetTable = lstTables[i].name;
                let rowCount = await this.bulkLoadWithCompanyDivision(path.join(process.cwd(), `./csv/${targetTable}.data`), targetTable, lstTables[i].fields.map(p => p.type), company, division);
                fs.unlinkSync(path.join(process.cwd(), `./csv/${targetTable}.data`)); //delete raw file
                logger.logMessage('  %s: imported %d rows for %s - %s', targetTable, rowCount, company.company_name, division.division_name);
            }
            fs.rmdirSync('./csv'); //remove directory
        }
    }

    private async bulkLoadWithCompanyDivision(csvFile: string, targetTable: string, lstFieldType: string[], company: CompanyConfig, division: DivisionConfig): Promise<number> {
        return new Promise<number>(async (resolve, reject) => {
            let sqlQuery = '';
            try {
                sqlQuery = '';
                let rowCount = 0;

                if (database.config.loadmethod == 'insert') { //INSERT query based loading
                    let txtCSV = fs.readFileSync(csvFile, 'utf-8');
                    let lstLines = txtCSV.split(/\r\n/g);
                    let fieldList = lstLines.shift() || ''; //extract header
                    
                    // Add company_id and division_id to field list
                    fieldList = `company_id,division_id,${fieldList}`;
                    fieldList = fieldList.replace(/\t/g, ','); //replace tab with comma for header

                    while (lstLines.length) { //loop until row is found
                        sqlQuery = `insert into ${targetTable} (${fieldList}) values`;

                        let countBatch = 0; //number of rows in batch

                        //run a loop to keep on appending row to SQL Query values until max allowable size of query is exhausted
                        while (lstLines.length && (sqlQuery.length + lstLines[0].length + 3 < 50000) && ++countBatch <= 1000) {
                            let activeLine = lstLines.shift() || '';
                            let lstValues = activeLine.split('\t');
                            
                            // Prepend company_id and division_id values
                            lstValues.unshift(`'${division.division_id}'`);
                            lstValues.unshift(`'${company.company_id}'`);
                            
                            for (let i = 0; i < lstValues.length; i++) {
                                let targetFieldType = lstFieldType[i - 2] || 'text'; // Adjust index for added fields
                                let targetFieldValue = lstValues[i];
                                
                                if (i < 2) { // company_id and division_id are always text
                                    lstValues[i] = targetFieldValue; // Already quoted above
                                } else if (targetFieldType == 'text') {
                                    let hasUnicodeText = /[^\u0000-\u007f]/g.test(targetFieldValue);
                                    targetFieldValue = targetFieldValue.replace(/'/g, '\'\'');  //escape single quote
                                    if (database.config.technology == 'mysql')
                                        targetFieldValue = targetFieldValue.replace(/\\/g, '\\\\'); //MySQL requires escaping of backslash
                                    targetFieldValue = `'${targetFieldValue}'`; //enclose value in single quotes for SQL query
                                    if (hasUnicodeText && database.config.technology == 'mssql')
                                        targetFieldValue = 'N' + targetFieldValue; //SQL Server requires prefixing quoted text with N if any Unicode character exists in string
                                    lstValues[i] = targetFieldValue;
                                }
                                else if (targetFieldType == 'date') {
                                    lstValues[i] = targetFieldValue == 'ñ' ? 'NULL' : `'${targetFieldValue}'`;
                                }
                                else;
                            }
                            activeLine = lstValues.join(','); //prepare SQL statement with values separated by comma
                            sqlQuery += `(${activeLine}),`; //enclose row values into round braces
                        }

                        sqlQuery = sqlQuery.substr(0, sqlQuery.length - 1) + ';'; //remove last trailing comma and append colon
                        rowCount += await database.executeNonQuery(sqlQuery);
                    }
                }
                resolve(rowCount);
            } catch (err: any) {
                logger.logError(`database.bulkLoadWithCompanyDivision(${targetTable})`, err);
                reject(err);
            }
        });
    }

    private async truncateTablesForCompanyDivision(lstTables: string[], company: CompanyConfig, division: DivisionConfig): Promise<void> {
        return new Promise<void>(async (resolve, reject) => {
            try {
                let lstTruncateSQL: string[] = [];
                for (let i = 0; i < lstTables.length; i++) {
                    let sqlQuery = `delete from ${lstTables[i]} where company_id = '${company.company_id}' and division_id = '${division.division_id}'`;
                    sqlQuery += ';';
                    lstTruncateSQL.push(sqlQuery);
                }
                await database.executeNonQuery(lstTruncateSQL); //fire all delete SQL queries in one go
                resolve();
            } catch (err) {
                reject(err);
                logger.logError('tallyMultiCompany.truncateTablesForCompanyDivision()', err);
            }
        });
    }

    private async updateLastAlterId(tallyUrl: string): Promise<void> {
        return new Promise<void>(async (resolve, reject) => {
            try {
                //acquire last AlterID of master & transaction from Tally (for current company)
                let xmlPayLoad = '<?xml version="1.0" encoding="utf-8"?><ENVELOPE><HEADER><VERSION>1</VERSION><TALLYREQUEST>Export</TALLYREQUEST><TYPE>Data</TYPE><ID>MyReport</ID></HEADER><BODY><DESC><STATICVARIABLES><SVEXPORTFORMAT>ASCII (Comma Delimited)</SVEXPORTFORMAT></STATICVARIABLES><TDL><TDLMESSAGE><REPORT NAME="MyReport"><FORMS>MyForm</FORMS></REPORT><FORM NAME="MyForm"><PARTS>MyPart</PARTS></FORM><PART NAME="MyPart"><LINES>MyLine</LINES><REPEAT>MyLine : MyCollection</REPEAT><SCROLLED>Vertical</SCROLLED></PART><LINE NAME="MyLine"><FIELDS>FldAlterMaster,FldAlterTransaction</FIELDS></LINE><FIELD NAME="FldAlterMaster"><SET>$AltMstId</SET></FIELD><FIELD NAME="FldAlterTransaction"><SET>$AltVchId</SET></FIELD><COLLECTION NAME="MyCollection"><TYPE>Company</TYPE><FILTER>FilterActiveCompany</FILTER></COLLECTION><SYSTEM TYPE="Formulae" NAME="FilterActiveCompany">$$IsEqual:##SVCurrentCompany:$Name</SYSTEM></TDLMESSAGE></TDL></DESC></BODY></ENVELOPE>';
                
                let contentLastAlterIdTally = await this.postTallyXML(xmlPayLoad, tallyUrl);
                if(contentLastAlterIdTally == '') { //target company is closed
                    this.lastAlterIdMaster = -1;
                    this.lastAlterIdTransaction = -1;
                    logger.logMessage('No company open in Tally at %s', tallyUrl);
                    return reject('Please select one or more company in Tally to sync data');
                }
                else {
                    let lstAltId = contentLastAlterIdTally.replace(/\"/g, '').split(',');
                    this.lastAlterIdMaster = lstAltId.length >= 2 ? parseInt(lstAltId[0]) : 0;
                    this.lastAlterIdTransaction = lstAltId.length >= 2 ? parseInt(lstAltId[1]) : 0;
        
                    // fill-up invalid alterID with zero
                    if(isNaN(this.lastAlterIdMaster)) {
                        this.lastAlterIdMaster = 0;
                    }
                    if(isNaN(this.lastAlterIdTransaction)) {
                        this.lastAlterIdTransaction = 0;
                    }
                }
                resolve();
            } catch (err) {
                logger.logError('tallyMultiCompany.updateLastAlterId()', err);
                resolve();
            }
        });
    }

    private postTallyXML(msg: string, tallyUrl: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            try {
                // Determine if we should use HTTPS based on server URL
                const useHttps = tallyUrl.startsWith('https://');
                const serverHost = useHttps ? tallyUrl.replace('https://', '') : tallyUrl;
                const httpModule = useHttps ? https : http;
                
                let req = httpModule.request({
                    hostname: serverHost,
                    port: 443, // Default HTTPS port
                    path: '',
                    method: 'POST',
                    headers: {
                        'Content-Length': Buffer.byteLength(msg, 'utf16le'),
                        'Content-Type': 'text/xml;charset=utf-16'
                    }
                },
                    (res) => {
                        let data = '';
                        res
                            .setEncoding('utf16le')
                            .on('data', (chunk) => {
                                let result = chunk.toString() || '';
                                data += result;
                            })
                            .on('end', () => {
                                resolve(data);
                            })
                            .on('error', (httpErr) => {
                                logger.logMessage('Unable to connect with Tally at %s. Ensure tally XML port is enabled', tallyUrl);
                                logger.logError('tallyMultiCompany.postTallyXML()', httpErr['message'] || '');
                                reject(httpErr);
                            });
                    });
                req.on('error', (reqError) => {
                    logger.logMessage('Unable to connect with Tally at %s. Ensure tally XML port is enabled', tallyUrl);
                    logger.logError('tallyMultiCompany.postTallyXML()', reqError['message'] || '');
                    reject(reqError);
                });
                req.write(msg, 'utf16le');
                req.end();
            } catch (err) {
                logger.logError('tallyMultiCompany.postTallyXML()', err);
                reject(err);
            }
        });
    };

    private substituteTDLParameters(msg: string, substitutions: Map<string, any>): string {
        let retval = msg;
        try {
            substitutions.forEach((v, k) => {
                let regPtrn = new RegExp(`\\{${k}\\}`);
                if (typeof v === 'string')
                    retval = retval.replace(regPtrn, utility.String.escapeHTML(v));
                else if (typeof v === 'number')
                    retval = retval.replace(regPtrn, v.toString());
                else if (v instanceof Date)
                    retval = retval.replace(regPtrn, utility.Date.format(v, 'd-MMM-yyyy'));
                else if (typeof v === 'boolean')
                    retval = retval.replace(regPtrn, v ? 'Yes' : 'No');
                else;
            });

        } catch (err) {
            logger.logError('tallyMultiCompany.substituteTDLParameters()', err);
        }
        return retval;
    }

    private processTdlOutputManipulation(txt: string): string {
        let retval = txt;
        try {
            retval = retval.replace('<ENVELOPE>', ''); //Eliminate ENVELOPE TAG
            retval = retval.replace('</ENVELOPE>', '');
            retval = retval.replace(/\<FLDBLANK\>\<\/FLDBLANK\>/g, ''); //Eliminate blank tag
            retval = retval.replace(/\s+\r\n/g, ''); //remove empty lines
            retval = retval.replace(/\r\n/g, ''); //remove all line breaks
            retval = retval.replace(/\t/g, ' '); //replace all tabs with a single space
            retval = retval.replace(/\s+\<F/g, '<F'); //trim left space
            retval = retval.replace(/\<\/F\d+\>/g, ''); //remove XML end tags
            retval = retval.replace(/\<F01\>/g, '\r\n'); //append line break to each row start and remove first field XML start tag
            retval = retval.replace(/\<F\d+\>/g, '\t'); //replace XML start tags with tab separator
            retval = retval.replace(/&amp;/g, '&'); //escape ampersand
            retval = retval.replace(/&lt;/g, '<'); //escape less than
            retval = retval.replace(/&gt;/g, '>'); //escape greater than
            retval = retval.replace(/&quot;/g, '"'); //escape ampersand
            retval = retval.replace(/&apos;/g, "'"); //escape ampersand
            retval = retval.replace(/&tab;/g, ''); //strip out tab if any
            retval = retval.replace(/&#\d+;/g, ""); //remove all unreadable character escapes
        } catch (err) {
            logger.logError('tallyMultiCompany.processTdlOutputManipulation()', err);
        }

        return retval;
    }

    private processReport(targetTable: string, tableConfig: tableConfigYAML, substitutions?: Map<string, any>, company?: CompanyConfig, division?: DivisionConfig): Promise<void> {
        return new Promise<void>(async (resolve, reject) => {
            try {
                let xml = this.generateXMLfromYAML(tableConfig);
                if (substitutions && substitutions.size)
                    xml = this.substituteTDLParameters(xml, substitutions);

                let output = await this.postTallyXML(xml, division?.tally_url || '');
                output = this.processTdlOutputManipulation(output);

                let columnHeaders = tableConfig.fields.map(p => p.name).join('\t');
                fs.writeFileSync(`./csv/${targetTable}.data`, columnHeaders + output);

                resolve();
            } catch (err) {
                logger.logError(`tallyMultiCompany.processReport(${targetTable})`, err);
                reject(err);
            }
        });
    }

    private saveCompanyInfo(company: CompanyConfig, division: DivisionConfig): Promise<void> {
        return new Promise<void>(async (resolve, reject) => {
            try {
                const convertDateYYYYMMDD = (dateStr: string): string => {
                    let partYear = dateStr.substring(0, 4);
                    let partMonth = dateStr.substring(4, 6);
                    let partDay = dateStr.substring(6);
                    return partYear + '-' + partMonth + '-' + partDay;
                }

                let xmlCompany = `<?xml version="1.0" encoding="utf-8"?><ENVELOPE><HEADER><VERSION>1</VERSION><TALLYREQUEST>Export</TALLYREQUEST><TYPE>Data</TYPE><ID>TallyDatabaseLoaderReport</ID></HEADER><BODY><DESC><STATICVARIABLES><SVEXPORTFORMAT>ASCII (Comma Delimited)</SVEXPORTFORMAT></STATICVARIABLES><TDL><TDLMESSAGE><REPORT NAME="TallyDatabaseLoaderReport"><FORMS>MyForm</FORMS></REPORT><FORM NAME="MyForm"><PARTS>MyPart</PARTS></FORM><PART NAME="MyPart"><LINES>MyLine</LINES><REPEAT>MyLine : MyCollection</REPEAT><SCROLLED>Vertical</SCROLLED></PART><LINE NAME="MyLine"><FIELDS>FldGuid,FldName,FldBooksFrom,FldLastVoucherDate,FldLastAlterIdMaster,FldLastAlterIdTransaction,FldEOL</FIELDS></LINE><FIELD NAME="FldGuid"><SET>$Guid</SET></FIELD><FIELD NAME="FldName"><SET>$$StringFindAndReplace:$Name:'"':'""'</SET></FIELD><FIELD NAME="FldBooksFrom"><SET>(($$YearOfDate:$BooksFrom)*10000)+(($$MonthOfDate:$BooksFrom)*100)+(($$DayOfDate:$BooksFrom)*1)</SET></FIELD><FIELD NAME="FldLastVoucherDate"><SET>(($$YearOfDate:$LastVoucherDate)*10000)+(($$MonthOfDate:$LastVoucherDate)*100)+(($$DayOfDate:$LastVoucherDate)*1)</SET></FIELD><FIELD NAME="FldLastAlterIdMaster"><SET>$AltMstId</SET></FIELD><FIELD NAME="FldLastAlterIdTransaction"><SET>$AltVchId</SET></FIELD><FIELD NAME="FldEOL"><SET>†</SET></FIELD><COLLECTION NAME="MyCollection"><TYPE>Company</TYPE><FILTER>FilterActiveCompany</FILTER></COLLECTION><SYSTEM TYPE="Formulae" NAME="FilterActiveCompany">$$IsEqual:##SVCurrentCompany:$Name</SYSTEM></TDLMESSAGE></TDL></DESC></BODY></ENVELOPE>`;
                
                let strCompanyInfo = await this.postTallyXML(xmlCompany, division.tally_url); //extract active company information
                if (strCompanyInfo.endsWith(',"†",\r\n')) {
                    strCompanyInfo = strCompanyInfo.replace(/\",\"†\",\r\n/g, '').substr(1);
                    let lstCompanyInfoParts = strCompanyInfo.split(/\",\"/g);
                    let companyName = lstCompanyInfoParts[1];
                    companyName = companyName.replace(/'/g, '\\"');
                    if (this.config.tally.fromdate == 'auto' || this.config.tally.todate == 'auto') { //auto assign from/to from company info for detection mode
                        this.config.tally.fromdate = convertDateYYYYMMDD(lstCompanyInfoParts[2]);
                        this.config.tally.todate = convertDateYYYYMMDD(lstCompanyInfoParts[3]);
                    }
                    let altIdMaster = parseInt(lstCompanyInfoParts[4]);
                    let altIdTransaction = parseInt(lstCompanyInfoParts[5]);

                    //clear config table of database and insert active company info to config table
                    if (/^(mssql|mysql|postgres)$/g.test(database.config.technology)) {
                        // Insert company and division info with unique identifiers using UPSERT
                        await database.executeNonQuery(`
                            insert into config(name,value) values
                            ('Update Timestamp','${new Date().toLocaleString()}'),
                            ('Company Name','${companyName}'),
                            ('Company ID','${company.company_id}'),
                            ('Division ID','${division.division_id}'),
                            ('Division Name','${division.division_name}'),
                            ('Tally URL','${division.tally_url}'),
                            ('Period From','${this.config.tally.fromdate}'),
                            ('Period To','${this.config.tally.todate}'),
                            ('Last AlterID Master','${altIdMaster}_${company.company_id}_${division.division_id}'),
                            ('Last AlterID Transaction','${altIdTransaction}_${company.company_id}_${division.division_id}')
                            ON CONFLICT (name) DO UPDATE SET value = EXCLUDED.value
                        `);
                    }
                }
                else {
                    logger.logMessage('No company open in Tally at %s', division.tally_url);
                    return reject('Please select one or more company in Tally to sync data');
                }
                resolve();
            } catch (err: any) {
                logger.logError(`tallyMultiCompany.saveCompanyInfo()`, err['message']);
                reject('');
            }
        });
    }

    private generateXMLfromYAML(tblConfig: tableConfigYAML): string {
        let retval = '';
        try {
            //XML header
            retval = `<?xml version="1.0" encoding="utf-8"?><ENVELOPE><HEADER><VERSION>1</VERSION><TALLYREQUEST>Export</TALLYREQUEST><TYPE>Data</TYPE><ID>TallyDatabaseLoaderReport</ID></HEADER><BODY><DESC><STATICVARIABLES><SVEXPORTFORMAT>XML (Data Interchange)</SVEXPORTFORMAT><SVFROMDATE>{fromDate}</SVFROMDATE><SVTODATE>{toDate}</SVTODATE><SVCURRENTCOMPANY>{targetCompany}</SVCURRENTCOMPANY></STATICVARIABLES><TDL><TDLMESSAGE><REPORT NAME="TallyDatabaseLoaderReport"><FORMS>MyForm</FORMS></REPORT><FORM NAME="MyForm"><PARTS>MyPart01</PARTS></FORM>`;

            //Push routes list
            let lstRoutes = tblConfig.collection.split(/\./g);
            let targetCollection = lstRoutes.splice(0, 1);
            lstRoutes.unshift('MyCollection'); //add basic collection level route

            //loop through and append PART XML
            for (let i = 0; i < lstRoutes.length; i++) {
                let xmlPart = utility.Number.format(i + 1, 'MyPart00');
                let xmlLine = utility.Number.format(i + 1, 'MyLine00');
                retval += `<PART NAME="${xmlPart}"><LINES>${xmlLine}</LINES><REPEAT>${xmlLine} : ${lstRoutes[i]}</REPEAT><SCROLLED>Vertical</SCROLLED></PART>`;
            }

            //loop through and append LINE XML (except last line which contains field data)
            for (let i = 0; i < lstRoutes.length - 1; i++) {
                let xmlLine = utility.Number.format(i + 1, 'MyLine00');
                let xmlPart = utility.Number.format(i + 2, 'MyPart00');
                retval += `<LINE NAME="${xmlLine}"><FIELDS>FldBlank</FIELDS><EXPLODE>${xmlPart}</EXPLODE></LINE>`;
            }

            retval += `<LINE NAME="${utility.Number.format(lstRoutes.length, 'MyLine00')}">`;
            retval += `<FIELDS>`; //field end

            //Append field declaration list
            for (let i = 0; i < tblConfig.fields.length; i++)
                retval += utility.Number.format(i + 1, 'Fld00') + ',';
            retval = utility.String.strip(retval, 1);
            retval += `</FIELDS></LINE>`; //End of Field declaration

            //loop through each field
            for (let i = 0; i < tblConfig.fields.length; i++) {
                let fieldXML = `<FIELD NAME="${utility.Number.format(i + 1, 'Fld00')}">`;
                let iField = tblConfig.fields[i];

                //set field TDL XML expression based on type of data
                if (/^(\.\.)?[a-zA-Z0-9_]+$/g.test(iField.field)) {
                    if (iField.type == 'text')
                        fieldXML += `<SET>$${iField.field}</SET>`;
                    else if (iField.type == 'logical')
                        fieldXML += `<SET>if $${iField.field} then 1 else 0</SET>`;
                    else if (iField.type == 'date')
                        fieldXML += `<SET>if $$IsEmpty:$${iField.field} then $$StrByCharCode:241 else $$PyrlYYYYMMDDFormat:$${iField.field}:"-"</SET>`;
                    else if (iField.type == 'number')
                        fieldXML += `<SET>if $$IsEmpty:$${iField.field} then "0" else $$String:$${iField.field}</SET>`;
                    else if (iField.type == 'amount')
                        fieldXML += `<SET>$$StringFindAndReplace:(if $$IsDebit:$${iField.field} then -$$NumValue:$${iField.field} else $$NumValue:$${iField.field}):"(-)":"-"</SET>`;
                    else if (iField.type == 'quantity')
                        fieldXML += `<SET>$$StringFindAndReplace:(if $$IsInwards:$${iField.field} then $$Number:$$String:$${iField.field}:"TailUnits" else -$$Number:$$String:$${iField.field}:"TailUnits"):"(-)":"-"</SET>`;
                    else if (iField.type == 'rate')
                        fieldXML += `<SET>if $$IsEmpty:$${iField.field} then 0 else $$Number:$${iField.field}</SET>`;
                    else
                        fieldXML += `<SET>${iField.field}</SET>`;
                }
                else
                    fieldXML += `<SET>${iField.field}</SET>`;

                fieldXML += `<XMLTAG>${utility.Number.format(i + 1, 'F00')}</XMLTAG>`;
                fieldXML += `</FIELD>`;

                retval += fieldXML;
            }

            retval += `<FIELD NAME="FldBlank"><SET>""</SET></FIELD>`; //Blank Field specification

            //collection
            retval += `<COLLECTION NAME="MyCollection"><TYPE>${targetCollection}</TYPE>`;

            //fetch list
            if (tblConfig.fetch && tblConfig.fetch.length)
                retval += `<FETCH>${tblConfig.fetch.join(',')}</FETCH>`;

            //filter
            if (tblConfig.filters && tblConfig.filters.length) {
                retval += `<FILTER>`;
                for (let j = 0; j < tblConfig.filters.length; j++)
                    retval += utility.Number.format(j + 1, 'Fltr00') + ',';
                retval = utility.String.strip(retval); //remove last comma
                retval += `</FILTER>`;
            }

            retval += `</COLLECTION>`;

            //filter
            if (tblConfig.filters && tblConfig.filters.length)
                for (let j = 0; j < tblConfig.filters.length; j++)
                    retval += `<SYSTEM TYPE="Formulae" NAME="${utility.Number.format(j + 1, 'Fltr00')}">${tblConfig.filters[j]}</SYSTEM>`;

            //XML footer
            retval += `</TDLMESSAGE></TDL></DESC></BODY></ENVELOPE>`;
        } catch (err) {
            logger.logError(`tallyMultiCompany.generateXMLfromYAML()`, err);
        }
        return retval;
    }

}
let tallyMultiCompany = new _tallyMultiCompany();

export { tallyMultiCompany };
