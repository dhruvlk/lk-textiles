import { todayISODate } from '@/lib/dates';
import { createClient } from '@/lib/supabase/client';
import { callTransactionalRpc } from '@/lib/supabase/rpc';
import {
  buildPaginatedResult,
  paginatedRange,
  orIlikeValue,
} from '@/lib/table/pagination';
import type {
  PaginatedResult,
  PaginationParams,
  Purchase,
  PurchaseFilters,
  PurchaseItem,
  PurchasePayment,
} from '@/types';
import type {
  PurchaseItemRow,
  PurchasePaymentRow,
  PurchaseRow,
} from '@/types/database';

const supabase = () => createClient();

function mapPurchase(
  row: PurchaseRow & {
    supplier?: unknown;
    items?: unknown[];
    documents?: unknown[];
    payments?: unknown[];
  }
): Purchase {
  return {
    id: row.id,
    company_id: row.company_id,
    supplier_id: row.supplier_id,
    supplier_name: row.supplier_name,
    supplier_gstin: row.supplier_gstin,
    invoice_number: row.invoice_number,
    invoice_date: row.invoice_date,
    due_date: row.due_date,
    financial_year: row.financial_year,
    purchase_type: row.purchase_type,
    is_gst_bill: row.is_gst_bill,
    hsn_sac: row.hsn_sac,
    subtotal: Number(row.subtotal) || 0,
    discount: Number(row.discount) || 0,
    gst_rate: Number(row.gst_rate) || 0,
    cgst_amount: Number(row.cgst_amount) || 0,
    sgst_amount: Number(row.sgst_amount) || 0,
    igst_amount: Number(row.igst_amount) || 0,
    total_gst: Number(row.total_gst) || 0,
    round_off: Number(row.round_off) || 0,
    grand_total: Number(row.grand_total) || 0,
    payment_status: row.payment_status,
    paid_amount: Number(row.paid_amount) || 0,
    balance_amount: Number(row.balance_amount) || 0,
    payment_method: row.payment_method,
    status: row.status,
    notes: row.notes,
    created_by: row.created_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
    supplier: row.supplier as Purchase['supplier'],
    items: (row.items || []).map((it) => mapItem(it as PurchaseItemRow)),
    documents: (row.documents || []) as Purchase['documents'],
    payments: (row.payments || []).map((pm) => mapPayment(pm as PurchasePaymentRow)),
  };
}

function mapItem(row: PurchaseItemRow): PurchaseItem {
  return {
    id: row.id,
    purchase_id: row.purchase_id,
    product_id: row.product_id,
    stock_id: row.stock_id,
    item_name: row.item_name,
    description: row.description,
    hsn_sac: row.hsn_sac,
    quantity: Number(row.quantity) || 0,
    unit: row.unit || 'Kg',
    rate: Number(row.rate) || 0,
    discount: Number(row.discount) || 0,
    taxable_amount: Number(row.taxable_amount) || 0,
    gst_rate: Number(row.gst_rate) || 0,
    gst_amount: Number(row.gst_amount) || 0,
    total_amount: Number(row.total_amount) || 0,
    yarn_type: row.yarn_type,
    count: row.count,
    denier: row.denier,
    color: row.color,
    lot_number: row.lot_number,
    batch_number: row.batch_number,
    roll_number: row.roll_number,
    beam_number: row.beam_number,
    quality: row.quality,
    width: row.width,
    gsm: row.gsm,
    meters: row.meters !== null ? Number(row.meters) : null,
    weight: row.weight !== null ? Number(row.weight) : null,
    created_at: row.created_at,
  };
}

function mapPayment(row: PurchasePaymentRow): PurchasePayment {
  return {
    id: row.id,
    company_id: row.company_id,
    purchase_id: row.purchase_id,
    expense_id: row.expense_id,
    payment_date: row.payment_date,
    amount: Number(row.amount) || 0,
    payment_method: row.payment_method,
    reference_number: row.reference_number,
    notes: row.notes,
    created_by: row.created_by,
    created_at: row.created_at,
  };
}

export async function checkDuplicateInvoice(
  companyId: string,
  supplierId: string | null,
  supplierGstin: string | null,
  invoiceNumber: string,
  financialYear: string,
  excludePurchaseId?: string
): Promise<{ isDuplicate: boolean; existingPurchase?: Purchase | null }> {
  if (!invoiceNumber?.trim()) return { isDuplicate: false };

  let query = supabase()
    .from('purchases')
    .select('*, supplier:suppliers(id, name, gstin)')
    .eq('company_id', companyId)
    .ilike('invoice_number', invoiceNumber.trim())
    .eq('financial_year', financialYear);

  if (excludePurchaseId) {
    query = query.neq('id', excludePurchaseId);
  }

  if (supplierId) {
    query = query.eq('supplier_id', supplierId);
  } else if (supplierGstin) {
    query = query.eq('supplier_gstin', supplierGstin.trim().toUpperCase());
  }

  const { data, error } = await query.limit(1).maybeSingle();
  if (error && error.code !== 'PGRST116') {
    console.error('Error checking duplicate invoice:', error);
  }

  if (data) {
    return { isDuplicate: true, existingPurchase: mapPurchase(data) };
  }
  return { isDuplicate: false };
}

