#!/bin/bash

# Multi-Company Incremental Sync for Local Database
# This script runs incremental sync for all companies and divisions configured in the config file

echo "Starting Multi-Company Incremental Sync for Local Database..."
echo "=========================================================="

# Check if config file exists
if [ ! -f "config-multi-company-incrmental-localdb.json" ]; then
    echo "Error: config-multi-company-incrmental-localdb.json not found!"
    echo "Please create the configuration file first."
    exit 1
fi

# Check if database structure file exists
if [ ! -f "database-structure-multi-company-incremental.sql" ]; then
    echo "Error: database-structure-multi-company-incremental.sql not found!"
    echo "Please create the database structure file first."
    exit 1
fi

# Check if YAML config exists
if [ ! -f "tally-export-config-multi-company-incremental.yaml" ]; then
    echo "Error: tally-export-config-multi-company-incremental.yaml not found!"
    echo "Please create the YAML configuration file first."
    exit 1
fi

echo "Configuration files found. Starting incremental sync..."
echo ""

# Run the incremental sync
node dist/index-multi-company.mjs --config config-multi-company-incrmental-localdb.json

echo ""
echo "Incremental sync completed!"
echo "Check the logs above for any errors or warnings."
