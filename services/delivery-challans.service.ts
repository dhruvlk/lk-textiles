import { todayISODate } from '@/lib/dates';
import { createClient } from '@/lib/supabase/client';
import { isBlankTakaRow } from '@/lib/challan-item';
import {
  appendInFilter,
  findCustomerIdsBySearch,
} from '@/lib/table/search-helpers';
import {
  buildPaginatedResult,
  ilikePattern,
  paginatedRange,
  orIlikeValue,
} from '@/lib/table/pagination';
import {
  applyDeliveryStockDeltas,
  parseStockError,
} from '@/services/stocks.service';
import type {
  Customer,
  DeliveryChallan,
  DeliveryChallanFilters,
  DeliveryChallanItem,
  DeliveryChallanStatus,
  PaginatedResult,
  PaginationParams,
} from '@/types';

const supabase = () => createClient();

const SELECT = `
  *,
  customer:customers(*),
  items:delivery_challan_items(*)
`;

const LIST_SELECT = `
  id,
  company_id,
  customer_id,
  challan_number,
  date,
  quality,
  stock_id,
  broker,
  delivered_by,
  status,
  total_pieces,
  total_meters,
  total_weight,
  created_at,
  updated_at,
  customer:customers(id, name, gst_number)
`;

function mapDeliveryChallan(row: Record<string, unknown>): DeliveryChallan {
  const customer = row.customer as Customer | undefined;
  const rawItems = (row.items as DeliveryChallanItem[] | null) ?? [];
  const items = [...rawItems]
    .map((item, index) => ({
      ...item,
      sort_order: Number(item.sort_order ?? index),
      taka_no: item.taka_no ?? null,
      meters: Number(item.meters) || 0,
      weight: Number(item.weight) || 0,
    }))
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  return {
    ...(row as unknown as DeliveryChallan),
    customer,
    items,
    total_pieces: Number(row.total_pieces ?? items.length),
    total_meters: Number(row.total_meters ?? 0),
    total_weight: Number(row.total_weight ?? 0),
  };
}

type DeliveryChallanRpcClient = {
  rpc(
    fn: 'generate_delivery_challan_number',
    args: { p_company_id: string }
  ): PromiseLike<{ data: string | null; error: { message: string } | null }>;
};

export async function generateDeliveryChallanNumber(companyId: string): Promise<string> {
  const { data, error } = await (supabase() as unknown as DeliveryChallanRpcClient).rpc(
    'generate_delivery_challan_number',
    { p_company_id: companyId }
  );
  if (error) throw error;
  if (!data) throw new Error('Failed to generate delivery challan number');
  return data;
}

function applyDeliveryChallanFilters(
  query: ReturnType<ReturnType<typeof supabase>['from']>,
  companyId: string,
  filters: DeliveryChallanFilters,
  searchCustomerIds: string[] = []
) {
  let next = query.eq('company_id', companyId);

  if (filters.status) next = next.eq('status', filters.status);
  if (filters.customerId) next = next.eq('customer_id', filters.customerId);
  if (filters.broker) next = next.ilike('broker', ilikePattern(filters.broker));
  if (filters.quality) next = next.ilike('quality', ilikePattern(filters.quality));
  if (filters.dateFrom) next = next.gte('date', filters.dateFrom);
  if (filters.dateTo) next = next.lte('date', filters.dateTo);

  if (filters.search?.trim()) {
    const pattern = orIlikeValue(filters.search);
    const orParts = [
      `challan_number.ilike.${pattern}`,
      `quality.ilike.${pattern}`,
      `broker.ilike.${pattern}`,
    ];
    appendInFilter(orParts, 'customer_id', searchCustomerIds);
    next = next.or(orParts.join(','));
  }

  return next;
}

function applyDeliveryChallanSort(
  query: ReturnType<ReturnType<typeof supabase>['from']>,
  filters: DeliveryChallanFilters
) {
  const allowed = new Set([
    'date',
    'challan_number',
    'created_at',
    'total_pieces',
    'total_meters',
    'quality',
  ]);
  const column = filters.sort?.column && allowed.has(filters.sort.column)
    ? filters.sort.column
    : 'date';
  const ascending = filters.sort?.direction === 'asc';

  if (column === 'date') {
    return query
      .order('date', { ascending })
      .order('created_at', { ascending });
  }

  return query.order(column, { ascending });
}