export async function getPurchasesPaginated(
  companyId: string,
  filters: PurchaseFilters = {},
  { page = 1, pageSize = 20 }: PaginationParams = {}
): Promise<PaginatedResult<Purchase>> {
  const { from, to } = paginatedRange(page, pageSize);

  let query = supabase()
    .from('purchases')
    .select(
      `
      *,
      supplier:suppliers (
        id,
        name,
        gstin,
        mobile
      ),
      documents:documents (
        id,
        file_name,
        file_type,
        file_size,
        public_url,
        storage_path,
        document_type
      ),
      items:purchase_items (
        id,
        item_name,
        quantity,
        unit,
        rate,
        total_amount,
        stock_id
      )
    `,
      { count: 'exact' }
    )
    .eq('company_id', companyId);

  if (filters.financialYear?.trim()) {
    query = query.eq('financial_year', filters.financialYear.trim());
  }

  if (filters.purchaseType) {
    query = query.eq('purchase_type', filters.purchaseType as PurchaseRow['purchase_type']);
  }

  if (filters.paymentStatus) {
    query = query.eq('payment_status', filters.paymentStatus as PurchaseRow['payment_status']);
  }

  if (filters.gstStatus === 'gst') {
    query = query.eq('is_gst_bill', true);
  } else if (filters.gstStatus === 'non_gst') {
    query = query.eq('is_gst_bill', false);
  }

  if (filters.supplierId?.trim()) {
    query = query.eq('supplier_id', filters.supplierId.trim());
  }

  if (filters.dateFrom?.trim()) {
    query = query.gte('invoice_date', filters.dateFrom.trim());
  }

  if (filters.dateTo?.trim()) {
    query = query.lte('invoice_date', filters.dateTo.trim());
  }

  if (filters.search?.trim()) {
    const s = filters.search.trim();
    const sq = orIlikeValue(s);
    query = query.or(
      `invoice_number.ilike.${sq},supplier_name.ilike.${sq},supplier_gstin.ilike.${sq},notes.ilike.${sq}`
    );
  }

  if (filters.sort) {
    query = query.order(filters.sort.column, {
      ascending: filters.sort.direction === 'asc',
    });
  } else {
    query = query.order('invoice_date', { ascending: false }).order('created_at', { ascending: false });
  }

  const { data, count, error } = await query.range(from, to);

  if (error) {
    console.error('Error fetching purchases:', error);
    throw error;
  }

  return buildPaginatedResult(
    ((data as unknown as Parameters<typeof mapPurchase>[0][]) || []).map((row) => mapPurchase(row)),
    count || 0,
    page,
    pageSize
  );
}

export async function getPurchaseById(companyId: string, id: string): Promise<Purchase | null> {
  const { data, error } = await supabase()
    .from('purchases')
    .select(
      `
      *,
      supplier:suppliers (*),
      items:purchase_items (*),
      documents:documents (*),
      payments:purchase_payments (*)
    `
    )
    .eq('company_id', companyId)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('Error fetching purchase by id:', error);
    throw error;
  }
  return data ? mapPurchase(data as unknown as Parameters<typeof mapPurchase>[0]) : null;
}

