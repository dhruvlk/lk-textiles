import { createClient } from '@/lib/supabase/client';
import {
  buildPaginatedResult,
  paginatedRange,
} from '@/lib/table/pagination';
import type {
  Expense,
  ExpenseFilters,
  PaginatedResult,
  PaginationParams,
} from '@/types';
import type { ExpenseRow } from '@/types/database';

const supabase = () => createClient();

function mapExpense(
  row: ExpenseRow & {
    category?: unknown;
    documents?: unknown[];
  }
): Expense {
  return {
    id: row.id,
    company_id: row.company_id,
    expense_date: row.expense_date,
    financial_year: row.financial_year,
    category_id: row.category_id,
    category_name: row.category_name,
    paid_to: row.paid_to,
    supplier_id: row.supplier_id,
    amount: Number(row.amount) || 0,
    is_gst_applicable: row.is_gst_applicable,
    vendor_gstin: row.vendor_gstin,
    hsn_sac: row.hsn_sac,
    taxable_amount: Number(row.taxable_amount) || 0,
    gst_rate: Number(row.gst_rate) || 0,
    cgst_amount: Number(row.cgst_amount) || 0,
    sgst_amount: Number(row.sgst_amount) || 0,
    igst_amount: Number(row.igst_amount) || 0,
    total_gst: Number(row.total_gst) || 0,
    total_amount: Number(row.total_amount) || 0,
    payment_method: row.payment_method,
    payment_status: row.payment_status,
    paid_amount: Number(row.paid_amount) || 0,
    reference_number: row.reference_number,
    notes: row.notes,
    status: row.status,
    created_by: row.created_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
    category: row.category as Expense['category'],
    documents: (row.documents || []) as Expense['documents'],
  };
}

export async function getExpensesPaginated(
  companyId: string,
  filters: ExpenseFilters = {},
  { page = 1, pageSize = 20 }: PaginationParams = {}
): Promise<PaginatedResult<Expense>> {
  const { from, to } = paginatedRange(page, pageSize);

  let query = supabase()
    .from('expenses')
    .select(
      `
      *,
      category:expense_categories (
        id,
        name,
        color
      ),
      documents:documents (
        id,
        file_name,
        file_type,
        file_size,
        public_url,
        document_type
      )
    `,
      { count: 'exact' }
    )
    .eq('company_id', companyId);

  if (filters.financialYear?.trim()) {
    query = query.eq('financial_year', filters.financialYear.trim());
  }

  if (filters.categoryId?.trim()) {
    query = query.eq('category_id', filters.categoryId.trim());
  }

  if (filters.paymentStatus) {
    query = query.eq('payment_status', filters.paymentStatus as ExpenseRow['payment_status']);
  }

  if (filters.gstStatus === 'gst') {
    query = query.eq('is_gst_applicable', true);
  } else if (filters.gstStatus === 'non_gst') {
    query = query.eq('is_gst_applicable', false);
  }

  if (filters.dateFrom?.trim()) {
    query = query.gte('expense_date', filters.dateFrom.trim());
  }

  if (filters.dateTo?.trim()) {
    query = query.lte('expense_date', filters.dateTo.trim());
  }

  if (filters.search?.trim()) {
    const s = filters.search.trim();
    query = query.or(
      `paid_to.ilike.%${s}%,category_name.ilike.%${s}%,reference_number.ilike.%${s}%,notes.ilike.%${s}%`
    );
  }

  if (filters.sort) {
    query = query.order(filters.sort.column, {
      ascending: filters.sort.direction === 'asc',
    });
  } else {
    query = query.order('expense_date', { ascending: false }).order('created_at', { ascending: false });
  }

  const { data, count, error } = await query.range(from, to);

  if (error) {
    console.error('Error fetching expenses:', error);
    throw error;
  }

  return buildPaginatedResult(
    ((data as any[]) || []).map((row) => mapExpense(row)),
    count || 0,
    page,
    pageSize
  );
}

export async function getExpenseById(companyId: string, id: string): Promise<Expense | null> {
  const { data, error } = await supabase()
    .from('expenses')
    .select(
      `
      *,
      category:expense_categories (*),
      documents:documents (*)
    `
    )
    .eq('company_id', companyId)
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data ? mapExpense(data as any) : null;
}

