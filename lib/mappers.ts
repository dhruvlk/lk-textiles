import { formatPhoneToStorage } from '@/lib/validations/phone';
import type { Company } from '@/types';
import type { CompanyRow } from '@/types/database';

export function mapCompany(row: CompanyRow): Company {
  return { ...row };
}

export function companyToInsert(
  company: Partial<Company> & { name: string; user_id: string }
) {
  return {
    user_id: company.user_id,
    name: company.name,
    owner_name: company.owner_name ?? null,
    logo_url: company.logo_url ?? null,
    stamp_url: company.stamp_url ?? null,
    gst_number: company.gst_number ?? null,
    hsn_code: company.hsn_code ?? null,
    address: company.address ?? null,
    city: company.city ?? null,
    state: company.state ?? null,
    pincode: company.pincode ?? null,
    phone: company.phone ? formatPhoneToStorage(company.phone) : null,
    email: company.email ?? null,
    website: company.website ?? null,
    pan_number: company.pan_number ?? null,
    tagline: company.tagline ?? null,
    bank_name: company.bank_name ?? null,
    account_name: company.account_name ?? null,
    account_number: company.account_number ?? null,
    ifsc_code: company.ifsc_code ?? null,
    branch: company.branch ?? null,
    bank_details: company.bank_details ?? null,
    upi_id: company.upi_id ?? null,
    signature_url: company.signature_url ?? null,
    terms_conditions: company.terms_conditions ?? company.invoice_terms ?? null,
    invoice_terms: company.invoice_terms ?? company.terms_conditions ?? null,
    delivery_challan_terms: company.delivery_challan_terms ?? null,
    invoice_prefix: company.invoice_prefix ?? 'INV',
    delivery_challan_prefix: company.delivery_challan_prefix ?? 'DC',
    invoice_start_number: company.invoice_start_number ?? 1,
    delivery_challan_start_number: company.delivery_challan_start_number ?? 1,
    number_fy_format: company.number_fy_format ?? 'YYYY',
    theme_primary: company.theme_primary ?? null,
    theme_secondary: company.theme_secondary ?? null,
    default_payment_terms: company.default_payment_terms ?? '45 Days',
    default_gst_type: company.default_gst_type ?? 'cgst_sgst',
    default_unit: company.default_unit ?? 'Taka',
    default_delivered_by: company.default_delivered_by ?? null,
    is_active: company.is_active ?? false,
  };
}
