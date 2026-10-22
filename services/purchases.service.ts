import { todayISODate } from '@/lib/dates';
import { createClient } from '@/lib/supabase/client';
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

type PurchaseRpcClient = {
  rpc(
    fn: 'process_purchase_stock_change',
    args: {
      p_company_id: string;
      p_stock_id: string;
      p_quantity: number;
      p_transaction_type: string;
      p_purchase_id?: string | null;
      p_notes?: string | null;
      p_user_id?: string | null;
    }
  ): PromiseLike<{ data: null; error: { message: string } | null }>;
};

type StockLine = { stock_id?: string | null; quantity: number };

/**
 * Applies purchase stock movements one by one. supabase-js `.rpc()` resolves
 * with `{ error }` rather than throwing, so errors must be checked explicitly.
 * If any movement fails, the ones already applied are compensated with the
 * opposite movement and the error is re-thrown, keeping stock consistent.
 */
async function applyPurchaseStockMovements(
  companyId: string,
  lines: StockLine[],
  type: 'Purchase' | 'Purchase Return',
  purchaseId: string,
  notes: string,
  userId: string | null
): Promise<void> {
  const rpcClient = supabase() as unknown as PurchaseRpcClient;
  const applied: StockLine[] = [];
  const opposite = type === 'Purchase' ? 'Purchase Return' : 'Purchase';

  for (const line of lines) {
    if (!line.stock_id || !(line.quantity > 0)) continue;
    const { error } = await rpcClient.rpc('process_purchase_stock_change', {
      p_company_id: companyId,
      p_stock_id: line.stock_id,
      p_quantity: line.quantity,
      p_transaction_type: type,
      p_purchase_id: purchaseId,
      p_notes: notes,
      p_user_id: userId,
    });
    if (error) {
      for (const done of applied) {
        const { error: undoError } = await rpcClient.rpc('process_purchase_stock_change', {
          p_company_id: companyId,
          p_stock_id: done.stock_id!,
          p_quantity: done.quantity,
          p_transaction_type: opposite,
          p_purchase_id: purchaseId,
          p_notes: `Compensation for failed stock update: ${notes}`,
          p_user_id: userId,
        });
        if (undoError) console.error('Stock compensation failed:', undoError);
      }
      throw new Error(`Stock update failed: ${error.message}`);
    }
    applied.push(line);
  }
}

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
  // When an initial payment is supplied, addPurchasePayment() below is the single
  // source of truth for paid/balance/status. Writing paid_amount on the header as
  // well would count the same payment twice.
  const hasInitialPayment = Boolean(options?.initialPayment && options.initialPayment.amount > 0);

  // 1. Insert header
  const { data: purchase, error: purchaseError } = await supabase()
    .from('purchases')
    .insert({
      company_id: companyId,
      supplier_id: purchaseData.supplier_id || null,
      supplier_name: purchaseData.supplier_name.trim(),
      supplier_gstin: purchaseData.supplier_gstin?.trim()?.toUpperCase() || null,
      invoice_number: purchaseData.invoice_number.trim(),
      invoice_date: purchaseData.invoice_date,
      due_date: purchaseData.due_date || null,
      financial_year: purchaseData.financial_year,
      purchase_type: purchaseData.purchase_type,
      is_gst_bill: purchaseData.is_gst_bill,
      hsn_sac: purchaseData.hsn_sac?.trim() || null,
      subtotal: purchaseData.subtotal,
      discount: purchaseData.discount,
      gst_rate: purchaseData.gst_rate,
      cgst_amount: purchaseData.cgst_amount,
      sgst_amount: purchaseData.sgst_amount,
      igst_amount: purchaseData.igst_amount,
      total_gst: purchaseData.total_gst,
      round_off: purchaseData.round_off,
      grand_total: purchaseData.grand_total,
      payment_status: hasInitialPayment ? 'Unpaid' : purchaseData.payment_status,
      paid_amount: hasInitialPayment ? 0 : purchaseData.paid_amount,
      balance_amount: hasInitialPayment ? purchaseData.grand_total : purchaseData.balance_amount,
      payment_method: purchaseData.payment_method || null,
      status: purchaseData.status || 'Active',
      notes: purchaseData.notes || null,
      created_by: options?.userId || null,
    })
    .select()
    .single();

  if (purchaseError) {
    console.error('Error inserting purchase:', purchaseError);
    throw purchaseError;
  }

  // 2. Insert items
  if (items && items.length > 0) {
    const itemsToInsert = items.map((it) => ({
      purchase_id: purchase.id,
      product_id: it.product_id || null,
      stock_id: it.stock_id || null,
      item_name: it.item_name.trim(),
      description: it.description?.trim() || null,
      hsn_sac: it.hsn_sac?.trim() || null,
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

    const { error: itemsError } = await supabase().from('purchase_items').insert(itemsToInsert);
    if (itemsError) {
      console.error('Error inserting purchase items:', itemsError);
      // Don't leave a header without items behind.
      await supabase().from('purchases').delete().eq('company_id', companyId).eq('id', purchase.id);
      throw itemsError;
    }

    // 3. Stock Integration: if Stock Purchase and item linked to stock_id, increase stock
    if (purchaseData.purchase_type === 'Stock Purchase' && purchaseData.status !== 'Draft') {
      try {
        await applyPurchaseStockMovements(
          companyId,
          items,
          'Purchase',
          purchase.id,
          `Purchase Bill #${purchase.invoice_number} from ${purchase.supplier_name}`,
          options?.userId || null
        );
      } catch (stkErr) {
        console.error('Failed to update stock for purchase:', stkErr);
        // Roll back the bill (items cascade) so stock and purchases stay in sync.
        await supabase().from('purchases').delete().eq('company_id', companyId).eq('id', purchase.id);
        throw stkErr;
      }
    }
  }

  // 4. Initial Payment if provided
  if (options?.initialPayment && options.initialPayment.amount > 0) {
    try {
      await addPurchasePayment(companyId, purchase.id, {
        amount: options.initialPayment.amount,
        payment_method: options.initialPayment.method,
        reference_number: options.initialPayment.reference || null,
        notes: options.initialPayment.notes || 'Payment on bill creation',
        payment_date: purchaseData.invoice_date,
        created_by: options.userId || null,
      });
    } catch (payErr) {
      // The bill (and its stock) is already saved; don't report the whole create
      // as failed (a retry would duplicate it). The payment can be added again.
      console.error('Bill saved but initial payment could not be recorded:', payErr);
    }
  }

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
  const { data: purchase, error: pErr } = await supabase()
    .from('purchases')
    .select('grand_total, paid_amount')
    .eq('company_id', companyId)
    .eq('id', purchaseId)
    .single();

  if (pErr) throw pErr;

  const currentPaid = Number(purchase.paid_amount) || 0;
  const grandTotal = Number(purchase.grand_total) || 0;
  const newPaid = currentPaid + payment.amount;
  const newBalance = Math.max(0, grandTotal - newPaid);

  let newStatus: Purchase['payment_status'] = 'Partially Paid';
  if (newBalance <= 0) {
    newStatus = 'Paid';
  } else if (newPaid <= 0) {
    newStatus = 'Unpaid';
  }

  // Insert payment ledger
  const { data: paymentRow, error: payErr } = await supabase()
    .from('purchase_payments')
    .insert({
      company_id: companyId,
      purchase_id: purchaseId,
      expense_id: null,
      amount: payment.amount,
      payment_method: payment.payment_method,
      reference_number: payment.reference_number || null,
      notes: payment.notes || null,
      payment_date: payment.payment_date || todayISODate(),
      created_by: payment.created_by || null,
    })
    .select()
    .single();

  if (payErr) throw payErr;

  // Update purchase status
  const { error: updateErr } = await supabase()
    .from('purchases')
    .update({
      paid_amount: newPaid,
      balance_amount: newBalance,
      payment_status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('company_id', companyId)
    .eq('id', purchaseId);

  if (updateErr) {
    // Keep ledger and summary consistent: remove the ledger row we just added.
    await supabase().from('purchase_payments').delete().eq('company_id', companyId).eq('id', paymentRow.id);
    throw updateErr;
  }

  return mapPayment(paymentRow);
}

export async function deletePurchase(companyId: string, id: string, userId?: string | null): Promise<void> {
  // 1. Fetch purchase to check for stock reversal
  const existing = await getPurchaseById(companyId, id);
  if (!existing) return;

  // 2. Reverse stock if Stock Purchase. Mirrors createPurchase(): Draft bills
  // never added stock, so they must not remove any either.
  if (existing.purchase_type === 'Stock Purchase' && existing.status !== 'Draft' && existing.items) {
    // Throws (and compensates) on failure so the bill isn't deleted while its
    // stock remains booked.
    await applyPurchaseStockMovements(
      companyId,
      existing.items,
      'Purchase Return',
      existing.id,
      `Stock reversed on deletion of Purchase Bill #${existing.invoice_number}`,
      userId || null
    );
  }

  // 3. Delete purchase (cascade deletes items, documents records, payments)
  const { error } = await supabase()
    .from('purchases')
    .delete()
    .eq('company_id', companyId)
    .eq('id', id);

  if (error) {
    // Bill still exists: re-book the stock we just reversed.
    if (existing.purchase_type === 'Stock Purchase' && existing.status !== 'Draft' && existing.items) {
      await applyPurchaseStockMovements(
        companyId,
        existing.items,
        'Purchase',
        existing.id,
        `Stock re-applied after failed deletion of Purchase Bill #${existing.invoice_number}`,
        userId || null
      ).catch((reErr) => console.error('Failed to re-apply stock after delete error:', reErr));
    }
    throw error;
  }

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
