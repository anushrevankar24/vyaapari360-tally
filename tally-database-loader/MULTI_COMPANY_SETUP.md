# Multi-Company Multi-Division Tally Database Setup

This document explains how to set up and use the multi-company, multi-division Tally database loader that supports data from multiple companies and divisions in a single database.

## Overview

The multi-company setup allows you to:
- Store data from multiple companies in a single database
- Support multiple divisions per company
- Each division can have its own Tally URL
- Maintain data isolation between companies and divisions
- Support both full sync and incremental sync
- **Automatically insert `company_id` and `division_id`** for each record

### Automatic Company/Division ID Insertion

The modified loader (`tally-multi-company.mts`) automatically:

1. **Reads the multi-company configuration** with company and division details
2. **Loops through each company and division** in the configuration
3. **Connects to the appropriate Tally URL** for each division
4. **Fetches data from Tally** for that specific division
5. **Automatically prepends `company_id` and `division_id`** to each record before database insertion
6. **Inserts data with proper company/division context** into the database

**Example of automatic insertion:**
```sql
-- Original Tally data: guid, name, parent, ...
-- Automatically becomes: company_id, division_id, guid, name, parent, ...

INSERT INTO mst_ledger (company_id, division_id, guid, name, parent, ...) 
VALUES ('bc90d453-0c64-4f6f-8bbe-dca32aba40d1', 'b38bfb72-3dd7-4aa5-b970-71b919d5ded4', 'ledger-guid-123', 'Cash Account', 'Primary', ...);
```

## Files Created

### Configuration Files
- `config-multi-company.json` - Full sync configuration
- `config-multi-company-incremental.json` - Incremental sync configuration

### Database Structure Files
- `database-structure-multi-company.sql` - Full sync database structure
- `database-structure-multi-company-incremental.sql` - Incremental sync database structure

### Tally Export Configuration Files
- `tally-export-config-multi-company.yaml` - Full sync export configuration
- `tally-export-config-multi-company-incremental.yaml` - Incremental sync export configuration

### Modified Loader Code
- `src/tally-multi-company.mts` - Multi-company Tally loader implementation
- `src/index-multi-company.mts` - Multi-company entry point
- `run-multi-company.bat` - Windows batch file to run multi-company sync

## Database Structure

### Key Features

1. **Company and Division Tables**
   - `mst_company` - Stores company information
   - `mst_division` - Stores division information with Tally URLs

2. **Multi-Company Support**
   - All tables include `company_id` and `division_id` columns
   - Composite primary keys using `(guid, company_id, division_id)`
   - Foreign key constraints to ensure data integrity

3. **Incremental Sync Support**
   - `alterid` columns for tracking changes
   - `_diff`, `_delete`, and `_vchnumber` tracking tables
   - Cascade update and delete operations

### Table Structure Example

```sql
create table mst_ledger
(
 guid varchar(64) not null,
 company_id varchar(36) not null,
 division_id varchar(36) not null,
 alterid int not null default 0,  -- For incremental sync
 name nvarchar(1024) not null default '',
 -- ... other fields
 primary key (guid, company_id, division_id),
 foreign key (company_id) references mst_company(company_id),
 foreign key (division_id) references mst_division(division_id)
);
```

## Configuration

### Company Configuration

```json
{
    "companies": [
        {
            "company_id": "bc90d453-0c64-4f6f-8bbe-dca32aba40d1",
            "company_name": "Company 1",
            "divisions": [
                {
                    "division_id": "b38bfb72-3dd7-4aa5-b970-71b919d5ded4",
                    "division_name": "Division 1",
                    "tally_url": "https://0780aee7142f.ngrok-free.app"
                }
            ]
        }
    ]
}
```

### Adding Multiple Companies/Divisions

To add more companies or divisions, simply extend the configuration:

```json
{
    "companies": [
        {
            "company_id": "bc90d453-0c64-4f6f-8bbe-dca32aba40d1",
            "company_name": "Company 1",
            "divisions": [
                {
                    "division_id": "b38bfb72-3dd7-4aa5-b970-71b919d5ded4",
                    "division_name": "Division 1",
                    "tally_url": "https://0780aee7142f.ngrok-free.app"
                },
                {
                    "division_id": "c49cfc83-4e88-5b6b-9ccf-ecb43bcb51e5",
                    "division_name": "Division 2",
                    "tally_url": "https://another-tally-url.ngrok-free.app"
                }
            ]
        },
        {
            "company_id": "d50dgd94-5f99-6c7c-adde-fdc54cdd62f6",
            "company_name": "Company 2",
            "divisions": [
                {
                    "division_id": "e61ehe05-6gaa-7d8d-beef-ged65dee73g7",
                    "division_name": "Division A",
                    "tally_url": "https://company2-tally.ngrok-free.app"
                }
            ]
        }
    ]
}
```

## Setup Instructions

### 1. Database Setup

#### For Full Sync:
```bash
# Create database structure
psql -h localhost -U anush -d tallydb -f database-structure-multi-company.sql
```

