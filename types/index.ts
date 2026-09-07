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
