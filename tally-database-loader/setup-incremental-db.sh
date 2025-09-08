#!/bin/bash

# Setup Incremental Database for Multi-Company Tally Sync
# This script creates a new database specifically for incremental sync testing

echo "Setting up Incremental Database for Multi-Company Tally Sync..."
echo "============================================================="

# Database configuration
DB_NAME="tallydb_incremental"
DB_USER="anush"
DB_PASSWORD="anush24"
DB_HOST="localhost"
DB_PORT="5432"

echo "Creating database: $DB_NAME"

# Create the database
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;"
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "CREATE DATABASE $DB_NAME;"

echo "Database created successfully!"

# Create the database structure
echo "Creating database structure from incremental schema..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f database-structure-multi-company-incremental.sql

echo "Database structure created successfully!"

# Insert company and division data
echo "Inserting company and division data..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f insert-company-division-data.sql

echo "Setup completed successfully!"
echo ""
echo "Database: $DB_NAME"
echo "Host: $DB_HOST"
echo "Port: $DB_PORT"
echo "User: $DB_USER"
echo ""
echo "You can now test incremental sync with this database."
