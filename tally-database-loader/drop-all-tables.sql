-- Drop all tables in reverse order of creation to handle foreign key dependencies
-- First drop any additional tables that might exist from previous setups
DROP TABLE IF EXISTS _diff CASCADE;
DROP TABLE IF EXISTS _delete CASCADE;
DROP TABLE IF EXISTS _vchnumber CASCADE;

-- Drop transaction tables
DROP TABLE IF EXISTS trn_attendance;
DROP TABLE IF EXISTS trn_payhead;
DROP TABLE IF EXISTS trn_employee;
DROP TABLE IF EXISTS trn_inventory_accounting;
DROP TABLE IF EXISTS trn_batch;
DROP TABLE IF EXISTS trn_bank;
DROP TABLE IF EXISTS trn_bill;
DROP TABLE IF EXISTS trn_cost_inventory_category_centre;
DROP TABLE IF EXISTS trn_cost_category_centre;
DROP TABLE IF EXISTS trn_cost_centre;
DROP TABLE IF EXISTS trn_inventory;
DROP TABLE IF EXISTS trn_accounting;
DROP TABLE IF EXISTS trn_voucher;

-- Drop master data tables
DROP TABLE IF EXISTS mst_stockitem_standard_price;
DROP TABLE IF EXISTS mst_stockitem_standard_cost;
DROP TABLE IF EXISTS trn_closingstock_ledger;
DROP TABLE IF EXISTS mst_opening_bill_allocation;
DROP TABLE IF EXISTS mst_opening_batch_allocation;
DROP TABLE IF EXISTS mst_gst_effective_rate;
DROP TABLE IF EXISTS mst_payhead;
DROP TABLE IF EXISTS mst_employee;
DROP TABLE IF EXISTS mst_attendance_type;
DROP TABLE IF EXISTS mst_cost_centre;
DROP TABLE IF EXISTS mst_cost_category;
DROP TABLE IF EXISTS mst_stock_item;
DROP TABLE IF EXISTS mst_stock_group;
DROP TABLE IF EXISTS mst_godown;
DROP TABLE IF EXISTS mst_uom;
DROP TABLE IF EXISTS mst_vouchertype;
DROP TABLE IF EXISTS mst_ledger;
DROP TABLE IF EXISTS mst_group;
DROP TABLE IF EXISTS config;

-- Drop reference tables last (with CASCADE to handle any remaining dependencies)
DROP TABLE IF EXISTS mst_division CASCADE;
DROP TABLE IF EXISTS mst_company CASCADE;
