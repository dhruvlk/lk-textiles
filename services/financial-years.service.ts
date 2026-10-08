import { createClient } from '@/lib/supabase/client';
import { formatFinancialYearCode } from '@/types';
import type {
  CompleteYearEndReportData,
  FinancialYear,
  GstInputReportRow,
  PurchaseExpenseOverviewStats,
  YearEndReviewData,
} from '@/types';
import type { FinancialYearRow } from '@/types/database';

const supabase = () => createClient();

function mapFinancialYear(row: FinancialYearRow): FinancialYear {
  return {
    id: row.id,
    company_id: row.company_id,
    year_label: row.year_label,
    start_date: row.start_date,
    end_date: row.end_date,
    status: row.status,
    closing_notes: row.closing_notes,
    closed_at: row.closed_at,
    closed_by: row.closed_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function getFinancialYears(companyId: string): Promise<FinancialYear[]> {
  const { data, error } = await supabase()
    .from('financial_years')
    .select('*')
    .eq('company_id', companyId)
    .order('start_date', { ascending: false });

  if (error) {
    console.error('Error fetching financial years:', error);
    throw error;
  }

  // If no FY records in table, auto-seed the current and previous FY
  if (!data || data.length === 0) {
    const currentFy = formatFinancialYearCode(new Date());
    const [startYear] = currentFy.split('-').map(Number);
    const prevFy = `${startYear - 1}-${String(startYear).slice(-2)}`;

    const seedYears = [
      {
        company_id: companyId,
        year_label: currentFy,
        start_date: `${startYear}-04-01`,
        end_date: `${startYear + 1}-03-31`,
        status: 'Open' as const,
        closing_notes: null,
        closed_at: null,
        closed_by: null,
      },
      {
        company_id: companyId,
        year_label: prevFy,
        start_date: `${startYear - 1}-04-01`,
        end_date: `${startYear}-03-31`,
        status: 'Closed' as const,
        closing_notes: 'Historical financial year',
        closed_at: `${startYear}-03-31T23:59:59Z`,
        closed_by: null,
      },
    ];

    const { data: seeded, error: seedErr } = await supabase()
      .from('financial_years')
      .upsert(seedYears, { onConflict: 'company_id, year_label' })
      .select();

    if (seedErr) {
      console.warn('Error auto-seeding FY:', seedErr);
      return [];
    }
    return (seeded || []).map(mapFinancialYear);
  }

  return data.map(mapFinancialYear);
}

export async function getPurchaseExpenseOverviewStats(
  companyId: string,
  financialYear?: string
): Promise<PurchaseExpenseOverviewStats> {
  const fy = financialYear || formatFinancialYearCode(new Date());

  // 1. Purchases query
  const { data: purchases } = await supabase()
    .from('purchases')
    .select(`
      id,
      supplier_gstin,
      is_gst_bill,
      grand_total,
      paid_amount,
      balance_amount,
      total_gst,
      payment_status,
      status,
      documents:documents (id)
    `)
    .eq('company_id', companyId)
    .eq('financial_year', fy);

  // 2. Expenses query
  const { data: expenses } = await supabase()
    .from('expenses')
    .select('id, amount, taxable_amount, total_gst, total_amount, paid_amount, payment_status, is_gst_applicable')
    .eq('company_id', companyId)
    .eq('financial_year', fy);

  let totalPurchases = 0;
  let totalPaidPurchases = 0;
  let totalOutstandingPurchases = 0;
  let inputGst = 0;
  let pendingBills = 0;
  let draftPurchases = 0;
  let missingDocumentsCount = 0;
  let missingGstinCount = 0;

  (purchases || []).forEach((p) => {
    if (p.status === 'Cancelled') return;
    if (p.status === 'Draft') {
      draftPurchases++;
      return;
    }

    const gTotal = Number(p.grand_total) || 0;
    const paid = Number(p.paid_amount) || 0;
    const bal = Number(p.balance_amount) || 0;
    const gst = Number(p.total_gst) || 0;

    totalPurchases += gTotal;
    totalPaidPurchases += paid;
    totalOutstandingPurchases += bal;
    inputGst += gst;

    if (p.payment_status === 'Unpaid' || p.payment_status === 'Partially Paid') {
      pendingBills++;
    }

    const docs = (p as unknown as { documents: unknown[] }).documents;
    if (!docs || docs.length === 0) {
      missingDocumentsCount++;
    }

    if (p.is_gst_bill && !p.supplier_gstin?.trim()) {
      missingGstinCount++;
    }
  });

  let totalExpenses = 0;
  let totalPaidExpenses = 0;
  let totalOutstandingExpenses = 0;

  (expenses || []).forEach((e) => {
    const total = Number(e.total_amount) || 0;
    const paid = Number(e.paid_amount) || 0;
    const gst = Number(e.total_gst) || 0;

    totalExpenses += total;
    totalPaidExpenses += paid;
    totalOutstandingExpenses += Math.max(0, total - paid);

    if (e.is_gst_applicable) {
      inputGst += gst;
    }

    if (e.payment_status === 'Unpaid' || e.payment_status === 'Partially Paid') {
      pendingBills++;
    }
  });

  return {
    totalPurchases,
    totalExpenses,
    inputGst,
    pendingBills,
    totalPaid: totalPaidPurchases + totalPaidExpenses,
    totalOutstanding: totalOutstandingPurchases + totalOutstandingExpenses,
    draftPurchases,
    missingDocumentsCount,
    missingGstinCount,
  };
}

export async function getGstInputReport(
  companyId: string,
  filters?: { financialYear?: string; dateFrom?: string; dateTo?: string }
): Promise<{ rows: GstInputReportRow[]; totals: { taxable: number; cgst: number; sgst: number; igst: number; totalGst: number } }> {
  // Purchases
  let pQuery = supabase()
    .from('purchases')
    .select('supplier_name, supplier_gstin, invoice_number, invoice_date, subtotal, cgst_amount, sgst_amount, igst_amount, total_gst, grand_total, is_gst_bill, status')
    .eq('company_id', companyId)
    .eq('is_gst_bill', true)
    .neq('status', 'Cancelled')
    .neq('status', 'Draft');

  if (filters?.financialYear) pQuery = pQuery.eq('financial_year', filters.financialYear);
  if (filters?.dateFrom) pQuery = pQuery.gte('invoice_date', filters.dateFrom);
  if (filters?.dateTo) pQuery = pQuery.lte('invoice_date', filters.dateTo);

  // Expenses with GST
  let eQuery = supabase()
    .from('expenses')
    .select('paid_to, vendor_gstin, reference_number, expense_date, taxable_amount, cgst_amount, sgst_amount, igst_amount, total_gst, total_amount, is_gst_applicable')
    .eq('company_id', companyId)
    .eq('is_gst_applicable', true);

  if (filters?.financialYear) eQuery = eQuery.eq('financial_year', filters.financialYear);
  if (filters?.dateFrom) eQuery = eQuery.gte('expense_date', filters.dateFrom);
  if (filters?.dateTo) eQuery = eQuery.lte('expense_date', filters.dateTo);

  const [pRes, eRes] = await Promise.all([pQuery, eQuery]);

  const rows: GstInputReportRow[] = [];

  (pRes.data || []).forEach((p) => {
    rows.push({
      supplier_name: p.supplier_name,
      supplier_gstin: p.supplier_gstin || 'Unspecified',
      invoice_number: p.invoice_number,
      invoice_date: p.invoice_date,
      taxable_amount: Number(p.subtotal) || 0,
      cgst_amount: Number(p.cgst_amount) || 0,
      sgst_amount: Number(p.sgst_amount) || 0,
      igst_amount: Number(p.igst_amount) || 0,
      total_gst: Number(p.total_gst) || 0,
      grand_total: Number(p.grand_total) || 0,
      source: 'Purchase',
    });
  });

  (eRes.data || []).forEach((e) => {
    rows.push({
      supplier_name: e.paid_to,
      supplier_gstin: e.vendor_gstin || 'Unspecified',
      invoice_number: e.reference_number || 'EXP-BILL',
      invoice_date: e.expense_date,
      taxable_amount: Number(e.taxable_amount) || 0,
      cgst_amount: Number(e.cgst_amount) || 0,
      sgst_amount: Number(e.sgst_amount) || 0,
      igst_amount: Number(e.igst_amount) || 0,
      total_gst: Number(e.total_gst) || 0,
      grand_total: Number(e.total_amount) || 0,
      source: 'Expense',
    });
  });

  // Sort by invoice_date desc
  rows.sort((a, b) => new Date(b.invoice_date).getTime() - new Date(a.invoice_date).getTime());

  const totals = rows.reduce(
    (acc, r) => ({
      taxable: acc.taxable + r.taxable_amount,
      cgst: acc.cgst + r.cgst_amount,
      sgst: acc.sgst + r.sgst_amount,
      igst: acc.igst + r.igst_amount,
      totalGst: acc.totalGst + r.total_gst,
    }),
    { taxable: 0, cgst: 0, sgst: 0, igst: 0, totalGst: 0 }
  );

  return { rows, totals };
}

export async function getYearEndReviewData(
  companyId: string,
  financialYear: string
): Promise<YearEndReviewData> {
  const [startYearStr, endYearShort] = financialYear.split('-');
  const startYear = Number(startYearStr);
  const startDate = `${startYear}-04-01`;
  const endDate = `${startYear + 1}-03-31`;

  // 1. Sales from Challans / Invoices
  const { data: challans } = await supabase()
    .from('challans')
    .select('id, challan_number, date, subtotal, grand_total, cgst_amount, sgst_amount, igst_amount, status')
    .eq('company_id', companyId)
    .gte('date', startDate)
    .lte('date', endDate);

  let totalSales = 0;
  let totalInvoices = 0;
  let taxableSales = 0;
  let outputGst = 0;

  (challans || []).forEach((c) => {
    if (c.status === 'Cancelled') return;
    totalInvoices++;
    totalSales += Number(c.grand_total) || 0;
    taxableSales += Number(c.subtotal) || 0;
    outputGst += (Number(c.cgst_amount) || 0) + (Number(c.sgst_amount) || 0) + (Number(c.igst_amount) || 0);
  });

  // 2. Purchases
  const { data: purchases } = await supabase()
    .from('purchases')
    .select(`
      id,
      invoice_number,
      grand_total,
      subtotal,
      total_gst,
      paid_amount,
      balance_amount,
      is_gst_bill,
      supplier_gstin,
      payment_status,
      status,
      documents:documents (id)
    `)
    .eq('company_id', companyId)
    .eq('financial_year', financialYear);

  let totalPurchases = 0;
  let purchaseBillsCount = 0;
  let inputGst = 0;
  let unpaidBillsCount = 0;
  let missingDocumentsCount = 0;
  let missingGstinGstBillsCount = 0;
  const invoiceMap = new Map<string, number>();

  (purchases || []).forEach((p) => {
    if (p.status === 'Cancelled' || p.status === 'Draft') return;
    purchaseBillsCount++;
    totalPurchases += Number(p.grand_total) || 0;
    inputGst += Number(p.total_gst) || 0;

    if (p.payment_status === 'Unpaid' || p.payment_status === 'Partially Paid') {
      unpaidBillsCount++;
    }

    const docs = (p as unknown as { documents: unknown[] }).documents;
    if (!docs || docs.length === 0) {
      missingDocumentsCount++;
    }

    if (p.is_gst_bill && !p.supplier_gstin?.trim()) {
      missingGstinGstBillsCount++;
    }

    const key = (p.invoice_number || '').trim().toLowerCase();
    invoiceMap.set(key, (invoiceMap.get(key) || 0) + 1);
  });

  let duplicateInvoicesCount = 0;
  invoiceMap.forEach((cnt) => {
    if (cnt > 1) duplicateInvoicesCount += cnt - 1;
  });

  // 3. Expenses
  const { data: expenses } = await supabase()
    .from('expenses')
    .select('id, total_amount, paid_amount, total_gst, is_gst_applicable, payment_status')
    .eq('company_id', companyId)
    .eq('financial_year', financialYear);

  let totalExpenses = 0;
  let paidExpenses = 0;
  let outstandingExpenses = 0;

  (expenses || []).forEach((e) => {
    const total = Number(e.total_amount) || 0;
    const paid = Number(e.paid_amount) || 0;
    totalExpenses += total;
    paidExpenses += paid;
    outstandingExpenses += Math.max(0, total - paid);

    if (e.is_gst_applicable) {
      inputGst += Number(e.total_gst) || 0;
    }

    if (e.payment_status === 'Unpaid' || e.payment_status === 'Partially Paid') {
      unpaidBillsCount++;
    }
  });

  // 4. Stock
  const { data: stocks } = await supabase()
    .from('stocks')
    .select('id, available_taka, sold_taka, total_taka')
    .eq('company_id', companyId);

  let totalQualities = 0;
  let closingStockTaka = 0;
  let soldStockTaka = 0;
  let totalStockTaka = 0;

  (stocks || []).forEach((s) => {
    totalQualities++;
    closingStockTaka += Number(s.available_taka) || 0;
    soldStockTaka += Number(s.sold_taka) || 0;
    totalStockTaka += Number(s.total_taka) || 0;
  });

  const netGstPosition = outputGst - inputGst; // Positive = Payable to Govt, Negative = ITC Credit

  return {
    financialYear,
    sales: {
      totalSales,
      totalInvoices,
      taxableSales,
      outputGst,
    },
    purchases: {
      totalPurchases,
      purchaseBillsCount,
      inputGst,
    },
    expenses: {
      totalExpenses,
      paidExpenses,
      outstandingExpenses,
    },
    stock: {
      totalQualities,
      openingStockTaka: Math.max(0, totalStockTaka - soldStockTaka),
      purchaseStockTaka: totalStockTaka,
      soldStockTaka,
      closingStockTaka,
    },
    gst: {
      inputGst,
      outputGst,
      netGstPosition,
    },
    warnings: {
      unpaidBillsCount,
      missingDocumentsCount,
      missingGstinGstBillsCount,
      duplicateInvoicesCount,
    },
  };
}

export async function closeFinancialYear(
  companyId: string,
  yearLabel: string,
  notes: string,
  userId?: string | null
): Promise<FinancialYear> {
  const { data, error } = await supabase()
    .from('financial_years')
    .update({
      status: 'Closed',
      closing_notes: notes,
      closed_at: new Date().toISOString(),
      closed_by: userId || null,
      updated_at: new Date().toISOString(),
    })
    .eq('company_id', companyId)
    .eq('year_label', yearLabel)
    .select()
    .single();

  if (error) throw error;

  try {
    await supabase().from('audit_logs').insert({
      company_id: companyId,
      user_id: userId || null,
      action: 'close_financial_year',
      module: 'purchases',
      entity_type: 'financial_year',
      metadata: {
        financial_year: yearLabel,
        closing_notes: notes,
      },
    });
  } catch (err) {
    console.warn('Audit error on close FY:', err);
  }

  return mapFinancialYear(data);
}

export async function reopenFinancialYear(
  companyId: string,
  yearLabel: string,
  userId?: string | null
): Promise<FinancialYear> {
  const { data, error } = await supabase()
    .from('financial_years')
    .update({
      status: 'Open',
      closed_at: null,
      closed_by: null,
      updated_at: new Date().toISOString(),
    })
    .eq('company_id', companyId)
    .eq('year_label', yearLabel)
    .select()
    .single();

  if (error) throw error;

  try {
    await supabase().from('audit_logs').insert({
      company_id: companyId,
      user_id: userId || null,
      action: 'reopen_financial_year',
      module: 'purchases',
      entity_type: 'financial_year',
      metadata: {
        financial_year: yearLabel,
      },
    });
  } catch (err) {
    console.warn('Audit error on reopen FY:', err);
  }

  return mapFinancialYear(data);
}

export async function getCompleteYearEndReportData(
  companyId: string,
  financialYear: string
): Promise<CompleteYearEndReportData> {
  const [startYearStr] = financialYear.split('-');
  const startYear = Number(startYearStr);
  const startDate = `${startYear}-04-01`;
  const endDate = `${startYear + 1}-03-31`;

  const [
    companyRes,
    challansRes,
    customersRes,
    purchasesRes,
    expensesRes,
    categoriesRes,
    stocksRes,
    employeesRes,
    salaryRes,
  ] = await Promise.all([
    supabase().from('companies').select('*').eq('id', companyId).single(),
    supabase()
      .from('challans')
      .select('id, challan_number, date, customer_id, subtotal, grand_total, cgst_amount, sgst_amount, igst_amount, payment_amount_received, status')
      .eq('company_id', companyId)
      .gte('date', startDate)
      .lte('date', endDate),
    supabase().from('customers').select('id, name').eq('company_id', companyId),
    supabase()
      .from('purchases')
      .select('id, supplier_id, supplier_name, supplier_gstin, invoice_number, invoice_date, subtotal, grand_total, cgst_amount, sgst_amount, igst_amount, total_gst, paid_amount, balance_amount, payment_status, is_gst_bill, status, documents:documents(id)')
      .eq('company_id', companyId)
      .eq('financial_year', financialYear),
    supabase()
      .from('expenses')
      .select('id, category_id, category_name, paid_to, vendor_gstin, amount, taxable_amount, cgst_amount, sgst_amount, igst_amount, total_gst, total_amount, paid_amount, is_gst_applicable, payment_status, documents:documents(id)')
      .eq('company_id', companyId)
      .eq('financial_year', financialYear),
    supabase().from('expense_categories').select('id, name').eq('company_id', companyId),
    supabase().from('stocks').select('id, quality_name, available_taka, sold_taka, total_taka').eq('company_id', companyId),
    supabase().from('company_members').select('id, user_id, is_active').eq('company_id', companyId),
    supabase().from('salary_slips').select('id, net_salary, salary_year, salary_month').eq('company_id', companyId),
  ]);

  const companyData = companyRes.data;

  // Customers Map
  const customerMap = new Map<string, string>();
  (customersRes.data || []).forEach((c) => customerMap.set(c.id, c.name));

  // Expense Categories Map
  const categoryMap = new Map<string, string>();
  (categoriesRes.data || []).forEach((cat) => categoryMap.set(cat.id, cat.name));

  // 1. Sales & Customer Summary
  const customerStats = new Map<string, { customerName: string; invoicesCount: number; totalSales: number; receivedAmount: number; outstanding: number }>();
  let totalSales = 0;
  let totalInvoices = 0;
  let taxableSales = 0;
  let salesCgst = 0;
  let salesSgst = 0;
  let salesIgst = 0;

  (challansRes.data || []).forEach((c) => {
    if (c.status === 'Cancelled') return;
    totalInvoices++;
    const grand = Number(c.grand_total) || 0;
    const sub = Number(c.subtotal) || 0;
    const cgst = Number(c.cgst_amount) || 0;
    const sgst = Number(c.sgst_amount) || 0;
    const igst = Number(c.igst_amount) || 0;
    const rec = Number(c.payment_amount_received) || 0;
    const bal = Math.max(0, grand - rec);

    totalSales += grand;
    taxableSales += sub;
    salesCgst += cgst;
    salesSgst += sgst;
    salesIgst += igst;

    const custName = customerMap.get(c.customer_id) || 'General Customer';
    const current = customerStats.get(c.customer_id) || {
      customerName: custName,
      invoicesCount: 0,
      totalSales: 0,
      receivedAmount: 0,
      outstanding: 0,
    };
    current.invoicesCount += 1;
    current.totalSales += grand;
    current.receivedAmount += rec;
    current.outstanding += bal;
    customerStats.set(c.customer_id, current);
  });

  const totalSalesGst = salesCgst + salesSgst + salesIgst;
  const netSales = taxableSales > 0 ? taxableSales : Math.max(0, totalSales - totalSalesGst);

  let totalReceivables = 0;
  customerStats.forEach((c) => {
    totalReceivables += c.outstanding;
  });

  // 2. Purchases & Supplier Summary
  const supplierStats = new Map<string, { supplierName: string; billsCount: number; totalPurchases: number; paidAmount: number; outstanding: number }>();
  let totalPurchases = 0;
  let totalPurchaseBills = 0;
  let taxablePurchases = 0;
  let purchaseCgst = 0;
  let purchaseSgst = 0;
  let purchaseIgst = 0;
  let totalInputGst = 0;
  let uploadedPurchaseDocs = 0;
  let missingPurchaseDocs = 0;
  let totalGstBills = 0;
  let missingGstinCount = 0;
  const invoiceMap = new Map<string, number>();

  (purchasesRes.data || []).forEach((p) => {
    if (p.status === 'Cancelled' || p.status === 'Draft') return;
    totalPurchaseBills++;
    const grand = Number(p.grand_total) || 0;
    const sub = Number(p.subtotal) || 0;
    const cgst = Number(p.cgst_amount) || 0;
    const sgst = Number(p.sgst_amount) || 0;
    const igst = Number(p.igst_amount) || 0;
    const gst = Number(p.total_gst) || (cgst + sgst + igst);
    const paid = Number(p.paid_amount) || 0;
    const bal = Number(p.balance_amount) || Math.max(0, grand - paid);

    totalPurchases += grand;
    taxablePurchases += sub;
    purchaseCgst += cgst;
    purchaseSgst += sgst;
    purchaseIgst += igst;
    totalInputGst += gst;

    if (p.is_gst_bill) totalGstBills++;
    if (p.is_gst_bill && !p.supplier_gstin?.trim()) missingGstinCount++;

    const docs = (p as unknown as { documents: unknown[] }).documents;
    if (docs && docs.length > 0) {
      uploadedPurchaseDocs++;
    } else {
      missingPurchaseDocs++;
    }

    const sName = p.supplier_name || 'Vendor';
    const current = supplierStats.get(sName) || {
      supplierName: sName,
      billsCount: 0,
      totalPurchases: 0,
      paidAmount: 0,
      outstanding: 0,
    };
    current.billsCount += 1;
    current.totalPurchases += grand;
    current.paidAmount += paid;
    current.outstanding += bal;
    supplierStats.set(sName, current);

    const invKey = (p.invoice_number || '').trim().toLowerCase();
    invoiceMap.set(invKey, (invoiceMap.get(invKey) || 0) + 1);
  });

  // 3. Expenses Summary
  const categoryStats = new Map<string, { categoryName: string; count: number; totalAmount: number; gstAmount: number }>();
  let totalExpenses = 0;
  let totalExpenseGst = 0;
  let expenseCgst = 0;
  let expenseSgst = 0;
  let expenseIgst = 0;
  let expenseDocsCount = 0;
  let unpaidExpensesBal = 0;

  (expensesRes.data || []).forEach((e) => {
    const total = Number(e.total_amount) || 0;
    const gst = Number(e.total_gst) || 0;
    const paid = Number(e.paid_amount) || 0;
    const bal = Math.max(0, total - paid);
    unpaidExpensesBal += bal;

    totalExpenses += total;
    if (e.is_gst_applicable) {
      totalExpenseGst += gst;
      expenseCgst += Number(e.cgst_amount) || 0;
      expenseSgst += Number(e.sgst_amount) || 0;
      expenseIgst += Number(e.igst_amount) || 0;
      totalInputGst += gst;
    }

    const eDocs = (e as unknown as { documents: unknown[] }).documents;
    if (eDocs && eDocs.length > 0) {
      expenseDocsCount++;
    }

    const catName = e.category_name || (e.category_id && categoryMap.get(e.category_id)) || 'General Expenses';
    const current = categoryStats.get(catName) || {
      categoryName: catName,
      count: 0,
      totalAmount: 0,
      gstAmount: 0,
    };
    current.count += 1;
    current.totalAmount += total;
    current.gstAmount += gst;
    categoryStats.set(catName, current);
  });

  let totalPayables = 0;
  supplierStats.forEach((s) => {
    totalPayables += s.outstanding;
  });
  totalPayables += unpaidExpensesBal;

  // 4. GST Position
  const inputCgst = purchaseCgst + expenseCgst;
  const inputSgst = purchaseSgst + expenseSgst;
  const inputIgst = purchaseIgst + expenseIgst;
  const outputCgst = salesCgst;
  const outputSgst = salesSgst;
  const outputIgst = salesIgst;
  const totalOutputGst = outputCgst + outputSgst + outputIgst;
  const netGstPosition = totalOutputGst - totalInputGst;

  // 5. Stock Summary
  let totalOpeningTaka = 0;
  let totalSoldTaka = 0;
  let totalClosingTaka = 0;

  const stockItems = (stocksRes.data || []).map((s) => {
    const total = Number(s.total_taka) || 0;
    const sold = Number(s.sold_taka) || 0;
    const avail = Number(s.available_taka) || 0;
    const opening = Math.max(0, total - sold);

    totalOpeningTaka += opening;
    totalSoldTaka += sold;
    totalClosingTaka += avail;

    return {
      qualityName: s.quality_name,
      openingTaka: opening,
      purchasedTaka: total,
      soldTaka: sold,
      closingTaka: avail,
      unit: 'Taka',
    };
  });

  // 6. Employees & Salary
  const FY_MONTHS_YEAR1 = ['April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const FY_MONTHS_YEAR2 = ['January', 'February', 'March'];
  let totalSalaryPaid = 0;
  let salarySlipsGenerated = 0;

  (salaryRes.data || []).forEach((s) => {
    const isYear1 = s.salary_year === startYear && FY_MONTHS_YEAR1.includes(s.salary_month);
    const isYear2 = s.salary_year === startYear + 1 && FY_MONTHS_YEAR2.includes(s.salary_month);
    if (isYear1 || isYear2) {
      salarySlipsGenerated++;
      totalSalaryPaid += Number(s.net_salary) || 0;
    }
  });

  // 7. Actionable Checklist
  const actionableIssues: string[] = [];
  if (missingPurchaseDocs > 0) {
    actionableIssues.push(`${missingPurchaseDocs} purchase bills do not have original document/invoice attached.`);
  }
  if (missingGstinCount > 0) {
    actionableIssues.push(`${missingGstinCount} GST bills require supplier GSTIN review.`);
  }
  let duplicateInvoicesCount = 0;
  invoiceMap.forEach((cnt) => {
    if (cnt > 1) duplicateInvoicesCount += cnt - 1;
  });
  if (duplicateInvoicesCount > 0) {
    actionableIssues.push(`${duplicateInvoicesCount} potential duplicate purchase bills detected.`);
  }
  if (totalReceivables > 0) {
    actionableIssues.push(`₹${Math.round(totalReceivables).toLocaleString('en-IN')} in customer receivables pending collection.`);
  }
  if (totalPayables > 0) {
    actionableIssues.push(`₹${Math.round(totalPayables).toLocaleString('en-IN')} in supplier payables outstanding.`);
  }

  return {
    company: {
      name: companyData?.name || 'Textile Enterprise',
      address: companyData?.address || '',
      city: companyData?.city || '',
      state: companyData?.state || '',
      pincode: companyData?.pincode || '',
      gstin: companyData?.gst_number || '',
      pan: companyData?.pan_number || '',
      phone: companyData?.phone || '',
      email: companyData?.email || '',
    },
    financialYear,
    dateRange: { start: startDate, end: endDate },
    generatedAt: new Date().toISOString(),
    executiveSummary: {
      totalSales,
      totalPurchases,
      totalExpenses,
      totalReceivables,
      totalPayables,
      totalInputGst,
      totalOutputGst,
      netGstPosition,
      openingStockTaka: totalOpeningTaka,
      closingStockTaka: totalClosingTaka,
    },
    salesSummary: {
      totalInvoices,
      totalSales,
      taxableSales,
      cgst: salesCgst,
      sgst: salesSgst,
      igst: salesIgst,
      totalGst: totalSalesGst,
      netSales,
    },
    purchaseSummary: {
      totalPurchaseBills,
      totalPurchases,
      taxablePurchases,
      cgst: purchaseCgst,
      sgst: purchaseSgst,
      igst: purchaseIgst,
      inputGst: purchaseCgst + purchaseSgst + purchaseIgst,
    },
    expenseSummary: {
      categories: Array.from(categoryStats.values()),
      totalExpenses,
      totalGst: totalExpenseGst,
    },
    gstSummary: {
      inputCgst,
      inputSgst,
      inputIgst,
      totalInputGst,
      outputCgst,
      outputSgst,
      outputIgst,
      totalOutputGst,
      netGstPosition,
    },
    stockSummary: {
      items: stockItems,
      totalOpeningTaka,
      totalSoldTaka,
      totalClosingTaka,
    },
    customerSummary: Array.from(customerStats.values()).sort((a, b) => b.totalSales - a.totalSales),
    supplierSummary: Array.from(supplierStats.values()).sort((a, b) => b.totalPurchases - a.totalPurchases),
    employeeSummary: {
      totalEmployees: (employeesRes.data || []).filter((e) => e.is_active).length,
      salarySlipsGenerated,
      totalSalaryPaid,
    },
    documentSummary: {
      totalPurchaseBills,
      uploadedPurchaseDocs,
      missingPurchaseDocs,
      expenseDocsCount,
      totalGstBills,
    },
    checklist: {
      salesReviewed: totalInvoices > 0,
      purchasesReviewed: totalPurchaseBills > 0,
      expensesReviewed: totalExpenses > 0,
      gstReviewed: true,
      stockReviewed: stockItems.length > 0,
      outstandingReviewed: totalReceivables === 0 && totalPayables === 0,
      documentsReviewed: missingPurchaseDocs === 0,
      actionableIssues,
    },
  };
}

export function exportYearEndDataCsv(data: CompleteYearEndReportData): string {
  const lines: string[] = [];

  lines.push(`COMPLETE FINANCIAL YEAR AUDIT REPORT`);
  lines.push(`Company,"${data.company.name}"`);
  lines.push(`GSTIN,"${data.company.gstin || 'N/A'}"`);
  lines.push(`Financial Year,"${data.financialYear} (${data.dateRange.start} to ${data.dateRange.end})"`);
  lines.push(`Generated,"${new Date(data.generatedAt).toLocaleString('en-IN')}"`);
  lines.push('');

  lines.push(`EXECUTIVE SUMMARY`);
  lines.push(`Metric,Amount (INR)`);
  lines.push(`Total Sales,${data.executiveSummary.totalSales}`);
  lines.push(`Total Purchases,${data.executiveSummary.totalPurchases}`);
  lines.push(`Total Expenses,${data.executiveSummary.totalExpenses}`);
  lines.push(`Total Receivables,${data.executiveSummary.totalReceivables}`);
  lines.push(`Total Payables,${data.executiveSummary.totalPayables}`);
  lines.push(`Total Input GST,${data.executiveSummary.totalInputGst}`);
  lines.push(`Total Output GST,${data.executiveSummary.totalOutputGst}`);
  lines.push(`Net GST Position,${data.executiveSummary.netGstPosition}`);
  lines.push(`Opening Stock (Taka),${data.executiveSummary.openingStockTaka}`);
  lines.push(`Closing Stock (Taka),${data.executiveSummary.closingStockTaka}`);
  lines.push('');

  lines.push(`SALES SUMMARY`);
  lines.push(`Total Invoices,${data.salesSummary.totalInvoices}`);
  lines.push(`Taxable Sales,${data.salesSummary.taxableSales}`);
  lines.push(`Sales CGST,${data.salesSummary.cgst}`);
  lines.push(`Sales SGST,${data.salesSummary.sgst}`);
  lines.push(`Sales IGST,${data.salesSummary.igst}`);
  lines.push(`Total Sales GST,${data.salesSummary.totalGst}`);
  lines.push(`Net Sales,${data.salesSummary.netSales}`);
  lines.push('');

  lines.push(`PURCHASE SUMMARY`);
  lines.push(`Total Purchase Bills,${data.purchaseSummary.totalPurchaseBills}`);
  lines.push(`Taxable Purchases,${data.purchaseSummary.taxablePurchases}`);
  lines.push(`Purchases CGST,${data.purchaseSummary.cgst}`);
  lines.push(`Purchases SGST,${data.purchaseSummary.sgst}`);
  lines.push(`Purchases IGST,${data.purchaseSummary.igst}`);
  lines.push(`Input GST on Purchases,${data.purchaseSummary.inputGst}`);
  lines.push('');

  lines.push(`EXPENSES BY CATEGORY`);
  lines.push(`Category,Transactions,Amount,GST`);
  data.expenseSummary.categories.forEach((cat) => {
    lines.push(`"${cat.categoryName}",${cat.count},${cat.totalAmount},${cat.gstAmount}`);
  });
  lines.push('');

  lines.push(`GST RECONCILIATION`);
  lines.push(`Type,CGST,SGST,IGST,Total`);
  lines.push(`Input Tax Credit,${data.gstSummary.inputCgst},${data.gstSummary.inputSgst},${data.gstSummary.inputIgst},${data.gstSummary.totalInputGst}`);
  lines.push(`Output Tax Liability,${data.gstSummary.outputCgst},${data.gstSummary.outputSgst},${data.gstSummary.outputIgst},${data.gstSummary.totalOutputGst}`);
  lines.push(`Net Position,,,,,${data.gstSummary.netGstPosition}`);
  lines.push('');

  lines.push(`CUSTOMER SUMMARY`);
  lines.push(`Customer Name,Invoices,Sales,Received,Outstanding`);
  data.customerSummary.forEach((c) => {
    lines.push(`"${c.customerName}",${c.invoicesCount},${c.totalSales},${c.receivedAmount},${c.outstanding}`);
  });
  lines.push('');

  lines.push(`SUPPLIER SUMMARY`);
  lines.push(`Supplier Name,Bills,Purchases,Paid,Outstanding`);
  data.supplierSummary.forEach((s) => {
    lines.push(`"${s.supplierName}",${s.billsCount},${s.totalPurchases},${s.paidAmount},${s.outstanding}`);
  });
  lines.push('');

  lines.push(`STOCK SUMMARY`);
  lines.push(`Quality,Opening Taka,Total Taka,Sold Taka,Closing Taka`);
  data.stockSummary.items.forEach((item) => {
    lines.push(`"${item.qualityName}",${item.openingTaka},${item.purchasedTaka},${item.soldTaka},${item.closingTaka}`);
  });

  return lines.join('\n');
}

