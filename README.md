# Vyaapari360 Tally Integration

A comprehensive solution for integrating Tally Prime with modern web applications and databases. This project provides tools to extract data from Tally Prime and load it into PostgreSQL databases for further analysis and reporting.

## 🚀 Features

- **Tally to Database Integration**: Extract data from Tally Prime via XML server
- **PostgreSQL Support**: Load data into PostgreSQL database with full schema support
- **Cloud-Ready**: Support for Ngrok tunneling for remote Tally server access
- **Modern Web UI**: React-based frontend for data visualization and management
- **Comprehensive Data Export**: Master data, transactions, inventory, and accounting data
- **Incremental Sync**: Support for both full and incremental data synchronization

## 📁 Project Structure

```
vyaapari360-tally/
├── tally-database-loader/          # Core data extraction and loading utility
│   ├── src/                       # TypeScript source code
│   ├── dist/                      # Compiled JavaScript
│   ├── platform/                  # Database-specific SQL scripts
│   ├── reports/                   # Pre-built SQL reports
│   └── config.json               # Configuration file
├── vyaapari360-ui/               # React frontend application
│   ├── src/                      # React source code
│   ├── public/                   # Static assets
│   └── build/                    # Production build
└── README.md                     # This file
```

## 🛠️ Prerequisites

- **Node.js** (v16 or higher)
- **PostgreSQL** (v11 or higher)
- **Tally Prime** with XML server enabled
- **Ngrok** (for cloud access)

## ⚙️ Installation

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd vyaapari360-tally
```

### 2. Install Dependencies

```bash
# Install database loader dependencies
cd tally-database-loader
npm install

# Install UI dependencies
cd ../vyaapari360-ui
npm install
```

### 3. Database Setup

Create a PostgreSQL database and run the schema creation script:

```bash
# Create database
createdb tallydb

# Create tables
psql -h localhost -U your_username -d tallydb -f tally-database-loader/platform/postgresql/database-structure.sql
```

## 🔧 Configuration

### Database Configuration

Edit `tally-database-loader/config.json`:

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
    }
}
```

### Tally Configuration

For local Tally server:
```json
{
    "tally": {
        "definition": "tally-export-config.yaml",
        "server": "localhost",
        "port": 9000,
        "fromdate": "auto",
        "todate": "auto",
        "sync": "full",
        "frequency": 0,
        "company": ""
    }
}
```

For cloud Tally server (via Ngrok):
```json
{
    "tally": {
        "definition": "tally-export-config.yaml",
        "server": "https://your-ngrok-url.ngrok-free.app",
        "port": 443,
        "fromdate": "auto",
        "todate": "auto",
        "sync": "full",
        "frequency": 0,
        "company": ""
    }
}
```

## 🚀 Usage

### Data Extraction and Loading

1. **Ensure Tally Prime is running** with XML server enabled
2. **Run the data loader**:

```bash
cd tally-database-loader
node dist/index.mjs
```

### Web Interface

1. **Start the React application**:

```bash
cd vyaapari360-ui
npm start
```

2. **Open your browser** and navigate to `http://localhost:3000`

## 📊 Data Structure

The system extracts and loads the following data types:

### Master Data
- **Groups**: Chart of accounts structure
- **Ledgers**: Account details and balances
- **Stock Items**: Inventory items with pricing
- **Voucher Types**: Transaction types
- **Units of Measure**: Measurement units
- **Godowns**: Warehouse locations

### Transaction Data
- **Vouchers**: All financial transactions
- **Accounting Entries**: Debit/Credit entries
- **Inventory Entries**: Stock movements
- **Bill Allocations**: Bill tracking
- **Bank Transactions**: Banking entries

## 🔄 Synchronization Modes

### Full Sync
- Exports all data from Tally
- Truncates and reloads all tables
- Use for initial setup or complete refresh

### Incremental Sync
- Exports only changed data since last sync
- Maintains data integrity
- Recommended for regular updates

## 📈 Reports

Pre-built SQL reports are available in the `reports/` directory:

- **Trial Balance**: Complete trial balance report
- **Profit & Loss**: P&L statement
- **Balance Sheet**: Financial position
- **Sales Reports**: Daily/monthly sales analysis
- **Purchase Reports**: Purchase analysis
- **Stock Reports**: Inventory analysis

## 🌐 Cloud Deployment

### Using Ngrok for Remote Access

1. **Install Ngrok**:
```bash
# Download from https://ngrok.com/
# Or use package manager
```

2. **Expose Tally Server**:
```bash
ngrok http 9000
```

3. **Update Configuration** with the provided Ngrok URL

## 🔒 Security Considerations

- **Database Credentials**: Store securely, never commit to version control
- **Ngrok URLs**: Use authentication for production deployments
- **SSL/TLS**: Enable for production database connections
- **Network Security**: Restrict database access to authorized IPs

## 🐛 Troubleshooting

### Common Issues

1. **Connection Refused**: Ensure Tally XML server is enabled
2. **Authentication Failed**: Verify database credentials
3. **SSL Errors**: Check SSL configuration for cloud databases
4. **Ngrok Issues**: Ensure Ngrok tunnel is active and accessible

### Logs

Check the following log files for debugging:
- `error-log.txt`: Error details
- `import-log.txt`: Import statistics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the documentation in the `docs/` directory
- Review the FAQ in `tally-database-loader/docs/faq.md`

## 🎯 Roadmap

- [ ] Real-time data synchronization
- [ ] Additional database support (MySQL, SQL Server)
- [ ] Advanced reporting dashboard
- [ ] API endpoints for data access
- [ ] Mobile application support

---

**Note**: This project is based on the Tally Database Loader utility and extends it with modern web technologies for enhanced usability and integration capabilities.