import { assertAffected } from '@/lib/supabase/require-affected';
import { createClient } from '@/lib/supabase/client';
import { callTransactionalRpc } from '@/lib/supabase/rpc';
import { parseQuantityNumeric } from '@/lib/challan-item';
import { calculateTax, sumItemAmounts } from '@/lib/tax';
import { resolvePaymentStatus } from '@/lib/payment-status';
import { todayISODate, toLocalISODate } from '@/lib/dates';
import { calculateDueDate } from '@/utils/calculateDueDate';
import { parseISO } from 'date-fns';
import {
  appendInFilter,
  findChallanIdsByItemSearch,
  findCustomerIdsBySearch,
} from '@/lib/table/search-helpers';
import {
  buildPaginatedResult,
  ilikePattern,
  paginatedRange,
  orIlikeValue,
} from '@/lib/table/pagination';
import type {
  Challan,
  ChallanFilters,
  ChallanItem,
  ChallanStatus,
  PaginatedResult,
  PaginationParams,
} from '@/types';

const supabase = () => createClient();

const CHALLAN_SELECT = `
  *,
  customer:customers(*),
  items:challan_items(*, product:products(*))
`;

const CHALLAN_LIST_SELECT = `
  id,
  company_id,
  customer_id,
  challan_number,
  date,
  broker,
  delivered_by,
  status,
  subtotal,
  discount,
  cgst_percent,
  sgst_percent,
  igst_percent,
  cgst_amount,
  sgst_amount,
  igst_amount,
  other_charges,
  grand_total,
  payment_status,
  payment_amount_received,
  payment_received_date,
  due_date,
  payment_terms,
  created_at,
  updated_at,
  customer:customers(id, name, gst_number, mobile, broker)
`;

function mapChallan(row: Record<string, unknown>): Challan {
  const customer = row.customer as Challan['customer'];
  const items = (row.items as ChallanItem[] | null) ?? [];
  const challan = {
    ...(row as unknown as Challan),
    customer,
    party: customer,
    customer_id: (row.customer_id as string) ?? (row.party_id as string),
    party_id: (row.customer_id as string) ?? (row.party_id as string),
    items,
    payment_amount_received: Number(row.payment_amount_received ?? 0),
  };

  // Resolve status client-side only — never write during list/detail reads.
  // Writes belong in payment recording / invoice update flows.
  return {
    ...challan,
    payment_status: resolvePaymentStatus(challan),
  };
}

type ChallanRpcClient = {
  rpc(
    fn: 'generate_challan_number',
    args: { p_company_id: string }
  ): PromiseLike<{ data: string | null; error: { message: string } | null }>;
};

export async function generateChallanNumber(companyId: string): Promise<string> {
  const { data, error } = await (supabase() as unknown as ChallanRpcClient).rpc(
    'generate_challan_number',
    { p_company_id: companyId }
  );
  if (error) throw error;
  if (!data) throw new Error('Failed to generate challan number');
  return data;
}

async function resolveChallanSearchIds(companyId: string, search: string) {
  const [customerIds, itemChallanIds] = await Promise.all([
    findCustomerIdsBySearch(companyId, search),
    findChallanIdsByItemSearch(search),
  ]);
  return { customerIds, itemChallanIds };
}

/**
 * Payment status shown in the UI is derived (resolvePaymentStatus) from amounts
 * and due date; the stored column is only refreshed when payments are recorded,
 * so it never becomes "Overdue" on its own. Filter on the same inputs instead.
 */
function applyPaymentStatusFilter(
  query: ReturnType<ReturnType<typeof supabase>['from']>,
  status: NonNullable<ChallanFilters['paymentStatus']>
) {
  const today = todayISODate();
  const notDue = `due_date.is.null,due_date.gte.${today}`;
  switch (status) {
    case 'Paid':
      return query.eq('payment_status', 'Paid');
    case 'Overdue':
      return query.neq('payment_status', 'Paid').lt('due_date', today);
    case 'Partially Paid':
      return query.neq('payment_status', 'Paid').gt('payment_amount_received', 0.01).or(notDue);
    case 'Pending':
      return query.neq('payment_status', 'Paid').lte('payment_amount_received', 0.01).or(notDue);
    default:
      return query.eq('payment_status', status);
  }
}

function applyChallanFilters(
  query: ReturnType<ReturnType<typeof supabase>['from']>,
  companyId: string,
  filters: ChallanFilters,
  searchIds: { customerIds: string[]; itemChallanIds: string[] } = {
    customerIds: [],
    itemChallanIds: [],
  }
) {
  let next = query.eq('company_id', companyId);

  if (filters.status) next = next.eq('status', filters.status);
  if (filters.paymentStatus) next = applyPaymentStatusFilter(next, filters.paymentStatus);
  if (filters.customerId) next = next.eq('customer_id', filters.customerId);
  if (filters.broker) next = next.ilike('broker', ilikePattern(filters.broker));
  if (filters.dateFrom) next = next.gte('date', filters.dateFrom);
  if (filters.dateTo) next = next.lte('date', filters.dateTo);

  if (filters.search?.trim()) {
    const pattern = orIlikeValue(filters.search);
    const orParts = [`challan_number.ilike.${pattern}`, `broker.ilike.${pattern}`];
    appendInFilter(orParts, 'customer_id', searchIds.customerIds);
    appendInFilter(orParts, 'id', searchIds.itemChallanIds);
    next = next.or(orParts.join(','));
  }

  return next;
}

