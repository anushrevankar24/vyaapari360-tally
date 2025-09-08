#!/bin/bash

# Local PostgreSQL Database Setup and Sync Script - Simple Version
# This script sets up a local PostgreSQL database and runs Tally sync
# Uses database-structure-multi-company-simple.sql (no primary keys on transaction tables)

echo "Setting up local PostgreSQL database for Tally Multi-Company Full Sync (Simple Version)..."

# Navigate to the directory
cd /home/anush/AtrimonyTech/vyaapari360-tally/tally-database-loader

# Step 1: Create database if it doesn't exist
echo "Creating database 'tallydb' if it doesn't exist..."
PGPASSWORD="anush24" psql -h localhost -p 5432 -U anush -d postgres -c "CREATE DATABASE tallydb;" 2>/dev/null || echo "Database 'tallydb' already exists or creation failed"

# Step 2: Drop all existing tables in tallydb
echo "Dropping all existing tables..."
PGPASSWORD="anush24" psql -h localhost -p 5432 -U anush -d tallydb -f drop-all-tables.sql

# Step 3: Create fresh tables (Simple version - no primary keys on transaction tables)
echo "Creating fresh tables (Simple version)..."
PGPASSWORD="anush24" psql -h localhost -p 5432 -U anush -d tallydb -f database-structure-multi-company-full.sql

# Step 4: Insert company and division data
echo "Inserting company and division data..."
PGPASSWORD="anush24" psql -h localhost -p 5432 -U anush -d tallydb -f insert-company-division-data.sql

# Step 5: Install dependencies and build
echo "Installing dependencies and building project..."
npm install
npm run build

# Step 6: Run the full sync
echo "Running Tally Multi-Company Full Sync to local database (Simple version)..."
node dist/index-multi-company.mjs --config config-multi-company-full-localdb.json

echo "✅ Local database setup and sync completed (Simple version)!"
echo "📊 No primary keys on transaction tables - data fetched by (guid, company_id, division_id) combinations"
