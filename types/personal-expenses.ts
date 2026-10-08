export type PersonalPaymentMethod =
  | 'Cash'
  | 'UPI'
  | 'Credit Card'
  | 'Debit Card'
  | 'Bank Transfer'
  | 'Cheque'
  | 'Other'
  | (string & {});

export type PersonalPaymentStatus = 'Paid' | 'Pending' | 'Partially Paid';

export interface PersonalExpenseCategory {
  id: string;
  user_id?: string | null;
  name: string;
  parent_id?: string | null;
  color?: string | null;
  icon?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  subcategories?: PersonalExpenseCategory[];
}

export interface PersonalExpenseDocument {
  id: string;
  expense_id: string;
  user_id: string;
  file_name: string;
  storage_path: string;
  file_type: string;
  file_size: number;
  public_url?: string;
  created_at: string;
}

export interface PersonalExpenseAuditLog {
  id: string;
  user_id: string;
  expense_id: string;
  action: 'Created' | 'Edited' | 'Document Uploaded' | 'Document Removed' | 'Deleted' | string;
  details?: string | null;
  created_at: string;
}

export interface PersonalExpenseSettings {
  id: string;
  user_id: string;
  expense_number_prefix: string;
  starting_number: number;
  next_number: number;
  default_currency: string;
  default_payment_method: string;
  default_category_id?: string | null;
  custom_payment_methods: string[];
  created_at: string;
  updated_at: string;
}

export interface PersonalExpense {
  id: string;
  user_id: string;
  expense_number: string;
  expense_date: string;
  category_id?: string | null;
  category_name: string;
  subcategory_id?: string | null;
  subcategory_name?: string | null;
  description: string;
  amount: number;
  payment_method: string;
  payment_status: PersonalPaymentStatus;
  paid_amount: number;
  pending_amount: number;
  paid_to?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  documents?: PersonalExpenseDocument[];
}

export interface PersonalExpenseFilters {
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  month?: string; // e.g. "2026-10"
  year?: string;  // e.g. "2026"
  yearType?: 'calendar' | 'financial';
  financialYear?: string; // e.g. "2026-27"
  categoryId?: string;
  paymentMethod?: string;
  paymentStatus?: PersonalPaymentStatus | '';
  paidTo?: string;
  minAmount?: number;
  maxAmount?: number;
  sortBy?: 'newest' | 'oldest' | 'highest' | 'lowest';
}

export interface PersonalExpenseMonthlySummary {
  monthLabel: string; // e.g. "October 2026"
  year: number;
  month: number; // 1-12
  totalSpent: number;
  transactionCount: number;
  averageDailySpend: number;
  largestExpense: number;
  largestExpenseDescription?: string;
  categoryBreakdown: Array<{
    categoryName: string;
    totalAmount: number;
    count: number;
    percentage: number;
    color?: string;
  }>;
}

export interface PersonalExpenseYearlySummary {
  yearLabel: string;
  yearType: 'calendar' | 'financial';
  totalSpent: number;
  transactionCount: number;
  averageMonthlySpending: number;
  averageDailySpending: number;
  largestExpense: number;
  monthlyBreakdown: Array<{
    monthKey: string;
    monthName: string;
    totalAmount: number;
    count: number;
  }>;
  categoryBreakdown: Array<{
    categoryName: string;
    totalAmount: number;
    count: number;
    percentage: number;
    color?: string;
  }>;
}

export interface PersonalExpenseOverviewStats {
  thisMonthTotal: number;
  thisYearTotal: number;
  todayTotal: number;
  pendingUnpaidTotal: number;
}
