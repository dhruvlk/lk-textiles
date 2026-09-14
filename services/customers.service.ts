import { createClient } from '@/lib/supabase/client';
import { formatPhoneToStorage } from '@/lib/validations/phone';
import type { Customer, PaginatedResult, PaginationParams } from '@/types';
import type { CustomerRow } from '@/types/database';

const supabase = () => createClient();

function mapCustomer(row: CustomerRow): Customer {
  return row;
}

function toCustomerInsert(customer: Omit<Customer, 'id' | 'created_at' | 'updated_at'>) {
  return {
    company_id: customer.company_id,
    name: customer.name,
    contact_person: customer.contact_person ?? null,
    mobile: customer.mobile ? formatPhoneToStorage(customer.mobile) : null,
    email: customer.email ?? null,
    gst_number: customer.gst_number ?? null,
    address: customer.address ?? null,
    city: customer.city ?? null,
    state: customer.state ?? null,
    pincode: customer.pincode ?? null,
    broker: customer.broker ?? null,
    notes: customer.notes ?? null,
  };
}

export async function getCustomers(companyId: string): Promise<Customer[]> {
  const { data, error } = await supabase()
    .from('customers')
    .select('*')
    .eq('company_id', companyId)
    .order('name');

  if (error) throw error;
  return (data ?? []).map(mapCustomer);
}

export async function getCustomersPaginated(
  companyId: string,
  search: string,
  { page = 1, pageSize = 10 }: PaginationParams = {}
): Promise<PaginatedResult<Customer>> {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase()
    .from('customers')
    .select('*', { count: 'exact' })
    .eq('company_id', companyId)
    .order('name')
    .range(from, to);

  if (search.trim()) {
    const q = `%${search.trim()}%`;
    query = query.or(
      `name.ilike.${q},gst_number.ilike.${q},mobile.ilike.${q},broker.ilike.${q}`
    );
  }

  const { data, error, count } = await query;
  if (error) throw error;

  const total = count ?? 0;
  return {
    data: (data ?? []).map(mapCustomer),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize) || 1,
  };
}

export async function getCustomerById(id: string): Promise<Customer | undefined> {
  const { data, error } = await supabase()
    .from('customers')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return undefined;
    throw error;
  }
  return mapCustomer(data);
}

export async function addCustomer(
  customer: Omit<Customer, 'id' | 'created_at' | 'updated_at'>
): Promise<Customer> {
  const { data, error } = await supabase()
    .from('customers')
    .insert(toCustomerInsert(customer))
    .select()
    .single();

  if (error) throw error;
  return mapCustomer(data);
}

export async function updateCustomer(customer: Customer): Promise<Customer> {
  const { id, created_at: _c, updated_at: _u, ...rest } = customer;
  const { data, error } = await supabase()
    .from('customers')
    .update(toCustomerInsert({ ...rest, company_id: customer.company_id, name: customer.name }))
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return mapCustomer(data);
}

export async function deleteCustomer(id: string): Promise<void> {
  const { error } = await supabase().from('customers').delete().eq('id', id);
  if (error) throw error;
}

export const getParties = getCustomers;
export const addParty = addCustomer;
export const updateParty = updateCustomer;
export const deleteParty = deleteCustomer;