function applyChallanSort(
  query: ReturnType<ReturnType<typeof supabase>['from']>,
  filters: ChallanFilters
) {
  const allowed = new Set([
    'date',
    'challan_number',
    'grand_total',
    'due_date',
    'created_at',
  ]);
  const column = filters.sort?.column && allowed.has(filters.sort.column)
    ? filters.sort.column
    : 'date';
  const ascending = filters.sort?.direction === 'asc';

  if (column === 'date') {
    return query.order('date', { ascending }).order('created_at', { ascending });
  }

  return query.order(column, { ascending });
}

export async function getChallans(
  companyId: string,
  filters: ChallanFilters = {}
): Promise<Challan[]> {
  const searchIds = filters.search?.trim()
    ? await resolveChallanSearchIds(companyId, filters.search)
    : { customerIds: [], itemChallanIds: [] };

  let query = supabase().from('challans').select(CHALLAN_LIST_SELECT);
  query = applyChallanFilters(query, companyId, filters, searchIds);
  query = applyChallanSort(query, filters);

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).map(mapChallan);
}

export async function getChallansPaginated(
  companyId: string,
  filters: ChallanFilters = {},
  { page = 1, pageSize = 50 }: PaginationParams = {}
): Promise<PaginatedResult<Challan>> {
  const searchIds = filters.search?.trim()
    ? await resolveChallanSearchIds(companyId, filters.search)
    : { customerIds: [], itemChallanIds: [] };

  const { from, to } = paginatedRange(page, pageSize);

  let query = supabase()
    .from('challans')
    .select(CHALLAN_LIST_SELECT, { count: 'exact' });

  query = applyChallanFilters(query, companyId, filters, searchIds);
  query = applyChallanSort(query, filters);
  query = query.range(from, to);

  const { data, error, count } = await query;
  if (error) throw error;

  return buildPaginatedResult(
    (data ?? []).map(mapChallan),
    count ?? 0,
    page,
    pageSize
  );
}

export async function getChallanById(id: string): Promise<Challan | undefined> {
  const { data, error } = await supabase()
    .from('challans')
    .select(CHALLAN_SELECT)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return undefined;
    throw error;
  }

  return mapChallan(data);
}

type ChallanInput = Omit<Challan, 'id' | 'created_at' | 'updated_at' | 'customer' | 'party' | 'items' | 'payments'> & {
  items: Omit<ChallanItem, 'id' | 'challan_id' | 'created_at' | 'updated_at' | 'product'>[];
};

function resolveDefaultTaxPercents(gstType?: string | null) {
  if (gstType === 'igst') return { cgstPercent: 0, sgstPercent: 0, igstPercent: 5 };
  if (gstType === 'none') return { cgstPercent: 0, sgstPercent: 0, igstPercent: 0 };
  return { cgstPercent: 2.5, sgstPercent: 2.5, igstPercent: 0 };
}

function buildChallanPayload(
  challan: ChallanInput,
  userId?: string,
  companyGstType?: string | null
) {
  const defaults = resolveDefaultTaxPercents(companyGstType);
  const subtotal = sumItemAmounts(challan.items);
  const tax = calculateTax({
    subtotal,
    discount: challan.discount ?? 0,
    cgstPercent: challan.cgst_percent ?? defaults.cgstPercent,
    sgstPercent: challan.sgst_percent ?? defaults.sgstPercent,
    igstPercent: challan.igst_percent ?? defaults.igstPercent,
    otherCharges: challan.other_charges ?? 0,
  });

  return {
    company_id: challan.company_id,
    customer_id: challan.customer_id ?? challan.party_id!,
    challan_number: challan.challan_number,
    date: challan.date,
    bill_number: challan.bill_number ?? null,
    vehicle_number: null,
    delivered_by: challan.delivered_by ?? challan.driver_name ?? null,
    driver_mobile: null,
    delivery_location: null,
    broker: challan.broker ?? null,
    payment_within_value: challan.payment_within_value ?? null,
    payment_within_unit: challan.payment_within_unit ?? null,
    payment_terms: challan.payment_terms ?? null,
    due_date: challan.due_date ?? null,
    amount_in_words: challan.amount_in_words ?? null,
    notes: challan.notes ?? null,
    status: challan.status,
    created_by: userId ?? challan.created_by ?? null,
    subtotal: tax.subtotal,
    discount: tax.discount,
    cgst_percent: tax.cgstPercent,
    sgst_percent: tax.sgstPercent,
    igst_percent: tax.igstPercent,
    cgst_amount: tax.cgstAmount,
    sgst_amount: tax.sgstAmount,
    igst_amount: tax.igstAmount,
    other_charges: tax.otherCharges,
    grand_total: tax.grandTotal,
  };
}

