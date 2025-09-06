export interface Voucher {
  guid: string;
  date: string;
  voucher_type: string;
  voucher_number: string;
  reference_number: string;
  reference_date?: string;
  narration: string;
  party_name: string;
  place_of_supply: string;
  is_invoice: number;
  is_accounting_voucher: number;
  is_inventory_voucher: number;
  is_order_voucher: number;
  voucher_category?: string;
}

export interface AccountingEntry {
  guid: string;
  ledger: string;
  amount: number;
  amount_forex: number;
  currency: string;
  ledger_group?: string;
  primary_group?: string;
}

export interface InventoryEntry {
  guid: string;
  item: string;
  quantity: number;
  rate: number;
  amount: number;
  additional_amount: number;
  discount_amount: number;
  godown?: string;
  tracking_number?: string;
  order_number?: string;
  order_duedate?: string;
  stock_group?: string;
  uom_name?: string;
}

export interface BillEntry {
  guid: string;
  ledger: string;
  name: string;
  amount: number;
  billtype: string;
  bill_credit_period: number;
}

export interface BankEntry {
  guid: string;
  ledger: string;
  transaction_type: string;
  instrument_date?: string;
  instrument_number: string;
  bank_name: string;
  amount: number;
  bankers_date?: string;
}

export interface CostCentreEntry {
  guid: string;
  ledger: string;
  costcentre: string;
  amount: number;
  cost_centre_name?: string;
}

export interface VoucherDetails {
  voucher: Voucher;
  accountingEntries: AccountingEntry[];
  inventoryEntries: InventoryEntry[];
  billEntries: BillEntry[];
  bankEntries: BankEntry[];
  costCentreEntries: CostCentreEntry[];
}

export interface Ledger {
  guid: string;
  name: string;
  parent: string;
  alias: string;
  description: string;
  notes: string;
  is_revenue?: number;
  is_deemedpositive?: number;
  opening_balance: number;
  closing_balance: number;
  mailing_name: string;
  mailing_address: string;
  mailing_state: string;
  mailing_country: string;
  mailing_pincode: string;
  email: string;
  it_pan: string;
  gstn: string;
  gst_registration_type: string;
  gst_supply_type: string;
  gst_duty_head: string;
  tax_rate: number;
  bank_account_holder: string;
  bank_account_number: string;
  bank_ifsc: string;
  bank_swift: string;
  bank_name: string;
  bank_branch: string;
  bill_credit_period: number;
  primary_group?: string;
  affects_gross_profit?: number;
}

export interface LedgerTransaction {
  voucher_guid: string;
  date: string;
  voucher_number: string;
  voucher_type: string;
  narration: string;
  amount: number;
  debit: number;
  credit: number;
  balance: number;
  other_ledgers?: string;
}

export interface LedgerDetails {
  ledger: Ledger;
  openingBalance: number;
  closingBalance: number;
  transactions: LedgerTransaction[];
}

export interface Group {
  guid: string;
  name: string;
  parent: string;
  primary_group: string;
  is_revenue?: number;
  is_deemedpositive?: number;
  is_reserved?: number;
  affects_gross_profit?: number;
  sort_position?: number;
  ledger_count: number;
}

export interface VoucherType {
  guid: string;
  name: string;
  parent: string;
  numbering_method: string;
  is_deemedpositive?: number;
  affects_stock?: number;
  voucher_count: number;
}

export interface DashboardStats {
  total_vouchers: number;
  total_ledgers: number;
  total_groups: number;
  total_stock_items: number;
  today_vouchers: number;
  month_vouchers: number;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface ApiResponse<T> {
  data?: T;
  pagination?: PaginationInfo;
  error?: string;
}
