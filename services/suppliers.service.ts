import { createClient } from '@/lib/supabase/client';
import type { Supplier, SupplierFilters } from '@/types';
import type { SupplierRow } from '@/types/database';

const supabase = () => createClient();

function mapSupplier(row: SupplierRow): Supplier {
  return {
    id: row.id,
    company_id: row.company_id,
    name: row.name,
    contact_person: row.contact_person,
    mobile: row.mobile,
    email: row.email,
    address: row.address,
    city: row.city,
    state: row.state,
    pincode: row.pincode,
    gstin: row.gstin,
    pan: row.pan,
    payment_terms: row.payment_terms,
    opening_balance: Number(row.opening_balance) || 0,
    notes: row.notes,
    is_active: row.is_active,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function getSuppliers(
  companyId: string,
  filters?: SupplierFilters
): Promise<Supplier[]> {
  let query = supabase()
    .from('suppliers')
    .select('*')
    .eq('company_id', companyId)
    .order('name', { ascending: true });

  if (filters?.search?.trim()) {
    const s = filters.search.trim();
    query = query.or(`name.ilike.%${s}%,contact_person.ilike.%${s}%,mobile.ilike.%${s}%,gstin.ilike.%${s}%`);
  }
  if (filters?.city?.trim()) {
    query = query.ilike('city', `%${filters.city.trim()}%`);
  }
  if (filters?.state?.trim()) {
    query = query.ilike('state', `%${filters.state.trim()}%`);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching suppliers:', error);
    throw error;
  }
  return (data || []).map(mapSupplier);
}

export async function getSupplierById(
  companyId: string,
  id: string
): Promise<Supplier | null> {
  const { data, error } = await supabase()
    .from('suppliers')
    .select('*')
    .eq('company_id', companyId)
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data ? mapSupplier(data) : null;
}

export async function createSupplier(
  companyId: string,
  supplier: Omit<Supplier, 'id' | 'company_id' | 'created_at' | 'updated_at'>
): Promise<Supplier> {
  const { data, error } = await supabase()
    .from('suppliers')
    .insert({
      company_id: companyId,
      name: supplier.name.trim(),
      contact_person: supplier.contact_person?.trim() || null,
      mobile: supplier.mobile?.trim() || null,
      email: supplier.email?.trim() || null,
      address: supplier.address?.trim() || null,
      city: supplier.city?.trim() || null,
      state: supplier.state?.trim() || null,
      pincode: supplier.pincode?.trim() || null,
      gstin: supplier.gstin?.trim()?.toUpperCase() || null,
      pan: supplier.pan?.trim()?.toUpperCase() || null,
      payment_terms: supplier.payment_terms || null,
      opening_balance: Number(supplier.opening_balance) || 0,
      notes: supplier.notes || null,
      is_active: supplier.is_active ?? true,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating supplier:', error);
    throw error;
  }
  return mapSupplier(data);
}

export async function updateSupplier(
  companyId: string,
  id: string,
  updates: Partial<Omit<Supplier, 'id' | 'company_id' | 'created_at' | 'updated_at'>>
): Promise<Supplier> {
  const payload: Partial<SupplierRow> = { updated_at: new Date().toISOString() };
  if (updates.name !== undefined) payload.name = updates.name.trim();
  if (updates.contact_person !== undefined) payload.contact_person = updates.contact_person?.trim() || null;
  if (updates.mobile !== undefined) payload.mobile = updates.mobile?.trim() || null;
  if (updates.email !== undefined) payload.email = updates.email?.trim() || null;
  if (updates.address !== undefined) payload.address = updates.address?.trim() || null;
  if (updates.city !== undefined) payload.city = updates.city?.trim() || null;
  if (updates.state !== undefined) payload.state = updates.state?.trim() || null;
  if (updates.pincode !== undefined) payload.pincode = updates.pincode?.trim() || null;
  if (updates.gstin !== undefined) payload.gstin = updates.gstin?.trim()?.toUpperCase() || null;
  if (updates.pan !== undefined) payload.pan = updates.pan?.trim()?.toUpperCase() || null;
  if (updates.payment_terms !== undefined) payload.payment_terms = updates.payment_terms || null;
  if (updates.opening_balance !== undefined) payload.opening_balance = Number(updates.opening_balance) || 0;
  if (updates.notes !== undefined) payload.notes = updates.notes || null;
  if (updates.is_active !== undefined) payload.is_active = updates.is_active;

  const { data, error } = await supabase()
    .from('suppliers')
    .update(payload)
    .eq('company_id', companyId)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return mapSupplier(data);
}

export async function deleteSupplier(companyId: string, id: string): Promise<void> {
  const { error } = await supabase()
    .from('suppliers')
    .delete()
    .eq('company_id', companyId)
    .eq('id', id);

  if (error) throw error;
}

export async function getSupplierStats(companyId: string, supplierId: string) {
  const { data: purchases, error } = await supabase()
    .from('purchases')
    .select('id, invoice_number, invoice_date, grand_total, paid_amount, balance_amount, total_gst, payment_status')
    .eq('company_id', companyId)
    .eq('supplier_id', supplierId)
    .order('invoice_date', { ascending: false });

  if (error) throw error;

  let totalPurchases = 0;
  let totalPaid = 0;
  let outstanding = 0;
  let inputGst = 0;
  let lastPurchaseDate: string | null = null;

  (purchases || []).forEach((p, idx) => {
    totalPurchases += Number(p.grand_total) || 0;
    totalPaid += Number(p.paid_amount) || 0;
    outstanding += Number(p.balance_amount) || 0;
    inputGst += Number(p.total_gst) || 0;
    if (idx === 0) lastPurchaseDate = p.invoice_date;
  });

  return {
    totalPurchases,
    totalPaid,
    outstanding,
    inputGst,
    lastPurchaseDate,
    purchasesCount: purchases?.length || 0,
    purchases: purchases || [],
  };
}