export async function getDeliveryChallansPaginated(
  companyId: string,
  filters: DeliveryChallanFilters = {},
  { page = 1, pageSize = 50 }: PaginationParams = {}
): Promise<PaginatedResult<DeliveryChallan>> {
  const searchCustomerIds = filters.search?.trim()
    ? await findCustomerIdsBySearch(companyId, filters.search)
    : [];

  const { from, to } = paginatedRange(page, pageSize);

  let query = supabase()
    .from('delivery_challans')
    .select(LIST_SELECT, { count: 'exact' });

  query = applyDeliveryChallanFilters(query, companyId, filters, searchCustomerIds);
  query = applyDeliveryChallanSort(query, filters);
  query = query.range(from, to);

  const { data, error, count } = await query;
  if (error) throw error;

  return buildPaginatedResult(
    (data ?? []).map(mapDeliveryChallan),
    count ?? 0,
    page,
    pageSize
  );
}

export async function getDeliveryChallans(
  companyId: string,
  filters: DeliveryChallanFilters = {}
): Promise<DeliveryChallan[]> {
  const searchCustomerIds = filters.search?.trim()
    ? await findCustomerIdsBySearch(companyId, filters.search)
    : [];

  let query = supabase().from('delivery_challans').select(LIST_SELECT);

  query = applyDeliveryChallanFilters(query, companyId, filters, searchCustomerIds);
  query = applyDeliveryChallanSort(query, filters);

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).map(mapDeliveryChallan);
}

export async function getDeliveryChallanById(id: string): Promise<DeliveryChallan | null> {
  const { data, error } = await supabase()
    .from('delivery_challans')
    .select(SELECT)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  const mapped = mapDeliveryChallan(data);

  // Fallback: nested embed can occasionally return [] even when rows exist
  if (!mapped.items?.length) {
    const { data: itemRows, error: itemsError } = await supabase()
      .from('delivery_challan_items')
      .select('*')
      .eq('delivery_challan_id', id)
      .order('sort_order', { ascending: true });

    if (itemsError) throw itemsError;

    if (itemRows?.length) {
      mapped.items = itemRows.map((row) => ({
        id: row.id,
        delivery_challan_id: row.delivery_challan_id,
        sort_order: Number(row.sort_order ?? 0),
        taka_no: row.taka_no,
        meters: Number(row.meters) || 0,
        weight: Number(row.weight) || 0,
        created_at: row.created_at,
        updated_at: row.updated_at,
      }));
      mapped.total_pieces = mapped.items.length;
      mapped.total_meters = mapped.items.reduce((sum, item) => sum + Number(item.meters || 0), 0);
      mapped.total_weight = mapped.items.reduce((sum, item) => sum + Number(item.weight || 0), 0);
    }
  }

  return mapped;
}

type DeliveryChallanInput = {
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
  items: Array<{
    taka_no?: string | null;
    meters?: number | null;
    weight?: number | null;
  }>;
};

function deliveryStockUsage(stockId: string | null | undefined, pieceCount: number): Map<string, number> {
  const map = new Map<string, number>();
  if (stockId && pieceCount > 0) {
    map.set(stockId, pieceCount);
  }
  return map;
}

function computeTotals(items: DeliveryChallanInput['items']) {
  const normalized = items.filter((item) => !isBlankTakaRow(item)).map((item, index) => ({
    sort_order: index,
    taka_no: item.taka_no?.trim() || null,
    meters: Number(item.meters) || 0,
    weight: Number(item.weight) || 0,
  }));

  return {
    items: normalized,
    total_pieces: normalized.length,
    total_meters: normalized.reduce((sum, item) => sum + item.meters, 0),
    total_weight: normalized.reduce((sum, item) => sum + item.weight, 0),
  };
}