function buildItemPayload(item: Omit<ChallanItem, 'id' | 'challan_id' | 'created_at' | 'updated_at' | 'product'>) {
  const quantityDisplay = item.quantity_display?.trim() || null;
  const numericQty =
    quantityDisplay != null
      ? parseQuantityNumeric(quantityDisplay)
      : item.meter ?? item.quantity ?? null;

  return {
    product_id: item.product_id ?? null,
    description: item.description ?? null,
    quantity: numericQty,
    quantity_display: quantityDisplay,
    unit: null,
    total_pieces: item.total_pieces ?? 1,
    quality: item.quality ?? null,
    fabric_name: item.fabric_name ?? null,
    color: item.color ?? null,
    design: item.design ?? null,
    roll_number: item.roll_number ?? null,
    lot_number: item.lot_number ?? null,
    meter: numericQty,
    weight: item.weight ?? null,
    rate: item.rate ?? null,
    amount: item.amount ?? null,
    remarks: item.remarks ?? null,
  };
}

export async function addChallan(
  challan: ChallanInput,
  userId?: string
): Promise<Challan> {
  const { data: companyRow } = await supabase()
    .from('companies')
    .select('default_gst_type')
    .eq('id', challan.company_id)
    .maybeSingle();

  const payload = buildChallanPayload(
    challan,
    userId,
    companyRow?.default_gst_type
  );

  // Header and items are written in one database transaction (save_invoice):
  // either the whole invoice is saved or nothing is.
  const id = await callTransactionalRpc('save_invoice', {
    p_invoice_id: null,
    p_header: payload,
    p_items: challan.items.map((item) => buildItemPayload(item)),
  });

  const created = await getChallanById(id);
  if (!created) throw new Error('Failed to load created challan');

  const { createNotification } = await import('@/services/notifications.service');
  await createNotification({
    companyId: created.company_id,
    type: 'invoice_created',
    title: 'Invoice created',
    message: `Invoice ${created.challan_number} was created.`,
    entityType: 'challan',
    entityId: created.id,
  }).catch(() => undefined);

  return created;
}

export async function updateChallan(challan: Challan & { items: ChallanItem[] }): Promise<Challan> {
  const payload = buildChallanPayload(challan, challan.created_by ?? undefined);

  // One transaction replaces header and items; payments already received are
  // kept and the payment status is recomputed in the database.
  await callTransactionalRpc('save_invoice', {
    p_invoice_id: challan.id,
    p_header: payload,
    p_items: challan.items.map((item) => buildItemPayload(item)),
  });

  const updated = await getChallanById(challan.id);
  if (!updated) throw new Error('Failed to load updated challan');
  return updated;
}

export async function deleteChallan(id: string): Promise<void> {
  const { data, error } = await supabase().from('challans').delete().eq('id', id).select('id');
  if (error) throw error;
  assertAffected(data, 'delete this invoice');
}

export async function duplicateChallan(
  challanId: string,
  companyId: string,
  userId?: string
): Promise<Challan> {
  const source = await getChallanById(challanId);
  if (!source) throw new Error('Challan not found');

  const challanNumber = await generateChallanNumber(companyId);
  const duplicateDate = todayISODate();
  const duplicateDueDate = calculateDueDate(
    parseISO(duplicateDate), // local midnight (a bare string parses as UTC)
    source.payment_within_value,
    source.payment_within_unit
  );

  return addChallan(
    {
      company_id: companyId,
      customer_id: source.customer_id,
      challan_number: challanNumber,
      date: duplicateDate,
      bill_number: source.bill_number,
      delivered_by: source.delivered_by ?? source.driver_name,
      broker: source.broker,
      payment_within_value: source.payment_within_value,
      payment_within_unit: source.payment_within_unit,
      payment_terms: source.payment_terms,
      // Recompute from the new date; copying the source due date made fresh
      // duplicates of old invoices immediately overdue.
      due_date: duplicateDueDate ? toLocalISODate(duplicateDueDate) : null,
      amount_in_words: source.amount_in_words,
      notes: source.notes,
      status: 'Draft' as ChallanStatus,
      subtotal: source.subtotal,
      discount: source.discount,
      cgst_percent: source.cgst_percent,
      sgst_percent: source.sgst_percent,
      igst_percent: source.igst_percent,
      other_charges: source.other_charges,
      items: (source.items ?? []).map(({ id: _id, challan_id: _cid, product: _p, ...item }) => item),
    },
    userId
  );
}
