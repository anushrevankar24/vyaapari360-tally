#!/bin/bash

# Multi-Company Full Sync for Supabase Database
# This is an example script - copy to run-full-sync-supabase.sh and add your credentials

# Navigate to the directory
cd /home/anush/AtrimonyTech/vyaapari360-tally/tally-database-loader

# Database configuration (replace with your actual values)
DB_HOST="your-supabase-host.supabase.co"
DB_PORT="5432"
DB_USER="postgres"
DB_PASSWORD="your-password"
DB_NAME="postgres"

# Step 1: Drop all existing tables in public schema
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f drop-all-tables.sql

# Step 2: Create fresh tables in public schema
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f database-structure-multi-company-full.sql

# Step 3: Insert company and division data in public schema
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f insert-company-division-data.sql

# Step 4: Install dependencies and build
npm install
npm run build

# Step 5: Run the full sync
node dist/index-multi-company.mjs --config config-multi-company-supabase-full.json
