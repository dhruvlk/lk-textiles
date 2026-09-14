import { createClient } from '@/lib/supabase/client';
import { mapCompany, companyToInsert } from '@/lib/mappers';
import { formatPhoneToStorage } from '@/lib/validations/phone';
import type { Company } from '@/types';

const supabase = () => createClient();

const SELECTED_KEY = 'challan_system_selected_company_id';

export async function getCompanies(): Promise<Company[]> {
  const { data: { user } } = await supabase().auth.getUser();
  if (!user) return [];

  const { data: memberships, error: membershipError } = await supabase()
    .from('company_members')
    .select('company_id')
    .eq('user_id', user.id)
    .eq('is_active', true);

  if (membershipError) throw membershipError;

  const companyIds = (memberships ?? []).map((m) => m.company_id);
  if (companyIds.length === 0) return [];

  const { data, error } = await supabase()
    .from('companies')
    .select('*')
    .in('id', companyIds)
    // @ts-expect-error status is not yet in generated types
    .eq('status', 'Active')
    .order('name');

  if (error) throw error;
  return (data ?? []).map(mapCompany);
}

export async function getCompanyById(id: string): Promise<Company | undefined> {
  const { data, error } = await supabase()
    .from('companies')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return undefined;
    throw error;
  }
  return mapCompany(data);
}

export async function getActiveCompany(companyId: string): Promise<Company | undefined> {
  const company = await getCompanyById(companyId);
  return company ?? undefined;
}

export async function getSelectedCompanyId(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(SELECTED_KEY);
}

export async function setSelectedCompanyId(id: string): Promise<void> {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SELECTED_KEY, id);

  await supabase()
    .from('companies')
    .update({ is_active: false })
    .neq('id', id);

  await supabase()
    .from('companies')
    .update({ is_active: true })
    .eq('id', id);
}

export async function addCompany(company: Omit<Company, 'id' | 'created_at' | 'updated_at'> & { user_id: string }): Promise<Company> {
  const { data, error } = await supabase()
    .from('companies')
    .insert(companyToInsert(company))
    .select()
    .single();

  if (error) throw error;
  return mapCompany(data);
}

export async function updateCompany(company: Company): Promise<Company> {
  const { id, user_id: _uid, created_at: _ca, updated_at: _ua, ...rest } = company;
  const payload = {
    ...rest,
    phone: rest.phone ? formatPhoneToStorage(rest.phone) : null,
    invoice_start_number: rest.invoice_start_number ?? 1,
    delivery_challan_start_number: rest.delivery_challan_start_number ?? 1,
    number_fy_format: rest.number_fy_format ?? 'YYYY',
    default_gst_type: rest.default_gst_type ?? 'cgst_sgst',
    terms_conditions: rest.terms_conditions ?? null,
    invoice_terms: null,
    delivery_challan_terms: null,
  };
  const { data, error } = await supabase()
    .from('companies')
    // @ts-expect-error status is not yet in generated types
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return mapCompany(data);
}

export async function checkCompanyData(id: string): Promise<boolean> {
  // @ts-expect-error RPC not yet in generated types
  const { data, error } = await supabase().rpc('check_company_has_data', { p_company_id: id });
  if (error) throw error;
  return Boolean(data);
}

export async function archiveCompany(id: string): Promise<void> {
  // @ts-expect-error status not yet in generated types
  const { error } = await supabase().from('companies').update({ status: 'Archived' }).eq('id', id);
  if (error) throw error;
}

export async function deleteCompany(id: string): Promise<void> {
  const { error } = await supabase().from('companies').delete().eq('id', id);
  if (error) throw error;
}

async function uploadCompanyAsset(
  companyId: string,
  file: File,
  folder: 'logo' | 'stamp' | 'signature'
): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'png';
  const path = `${companyId}/${folder}-${Date.now()}.${ext}`;

  const { error } = await supabase().storage.from('company-logos').upload(path, file, {
    upsert: true,
    contentType: file.type,
  });

  if (error) throw error;

  const { data } = supabase().storage.from('company-logos').getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadCompanyLogo(companyId: string, file: File): Promise<string> {
  return uploadCompanyAsset(companyId, file, 'logo');
}

/**
 * Future: re-enable when FEATURES.companyStampSignature is true.
 * DB columns `stamp_url` / `signature_url` remain in place.
 */
export async function uploadCompanyStamp(companyId: string, file: File): Promise<string> {
  return uploadCompanyAsset(companyId, file, 'stamp');
}

/**
 * Future: re-enable when FEATURES.companyStampSignature is true.
 * DB columns `stamp_url` / `signature_url` remain in place.
 */
export async function uploadCompanySignature(companyId: string, file: File): Promise<string> {
  return uploadCompanyAsset(companyId, file, 'signature');
}