export async function createExpense(
  companyId: string,
  expenseData: Omit<Expense, 'id' | 'company_id' | 'created_at' | 'updated_at' | 'category' | 'documents'>,
  userId?: string | null
): Promise<Expense> {
  const { data, error } = await supabase()
    .from('expenses')
    .insert({
      company_id: companyId,
      expense_date: expenseData.expense_date,
      financial_year: expenseData.financial_year,
      category_id: expenseData.category_id || null,
      category_name: expenseData.category_name.trim(),
      paid_to: expenseData.paid_to.trim(),
      supplier_id: expenseData.supplier_id || null,
      amount: expenseData.amount,
      is_gst_applicable: expenseData.is_gst_applicable,
      vendor_gstin: expenseData.vendor_gstin?.trim()?.toUpperCase() || null,
      hsn_sac: expenseData.hsn_sac?.trim() || null,
      taxable_amount: expenseData.taxable_amount,
      gst_rate: expenseData.gst_rate,
      cgst_amount: expenseData.cgst_amount,
      sgst_amount: expenseData.sgst_amount,
      igst_amount: expenseData.igst_amount,
      total_gst: expenseData.total_gst,
      total_amount: expenseData.total_amount,
      payment_method: expenseData.payment_method,
      payment_status: expenseData.payment_status,
      paid_amount: expenseData.paid_amount,
      reference_number: expenseData.reference_number?.trim() || null,
      notes: expenseData.notes?.trim() || null,
      status: expenseData.status || 'Active',
      created_by: userId || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating expense:', error);
    throw error;
  }

  // Audit Log
  try {
    await supabase().from('audit_logs').insert({
      company_id: companyId,
      user_id: userId || null,
      action: 'create_expense',
      module: 'purchases',
      entity_type: 'expense',
      entity_id: data.id,
      metadata: {
        category: data.category_name,
        paid_to: data.paid_to,
        amount: data.total_amount,
      },
    });
  } catch (auditErr) {
    console.warn('Audit log error:', auditErr);
  }

  return (await getExpenseById(companyId, data.id))!;
}

export async function updateExpense(
  companyId: string,
  id: string,
  updates: Partial<Omit<Expense, 'id' | 'company_id' | 'created_at' | 'updated_at' | 'category' | 'documents'>>,
  userId?: string | null
): Promise<Expense> {
  const payload: Partial<ExpenseRow> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.expense_date !== undefined) payload.expense_date = updates.expense_date;
  if (updates.financial_year !== undefined) payload.financial_year = updates.financial_year;
  if (updates.category_id !== undefined) payload.category_id = updates.category_id || null;
  if (updates.category_name !== undefined) payload.category_name = updates.category_name.trim();
  if (updates.paid_to !== undefined) payload.paid_to = updates.paid_to.trim();
  if (updates.supplier_id !== undefined) payload.supplier_id = updates.supplier_id || null;
  if (updates.amount !== undefined) payload.amount = updates.amount;
  if (updates.is_gst_applicable !== undefined) payload.is_gst_applicable = updates.is_gst_applicable;
  if (updates.vendor_gstin !== undefined) payload.vendor_gstin = updates.vendor_gstin?.trim()?.toUpperCase() || null;
  if (updates.hsn_sac !== undefined) payload.hsn_sac = updates.hsn_sac?.trim() || null;
  if (updates.taxable_amount !== undefined) payload.taxable_amount = updates.taxable_amount;
  if (updates.gst_rate !== undefined) payload.gst_rate = updates.gst_rate;
  if (updates.cgst_amount !== undefined) payload.cgst_amount = updates.cgst_amount;
  if (updates.sgst_amount !== undefined) payload.sgst_amount = updates.sgst_amount;
  if (updates.igst_amount !== undefined) payload.igst_amount = updates.igst_amount;
  if (updates.total_gst !== undefined) payload.total_gst = updates.total_gst;
  if (updates.total_amount !== undefined) payload.total_amount = updates.total_amount;
  if (updates.payment_method !== undefined) payload.payment_method = updates.payment_method;
  if (updates.payment_status !== undefined) payload.payment_status = updates.payment_status;
  if (updates.paid_amount !== undefined) payload.paid_amount = updates.paid_amount;
  if (updates.reference_number !== undefined) payload.reference_number = updates.reference_number?.trim() || null;
  if (updates.notes !== undefined) payload.notes = updates.notes?.trim() || null;
  if (updates.status !== undefined) payload.status = updates.status;

  const { data, error } = await supabase()
    .from('expenses')
    .update(payload)
    .eq('company_id', companyId)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return (await getExpenseById(companyId, data.id))!;
}

export async function deleteExpense(companyId: string, id: string, userId?: string | null): Promise<void> {
  const existing = await getExpenseById(companyId, id);

  const { error } = await supabase()
    .from('expenses')
    .delete()
    .eq('company_id', companyId)
    .eq('id', id);

  if (error) throw error;

  try {
    await supabase().from('audit_logs').insert({
      company_id: companyId,
      user_id: userId || null,
      action: 'delete_expense',
      module: 'purchases',
      entity_type: 'expense',
      entity_id: id,
      metadata: {
        paid_to: existing?.paid_to,
        amount: existing?.total_amount,
      },
    });
  } catch (auditErr) {
    console.warn('Audit log error:', auditErr);
  }
}
