import { createClient } from '@/lib/supabase/client';
import {
  MONTH_LABELS,
  isDateInRange,
  resolvePeriodRange,
  type DateRange,
} from '@/lib/reports/date-ranges';
import { getAmountReceived, getChallanTotal, resolvePaymentStatus } from '@/lib/payment-status';
import { getStockStatus, type ChallanPaymentStatus } from '@/types';
import type {
  ChartPoint,
  CustomerReportRow,
  MonthlySalesRow,
  PaymentReportSummary,
  QualityReportRow,
  ReportFilters,
  ReportKpis,
  ReportsBundle,
  EmployeeSalaryReportRow,
  SalaryReportSummary,
  SalesPeriodSummary,
  StockReportSummary,
  YearlySalesRow,
} from '@/types/reports';

const supabase = () => createClient();

type InvoiceRow = {
  id: string;
  date: string;
  grand_total: number | null;
  customer_id: string;
  broker: string | null;
  payment_status: ChallanPaymentStatus | null;
  payment_amount_received: number | null;
  due_date: string | null;
};

type DeliveryRow = {
  id: string;
  date: string;
  quality: string | null;
  stock_id: string | null;
  total_pieces: number | null;
  total_meters: number | null;
  total_weight: number | null;
  customer_id: string;
  broker: string | null;
};

type CustomerRow = {
  id: string;
  name: string;
};

type StockRow = {
  quality_name: string;
  available_taka: number;
  total_taka: number;
  sold_taka: number;
};

function matchesSearch(haystack: string, search?: string): boolean {
  if (!search?.trim()) return true;
  return haystack.toLowerCase().includes(search.trim().toLowerCase());
}

function filterInvoices(
  rows: InvoiceRow[],
  range: DateRange,
  filters: ReportFilters
): InvoiceRow[] {
  return rows.filter((row) => {
    if (!isDateInRange(row.date, range)) return false;
    if (filters.customerId && row.customer_id !== filters.customerId) return false;
    if (filters.broker && !(row.broker || '').toLowerCase().includes(filters.broker.toLowerCase())) {
      return false;
    }
    if (filters.paymentStatus) {
      const status = resolvePaymentStatus(row);
      if (status !== filters.paymentStatus) return false;
    }
    return true;
  });
}

function filterDeliveries(
  rows: DeliveryRow[],
  range: DateRange,
  filters: ReportFilters
): DeliveryRow[] {
  return rows.filter((row) => {
    if (!isDateInRange(row.date, range)) return false;
    if (filters.customerId && row.customer_id !== filters.customerId) return false;
    if (filters.broker && !(row.broker || '').toLowerCase().includes(filters.broker.toLowerCase())) {
      return false;
    }
    if (filters.quality) {
      const q = (row.quality || '').toLowerCase();
      if (q !== filters.quality.toLowerCase() && !q.includes(filters.quality.toLowerCase())) {
        return false;
      }
    }
    return true;
  });
}

function sumSales(rows: InvoiceRow[]): number {
  return rows.reduce((sum, row) => sum + getChallanTotal(row), 0);
}

function buildPeriodSummary(invoices: InvoiceRow[], deliveries: DeliveryRow[]): SalesPeriodSummary {
  return {
    salesAmount: sumSales(invoices),
    deliveryChallans: deliveries.length,
    invoices: invoices.length,
    piecesSold: deliveries.reduce((sum, row) => sum + (Number(row.total_pieces) || 0), 0),
    metersSold: deliveries.reduce((sum, row) => sum + (Number(row.total_meters) || 0), 0),
    weightSold: deliveries.reduce((sum, row) => sum + (Number(row.total_weight) || 0), 0),
  };
}

function buildMonthly(
  invoices: InvoiceRow[],
  deliveries: DeliveryRow[],
  year: number
): MonthlySalesRow[] {
  return MONTH_LABELS.map((label, index) => {
    const month = index + 1;
    const prefix = `${year}-${String(month).padStart(2, '0')}`;
    const sales = invoices
      .filter((row) => row.date.startsWith(prefix))
      .reduce((sum, row) => sum + getChallanTotal(row), 0);
    const deliveryCount = deliveries.filter((row) => row.date.startsWith(prefix)).length;
    return { month, label, sales, deliveries: deliveryCount };
  });
}

