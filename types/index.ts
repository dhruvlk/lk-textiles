export type NumberFyFormat = 'YYYY' | 'YYYY-YY' | 'none';
export type DefaultGstType = 'cgst_sgst' | 'igst' | 'none';

export interface CompanyBankAccount {
  id: string;
  company_id: string;
  bank_name: string;
  account_name?: string | null;
  account_number?: string | null;
  ifsc_code?: string | null;
  branch?: string | null;
  upi_id?: string | null;
  is_default?: boolean;
  created_at?: string;
  updated_at?: string;
}

export type NotificationType =
  | 'low_stock'
  | 'out_of_stock'
  | 'payment_due'
  | 'overdue_payment'
  | 'invoice_created'
  | 'delivery_challan_created'
  | 'company_updated'
  | 'employee_login'
  | 'system_update';

export interface AppNotification {
  id: string;
  company_id: string;
  user_id?: string | null;
  type: NotificationType;
  title: string;
  message?: string | null;
  entity_type?: string | null;
  entity_id?: string | null;
  is_read: boolean;
  created_at: string;
}

export interface Company {
  id: string;
  user_id?: string;
  name: string;
  parent_company_id?: string | null;
  is_primary?: boolean;
  owner_name?: string | null;
  logo_url?: string | null;
  stamp_url?: string | null;
  gst_number?: string | null;
  hsn_code?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  pan_number?: string | null;
  tagline?: string | null;
  bank_name?: string | null;
  account_name?: string | null;
  account_number?: string | null;
  ifsc_code?: string | null;
  branch?: string | null;
  bank_details?: string | null;
  upi_id?: string | null;
  signature_url?: string | null;
  terms_conditions?: string | null;
  invoice_terms?: string | null;
  delivery_challan_terms?: string | null;
  invoice_prefix?: string | null;
  delivery_challan_prefix?: string | null;
  invoice_start_number?: number | null;
  delivery_challan_start_number?: number | null;
  number_fy_format?: NumberFyFormat | null;
  theme_primary?: string | null;
  theme_secondary?: string | null;
  default_payment_terms?: string | null;
  default_gst_type?: DefaultGstType | null;
  default_unit?: string | null;
  default_delivered_by?: string | null;
  is_active?: boolean;
  status?: 'Active' | 'Archived';
  created_at?: string;
  updated_at?: string;
}

/** @deprecated Use Customer — kept as alias for gradual migration */
export type Party = Customer;

