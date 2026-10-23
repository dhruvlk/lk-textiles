import { createClient } from '@/lib/supabase/client';
import { orIlikeValue } from '@/lib/table/pagination';

const supabase = () => createClient();

export async function findCustomerIdsBySearch(
  companyId: string,
  search: string
): Promise<string[]> {
  const pattern = orIlikeValue(search);
  const { data, error } = await supabase()
    .from('customers')
    .select('id')
    .eq('company_id', companyId)
    .or(`name.ilike.${pattern},gst_number.ilike.${pattern},mobile.ilike.${pattern}`);

  if (error) throw error;
  return (data ?? []).map((row) => row.id as string);
}

export async function findChallanIdsByItemSearch(search: string): Promise<string[]> {
  const pattern = orIlikeValue(search);
  const { data, error } = await supabase()
    .from('challan_items')
    .select('challan_id')
    .or(`quality.ilike.${pattern},fabric_name.ilike.${pattern},description.ilike.${pattern}`);

  if (error) throw error;
  return [...new Set((data ?? []).map((row) => row.challan_id as string))];
}

export function appendInFilter(orParts: string[], column: string, ids: string[]): void {
  if (!ids.length) return;
  orParts.push(`${column}.in.(${ids.join(',')})`);
}