function buildYearly(invoices: InvoiceRow[], deliveries: DeliveryRow[]): YearlySalesRow[] {
  const years = new Set<number>();
  for (const row of invoices) {
    const y = Number(row.date.slice(0, 4));
    if (y) years.add(y);
  }
  for (const row of deliveries) {
    const y = Number(row.date.slice(0, 4));
    if (y) years.add(y);
  }
  if (years.size === 0) years.add(new Date().getFullYear());

  return [...years]
    .sort((a, b) => a - b)
    .map((year) => {
      const prefix = String(year);
      return {
        year,
        sales: invoices
          .filter((row) => row.date.startsWith(prefix))
          .reduce((sum, row) => sum + getChallanTotal(row), 0),
        deliveries: deliveries.filter((row) => row.date.startsWith(prefix)).length,
      };
    });
}

function buildCustomers(
  invoices: InvoiceRow[],
  customers: CustomerRow[],
  search?: string
): CustomerReportRow[] {
  const byId = new Map(customers.map((c) => [c.id, c.name]));
  const map = new Map<
    string,
    {
      totalOrders: number;
      totalSales: number;
      pendingAmount: number;
      lastPurchaseDate: string | null;
    }
  >();

  for (const row of invoices) {
    const current = map.get(row.customer_id) ?? {
      totalOrders: 0,
      totalSales: 0,
      pendingAmount: 0,
      lastPurchaseDate: null,
    };
    const total = getChallanTotal(row);
    const received = getAmountReceived(row);
    current.totalOrders += 1;
    current.totalSales += total;
    current.pendingAmount += Math.max(0, total - received);
    if (!current.lastPurchaseDate || row.date > current.lastPurchaseDate) {
      current.lastPurchaseDate = row.date;
    }
    map.set(row.customer_id, current);
  }

  return [...map.entries()]
    .map(([customerId, stats]) => ({
      customerId,
      customerName: byId.get(customerId) || 'Unknown',
      ...stats,
    }))
    .filter((row) => matchesSearch(`${row.customerName}`, search))
    .sort((a, b) => b.totalSales - a.totalSales);
}

function buildQualities(
  deliveries: DeliveryRow[],
  invoices: InvoiceRow[],
  search?: string
): QualityReportRow[] {
  const salesByCustomerDate = new Map<string, number>();
  for (const inv of invoices) {
    const key = `${inv.customer_id}|${inv.date}`;
    salesByCustomerDate.set(key, (salesByCustomerDate.get(key) || 0) + getChallanTotal(inv));
  }

  const map = new Map<
    string,
    {
      totalDelivered: number;
      totalMeters: number;
      totalWeight: number;
      totalSales: number;
    }
  >();

  for (const row of deliveries) {
    const name = (row.quality || 'Unspecified').trim() || 'Unspecified';
    const current = map.get(name) ?? {
      totalDelivered: 0,
      totalMeters: 0,
      totalWeight: 0,
      totalSales: 0,
    };
    current.totalDelivered += Number(row.total_pieces) || 0;
    current.totalMeters += Number(row.total_meters) || 0;
    current.totalWeight += Number(row.total_weight) || 0;
    // Approximate quality sales share via matching customer+date invoices when present
    const linked = salesByCustomerDate.get(`${row.customer_id}|${row.date}`) || 0;
    current.totalSales += linked;
    map.set(name, current);
  }

  return [...map.entries()]
    .map(([qualityName, stats]) => ({ qualityName, ...stats }))
    .filter((row) => matchesSearch(row.qualityName, search))
    .sort((a, b) => b.totalDelivered - a.totalDelivered || b.totalSales - a.totalSales);
}

function buildPayments(invoices: InvoiceRow[]): PaymentReportSummary {
  let paidCount = 0;
  let pendingCount = 0;
  let partiallyPaidCount = 0;
  let overdueCount = 0;
  let totalReceived = 0;
  let totalPending = 0;

  for (const row of invoices) {
    const status = resolvePaymentStatus(row);
    const total = getChallanTotal(row);
    const received = getAmountReceived(row);
    totalReceived += received;
    totalPending += Math.max(0, total - received);

    if (status === 'Paid') paidCount += 1;
    else if (status === 'Partially Paid') partiallyPaidCount += 1;
    else if (status === 'Overdue') overdueCount += 1;
    else pendingCount += 1;
  }

  const billed = totalReceived + totalPending;
  return {
    paidCount,
    pendingCount,
    partiallyPaidCount,
    overdueCount,
    totalReceived,
    totalPending,
    collectionPercent: billed > 0 ? (totalReceived / billed) * 100 : 0,
  };
}

