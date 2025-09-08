import process from 'process';
import { tallyMultiCompany } from './tally-multi-company.mjs';
import { database } from './database.mjs';
import { logger } from './logger.mjs'

let isSyncRunning = false;
let lastMasterAlterId = 0;
let lastTransactionAlterId = 0;

function parseCommandlineOptions(): Map<string, string> {
    let retval = new Map<string, string>();
    try {
        let lstArgs = process.argv;

        // Handle both --word-word format and --config format
        for (let i = 2; i < lstArgs.length; i += 2) {
            if (i + 1 < lstArgs.length) {
                let argName = lstArgs[i];
                let argValue = lstArgs[i + 1];
                
                // Handle --config argument
                if (argName === '--config') {
                    retval.set('config', argValue);
                }
                // Handle --word-word format arguments
                else if (/^--\w+-\w+$/g.test(argName)) {
                    retval.set(argName.substr(2), argValue);
                }
            }
        }
    } catch (err) {
        logger.logError('index.parseCommandlineOptions()', err);
    }
    return retval;
}

function invokeImport(): Promise<void> {
    return new Promise<void>(async (resolve) => {
        try {
            isSyncRunning = true;
            await tallyMultiCompany.importData();
            logger.logMessage('Multi-Company Import completed successfully [%s]', new Date().toLocaleString());
        }
        catch (err) {
            logger.logMessage('Error in importing multi-company data\r\nPlease check error-log.txt file for detailed errors [%s]', new Date().toLocaleString());
        }
        finally {
            isSyncRunning = false;
            resolve();
        }    
    });
}

//Update commandline overrides to configuration options
let cmdConfig = parseCommandlineOptions();
database.updateCommandlineConfig(cmdConfig);
tallyMultiCompany.updateCommandlineConfig(cmdConfig);

if(tallyMultiCompany.config.tally.frequency <= 0) { // on-demand sync
    await invokeImport();
    logger.closeStreams();
}
else { // continuous sync
    const triggerImport = async () => {
        try {
            // skip if sync is already running (wait for next trigger)
        if(!isSyncRunning) {
            // For multi-company setup, we'll process all companies/divisions
            // The updateLastAlterId is handled within each division processing
            let isDataChanged = true; // For now, always process in multi-company mode
            if(isDataChanged) { // process only if data is changed
                await invokeImport();
            }
            else {
                logger.logMessage('No change in Tally data found [%s]', new Date().toLocaleString());
            }
        }
        } catch (err) {
            if(typeof err == 'string' && err.endsWith('is closed in Tally')) {
                logger.logMessage(err + ' [%s]', new Date().toLocaleString());
            }
            else {
                throw err;
            }
        }
    }

    // For multi-company setup, we don't need company-specific continuous sync
    // as we process all companies/divisions in each run
    setInterval(async () => await triggerImport(), tallyMultiCompany.config.tally.frequency * 60000);
    await triggerImport();
}
