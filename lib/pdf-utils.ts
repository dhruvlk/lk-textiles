import type { Company } from '@/types';

export function formatCompanyAddress(company: Company): string {
  const parts = [company.address, company.city, company.state, company.pincode].filter(Boolean);
  return parts.join(', ');
}

/** Sanitize a name for use in download filenames. */
export function slugifyCompanyName(name?: string | null): string {
  if (!name?.trim()) return '';
  return name
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Build a PDF download filename like:
 * Delivery-Challan-DC-000002-Customer-Name.pdf
 * Invoice-CH-000041-Customer-Name.pdf
 */
export function buildPdfFilename(
  prefix: string,
  documentNumber?: string | null,
  partyName?: string | null
): string {
  const partySlug = slugifyCompanyName(partyName);
  const parts = [prefix];
  if (documentNumber?.trim()) parts.push(documentNumber.trim());
  if (partySlug) parts.push(partySlug);
  return `${parts.join('-')}.pdf`;
}

export interface BankDetailRow {
  label?: string;
  value: string;
  isBankName?: boolean;
}

export function getBankDetailRows(company: Company): BankDetailRow[] {
  const rows: BankDetailRow[] = [];

  if (company.bank_name) {
    rows.push({ label: 'Bank Name:', value: company.bank_name });
  }
  if (company.account_number) {
    rows.push({ label: 'A/C No:', value: company.account_number });
  }
  if (company.ifsc_code) {
    rows.push({ label: 'IFSC:', value: company.ifsc_code });
  }

  if (rows.length === 0 && company.bank_details) {
    return company.bank_details
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((value) => ({ value }));
  }

  return rows;
}

export function resolveInvoiceTerms(company: Company): string[] {
  return parseTerms(company.terms_conditions);
}



export function parseTerms(terms?: string | null): string[] {
  if (!terms?.trim()) return [];

  const chunks = terms
    .split(/\n|•/)
    .flatMap((chunk) => chunk.split(/(?<=(?<!a\/c)\.)\s+(?=[a-z])/i))
    .map((line) => line.replace(/^[-•*\d.)\s]+/, '').trim())
    .filter(Boolean)
    .map((line) => line.charAt(0).toUpperCase() + line.slice(1));

  return chunks;
}

export function itemDescription(item: {
  description?: string | null;
  quality?: string | null;
  fabric_name?: string | null;
  product?: { name?: string; hsn_code?: string | null } | null;
}): string {
  if (item.description?.trim()) return item.description.trim();
  const parts = [
    item.product?.name,
    item.quality,
    item.fabric_name,
  ].filter(Boolean);
  return parts.join(' ').trim();
}

export function resolveHsnCode(
  company?: { hsn_code?: string | null } | null,
  items: { product?: { hsn_code?: string | null } | null }[] = []
): string {
  for (const item of items) {
    if (item.product?.hsn_code) return item.product.hsn_code;
  }
  if (company?.hsn_code?.trim()) return company.hsn_code.trim();
  return '-';
}