function buildStock(stocks: StockRow[]): StockReportSummary {
  let lowStockCount = 0;
  let outOfStockCount = 0;
  let totalAvailable = 0;

  for (const stock of stocks) {
    totalAvailable += Number(stock.available_taka) || 0;
    const status = getStockStatus({ available_taka: Number(stock.available_taka) || 0 });
    if (status === 'Low Stock') lowStockCount += 1;
    if (status === 'Out Of Stock') outOfStockCount += 1;
  }

  return {
    totalAvailable,
    lowStockCount,
    outOfStockCount,
    totalQualities: stocks.length,
    totalStockValue: null,
  };
}

function buildSalarySummary(
  salarySlips: Record<string, unknown>[],
  range: DateRange
): SalaryReportSummary {
  const filtered = salarySlips.filter((s) => isDateInRange(s.pay_date as string, range));
  let totalGross = 0;
  let totalDeductions = 0;
  let totalNet = 0;
  const map = new Map<string, EmployeeSalaryReportRow>();

  for (const s of filtered) {
    const gross = Number(s.gross_earnings || 0);
    const ded = Number(s.total_deductions || 0);
    const net = Number(s.net_salary || 0);
    totalGross += gross;
    totalDeductions += ded;
    totalNet += net;

    const empKey = (s.employee_id as string) || (s.employee_name as string);
    const existing = map.get(empKey) || {
      employeeId: (s.employee_id as string) || '',
      employeeName: (s.employee_name as string) || 'Employee',
      designation: (s.designation as string) || null,
      totalGross: 0,
      totalDeductions: 0,
      totalNet: 0,
      slipCount: 0,
    };
    existing.totalGross += gross;
    existing.totalDeductions += ded;
    existing.totalNet += net;
    existing.slipCount += 1;
    map.set(empKey, existing);
  }

  return {
    totalGross,
    totalDeductions,
    totalNet,
    totalSlips: filtered.length,
    employeeBreakdown: Array.from(map.values()),
  };
}

function buildKpis(
  allInvoices: InvoiceRow[],
  allDeliveries: DeliveryRow[],
  customers: CustomerRow[],
  stock: StockReportSummary
): ReportKpis {
  const now = new Date();
  const today = resolvePeriodRange('today', undefined, undefined, now);
  const week = resolvePeriodRange('this_week', undefined, undefined, now);
  const month = resolvePeriodRange('this_month', undefined, undefined, now);
  const year = resolvePeriodRange('this_year', undefined, undefined, now);

  let pendingPayments = 0;
  let receivedPayments = 0;
  for (const row of allInvoices) {
    const total = getChallanTotal(row);
    const received = getAmountReceived(row);
    receivedPayments += received;
    pendingPayments += Math.max(0, total - received);
  }

  return {
    todaySales: sumSales(allInvoices.filter((r) => isDateInRange(r.date, today))),
    weekSales: sumSales(allInvoices.filter((r) => isDateInRange(r.date, week))),
    monthSales: sumSales(allInvoices.filter((r) => isDateInRange(r.date, month))),
    yearSales: sumSales(allInvoices.filter((r) => isDateInRange(r.date, year))),
    totalSales: sumSales(allInvoices),
    pendingPayments,
    receivedPayments,
    totalCustomers: customers.length,
    totalDeliveryChallans: allDeliveries.length,
    totalInvoices: allInvoices.length,
    totalAvailableStock: stock.totalAvailable,
  };
}

/**
 * Loads company-scoped challan / delivery / stock facts and aggregates
 * analytics for the Reports module. Modular entry-point for future reports.
 */
