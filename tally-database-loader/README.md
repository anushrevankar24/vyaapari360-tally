# Tally Database Loader

A comprehensive tool for synchronizing Tally ERP data with various database systems, supporting both single-company and multi-company setups with full and incremental sync capabilities.

## 📋 Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Database Setup](#database-setup)
- [Usage](#usage)
- [Scripts Guide](#scripts-guide)
- [Multi-Company Setup](#multi-company-setup)
- [Incremental Sync](#incremental-sync)
- [Troubleshooting](#troubleshooting)
- [Security Notes](#security-notes)

## ✨ Features

- **Multi-Database Support**: PostgreSQL, MySQL, SQL Server, BigQuery, CSV
- **Multi-Company Support**: Handle multiple companies and divisions
- **Sync Types**: Full sync and Incremental sync
- **Data Types**: Master data and Transaction data
- **Real-time Sync**: Continuous synchronization with configurable frequency
- **Comprehensive Logging**: Detailed logs for monitoring and debugging
- **Flexible Configuration**: JSON-based configuration files

## 🔧 Prerequisites

### System Requirements
- **Node.js**: Version 16 or higher
- **Database**: PostgreSQL 12+, MySQL 8+, SQL Server 2016+, or BigQuery
- **Tally ERP**: Version 9.0 or higher with XML port enabled

### Tally ERP Setup
1. Open Tally ERP
2. Go to **Gateway of Tally** → **F11** (Features) → **Advanced Configuration**
3. Enable **XML Port** (usually port 9000)
4. Ensure **Allow XML Requests** is set to **Yes**

## 📦 Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd tally-database-loader
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Build the Project
```bash
npm run build
```

### 4. Verify Installation
```bash
node dist/index.mjs --help
```

## ⚙️ Configuration

### Configuration Files Structure

The loader uses JSON configuration files to define database connections, Tally settings, and sync parameters.

#### Basic Configuration Template
```json
{
    "database": {
        "technology": "postgres",
        "server": "localhost",
        "port": 5432,
        "ssl": false,
        "schema": "tallydb",
        "username": "your_username",
        "password": "your_password",
        "loadmethod": "insert"
    },
    "tally": {
        "definition": "tally-export-config.yaml",
        "fromdate": "auto",
        "todate": "auto",
        "sync": "full",
        "frequency": 0
    }
}
```

#### Multi-Company Configuration Template
```json
{
    "database": {
        "technology": "postgres",
        "server": "localhost",
        "port": 5432,
        "ssl": false,
        "schema": "tallydb",
        "username": "your_username",
        "password": "your_password",
        "loadmethod": "insert"
    },
    "companies": [
        {
            "company_id": "uuid-here",
            "company_name": "Your Company Name",
            "divisions": [
                {
                    "division_id": "uuid-here",
                    "division_name": "Division Name",
                    "tally_url": "http://your-tally-server:9000"
                }
            ]
        }
    ],
    "tally": {
        "definition": "tally-export-config.yaml",
        "fromdate": "auto",
        "todate": "auto",
        "sync": "full",
        "frequency": 0
    }
}
```

### Configuration Parameters

#### Database Configuration
- **technology**: Database type (`postgres`, `mysql`, `mssql`, `bigquery`, `csv`)
- **server**: Database server hostname or IP
- **port**: Database port number
- **ssl**: Enable SSL connection (true/false)
- **schema**: Database schema name
- **username**: Database username
- **password**: Database password
- **loadmethod**: Data loading method (`insert` or `bulk`)

#### Tally Configuration
- **definition**: YAML file defining data export structure
- **fromdate**: Start date for data sync (`auto` or `YYYY-MM-DD`)
- **todate**: End date for data sync (`auto` or `YYYY-MM-DD`)
- **sync**: Sync type (`full` or `incremental`)
- **frequency**: Continuous sync frequency in minutes (0 for one-time sync)

## 🗄️ Database Setup

### PostgreSQL Setup

#### 1. Create Database
```sql
CREATE DATABASE tallydb;
```

#### 2. Create Database Structure
```bash
# For full sync
psql -h localhost -p 5432 -U your_username -d tallydb -f database-structure.sql

# For multi-company full sync
psql -h localhost -p 5432 -U your_username -d tallydb -f database-structure-multi-company-full.sql

# For multi-company incremental sync
psql -h localhost -p 5432 -U your_username -d tallydb -f database-structure-multi-company-incremental.sql
```

#### 3. Insert Company/Division Data (Multi-Company)
```bash
psql -h localhost -p 5432 -U your_username -d tallydb -f insert-company-division-data.sql
```

### MySQL Setup

#### 1. Create Database
```sql
CREATE DATABASE tallydb;
```

#### 2. Create Database Structure
```bash
# For full sync
mysql -h localhost -P 3306 -u your_username -p tallydb < database-structure.sql

# For multi-company full sync
mysql -h localhost -P 3306 -u your_username -p tallydb < database-structure-multi-company-full.sql

# For multi-company incremental sync
mysql -h localhost -P 3306 -u your_username -p tallydb < database-structure-multi-company-incremental.sql
```

### SQL Server Setup

#### 1. Create Database
```sql
CREATE DATABASE tallydb;
```

#### 2. Create Database Structure
```bash
# For full sync
sqlcmd -S localhost -d tallydb -i database-structure.sql

# For multi-company full sync
sqlcmd -S localhost -d tallydb -i database-structure-multi-company-full.sql

# For multi-company incremental sync
sqlcmd -S localhost -d tallydb -i database-structure-multi-company-incremental.sql
```

## 🚀 Usage

### Command Line Usage

#### Basic Sync
```bash
node dist/index.mjs --config config.json
```

#### Multi-Company Sync
```bash
node dist/index.mjs --config config-multi-company.json
```

#### Command Line Overrides
```bash
node dist/index.mjs --config config.json --tally-sync incremental --tally-fromdate 2024-01-01 --tally-todate 2024-12-31
```

### Available Command Line Parameters

- `--config <file>`: Configuration file path
- `--tally-sync <type>`: Sync type (full/incremental)
- `--tally-fromdate <date>`: Start date (YYYY-MM-DD)
- `--tally-todate <date>`: End date (YYYY-MM-DD)
- `--tally-frequency <minutes>`: Continuous sync frequency
- `--tally-master <true/false>`: Import master data
- `--tally-transaction <true/false>`: Import transaction data
- `--tally-truncate <true/false>`: Truncate tables before import

## 📜 Scripts Guide

### 1. `run-full-sync-local.sh`

**Purpose**: Sets up and runs a full sync to a local PostgreSQL database.

**What it does**:
1. Creates the `tallydb` database if it doesn't exist
2. Drops all existing tables
3. Creates fresh tables using the multi-company full structure
4. Inserts company and division data
5. Installs dependencies and builds the project
6. Runs the full sync

**Usage**:
```bash
chmod +x run-full-sync-local.sh
./run-full-sync-local.sh
```

**Prerequisites**:
- PostgreSQL server running on localhost:5432
- User `anush` with password `anush24` (modify script for your credentials)
- Tally ERP running with XML port enabled

**Configuration Required**:
- Update the script with your PostgreSQL credentials
- Ensure `config-multi-company-full-localdb.json` exists and is configured

### 2. `run-full-sync-supabase.example.sh`

**Purpose**: Example script for setting up and running a full sync to Supabase.

**What it does**:
1. Drops all existing tables in the public schema
2. Creates fresh tables using the multi-company full structure
3. Inserts company and division data
4. Installs dependencies and builds the project
5. Runs the full sync

**Usage**:
```bash
# Copy the example file
cp run-full-sync-supabase.example.sh run-full-sync-supabase.sh

# Edit the file with your Supabase credentials
nano run-full-sync-supabase.sh

# Make it executable and run
chmod +x run-full-sync-supabase.sh
./run-full-sync-supabase.sh
```

**Configuration Required**:
- Replace `your-supabase-host.supabase.co` with your actual Supabase host
- Replace `your-password` with your actual Supabase password
- Ensure `config-multi-company-supabase-full.json` exists and is configured

### 3. `run-incremental-sync-local.sh`

**Purpose**: Runs incremental sync to a local database.

**What it does**:
1. Validates that all required configuration files exist
2. Runs the incremental sync process
3. Only processes changed data since the last sync

**Usage**:
```bash
chmod +x run-incremental-sync-local.sh
./run-incremental-sync-local.sh
```

**Prerequisites**:
- Database must be set up with incremental structure
- Previous sync must have been completed (for AlterID tracking)
- `config-multi-company-incrmental-localdb.json` must exist

**Configuration Required**:
- Ensure `config-multi-company-incrmental-localdb.json` is configured
- Ensure `database-structure-multi-company-incremental.sql` exists
- Ensure `tally-export-config-multi-company-incremental.yaml` exists

### 4. `setup-incremental-db.sh`

**Purpose**: Sets up a new database specifically for incremental sync testing.

**What it does**:
1. Creates a new database `tallydb_incremental`
2. Creates the incremental database structure
3. Inserts company and division data

**Usage**:
```bash
chmod +x setup-incremental-db.sh
./setup-incremental-db.sh
```

**Prerequisites**:
- PostgreSQL server running on localhost:5432
- User `anush` with password `anush24` (modify script for your credentials)

## 🏢 Multi-Company Setup

### 1. Generate UUIDs for Companies and Divisions

```bash
# Generate UUIDs (you can use online UUID generators)
# Company ID: bc90d453-0c64-4f6f-8bbe-dca32aba40d1
# Division ID: b38bfb72-3dd7-4aa5-b970-71b919d5ded4
```

### 2. Update Configuration Files

#### Update `insert-company-division-data.sql`
```sql
INSERT INTO mst_company (company_id, company_name) VALUES 
('bc90d453-0c64-4f6f-8bbe-dca32aba40d1', 'Your Company Name');

INSERT INTO mst_division (division_id, company_id, division_name, tally_url) VALUES 
('b38bfb72-3dd7-4aa5-b970-71b919d5ded4', 'bc90d453-0c64-4f6f-8bbe-dca32aba40d1', 'Division Name', 'http://your-tally-server:9000');
```

#### Update Configuration Files
- `config-multi-company-full-localdb.json`
- `config-multi-company-incremental-localdb.json`
- `config-multi-company-supabase-full.json`

### 3. Set Up Tally URLs

Ensure each division has a unique Tally URL:
- `http://server1:9000` for Division 1
- `http://server2:9000` for Division 2
- Or use ngrok for remote access: `https://your-ngrok-url.ngrok-free.app`

## 🔄 Incremental Sync

### How Incremental Sync Works

1. **AlterID Tracking**: Tally assigns unique AlterIDs to each record
2. **Change Detection**: Compares current AlterID with last synced AlterID
3. **Selective Import**: Only imports records with AlterID > last synced AlterID
4. **Change Processing**: Handles inserts, updates, and deletes properly

### Incremental Sync Requirements

1. **Database Structure**: Must use `database-structure-multi-company-incremental.sql`
2. **AlterID Columns**: All tables must have `alterid` columns
3. **Temporary Tables**: `_diff`, `_delete`, `_vchnumber` tables must exist
4. **Previous Sync**: At least one full sync must have been completed

### Incremental Sync Process

1. **First Run**: Imports all data (acts like full sync)
2. **Subsequent Runs**: Only imports changed data
3. **Change Detection**: Uses AlterID comparison
4. **Data Integrity**: Handles cascading updates and deletes

### Setting Up Incremental Sync

```bash
# 1. Set up incremental database
./setup-incremental-db.sh

# 2. Run first sync (full import)
./run-incremental-sync-new-db.sh

# 3. Subsequent runs (incremental only)
./run-incremental-sync-new-db.sh
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Connection Issues
```
Error: Unable to connect with Tally at http://localhost:9000
```
**Solution**: 
- Ensure Tally ERP is running
- Check XML port is enabled (F11 → Advanced Configuration)
- Verify the URL in configuration

#### 2. Database Connection Issues
```
Error: Connection to database failed
```
**Solution**:
- Verify database credentials
- Check if database server is running
- Ensure database exists

#### 3. Permission Issues
```
Error: Permission denied for table
```
**Solution**:
- Grant proper permissions to database user
- Ensure user has CREATE, INSERT, UPDATE, DELETE permissions

#### 4. No Data Found
```
No change found for Company - Division
```
**Solution**:
- Check if Tally has data in the specified date range
- Verify company is open in Tally
- Check if XML port is accessible

### Log Files

- **import-log.txt**: General import logs
- **error-log.txt**: Error logs and stack traces

### Debug Mode

Enable detailed logging by setting environment variable:
```bash
export DEBUG=true
node dist/index.mjs --config config.json
```

## 🔒 Security Notes

### Configuration Files

- **Never commit** actual configuration files with credentials
- Use `.example` files for templates
- Add sensitive files to `.gitignore`

### Database Security

- Use strong passwords
- Enable SSL connections for remote databases
- Restrict database user permissions
- Use environment variables for sensitive data

### Network Security

- Use VPN for remote Tally connections
- Enable firewall rules for database ports
- Use HTTPS for remote Tally URLs (ngrok)

## 📚 Additional Resources

### Configuration Examples

- `config.example.json`: Basic configuration template
- `config-multi-company.example.json`: Multi-company configuration template
- `config-multi-company-full-localdb.example.json`: Local database full sync
- `config-multi-company-incremental-localdb.example.json`: Local database incremental sync

### Database Structures

- `database-structure.sql`: Single-company structure
- `database-structure-multi-company-full.sql`: Multi-company full sync structure
- `database-structure-multi-company-incremental.sql`: Multi-company incremental sync structure

### Documentation

- `MULTI_COMPANY_SETUP.md`: Detailed multi-company setup guide
- `TALLY_DATABASE_STRUCTURE_DOCUMENTATION.txt`: Database structure documentation
- `DATABASE_SCHEMA_DIAGRAM.txt`: Database schema diagram

## 🤝 Support

For issues and questions:
1. Check the troubleshooting section
2. Review log files
3. Check Tally ERP XML port configuration
4. Verify database connectivity

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Note**: Always test with a small dataset first before running full production syncs. Ensure you have proper backups of your database before running any sync operations.