export async function addDeliveryChallan(
  input: DeliveryChallanInput,
  userId?: string
): Promise<DeliveryChallan> {
  const totals = computeTotals(input.items);

  const { data, error } = await supabase()
    .from('delivery_challans')
    .insert({
      company_id: input.company_id,
      customer_id: input.customer_id,
      challan_number: input.challan_number,
      date: input.date,
      quality: input.quality ?? null,
      stock_id: input.stock_id ?? null,
      broker: input.broker ?? null,
      delivered_by: input.delivered_by ?? null,
      remarks: input.remarks ?? null,
      notes: input.notes ?? null,
      status: input.status,
      total_pieces: totals.total_pieces,
      total_meters: totals.total_meters,
      total_weight: totals.total_weight,
      created_by: userId ?? null,
    })
    .select()
    .single();

  if (error) throw error;

  const itemsPayload = totals.items.map((item) => ({
    ...item,
    delivery_challan_id: data.id,
  }));

  if (itemsPayload.length > 0) {
    const { error: itemsError } = await supabase()
      .from('delivery_challan_items')
      .insert(itemsPayload);
    if (itemsError) {
      await supabase().from('delivery_challans').delete().eq('id', data.id);
      throw itemsError;
    }
  }

  try {
    await applyDeliveryStockDeltas({
      companyId: input.company_id,
      previous: new Map(),
      next: deliveryStockUsage(input.stock_id, totals.total_pieces),
      deliveryChallanId: data.id,
      userId,
      isCreate: true,
    });
  } catch (stockError) {
    await supabase().from('delivery_challan_items').delete().eq('delivery_challan_id', data.id);
    await supabase().from('delivery_challans').delete().eq('id', data.id);
    throw new Error(parseStockError(stockError));
  }

  const created = await getDeliveryChallanById(data.id);
  if (!created) throw new Error('Failed to load created delivery challan');

  const { createNotification } = await import('@/services/notifications.service');
  await createNotification({
    companyId: created.company_id,
    type: 'delivery_challan_created',
    title: 'Delivery challan created',
    message: `Delivery challan ${created.challan_number} was created.`,
    entityType: 'delivery_challan',
    entityId: created.id,
  }).catch(() => undefined);

  return created;
}

export async function updateDeliveryChallan(
  id: string,
  input: DeliveryChallanInput
): Promise<DeliveryChallan> {
  const existing = await getDeliveryChallanById(id);
  if (!existing) throw new Error('Delivery challan not found');

  const totals = computeTotals(input.items);
  const previousUsage = deliveryStockUsage(existing.stock_id, existing.total_pieces);
  const nextUsage = deliveryStockUsage(input.stock_id, totals.total_pieces);

  const { error } = await supabase()
    .from('delivery_challans')
    .update({
      customer_id: input.customer_id,
      challan_number: input.challan_number,
      date: input.date,
      quality: input.quality ?? null,
      stock_id: input.stock_id ?? null,
      broker: input.broker ?? null,
      delivered_by: input.delivered_by ?? null,
      remarks: input.remarks ?? null,
      notes: input.notes ?? null,
      status: input.status,
      total_pieces: totals.total_pieces,
      total_meters: totals.total_meters,
      total_weight: totals.total_weight,
    })
    .eq('id', id);

  if (error) throw error;

  await supabase().from('delivery_challan_items').delete().eq('delivery_challan_id', id);

  const itemsPayload = totals.items.map((item) => ({
    ...item,
    delivery_challan_id: id,
  }));

  if (itemsPayload.length > 0) {
    const { error: itemsError } = await supabase()
      .from('delivery_challan_items')
      .insert(itemsPayload);
    if (itemsError) throw itemsError;
  }

  try {
    await applyDeliveryStockDeltas({
      companyId: input.company_id,
      previous: previousUsage,
      next: nextUsage,
      deliveryChallanId: id,
      userId: existing.created_by,
    });
  } catch (stockError) {
    throw new Error(parseStockError(stockError));
  }

  const updated = await getDeliveryChallanById(id);
  if (!updated) throw new Error('Failed to load updated delivery challan');
  return updated;
}

export async function deleteDeliveryChallan(id: string): Promise<void> {
  const existing = await getDeliveryChallanById(id);
  if (!existing) throw new Error('Delivery challan not found');

  try {
    await applyDeliveryStockDeltas({
      companyId: existing.company_id,
      previous: deliveryStockUsage(existing.stock_id, existing.total_pieces),
      next: new Map(),
      deliveryChallanId: id,
      userId: existing.created_by,
      isDelete: true,
    });
  } catch (stockError) {
    throw new Error(parseStockError(stockError));
  }

  const { error } = await supabase().from('delivery_challans').delete().eq('id', id);
  if (error) throw error;
}

export async function duplicateDeliveryChallan(
  id: string,
  companyId: string,
  userId?: string
): Promise<DeliveryChallan> {
  const source = await getDeliveryChallanById(id);
  if (!source) throw new Error('Delivery challan not found');

  const challanNumber = await generateDeliveryChallanNumber(companyId);

  return addDeliveryChallan(
    {
      company_id: companyId,
      customer_id: source.customer_id,
      challan_number: challanNumber,
      date: todayISODate(),
      quality: source.quality,
      stock_id: source.stock_id,
      broker: source.broker,
      delivered_by: source.delivered_by,
      remarks: source.remarks,
      notes: source.notes,
      status: 'Draft',
      items: (source.items ?? []).map((item) => ({
        taka_no: item.taka_no,
        meters: item.meters,
        weight: item.weight,
      })),
    },
    userId
  );
}