export async function createPurchase(
  companyId: string,
  purchaseData: Omit<
    Purchase,
    'id' | 'company_id' | 'created_at' | 'updated_at' | 'items' | 'documents' | 'payments'
  >,
  items: Omit<PurchaseItem, 'id' | 'purchase_id' | 'created_at'>[],
  options?: {
    userId?: string | null;
    initialPayment?: {
      amount: number;
      method: PurchasePayment['payment_method'];
      reference?: string;
      notes?: string;
    };
  }
): Promise<Purchase> {
  // Header, items, stock additions and the initial payment are one database
  // transaction (save_purchase). The header's paid / balance / status are
  // derived from the payment there, so it can never be counted twice.
  const header = {
    company_id: companyId,
    supplier_id: purchaseData.supplier_id || null,
    supplier_name: purchaseData.supplier_name,
    supplier_gstin: purchaseData.supplier_gstin || null,
    invoice_number: purchaseData.invoice_number,
    invoice_date: purchaseData.invoice_date,
    due_date: purchaseData.due_date || null,
    financial_year: purchaseData.financial_year,
    purchase_type: purchaseData.purchase_type,
    is_gst_bill: purchaseData.is_gst_bill,
    hsn_sac: purchaseData.hsn_sac || null,
    subtotal: purchaseData.subtotal,
    discount: purchaseData.discount,
    gst_rate: purchaseData.gst_rate,
    cgst_amount: purchaseData.cgst_amount,
    sgst_amount: purchaseData.sgst_amount,
    igst_amount: purchaseData.igst_amount,
    total_gst: purchaseData.total_gst,
    round_off: purchaseData.round_off,
    grand_total: purchaseData.grand_total,
    paid_amount: purchaseData.paid_amount,
    payment_method: purchaseData.payment_method || null,
    status: purchaseData.status || 'Active',
    notes: purchaseData.notes || null,
    created_by: options?.userId || null,
  };
  const itemRows = items.map((it) => ({
    product_id: it.product_id || null,
    stock_id: it.stock_id || null,
    item_name: it.item_name,
    description: it.description || null,
    hsn_sac: it.hsn_sac || null,
    quantity: Number(it.quantity) || 1,
    unit: it.unit || 'Kg',
    rate: Number(it.rate) || 0,
    discount: Number(it.discount) || 0,
    taxable_amount: Number(it.taxable_amount) || 0,
    gst_rate: Number(it.gst_rate) || 0,
    gst_amount: Number(it.gst_amount) || 0,
    total_amount: Number(it.total_amount) || 0,
    yarn_type: it.yarn_type || null,
    count: it.count || null,
    denier: it.denier || null,
    color: it.color || null,
    lot_number: it.lot_number || null,
    batch_number: it.batch_number || null,
    roll_number: it.roll_number || null,
    beam_number: it.beam_number || null,
    quality: it.quality || null,
    width: it.width || null,
    gsm: it.gsm || null,
    meters: it.meters !== null && it.meters !== undefined ? Number(it.meters) : null,
    weight: it.weight !== null && it.weight !== undefined ? Number(it.weight) : null,
  }));
  const initialPayment =
    options?.initialPayment && options.initialPayment.amount > 0
      ? {
          amount: options.initialPayment.amount,
          payment_method: options.initialPayment.method,
          reference_number: options.initialPayment.reference || null,
          notes: options.initialPayment.notes || 'Payment on bill creation',
          payment_date: purchaseData.invoice_date,
        }
      : null;

  const purchaseId = await callTransactionalRpc('save_purchase', {
    p_header: header,
    p_items: itemRows,
    p_initial_payment: initialPayment,
  });
  const purchase = { id: purchaseId, invoice_number: header.invoice_number, supplier_name: header.supplier_name, grand_total: header.grand_total };

  // 5. Audit Log
  try {
    await supabase().from('audit_logs').insert({
      company_id: companyId,
      user_id: options?.userId || null,
      action: 'create_purchase',
      module: 'purchases',
      entity_type: 'purchase',
      entity_id: purchase.id,
      metadata: {
        invoice_number: purchase.invoice_number,
        supplier: purchase.supplier_name,
        amount: purchase.grand_total,
      },
    });
  } catch (auditErr) {
    // Non-fatal
    console.warn('Audit log error:', auditErr);
  }

  return (await getPurchaseById(companyId, purchase.id))!;
}

export async function addPurchasePayment(
  companyId: string,
  purchaseId: string,
  payment: {
    amount: number;
    payment_method: PurchasePayment['payment_method'];
    reference_number?: string | null;
    notes?: string | null;
    payment_date?: string;
    created_by?: string | null;
  }
): Promise<PurchasePayment> {
  // Ledger row and bill totals in one locked transaction (record_purchase_payment):
  // no lost updates, and no ledger row without the matching bill balance.
  const paymentId = await callTransactionalRpc('record_purchase_payment', {
    p_purchase_id: purchaseId,
    p_amount: payment.amount,
    p_payment_method: payment.payment_method,
    p_payment_date: payment.payment_date || null,
    p_reference: payment.reference_number || null,
    p_notes: payment.notes || null,
  });

  const { data: paymentRow, error } = await supabase()
    .from('purchase_payments')
    .select('*')
    .eq('company_id', companyId)
    .eq('id', paymentId)
    .single();
  if (error) throw error;
  return mapPayment(paymentRow);
}

export async function deletePurchase(companyId: string, id: string, userId?: string | null): Promise<void> {
  const existing = await getPurchaseById(companyId, id);
  if (!existing) return;

  // Stock reversal (skipped for Drafts) and the delete are one transaction
  // (delete_purchase); stock already delivered blocks the delete with a reason.
  await callTransactionalRpc('delete_purchase', { p_purchase_id: id });

  // 4. Audit Log
  try {
    await supabase().from('audit_logs').insert({
      company_id: companyId,
      user_id: userId || null,
      action: 'delete_purchase',
      module: 'purchases',
      entity_type: 'purchase',
      entity_id: id,
      metadata: {
        invoice_number: existing.invoice_number,
        supplier: existing.supplier_name,
        amount: existing.grand_total,
      },
    });
  } catch (auditErr) {
    console.warn('Audit log error:', auditErr);
  }
}