export interface Customer {
  id: string;
  company_id: string;
  name: string;
  contact_person?: string | null;
  mobile?: string | null;
  email?: string | null;
  gst_number?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  broker?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Product {
  id: string;
  company_id: string;
  name: string;
  hsn_code?: string | null;
  unit: string;
  default_rate: number;
  description?: string | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ChallanItem {
  id: string;
  challan_id: string;
  product_id?: string | null;
  description?: string | null;
  quantity?: number | null;
  quantity_display?: string | null;
  unit?: string | null;
  total_pieces?: number | null;
  quality?: string | null;
  fabric_name?: string | null;
  color?: string | null;
  design?: string | null;
  roll_number?: string | null;
  lot_number?: string | null;
  meter?: number | null;
  weight?: number | null;
  rate?: number | null;
  amount?: number | null;
  remarks?: string | null;
  product?: Product;
}

export type ChallanStatus = 'Draft' | 'Pending' | 'Delivered' | 'Returned' | 'Cancelled';

export type ChallanPaymentStatus = 'Pending' | 'Partially Paid' | 'Paid' | 'Overdue';

export interface Challan {
  id: string;
  company_id: string;
  customer_id: string;
  /** @deprecated use customer_id */
  party_id?: string;
  challan_number: string;
  date: string;
  bill_number?: string | null;
  vehicle_number?: string | null;
  delivered_by?: string | null;
  /** @deprecated use delivered_by */
  driver_name?: string | null;
  driver_mobile?: string | null;
  delivery_location?: string | null;
  broker?: string | null;
  payment_within_value?: number | null;
  payment_within_unit?: string | null;
  payment_terms?: string | null;
  due_date?: string | null;
  amount_in_words?: string | null;
  notes?: string | null;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
  status: ChallanStatus;
  subtotal?: number;
  discount?: number;
  cgst_percent?: number;
  sgst_percent?: number;
  igst_percent?: number;
  cgst_amount?: number;
  sgst_amount?: number;
  igst_amount?: number;
  other_charges?: number;
  grand_total?: number;
  payment_status?: ChallanPaymentStatus;
  payment_received_date?: string | null;
  payment_amount_received?: number;
  payment_reference?: string | null;
  payment_notes?: string | null;
  payment_mode?: string | null;
  customer?: Customer;
  /** @deprecated use customer */
  party?: Customer;
  items?: ChallanItem[];
  payments?: ChallanPayment[];
}

export interface ChallanPayment {
  id: string;
  challan_id: string;
  company_id: string;
  amount: number;
  payment_date: string;
  payment_mode?: string | null;
  reference_number?: string | null;
  notes?: string | null;
  created_by?: string | null;
  created_at?: string;
}

export interface ChallanFilters {
  search?: string;
  status?: ChallanStatus | '';
  paymentStatus?: ChallanPaymentStatus | '';
  customerId?: string;
  broker?: string;
  dateFrom?: string;
  dateTo?: string;
  sort?: TableSort;
}

export type SortDirection = 'asc' | 'desc';

export interface TableSort {
  column: string;
  direction: SortDirection;
}

export interface DashboardStats {
  totalCustomers: number;
  totalChallans: number;
  todayChallans: number;
  monthlySales: number;
  recentChallans: Challan[];
  totalInquiries?: number;
  recentInquiries?: Inquiry[];
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export type DeliveryChallanStatus = 'Draft' | 'Pending' | 'Delivered' | 'Returned' | 'Cancelled';

export interface DeliveryChallanItem {
  id: string;
  delivery_challan_id: string;
  sort_order: number;
  taka_no?: string | null;
  meters: number;
  weight: number;
  created_at?: string;
  updated_at?: string;
}

export interface DeliveryChallan {
  id: string;
  company_id: string;
  customer_id: string;
  challan_number: string;
  date: string;
  quality?: string | null;
  stock_id?: string | null;
  broker?: string | null;
  delivered_by?: string | null;
  remarks?: string | null;
  notes?: string | null;
  status: DeliveryChallanStatus;
  total_pieces: number;
  total_meters: number;
  total_weight: number;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
  customer?: Customer;
  stock?: Stock;
  items?: DeliveryChallanItem[];
}

export interface DeliveryChallanFilters {
  search?: string;
  status?: DeliveryChallanStatus | '';
  customerId?: string;
  broker?: string;
  quality?: string;
  dateFrom?: string;
  dateTo?: string;
  sort?: TableSort;
}

export type StockStatus = 'Available' | 'Low Stock' | 'Out Of Stock';

/** Fixed Low Stock threshold — Available Taka greater than this is Available. */
export const STOCK_LOW_THRESHOLD = 10;

export type StockTransactionType =
  | 'Opening Stock'
  | 'Delivery Challan'
  | 'Delivery Challan Edit'
  | 'Delivery Challan Delete'
  | 'Manual Stock Adjustment';

export interface Stock {
  id: string;
  company_id: string;
  quality_name: string;
  total_taka: number;
  sold_taka: number;
  available_taka: number;
  hsn_code?: string | null;
  remarks?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface StockMovement {
  id: string;
  stock_id: string;
  company_id: string;
  transaction_type: StockTransactionType;
  challan_id?: string | null;
  delivery_challan_id?: string | null;
  quantity: number;
  previous_stock: number;
  current_stock: number;
  notes?: string | null;
  created_by?: string | null;
  created_at?: string;
}

export interface StockFilters {
  search?: string;
  status?: StockStatus | '';
  hsn?: string;
  sort?: TableSort;
}

export interface StockSummary {
  totalQualities: number;
  totalTaka: number;
  totalSoldTaka: number;
  totalAvailableTaka: number;
  lowStockCount: number;
  outOfStockCount: number;
}

export function getStockStatus(
  stock: Pick<Stock, 'available_taka'> | number
): StockStatus {
  const available = typeof stock === 'number' ? stock : stock.available_taka;
  if (available <= 0) return 'Out Of Stock';
  if (available <= STOCK_LOW_THRESHOLD) return 'Low Stock';
  return 'Available';
}

export interface LetterPad {
  id: string;
  company_id: string;
  title: string;
  letter_date: string;
  subject?: string | null;
  content: string;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface LetterPadFilters {
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

export type InquiryStatus = 'new' | 'read';

export interface Inquiry {
  id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  subject?: string | null;
  message: string;
  status: InquiryStatus;
  created_at: string;
  updated_at: string;
}

export interface InquiryFilters {
  search?: string;
  status?: InquiryStatus | 'all' | '';
  sort?: TableSort;
}

export type SalarySlipPaymentStatus = 'Pending' | 'Paid' | 'Partially Paid';

export interface SalarySlip {
  id: string;
  company_id: string;
  employee_id: string | null;
  employee_name: string;
  employee_code?: string | null;
  designation?: string | null;
  department?: string | null;
  joining_date?: string | null;
  bank_name?: string | null;
  bank_account_number?: string | null;
  bank_ifsc?: string | null;
  pan_number?: string | null;
  uan_number?: string | null;
  pf_number?: string | null;
  salary_slip_number: string;
  salary_month: string;
  salary_year: number;
  pay_date: string;
  basic_salary: number;
  hra: number;
  conveyance: number;
  medical_allowance: number;
  special_allowance: number;
  bonus: number;
  overtime: number;
  other_earnings: number;
  gross_earnings: number;
  pf: number;
  professional_tax: number;
  tds: number;
  esic: number;
  loan_deduction: number;
  advance_deduction: number;
  other_deduction: number;
  total_deductions: number;
  net_salary: number;
  amount_in_words?: string | null;
  notes?: string | null;
  payment_status: SalarySlipPaymentStatus;
  payment_mode?: string | null;
  payment_date?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SalarySlipFilters {
  search?: string;
  employeeId?: string;
  salaryMonth?: string;
  salaryYear?: number | string;
  paymentStatus?: SalarySlipPaymentStatus | '';
  sort?: TableSort;
}

export interface MonthYearOption {
  month: string;
  year: number;
  label: string; // e.g. "August 2026"
  shortLabel: string; // e.g. "Aug 2026"
}

export interface MultiMonthHistoryRow {
  month: string;
  year: number;
  monthDisplay: string; // e.g. "Mar 2026"
  basicSalary: number;
  grossEarnings: number;
  totalDeductions: number;
  netSalary: number;
  slipId?: string;
  slipNumber?: string;
  available: boolean;
}

export interface MultiMonthSummaryData {
  employeeId: string;
  employeeName: string;
  joiningDate?: string | null;
  panNumber?: string | null;
  periodDisplay: string; // e.g. "March 2026 – August 2026"
  monthsCount: number;
  rows: MultiMonthHistoryRow[];
  totalBasicSalary: number;
  totalGrossEarnings: number;
  totalDeductions: number;
  totalNetSalary: number;
  amountInWords: string;
  notes?: string | null;
}

export type DuplicateSalaryAction = 'keep' | 'update' | 'skip';

export interface SalaryComponents {
  basic_salary: number;
  hra: number;
  conveyance: number;
  medical_allowance: number;
  special_allowance: number;
  bonus: number;
  overtime: number;
  other_earnings: number;
  pf: number;
  professional_tax: number;
  tds: number;
  esic: number;
  loan_deduction: number;
  advance_deduction: number;
  other_deduction: number;
}

export interface SalaryRevisionPeriod extends SalaryComponents {
  id: string;
  fromMonth: string;
  fromYear: number;
  toMonth: string;
  toYear: number;
  label?: string;
}

export interface BulkSalaryMonthItem extends SalaryComponents {
  month: string;
  year: number;
  monthIndex: number;
  key: string; // e.g. "March-2026"
  label: string; // e.g. "March 2026"
  shortLabel: string; // e.g. "Mar 2026"
  gross_earnings: number;
  total_deductions: number;
  net_salary: number;
  pay_date: string;
  payment_status: SalarySlipPaymentStatus;
  payment_mode?: string | null;
  payment_date?: string | null;
  notes?: string | null;
  existingSlip: SalarySlip | null;
  duplicateAction: DuplicateSalaryAction;
}

// ==============================================================================
// Purchases, Expenses, Documents & Financial Year Types
// ==============================================================================

export interface Supplier {
  id: string;
  company_id: string;
  name: string;
  contact_person?: string | null;
  mobile?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  gstin?: string | null;
  pan?: string | null;
  payment_terms?: string | null;
  opening_balance: number;
  notes?: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SupplierFilters {
  search?: string;
  city?: string;
  state?: string;
  sort?: TableSort;
}

export interface ExpenseCategory {
  id: string;
  company_id: string;
  name: string;
  description?: string | null;
  color?: string | null;
  is_system: boolean;
  created_at?: string;
  updated_at?: string;
}

export type PurchaseType =
  | 'Stock Purchase'
  | 'Expense Purchase'
  | 'Asset Purchase'
  | 'Service Purchase'
  | 'Other';

export type PurchasePaymentStatus = 'Paid' | 'Partially Paid' | 'Unpaid';
export type PurchaseStatus = 'Draft' | 'Active' | 'Archived' | 'Cancelled';
export type PaymentMethod = 'Cash' | 'Bank Transfer' | 'UPI' | 'Cheque' | 'Card' | 'Other';

export interface PurchaseItem {
  id: string;
  purchase_id: string;
  product_id?: string | null;
  stock_id?: string | null;
  item_name: string;
  description?: string | null;
  hsn_sac?: string | null;
  quantity: number;
  unit: string;
  rate: number;
  discount: number;
  taxable_amount: number;
  gst_rate: number;
  gst_amount: number;
  total_amount: number;
  yarn_type?: string | null;
  count?: string | null;
  denier?: string | null;
  color?: string | null;
  lot_number?: string | null;
  batch_number?: string | null;
  roll_number?: string | null;
  beam_number?: string | null;
  quality?: string | null;
  width?: string | null;
  gsm?: string | null;
  meters?: number | null;
  weight?: number | null;
  created_at?: string;
}

export interface VaultDocument {
  id: string;
  company_id: string;
  financial_year: string;
  document_type: 'Purchase Bill' | 'Expense Bill' | 'GST Document' | 'Transport Bill' | 'Machine Bill' | 'Other';
  purchase_id?: string | null;
  expense_id?: string | null;
  supplier_id?: string | null;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  public_url?: string | null;
  tags: string[];
  description?: string | null;
  ocr_data?: Record<string, unknown> | null;
  status: 'Draft' | 'Active' | 'Archived';
  uploaded_by?: string | null;
  created_at: string;
  updated_at: string;
  supplier?: Supplier;
}

export interface PurchasePayment {
  id: string;
  company_id: string;
  purchase_id?: string | null;
  expense_id?: string | null;
  payment_date: string;
  amount: number;
  payment_method: PaymentMethod;
  reference_number?: string | null;
  notes?: string | null;
  created_by?: string | null;
  created_at: string;
}

export interface Purchase {
  id: string;
  company_id: string;
  supplier_id?: string | null;
  supplier_name: string;
  supplier_gstin?: string | null;
  invoice_number: string;
  invoice_date: string;
  due_date?: string | null;
  financial_year: string;
  purchase_type: PurchaseType;
  is_gst_bill: boolean;
  hsn_sac?: string | null;
  subtotal: number;
  discount: number;
  gst_rate: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  total_gst: number;
  round_off: number;
  grand_total: number;
  payment_status: PurchasePaymentStatus;
  paid_amount: number;
  balance_amount: number;
  payment_method?: PaymentMethod | null;
  status: PurchaseStatus;
  notes?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  supplier?: Supplier;
  items?: PurchaseItem[];
  documents?: VaultDocument[];
  payments?: PurchasePayment[];
}

export interface PurchaseFilters {
  search?: string;
  financialYear?: string;
  month?: string;
  dateFrom?: string;
  dateTo?: string;
  purchaseType?: PurchaseType | '';
  supplierId?: string;
  gstStatus?: 'gst' | 'non_gst' | '';
  paymentStatus?: PurchasePaymentStatus | '';
  sort?: TableSort;
}

export interface Expense {
  id: string;
  company_id: string;
  expense_date: string;
  financial_year: string;
  category_id?: string | null;
  category_name: string;
  paid_to: string;
  supplier_id?: string | null;
  amount: number;
  is_gst_applicable: boolean;
  vendor_gstin?: string | null;
  hsn_sac?: string | null;
  taxable_amount: number;
  gst_rate: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  total_gst: number;
  total_amount: number;
  payment_method: PaymentMethod;
  payment_status: PurchasePaymentStatus;
  paid_amount: number;
  reference_number?: string | null;
  notes?: string | null;
  status: 'Active' | 'Archived';
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  category?: ExpenseCategory;
  documents?: VaultDocument[];
}

export interface ExpenseFilters {
  search?: string;
  financialYear?: string;
  month?: string;
  dateFrom?: string;
  dateTo?: string;
  categoryId?: string;
  paymentStatus?: PurchasePaymentStatus | '';
  gstStatus?: 'gst' | 'non_gst' | '';
  sort?: TableSort;
}

export interface DocumentFilters {
  search?: string;
  financialYear?: string;
  documentType?: string;
  tag?: string;
  sort?: TableSort;
}

export interface FinancialYear {
  id: string;
  company_id: string;
  year_label: string;
  start_date: string;
  end_date: string;
  status: 'Open' | 'Reviewing' | 'Closed';
  closing_notes?: string | null;
  closed_at?: string | null;
  closed_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface PurchaseExpenseOverviewStats {
  totalPurchases: number;
  totalExpenses: number;
  inputGst: number;
  pendingBills: number;
  totalPaid: number;
  totalOutstanding: number;
  draftPurchases: number;
  missingDocumentsCount: number;
  missingGstinCount: number;
}

export interface GstInputReportRow {
  supplier_name: string;
  supplier_gstin: string;
  invoice_number: string;
  invoice_date: string;
  taxable_amount: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  total_gst: number;
  grand_total: number;
  source: 'Purchase' | 'Expense';
}

export interface YearEndReviewData {
  financialYear: string;
  sales: {
    totalSales: number;
    totalInvoices: number;
    taxableSales: number;
    outputGst: number;
  };
  purchases: {
    totalPurchases: number;
    purchaseBillsCount: number;
    inputGst: number;
  };
  expenses: {
    totalExpenses: number;
    paidExpenses: number;
    outstandingExpenses: number;
  };
  stock: {
    totalQualities: number;
    openingStockTaka: number;
    purchaseStockTaka: number;
    soldStockTaka: number;
    closingStockTaka: number;
  };
  gst: {
    inputGst: number;
    outputGst: number;
    netGstPosition: number;
  };
  warnings: {
    unpaidBillsCount: number;
    missingDocumentsCount: number;
    missingGstinGstBillsCount: number;
    duplicateInvoicesCount: number;
  };
}

export const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

export function isValidGstin(gstin: string): boolean {
  if (!gstin) return false;
  return GSTIN_REGEX.test(gstin.trim().toUpperCase());
}

export function formatFinancialYearCode(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) {
    const now = new Date();
    const m = now.getMonth();
    const y = now.getFullYear();
    return m >= 3 ? `${y}-${String(y + 1).slice(-2)}` : `${y - 1}-${String(y).slice(-2)}`;
  }
  const month = d.getMonth();
  const year = d.getFullYear();
  if (month >= 3) {
    const nextYear = String(year + 1).slice(-2);
    return `${year}-${nextYear}`;
  } else {
    const prevYear = year - 1;
    const currentYearShort = String(year).slice(-2);
    return `${prevYear}-${currentYearShort}`;
  }
}

export function formatFinancialYearLabel(fyCode: string): string {
  if (!fyCode) return '';
  if (fyCode.startsWith('FY')) return fyCode;
  return `FY ${fyCode.replace('-', '–')}`;
}

export interface CompleteYearEndReportData {
  company: {
    name: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    gstin: string;
    pan: string;
    phone: string;
    email: string;
  };
  financialYear: string;
  dateRange: { start: string; end: string };
  generatedAt: string;
  executiveSummary: {
    totalSales: number;
    totalPurchases: number;
    totalExpenses: number;
    totalReceivables: number;
    totalPayables: number;
    totalInputGst: number;
    totalOutputGst: number;
    netGstPosition: number;
    openingStockTaka: number;
    closingStockTaka: number;
  };
  salesSummary: {
    totalInvoices: number;
    totalSales: number;
    taxableSales: number;
    cgst: number;
    sgst: number;
    igst: number;
    totalGst: number;
    netSales: number;
  };
  purchaseSummary: {
    totalPurchaseBills: number;
    totalPurchases: number;
    taxablePurchases: number;
    cgst: number;
    sgst: number;
    igst: number;
    inputGst: number;
  };
  expenseSummary: {
    categories: Array<{
      categoryName: string;
      count: number;
      totalAmount: number;
      gstAmount: number;
    }>;
    totalExpenses: number;
    totalGst: number;
  };
  gstSummary: {
    inputCgst: number;
    inputSgst: number;
    inputIgst: number;
    totalInputGst: number;
    outputCgst: number;
    outputSgst: number;
    outputIgst: number;
    totalOutputGst: number;
    netGstPosition: number;
  };
  stockSummary: {
    items: Array<{
      qualityName: string;
      openingTaka: number;
      purchasedTaka: number;
      soldTaka: number;
      closingTaka: number;
      unit: string;
    }>;
    totalOpeningTaka: number;
    totalSoldTaka: number;
    totalClosingTaka: number;
  };
  customerSummary: Array<{
    customerName: string;
    invoicesCount: number;
    totalSales: number;
    receivedAmount: number;
    outstanding: number;
  }>;
  supplierSummary: Array<{
    supplierName: string;
    billsCount: number;
    totalPurchases: number;
    paidAmount: number;
    outstanding: number;
  }>;
  employeeSummary: {
    totalEmployees: number;
    salarySlipsGenerated: number;
    totalSalaryPaid: number;
  };
  documentSummary: {
    totalPurchaseBills: number;
    uploadedPurchaseDocs: number;
    missingPurchaseDocs: number;
    expenseDocsCount: number;
    totalGstBills: number;
  };
  checklist: {
    salesReviewed: boolean;
    purchasesReviewed: boolean;
    expensesReviewed: boolean;
    gstReviewed: boolean;
    stockReviewed: boolean;
    outstandingReviewed: boolean;
    documentsReviewed: boolean;
    actionableIssues: string[];
  };
}