#### For Incremental Sync:
```bash
# Create database structure
psql -h localhost -U anush -d tallydb -f database-structure-multi-company-incremental.sql
```

### 2. Insert Company and Division Data

Before running the sync, you need to insert company and division records:

```sql
-- Insert company
INSERT INTO mst_company (company_id, company_name) 
VALUES ('bc90d453-0c64-4f6f-8bbe-dca32aba40d1', 'Company 1');

-- Insert division
INSERT INTO mst_division (division_id, company_id, division_name, tally_url) 
VALUES ('b38bfb72-3dd7-4aa5-b970-71b919d5ded4', 
        'bc90d453-0c64-4f6f-8bbe-dca32aba40d1', 
        'Division 1', 
        'https://0780aee7142f.ngrok-free.app');
```

### 3. Build and Run the Multi-Company Sync

#### Build the Multi-Company Loader:
```bash
# Build the TypeScript files
npm run build
```

#### For Full Sync:
```bash
# Use the multi-company configuration
node dist/index-multi-company.mjs --config config-multi-company.json
```

#### For Incremental Sync:
```bash
# Use the multi-company incremental configuration
node dist/index-multi-company.mjs --config config-multi-company-incremental.json
```

#### Using the Batch File (Windows):
```bash
# Run the multi-company incremental sync
run-multi-company.bat
```

## Data Isolation

### Querying Data by Company/Division

```sql
-- Get all ledgers for a specific company and division
SELECT * FROM mst_ledger 
WHERE company_id = 'bc90d453-0c64-4f6f-8bbe-dca32aba40d1' 
  AND division_id = 'b38bfb72-3dd7-4aa5-b970-71b919d5ded4';

-- Get all vouchers for a specific company
SELECT * FROM trn_voucher 
WHERE company_id = 'bc90d453-0c64-4f6f-8bbe-dca32aba40d1';

-- Cross-company reports (if needed)
SELECT c.company_name, d.division_name, COUNT(*) as voucher_count
FROM trn_voucher v
JOIN mst_company c ON v.company_id = c.company_id
JOIN mst_division d ON v.division_id = d.division_id
GROUP BY c.company_name, d.division_name;
```

## Benefits of This Approach

### 1. **Option 1 Implementation (Recommended)**
- **Clean Data Structure**: All data includes company/division context from the start
- **No Data Migration**: No need to update existing records
- **Better Performance**: No post-sync updates required
- **Scalable**: Easy to add new companies/divisions
- **Data Integrity**: Foreign key constraints ensure referential integrity

### 2. **Multi-Company Benefits**
- **Centralized Reporting**: Generate reports across multiple companies
- **Data Isolation**: Each company's data is properly isolated
- **Flexible Architecture**: Support for complex organizational structures
- **Incremental Sync**: Efficient updates for each division

### 3. **Incremental Sync Benefits**
- **Faster Updates**: Only sync changed data
- **Reduced Network Traffic**: Smaller data transfers
- **Better Performance**: Faster sync operations
- **Change Tracking**: Track what data has changed

## Migration from Single Company Setup

If you have existing single-company data, you can migrate it:

```sql
-- Add company_id and division_id columns to existing tables
ALTER TABLE mst_ledger ADD COLUMN company_id varchar(36);
ALTER TABLE mst_ledger ADD COLUMN division_id varchar(36);

-- Update existing records with default company/division
UPDATE mst_ledger SET 
    company_id = 'bc90d453-0c64-4f6f-8bbe-dca32aba40d1',
    division_id = 'b38bfb72-3dd7-4aa5-b970-71b919d5ded4'
WHERE company_id IS NULL;

-- Add constraints
ALTER TABLE mst_ledger ADD CONSTRAINT fk_ledger_company 
    FOREIGN KEY (company_id) REFERENCES mst_company(company_id);
ALTER TABLE mst_ledger ADD CONSTRAINT fk_ledger_division 
    FOREIGN KEY (division_id) REFERENCES mst_division(division_id);
```

## Troubleshooting

### Common Issues

1. **Foreign Key Violations**
   - Ensure company and division records exist before syncing
   - Check that company_id and division_id match the configuration

2. **Duplicate Key Errors**
   - Verify that GUIDs are unique within each company/division combination
   - Check for data conflicts between different Tally instances

3. **Connection Issues**
   - Verify Tally URLs are accessible
   - Check network connectivity to Tally servers

### Performance Optimization

1. **Indexes**: The database structure includes optimized indexes for common queries
2. **Batch Processing**: Process data in batches for large datasets
3. **Connection Pooling**: Use connection pooling for better performance

## Security Considerations

1. **Data Isolation**: Each company's data is properly isolated
2. **Access Control**: Implement proper database access controls
3. **Network Security**: Secure connections to Tally servers
4. **Data Encryption**: Consider encrypting sensitive data

## Support

For issues or questions regarding the multi-company setup:
1. Check the configuration files for correct company/division IDs
2. Verify database structure matches the SQL files
3. Ensure Tally URLs are accessible
4. Check database logs for detailed error messages
