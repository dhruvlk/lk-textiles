import { createClient } from '@/lib/supabase/client';
import type { DocumentFilters, VaultDocument } from '@/types';
import type { DocumentRow } from '@/types/database';

const supabase = () => createClient();

const BUCKET_NAME = 'company-documents';

function mapDocument(row: DocumentRow & { supplier?: unknown }): VaultDocument {
  return {
    id: row.id,
    company_id: row.company_id,
    financial_year: row.financial_year,
    document_type: row.document_type,
    purchase_id: row.purchase_id,
    expense_id: row.expense_id,
    supplier_id: row.supplier_id,
    file_name: row.file_name,
    file_type: row.file_type,
    file_size: Number(row.file_size) || 0,
    storage_path: row.storage_path,
    public_url: row.public_url,
    tags: row.tags || [],
    description: row.description,
    ocr_data: row.ocr_data as Record<string, unknown> | null,
    status: row.status,
    uploaded_by: row.uploaded_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
    supplier: row.supplier as VaultDocument['supplier'],
  };
}

export async function uploadVaultDocument(
  companyId: string,
  file: File,
  meta: {
    financialYear: string;
    documentType: VaultDocument['document_type'];
    purchaseId?: string | null;
    expenseId?: string | null;
    supplierId?: string | null;
    tags?: string[];
    description?: string | null;
    status?: 'Draft' | 'Active';
    userId?: string | null;
  }
): Promise<VaultDocument> {
  const ext = file.name.split('.').pop() || 'bin';
  const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const sanitizedFolder = meta.documentType.toLowerCase().replace(/\s+/g, '-');
  const path = `${companyId}/${meta.financialYear}/${sanitizedFolder}/${Date.now()}-${cleanName}`;

  // 1. Upload to Supabase Storage
  const { error: uploadError } = await supabase().storage.from(BUCKET_NAME).upload(path, file, {
    upsert: true,
    contentType: file.type,
  });

  if (uploadError) {
    console.error('Storage upload error:', uploadError);
    throw uploadError;
  }

  // 2. Get Public URL (bucket is public or accessible via company folder)
  const { data: urlData } = supabase().storage.from(BUCKET_NAME).getPublicUrl(path);
  const publicUrl = urlData.publicUrl;

  // 3. Save database record
  const { data, error: dbError } = await supabase()
    .from('documents')
    .insert({
      company_id: companyId,
      financial_year: meta.financialYear,
      document_type: meta.documentType,
      purchase_id: meta.purchaseId || null,
      expense_id: meta.expenseId || null,
      supplier_id: meta.supplierId || null,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
      storage_path: path,
      public_url: publicUrl,
      tags: meta.tags || [],
      description: meta.description || null,
      status: meta.status || 'Active',
      uploaded_by: meta.userId || null,
      ocr_data: null,
    })
    .select(`
      *,
      supplier:suppliers (
        id,
        name,
        gstin
      )
    `)
    .single();

  if (dbError) {
    console.error('Database record error for document:', dbError);
    throw dbError;
  }

  return mapDocument(data);
}

export async function getVaultDocuments(
  companyId: string,
  filters?: DocumentFilters
): Promise<VaultDocument[]> {
  let query = supabase()
    .from('documents')
    .select(`
      *,
      supplier:suppliers (
        id,
        name,
        gstin
      )
    `)
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });

  if (filters?.financialYear?.trim()) {
    query = query.eq('financial_year', filters.financialYear.trim());
  }

  if (filters?.documentType?.trim() && filters.documentType !== 'all') {
    query = query.eq('document_type', filters.documentType as DocumentRow['document_type']);
  }

  if (filters?.tag?.trim()) {
    query = query.contains('tags', [filters.tag.trim()]);
  }

  if (filters?.search?.trim()) {
    const s = filters.search.trim();
    query = query.or(`file_name.ilike.%${s}%,description.ilike.%${s}%`);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching vault documents:', error);
    throw error;
  }

  return (data || []).map(mapDocument);
}

export async function getDocumentsByPurchaseId(
  companyId: string,
  purchaseId: string
): Promise<VaultDocument[]> {
  const { data, error } = await supabase()
    .from('documents')
    .select('*')
    .eq('company_id', companyId)
    .eq('purchase_id', purchaseId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data || []).map(mapDocument);
}

export async function getDocumentsByExpenseId(
  companyId: string,
  expenseId: string
): Promise<VaultDocument[]> {
  const { data, error } = await supabase()
    .from('documents')
    .select('*')
    .eq('company_id', companyId)
    .eq('expense_id', expenseId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data || []).map(mapDocument);
}

export async function deleteVaultDocument(
  companyId: string,
  documentId: string
): Promise<void> {
  // First fetch the document to get the storage path
  const { data: doc, error: fetchErr } = await supabase()
    .from('documents')
    .select('storage_path')
    .eq('company_id', companyId)
    .eq('id', documentId)
    .single();

  if (fetchErr) throw fetchErr;

  if (doc?.storage_path) {
    await supabase().storage.from(BUCKET_NAME).remove([doc.storage_path]);
  }

  const { error: deleteErr } = await supabase()
    .from('documents')
    .delete()
    .eq('company_id', companyId)
    .eq('id', documentId);

  if (deleteErr) throw deleteErr;
}
