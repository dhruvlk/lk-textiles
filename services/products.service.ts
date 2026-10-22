import { createClient } from '@/lib/supabase/client';
import { orIlikeValue } from '@/lib/table/pagination';
import type { Product } from '@/types';
import type { ProductRow } from '@/types/database';

const supabase = () => createClient();

function mapProduct(row: ProductRow): Product {
  return row;
}

function toProductInsert(product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) {
  return {
    company_id: product.company_id,
    name: product.name,
    hsn_code: product.hsn_code ?? null,
    unit: product.unit,
    default_rate: product.default_rate,
    description: product.description ?? null,
    is_active: product.is_active ?? true,
  };
}

export async function getProducts(companyId: string, search = ''): Promise<Product[]> {
  let query = supabase()
    .from('products')
    .select('*')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .order('name');

  if (search.trim()) {
    const q = orIlikeValue(search);
    query = query.or(`name.ilike.${q},hsn_code.ilike.${q},description.ilike.${q}`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(mapProduct);
}

export async function getProductById(id: string): Promise<Product | undefined> {
  const { data, error } = await supabase()
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return undefined;
    throw error;
  }
  return mapProduct(data);
}

export async function addProduct(
  product: Omit<Product, 'id' | 'created_at' | 'updated_at'>
): Promise<Product> {
  const { data, error } = await supabase()
    .from('products')
    .insert(toProductInsert(product))
    .select()
    .single();

  if (error) throw error;
  return mapProduct(data);
}

export async function updateProduct(product: Product): Promise<Product> {
  const { id, created_at: _c, updated_at: _u, ...rest } = product;
  const { data, error } = await supabase()
    .from('products')
    .update(toProductInsert({ ...rest, company_id: product.company_id, name: product.name }))
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return mapProduct(data);
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase().from('products').delete().eq('id', id);
  if (error) throw error;
}