export async function getReportsBundle(
  companyId: string,
  filters: ReportFilters
): Promise<ReportsBundle> {
  const [invoicesRes, deliveriesRes, customersRes, stocksRes, salaryRes] = await Promise.all([
    supabase()
      .from('challans')
      .select(
        'id, date, grand_total, customer_id, broker, payment_status, payment_amount_received, due_date'
      )
      .eq('company_id', companyId)
      .order('date', { ascending: false }),
    supabase()
      .from('delivery_challans')
      .select(
        'id, date, quality, stock_id, total_pieces, total_meters, total_weight, customer_id, broker'
      )
      .eq('company_id', companyId)
      .order('date', { ascending: false }),
    supabase().from('customers').select('id, name').eq('company_id', companyId).order('name'),
    supabase()
      .from('stocks')
      .select('quality_name, available_taka, total_taka, sold_taka')
      .eq('company_id', companyId),
    supabase()
      .from('salary_slips')
      .select('*')
      .eq('company_id', companyId),
  ]);

  if (invoicesRes.error) throw invoicesRes.error;
  if (deliveriesRes.error) throw deliveriesRes.error;
  if (customersRes.error) throw customersRes.error;
  if (stocksRes.error) throw stocksRes.error;
  if (salaryRes.error) throw salaryRes.error;

  const allInvoices = (invoicesRes.data ?? []) as InvoiceRow[];
  const allDeliveries = (deliveriesRes.data ?? []) as DeliveryRow[];
  const customers = (customersRes.data ?? []) as CustomerRow[];
  const stocks = (stocksRes.data ?? []) as StockRow[];
  const salarySlips = (salaryRes.data ?? []) as Record<string, unknown>[];

  const range = resolvePeriodRange(filters.period, filters.dateFrom, filters.dateTo);
  const invoices = filterInvoices(allInvoices, range, filters);
  const deliveries = filterDeliveries(allDeliveries, range, filters);

  const stock = buildStock(stocks);
  const kpis = buildKpis(allInvoices, allDeliveries, customers, stock);
  const periodSummary = buildPeriodSummary(invoices, deliveries);

  const yearForMonthly =
    filters.period === 'last_year' ? new Date().getFullYear() - 1 : new Date().getFullYear();
  const yearRange =
    filters.period === 'last_year'
      ? resolvePeriodRange('last_year')
      : resolvePeriodRange('this_year');

  const monthlySales = buildMonthly(
    filterInvoices(allInvoices, yearRange, filters),
    filterDeliveries(allDeliveries, yearRange, filters),
    yearForMonthly
  );

  const yearlySales = buildYearly(
    filterInvoices(allInvoices, { from: null, to: null }, filters),
    filterDeliveries(allDeliveries, { from: null, to: null }, filters)
  );

  const customerRows = buildCustomers(invoices, customers, filters.search);
  const qualityRows = buildQualities(deliveries, invoices, filters.search);
  const payments = buildPayments(invoices);

  const charts = {
    monthly: monthlySales.map((row) => ({
      name: row.label.slice(0, 3),
      value: row.sales,
      secondary: row.deliveries,
    })) as ChartPoint[],
    yearly: yearlySales.map((row) => ({
      name: String(row.year),
      value: row.sales,
      secondary: row.deliveries,
    })) as ChartPoint[],
    customers: customerRows.slice(0, 8).map((row) => ({
      name: row.customerName,
      value: row.totalSales,
    })),
    qualities: qualityRows.slice(0, 8).map((row) => ({
      name: row.qualityName,
      value: row.totalDelivered,
    })),
    payments: [
      { name: 'Paid', value: payments.paidCount },
      { name: 'Pending', value: payments.pendingCount },
      { name: 'Partial', value: payments.partiallyPaidCount },
      { name: 'Overdue', value: payments.overdueCount },
    ],
  };

  const salary = buildSalarySummary(salarySlips, range);

  const qualities = [
    ...new Set(
      allDeliveries
        .map((row) => (row.quality || '').trim())
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b))
    ),
  ];

  const brokers = [
    ...new Set(
      [...allInvoices, ...allDeliveries]
        .map((row) => (row.broker || '').trim())
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b))
    ),
  ];

  return {
    kpis,
    periodSummary,
    monthlySales,
    yearlySales,
    customers: customerRows,
    qualities: qualityRows,
    payments,
    stock,
    salary,
    charts,
    filterOptions: {
      customers: customers.map((c) => ({ id: c.id, name: c.name })),
      qualities,
      brokers,
    },
  };
}
