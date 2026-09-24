export type ReportPeriodPreset =
  | 'today'
  | 'yesterday'
  | 'this_week'
  | 'last_week'
  | 'this_month'
  | 'last_month'
  | 'this_year'
  | 'last_year'
  | 'custom'
  | 'all';

export type ReportFilters = {
  period: ReportPeriodPreset;
  dateFrom?: string;
  dateTo?: string;
  customerId?: string;
  quality?: string;
  broker?: string;
  paymentStatus?: string;
  search?: string;
};

export type ReportKpis = {
  todaySales: number;
  weekSales: number;
  monthSales: number;
  yearSales: number;
  totalSales: number;
  pendingPayments: number;
  receivedPayments: number;
  totalCustomers: number;
  totalDeliveryChallans: number;
  totalInvoices: number;
  totalAvailableStock: number;
};

export type SalesPeriodSummary = {
  salesAmount: number;
  deliveryChallans: number;
  invoices: number;
  piecesSold: number;
  metersSold: number;
  weightSold: number;
};

export type MonthlySalesRow = {
  month: number;
  label: string;
  sales: number;
  deliveries: number;
};

export type YearlySalesRow = {
  year: number;
  sales: number;
  deliveries: number;
};

export type CustomerReportRow = {
  customerId: string;
  customerName: string;
  totalOrders: number;
  totalSales: number;
  pendingAmount: number;
  lastPurchaseDate: string | null;
};

export type QualityReportRow = {
  qualityName: string;
  totalDelivered: number;
  totalMeters: number;
  totalWeight: number;
  totalSales: number;
};

export type PaymentReportSummary = {
  paidCount: number;
  pendingCount: number;
  partiallyPaidCount: number;
  overdueCount: number;
  totalReceived: number;
  totalPending: number;
  collectionPercent: number;
};

export type StockReportSummary = {
  totalAvailable: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalQualities: number;
  totalStockValue: number | null;
};

export type EmployeeSalaryReportRow = {
  employeeId: string;
  employeeName: string;
  designation?: string | null;
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  slipCount: number;
};

export type SalaryReportSummary = {
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  totalSlips: number;
  employeeBreakdown: EmployeeSalaryReportRow[];
};

export type ChartPoint = {
  name: string;
  value: number;
  secondary?: number;
};

export type ReportsBundle = {
  kpis: ReportKpis;
  periodSummary: SalesPeriodSummary;
  monthlySales: MonthlySalesRow[];
  yearlySales: YearlySalesRow[];
  customers: CustomerReportRow[];
  qualities: QualityReportRow[];
  payments: PaymentReportSummary;
  stock: StockReportSummary;
  salary?: SalaryReportSummary;
  charts: {
    monthly: ChartPoint[];
    yearly: ChartPoint[];
    customers: ChartPoint[];
    qualities: ChartPoint[];
    payments: ChartPoint[];
  };
  filterOptions: {
    customers: Array<{ id: string; name: string }>;
    qualities: string[];
    brokers: string[];
  };
};
