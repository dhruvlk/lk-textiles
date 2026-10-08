import { createClient } from '@/lib/supabase/client';
import type {
  PersonalExpense,
  PersonalExpenseCategory,
  PersonalExpenseDocument,
  PersonalExpenseFilters,
  PersonalExpenseMonthlySummary,
  PersonalExpenseOverviewStats,
  PersonalExpenseSettings,
  PersonalExpenseYearlySummary,
  PersonalPaymentStatus,
} from '@/types/personal-expenses';

const supabase = () => createClient();
const STORAGE_BUCKET = 'personal-documents';

/** Format a number safely */
function num(val: unknown): number {
  const n = Number(val);
  return Number.isFinite(n) ? n : 0;
}

/** Sanitize file names for cloud storage */
function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9.-]/g, '_');
}

// ============================================================================
// Categories
// ============================================================================

export async function ensureDefaultPersonalCategories(userId: string): Promise<void> {
  try {
    await supabase().rpc('ensure_default_personal_categories', { p_user_id: userId });
  } catch (err) {
    console.error('Error ensuring default personal categories:', err);
  }
}

export async function getPersonalCategories(userId: string): Promise<PersonalExpenseCategory[]> {
  if (!userId) return [];
  await ensureDefaultPersonalCategories(userId);

  const { data, error } = await supabase()
    .from('personal_expense_categories')
    .select('*')
    .eq('user_id', userId)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching personal expense categories:', error);
    throw error;
  }

  const all = (data || []).map((row) => ({
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    parent_id: row.parent_id,
    color: row.color,
    icon: row.icon,
    is_active: row.is_active,
    created_at: row.created_at,
    updated_at: row.updated_at,
    subcategories: [] as PersonalExpenseCategory[],
  }));

  // Build parent-child tree
  const parentMap = new Map<string, PersonalExpenseCategory>();
  const rootCategories: PersonalExpenseCategory[] = [];

  all.forEach((cat) => {
    if (!cat.parent_id) {
      parentMap.set(cat.id, cat);
      rootCategories.push(cat);
    }
  });

  all.forEach((cat) => {
    if (cat.parent_id && parentMap.has(cat.parent_id)) {
      parentMap.get(cat.parent_id)!.subcategories!.push(cat);
    }
  });

  return rootCategories;
}

export async function getPersonalSubcategories(
  userId: string,
  parentCategoryId: string
): Promise<PersonalExpenseCategory[]> {
  if (!userId || !parentCategoryId) return [];

  const { data, error } = await supabase()
    .from('personal_expense_categories')
    .select('*')
    .eq('user_id', userId)
    .eq('parent_id', parentCategoryId)
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching personal subcategories:', error);
    throw error;
  }

  return (data || []).map((row) => ({
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    parent_id: row.parent_id,
    color: row.color,
    icon: row.icon,
    is_active: row.is_active,
    created_at: row.created_at,
    updated_at: row.updated_at,
    subcategories: [],
  }));
}

export async function getAllPersonalCategoriesFlat(
  userId: string
): Promise<PersonalExpenseCategory[]> {
  if (!userId) return [];
  await ensureDefaultPersonalCategories(userId);

  const { data, error } = await supabase()
    .from('personal_expense_categories')
    .select('*')
    .eq('user_id', userId)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching flat personal categories:', error);
    throw error;
  }

  return (data || []).map((row) => ({
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    parent_id: row.parent_id,
    color: row.color,
    icon: row.icon,
    is_active: row.is_active,
    created_at: row.created_at,
    updated_at: row.updated_at,
    subcategories: [],
  }));
}

export async function isCategoryUsed(categoryId: string, userId: string): Promise<boolean> {
  if (!categoryId || !userId) return false;

  const { count, error } = await supabase()
    .from('personal_expenses')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .or(`category_id.eq.${categoryId},subcategory_id.eq.${categoryId}`);

  if (error) {
    console.error('Error checking category usage:', error);
    return false;
  }

  return (count || 0) > 0;
}

export async function createPersonalCategory(
  userId: string,
  input: {
    name: string;
    parent_id?: string | null;
    color?: string | null;
    icon?: string | null;
    is_active?: boolean;
  }
): Promise<PersonalExpenseCategory> {
  const { data, error } = await supabase()
    .from('personal_expense_categories')
    .insert({
      user_id: userId,
      name: input.name.trim(),
      parent_id: input.parent_id || null,
      color: input.color || '#4f46e5',
      icon: input.icon || null,
      is_active: input.is_active ?? true,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating personal category:', error);
    throw error;
  }

  return {
    id: data.id,
    user_id: data.user_id,
    name: data.name,
    parent_id: data.parent_id,
    color: data.color,
    icon: data.icon,
    is_active: data.is_active,
    created_at: data.created_at,
    updated_at: data.updated_at,
    subcategories: [],
  };
}

export async function updatePersonalCategory(
  categoryId: string,
  userId: string,
  input: {
    name?: string;
    color?: string | null;
    icon?: string | null;
    is_active?: boolean;
    parent_id?: string | null;
  }
): Promise<PersonalExpenseCategory> {
  const payload: any = { updated_at: new Date().toISOString() };
  if (input.name !== undefined) payload.name = input.name.trim();
  if (input.color !== undefined) payload.color = input.color;
  if (input.icon !== undefined) payload.icon = input.icon;
  if (input.is_active !== undefined) payload.is_active = input.is_active;
  if (input.parent_id !== undefined) payload.parent_id = input.parent_id || null;

  const { data, error } = await supabase()
    .from('personal_expense_categories')
    .update(payload)
    .eq('id', categoryId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating personal category:', error);
    throw error;
  }

  return {
    id: data.id,
    user_id: data.user_id,
    name: data.name,
    parent_id: data.parent_id,
    color: data.color,
    icon: data.icon,
    is_active: data.is_active,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

export async function deletePersonalCategory(categoryId: string, userId: string): Promise<void> {
  const { error } = await supabase()
    .from('personal_expense_categories')
    .delete()
    .eq('id', categoryId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error deleting personal category:', error);
    throw error;
  }
}

// ============================================================================
// Settings
// ============================================================================

export async function getPersonalExpenseSettings(userId: string): Promise<PersonalExpenseSettings> {
  const { data, error } = await supabase()
    .from('personal_expense_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching personal expense settings:', error);
  }

  if (data) {
    return {
      id: data.id,
      user_id: data.user_id,
      expense_number_prefix: data.expense_number_prefix || 'PE-',
      starting_number: data.starting_number || 1,
      next_number: data.next_number || 1,
      default_currency: data.default_currency || 'INR',
      default_payment_method: data.default_payment_method || 'Cash',
      default_category_id: data.default_category_id || null,
      custom_payment_methods: data.custom_payment_methods || [
        'Cash',
        'UPI',
        'Credit Card',
        'Debit Card',
        'Bank Transfer',
        'Cheque',
        'Other',
      ],
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  }

  // Insert default settings
  const { data: inserted, error: insertError } = await supabase()
    .from('personal_expense_settings')
    .insert({
      user_id: userId,
      expense_number_prefix: 'PE-',
      starting_number: 1,
      next_number: 1,
      default_currency: 'INR',
      default_payment_method: 'Cash',
      custom_payment_methods: [
        'Cash',
        'UPI',
        'Credit Card',
        'Debit Card',
        'Bank Transfer',
        'Cheque',
        'Other',
      ],
    })
    .select()
    .single();

  if (insertError) {
    // If conflict happened concurrently, re-fetch
    const { data: refetched } = await supabase()
      .from('personal_expense_settings')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (refetched) {
      return {
        id: refetched.id,
        user_id: refetched.user_id,
        expense_number_prefix: refetched.expense_number_prefix || 'PE-',
        starting_number: refetched.starting_number || 1,
        next_number: refetched.next_number || 1,
        default_currency: refetched.default_currency || 'INR',
        default_payment_method: refetched.default_payment_method || 'Cash',
        default_category_id: refetched.default_category_id || null,
        custom_payment_methods: refetched.custom_payment_methods || [],
        created_at: refetched.created_at,
        updated_at: refetched.updated_at,
      };
    }
  }

  return {
    id: inserted?.id || '',
    user_id: userId,
    expense_number_prefix: inserted?.expense_number_prefix || 'PE-',
    starting_number: inserted?.starting_number || 1,
    next_number: inserted?.next_number || 1,
    default_currency: inserted?.default_currency || 'INR',
    default_payment_method: inserted?.default_payment_method || 'Cash',
    default_category_id: inserted?.default_category_id || null,
    custom_payment_methods: inserted?.custom_payment_methods || [
      'Cash',
      'UPI',
      'Credit Card',
      'Debit Card',
      'Bank Transfer',
      'Cheque',
      'Other',
    ],
    created_at: inserted?.created_at || new Date().toISOString(),
    updated_at: inserted?.updated_at || new Date().toISOString(),
  };
}

export async function updatePersonalExpenseSettings(
  userId: string,
  input: {
    expense_number_prefix?: string;
    starting_number?: number;
    next_number?: number;
    default_currency?: string;
    default_payment_method?: string;
    default_category_id?: string | null;
    custom_payment_methods?: string[];
  }
): Promise<PersonalExpenseSettings> {
  const payload: any = { updated_at: new Date().toISOString() };
  if (input.expense_number_prefix !== undefined) {
    payload.expense_number_prefix = input.expense_number_prefix.trim().toUpperCase();
  }
  if (input.starting_number !== undefined) payload.starting_number = input.starting_number;
  if (input.next_number !== undefined) payload.next_number = input.next_number;
  if (input.default_currency !== undefined) payload.default_currency = input.default_currency;
  if (input.default_payment_method !== undefined) {
    payload.default_payment_method = input.default_payment_method;
  }
  if (input.default_category_id !== undefined) {
    payload.default_category_id = input.default_category_id || null;
  }
  if (input.custom_payment_methods !== undefined) {
    payload.custom_payment_methods = input.custom_payment_methods;
  }

  const { data, error } = await supabase()
    .from('personal_expense_settings')
    .update(payload)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating personal expense settings:', error);
    throw error;
  }

  return {
    id: data.id,
    user_id: data.user_id,
    expense_number_prefix: data.expense_number_prefix,
    starting_number: data.starting_number,
    next_number: data.next_number,
    default_currency: data.default_currency,
    default_payment_method: data.default_payment_method,
    default_category_id: data.default_category_id || null,
    custom_payment_methods: data.custom_payment_methods || [],
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

// ============================================================================
// Document signed URL generator
// ============================================================================

export async function getPersonalDocumentSignedUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabase()
    .storage.from(STORAGE_BUCKET)
    .createSignedUrl(storagePath, 3600); // 1 hour expiration

  if (error || !data?.signedUrl) {
    console.error('Error generating signed URL:', error);
    return '';
  }
  return data.signedUrl;
}

// ============================================================================
// Personal Expenses List & Queries
// ============================================================================

export async function getPersonalExpensesPaginated(
  userId: string,
  filters: PersonalExpenseFilters = {},
  page = 1,
  pageSize = 20
): Promise<{
  data: PersonalExpense[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  let query = supabase()
    .from('personal_expenses')
    .select(
      `
      *,
      documents:personal_expense_documents (
        id,
        expense_id,
        user_id,
        file_name,
        storage_path,
        file_type,
        file_size,
        created_at
      )
    `,
      { count: 'exact' }
    )
    .eq('user_id', userId);

  // Search
  if (filters.search && filters.search.trim()) {
    const q = filters.search.trim();
    query = query.or(
      `description.ilike.%${q}%,paid_to.ilike.%${q}%,notes.ilike.%${q}%,category_name.ilike.%${q}%,expense_number.ilike.%${q}%`
    );
  }

  // Date range
  if (filters.dateFrom) {
    query = query.gte('expense_date', filters.dateFrom);
  }
  if (filters.dateTo) {
    query = query.lte('expense_date', filters.dateTo);
  }

  // Month filter (format YYYY-MM)
  if (filters.month) {
    const [y, m] = filters.month.split('-');
    if (y && m) {
      const start = `${y}-${m.padStart(2, '0')}-01`;
      const lastDay = new Date(Number(y), Number(m), 0).getDate();
      const end = `${y}-${m.padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      query = query.gte('expense_date', start).lte('expense_date', end);
    }
  }

  // Year filter
  if (filters.year) {
    const y = Number(filters.year);
    if (filters.yearType === 'financial') {
      const start = `${y}-04-01`;
      const end = `${y + 1}-03-31`;
      query = query.gte('expense_date', start).lte('expense_date', end);
    } else {
      const start = `${y}-01-01`;
      const end = `${y}-12-31`;
      query = query.gte('expense_date', start).lte('expense_date', end);
    }
  }

  // Category filter
  if (filters.categoryId) {
    query = query.or(
      `category_id.eq.${filters.categoryId},subcategory_id.eq.${filters.categoryId}`
    );
  }

  // Payment Method
  if (filters.paymentMethod) {
    query = query.eq('payment_method', filters.paymentMethod);
  }

  // Payment Status
  if (filters.paymentStatus) {
    query = query.eq('payment_status', filters.paymentStatus);
  }

  // Paid to / Merchant
  if (filters.paidTo) {
    query = query.ilike('paid_to', `%${filters.paidTo}%`);
  }

  // Amount range
  if (filters.minAmount !== undefined && filters.minAmount > 0) {
    query = query.gte('amount', filters.minAmount);
  }
  if (filters.maxAmount !== undefined && filters.maxAmount > 0) {
    query = query.lte('amount', filters.maxAmount);
  }

  // Sorting
  switch (filters.sortBy) {
    case 'oldest':
      query = query.order('expense_date', { ascending: true }).order('created_at', { ascending: true });
      break;
    case 'highest':
      query = query.order('amount', { ascending: false });
      break;
    case 'lowest':
      query = query.order('amount', { ascending: true });
      break;
    case 'newest':
    default:
      query = query.order('expense_date', { ascending: false }).order('created_at', { ascending: false });
      break;
  }

  // Pagination
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, count, error } = await query;

  if (error) {
    console.error('Error fetching personal expenses:', error);
    throw error;
  }

  const expenses: PersonalExpense[] = (data || []).map((row) => ({
    id: row.id,
    user_id: row.user_id,
    expense_number: row.expense_number,
    expense_date: row.expense_date,
    category_id: row.category_id,
    category_name: row.category_name,
    subcategory_id: row.subcategory_id,
    subcategory_name: row.subcategory_name,
    description: row.description,
    amount: num(row.amount),
    payment_method: row.payment_method,
    payment_status: row.payment_status as PersonalPaymentStatus,
    paid_amount: num(row.paid_amount),
    pending_amount: num(row.pending_amount),
    paid_to: row.paid_to,
    notes: row.notes,
    created_at: row.created_at,
    updated_at: row.updated_at,
    documents: ((row as any).documents || []).map((doc: any) => ({
      id: doc.id,
      expense_id: doc.expense_id,
      user_id: doc.user_id,
      file_name: doc.file_name,
      storage_path: doc.storage_path,
      file_type: doc.file_type,
      file_size: num(doc.file_size),
      created_at: doc.created_at,
    })),
  }));

  const total = count || 0;
  const totalPages = Math.ceil(total / pageSize) || 1;

  return {
    data: expenses,
    total,
    page,
    pageSize,
    totalPages,
  };
}

export async function getPersonalExpenseById(
  expenseId: string,
  userId: string
): Promise<PersonalExpense | null> {
  const { data, error } = await supabase()
    .from('personal_expenses')
    .select(
      `
      *,
      documents:personal_expense_documents (
        id,
        expense_id,
        user_id,
        file_name,
        storage_path,
        file_type,
        file_size,
        created_at
      )
    `
    )
    .eq('id', expenseId)
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    user_id: data.user_id,
    expense_number: data.expense_number,
    expense_date: data.expense_date,
    category_id: data.category_id,
    category_name: data.category_name,
    subcategory_id: data.subcategory_id,
    subcategory_name: data.subcategory_name,
    description: data.description,
    amount: num(data.amount),
    payment_method: data.payment_method,
    payment_status: data.payment_status as PersonalPaymentStatus,
    paid_amount: num(data.paid_amount),
    pending_amount: num(data.pending_amount),
    paid_to: data.paid_to,
    notes: data.notes,
    created_at: data.created_at,
    updated_at: data.updated_at,
    documents: ((data as any).documents || []).map((doc: any) => ({
      id: doc.id,
      expense_id: doc.expense_id,
      user_id: doc.user_id,
      file_name: doc.file_name,
      storage_path: doc.storage_path,
      file_type: doc.file_type,
      file_size: num(doc.file_size),
      created_at: doc.created_at,
    })),
  };
}

// ============================================================================
// Create, Update, Delete & Duplicate
// ============================================================================

export async function createPersonalExpense(
  userId: string,
  input: {
    expense_date: string;
    category_id?: string | null;
    category_name: string;
    subcategory_id?: string | null;
    subcategory_name?: string | null;
    description: string;
    amount: number;
    payment_method?: string;
    payment_status?: PersonalPaymentStatus;
    paid_amount?: number;
    paid_to?: string | null;
    notes?: string | null;
  },
  files?: File[]
): Promise<PersonalExpense> {
  // 1. Generate unique server-side expense number
  const { data: expNumData, error: numError } = await supabase().rpc(
    'generate_personal_expense_number',
    { p_user_id: userId }
  );

  if (numError || !expNumData) {
    console.error('Failed to generate expense number:', numError);
    throw new Error('Failed to generate personal expense number');
  }

  const expenseNumber = expNumData as string;
  const amount = num(input.amount);
  const status = input.payment_status || 'Paid';

  let paidAmount = 0;
  let pendingAmount = 0;

  if (status === 'Paid') {
    paidAmount = amount;
    pendingAmount = 0;
  } else if (status === 'Pending') {
    paidAmount = 0;
    pendingAmount = amount;
  } else {
    // Partially Paid
    paidAmount = input.paid_amount !== undefined ? num(input.paid_amount) : 0;
    pendingAmount = Math.max(0, amount - paidAmount);
  }

  // 2. Insert expense record
  const { data: newExpense, error: insertError } = await supabase()
    .from('personal_expenses')
    .insert({
      user_id: userId,
      expense_number: expenseNumber,
      expense_date: input.expense_date,
      category_id: input.category_id || null,
      category_name: input.category_name,
      subcategory_id: input.subcategory_id || null,
      subcategory_name: input.subcategory_name || null,
      description: input.description.trim(),
      amount,
      payment_method: input.payment_method || 'Cash',
      payment_status: status,
      paid_amount: paidAmount,
      pending_amount: pendingAmount,
      paid_to: input.paid_to?.trim() || null,
      notes: input.notes?.trim() || null,
    })
    .select()
    .single();

  if (insertError) {
    console.error('Error inserting personal expense:', insertError);
    throw insertError;
  }

  // 3. Log Audit Trail
  await supabase()
    .from('personal_expense_audit_logs')
    .insert({
      user_id: userId,
      expense_id: newExpense.id,
      action: 'Created',
      details: `Created expense ${expenseNumber} for ₹${amount}`,
    });

  // 4. Upload attachments if provided
  const attachedDocs: PersonalExpenseDocument[] = [];
  if (files && files.length > 0) {
    for (const file of files) {
      try {
        const cleanName = sanitizeFileName(file.name);
        const storagePath = `${userId}/${newExpense.id}/${Date.now()}-${cleanName}`;

        const { error: uploadError } = await supabase()
          .storage.from(STORAGE_BUCKET)
          .upload(storagePath, file, {
            contentType: file.type,
            upsert: true,
          });

        if (uploadError) {
          console.error('File upload failed for', file.name, uploadError);
          continue;
        }

        const { data: docData, error: docError } = await supabase()
          .from('personal_expense_documents')
          .insert({
            expense_id: newExpense.id,
            user_id: userId,
            file_name: file.name,
            storage_path: storagePath,
            file_type: file.type || 'application/octet-stream',
            file_size: file.size,
          })
          .select()
          .single();

        if (!docError && docData) {
          attachedDocs.push({
            id: docData.id,
            expense_id: docData.expense_id,
            user_id: docData.user_id,
            file_name: docData.file_name,
            storage_path: docData.storage_path,
            file_type: docData.file_type,
            file_size: num(docData.file_size),
            created_at: docData.created_at,
          });

          await supabase()
            .from('personal_expense_audit_logs')
            .insert({
              user_id: userId,
              expense_id: newExpense.id,
              action: 'Document Uploaded',
              details: `Uploaded ${file.name}`,
            });
        }
      } catch (uploadErr) {
        console.error('Exception uploading file:', uploadErr);
      }
    }
  }

  return {
    id: newExpense.id,
    user_id: newExpense.user_id,
    expense_number: newExpense.expense_number,
    expense_date: newExpense.expense_date,
    category_id: newExpense.category_id,
    category_name: newExpense.category_name,
    subcategory_id: newExpense.subcategory_id,
    subcategory_name: newExpense.subcategory_name,
    description: newExpense.description,
    amount: num(newExpense.amount),
    payment_method: newExpense.payment_method,
    payment_status: newExpense.payment_status as PersonalPaymentStatus,
    paid_amount: num(newExpense.paid_amount),
    pending_amount: num(newExpense.pending_amount),
    paid_to: newExpense.paid_to,
    notes: newExpense.notes,
    created_at: newExpense.created_at,
    updated_at: newExpense.updated_at,
    documents: attachedDocs,
  };
}

export async function updatePersonalExpense(
  expenseId: string,
  userId: string,
  input: {
    expense_date?: string;
    category_id?: string | null;
    category_name?: string;
    subcategory_id?: string | null;
    subcategory_name?: string | null;
    description?: string;
    amount?: number;
    payment_method?: string;
    payment_status?: PersonalPaymentStatus;
    paid_amount?: number;
    paid_to?: string | null;
    notes?: string | null;
  }
): Promise<PersonalExpense> {
  const current = await getPersonalExpenseById(expenseId, userId);
  if (!current) {
    throw new Error('Expense not found');
  }

  const payload: any = { updated_at: new Date().toISOString() };
  if (input.expense_date !== undefined) payload.expense_date = input.expense_date;
  if (input.category_id !== undefined) payload.category_id = input.category_id;
  if (input.category_name !== undefined) payload.category_name = input.category_name;
  if (input.subcategory_id !== undefined) payload.subcategory_id = input.subcategory_id;
  if (input.subcategory_name !== undefined) payload.subcategory_name = input.subcategory_name;
  if (input.description !== undefined) payload.description = input.description.trim();
  if (input.payment_method !== undefined) payload.payment_method = input.payment_method;
  if (input.paid_to !== undefined) payload.paid_to = input.paid_to?.trim() || null;
  if (input.notes !== undefined) payload.notes = input.notes?.trim() || null;

  const newAmount = input.amount !== undefined ? num(input.amount) : current.amount;
  const newStatus = input.payment_status || current.payment_status;

  payload.amount = newAmount;
  payload.payment_status = newStatus;

  if (newStatus === 'Paid') {
    payload.paid_amount = newAmount;
    payload.pending_amount = 0;
  } else if (newStatus === 'Pending') {
    payload.paid_amount = 0;
    payload.pending_amount = newAmount;
  } else {
    // Partially Paid
    const pd = input.paid_amount !== undefined ? num(input.paid_amount) : current.paid_amount;
    payload.paid_amount = pd;
    payload.pending_amount = Math.max(0, newAmount - pd);
  }

  const { data, error } = await supabase()
    .from('personal_expenses')
    .update(payload)
    .eq('id', expenseId)
    .eq('user_id', userId)
    .select(
      `
      *,
      documents:personal_expense_documents (
        id,
        expense_id,
        user_id,
        file_name,
        storage_path,
        file_type,
        file_size,
        created_at
      )
    `
    )
    .single();

  if (error) {
    console.error('Error updating personal expense:', error);
    throw error;
  }

  // Audit trail
  await supabase()
    .from('personal_expense_audit_logs')
    .insert({
      user_id: userId,
      expense_id: expenseId,
      action: 'Edited',
      details: `Updated expense ${data.expense_number}`,
    });

  return {
    id: data.id,
    user_id: data.user_id,
    expense_number: data.expense_number,
    expense_date: data.expense_date,
    category_id: data.category_id,
    category_name: data.category_name,
    subcategory_id: data.subcategory_id,
    subcategory_name: data.subcategory_name,
    description: data.description,
    amount: num(data.amount),
    payment_method: data.payment_method,
    payment_status: data.payment_status as PersonalPaymentStatus,
    paid_amount: num(data.paid_amount),
    pending_amount: num(data.pending_amount),
    paid_to: data.paid_to,
    notes: data.notes,
    created_at: data.created_at,
    updated_at: data.updated_at,
    documents: ((data as any).documents || []).map((doc: any) => ({
      id: doc.id,
      expense_id: doc.expense_id,
      user_id: doc.user_id,
      file_name: doc.file_name,
      storage_path: doc.storage_path,
      file_type: doc.file_type,
      file_size: num(doc.file_size),
      created_at: doc.created_at,
    })),
  };
}

export async function deletePersonalExpense(expenseId: string, userId: string): Promise<void> {
  // 1. Fetch attached documents to remove from Storage
  const { data: docs } = await supabase()
    .from('personal_expense_documents')
    .select('storage_path')
    .eq('expense_id', expenseId)
    .eq('user_id', userId);

  if (docs && docs.length > 0) {
    const paths = docs.map((d) => d.storage_path);
    await supabase().storage.from(STORAGE_BUCKET).remove(paths);
  }

  // 2. Delete expense record (cascades documents and audit logs)
  const { error } = await supabase()
    .from('personal_expenses')
    .delete()
    .eq('id', expenseId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error deleting personal expense:', error);
    throw error;
  }
}

export async function duplicatePersonalExpense(
  expenseId: string,
  userId: string
): Promise<PersonalExpense> {
  const current = await getPersonalExpenseById(expenseId, userId);
  if (!current) {
    throw new Error('Expense not found');
  }

  return createPersonalExpense(userId, {
    expense_date: new Date().toISOString().split('T')[0],
    category_id: current.category_id,
    category_name: current.category_name,
    subcategory_id: current.subcategory_id,
    subcategory_name: current.subcategory_name,
    description: current.description,
    amount: current.amount,
    payment_method: current.payment_method,
    payment_status: current.payment_status,
    paid_amount: current.paid_amount,
    paid_to: current.paid_to,
    notes: current.notes,
  });
}

// ============================================================================
// Document Management for an Existing Expense
// ============================================================================

export async function uploadExpenseAttachments(
  expenseId: string,
  userId: string,
  files: File[]
): Promise<PersonalExpenseDocument[]> {
  const uploaded: PersonalExpenseDocument[] = [];

  for (const file of files) {
    const cleanName = sanitizeFileName(file.name);
    const storagePath = `${userId}/${expenseId}/${Date.now()}-${cleanName}`;

    const { error: uploadError } = await supabase()
      .storage.from(STORAGE_BUCKET)
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      throw uploadError;
    }

    const { data, error } = await supabase()
      .from('personal_expense_documents')
      .insert({
        expense_id: expenseId,
        user_id: userId,
        file_name: file.name,
        storage_path: storagePath,
        file_type: file.type || 'application/octet-stream',
        file_size: file.size,
      })
      .select()
      .single();

    if (error) {
      console.error('Error registering document in DB:', error);
      throw error;
    }

    await supabase()
      .from('personal_expense_audit_logs')
      .insert({
        user_id: userId,
        expense_id: expenseId,
        action: 'Document Uploaded',
        details: `Uploaded ${file.name}`,
      });

    uploaded.push({
      id: data.id,
      expense_id: data.expense_id,
      user_id: data.user_id,
      file_name: data.file_name,
      storage_path: data.storage_path,
      file_type: data.file_type,
      file_size: num(data.file_size),
      created_at: data.created_at,
    });
  }

  return uploaded;
}

export async function deleteExpenseAttachment(
  documentId: string,
  userId: string
): Promise<void> {
  const { data: doc, error: fetchErr } = await supabase()
    .from('personal_expense_documents')
    .select('*')
    .eq('id', documentId)
    .eq('user_id', userId)
    .single();

  if (fetchErr || !doc) {
    throw new Error('Document not found');
  }

  // Remove from storage
  await supabase().storage.from(STORAGE_BUCKET).remove([doc.storage_path]);

  // Remove record
  await supabase()
    .from('personal_expense_documents')
    .delete()
    .eq('id', documentId)
    .eq('user_id', userId);

  // Log audit
  await supabase()
    .from('personal_expense_audit_logs')
    .insert({
      user_id: userId,
      expense_id: doc.expense_id,
      action: 'Document Removed',
      details: `Removed document ${doc.file_name}`,
    });
}

// ============================================================================
// Analytics & Summaries (100% Dynamic)
// ============================================================================

export async function getPersonalExpenseOverviewStats(
  userId: string
): Promise<PersonalExpenseOverviewStats> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  const todayStr = `${year}-${month}-${day}`;
  const monthStart = `${year}-${month}-01`;
  const nextMonthFirst = new Date(year, now.getMonth() + 1, 1);
  const monthEnd = new Date(nextMonthFirst.getTime() - 86400000).toISOString().split('T')[0];
  const yearStart = `${year}-01-01`;
  const yearEnd = `${year}-12-31`;

  // Parallel queries for fast KPI cards
  const [todayRes, monthRes, yearRes, pendingRes] = await Promise.all([
    // Today
    supabase()
      .from('personal_expenses')
      .select('amount')
      .eq('user_id', userId)
      .eq('expense_date', todayStr),
    // This Month
    supabase()
      .from('personal_expenses')
      .select('amount')
      .eq('user_id', userId)
      .gte('expense_date', monthStart)
      .lte('expense_date', monthEnd),
    // This Year
    supabase()
      .from('personal_expenses')
      .select('amount')
      .eq('user_id', userId)
      .gte('expense_date', yearStart)
      .lte('expense_date', yearEnd),
    // Pending / Unpaid total
    supabase()
      .from('personal_expenses')
      .select('pending_amount')
      .eq('user_id', userId)
      .neq('payment_status', 'Paid'),
  ]);

  const todayTotal = (todayRes.data || []).reduce((sum, r) => sum + num(r.amount), 0);
  const thisMonthTotal = (monthRes.data || []).reduce((sum, r) => sum + num(r.amount), 0);
  const thisYearTotal = (yearRes.data || []).reduce((sum, r) => sum + num(r.amount), 0);
  const pendingUnpaidTotal = (pendingRes.data || []).reduce(
    (sum, r) => sum + num(r.pending_amount),
    0
  );

  return {
    todayTotal,
    thisMonthTotal,
    thisYearTotal,
    pendingUnpaidTotal,
  };
}

export async function getPersonalMonthlySummary(
  userId: string,
  year: number,
  month: number // 1-12
): Promise<PersonalExpenseMonthlySummary> {
  const mStr = String(month).padStart(2, '0');
  const monthStart = `${year}-${mStr}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const monthEnd = `${year}-${mStr}-${String(lastDay).padStart(2, '0')}`;

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  const monthLabel = `${monthNames[month - 1]} ${year}`;

  const { data, error } = await supabase()
    .from('personal_expenses')
    .select('amount, category_name, description, expense_date')
    .eq('user_id', userId)
    .gte('expense_date', monthStart)
    .lte('expense_date', monthEnd);

  if (error) {
    console.error('Error fetching monthly summary:', error);
    throw error;
  }

  const rows = data || [];
  let totalSpent = 0;
  let largestExpense = 0;
  let largestExpenseDescription = '';

  const catMap = new Map<string, { totalAmount: number; count: number }>();

  rows.forEach((r) => {
    const amt = num(r.amount);
    totalSpent += amt;
    if (amt > largestExpense) {
      largestExpense = amt;
      largestExpenseDescription = r.description || '';
    }

    const cat = r.category_name || 'Other';
    const existing = catMap.get(cat) || { totalAmount: 0, count: 0 };
    existing.totalAmount += amt;
    existing.count += 1;
    catMap.set(cat, existing);
  });

  const transactionCount = rows.length;

  // Average daily spend: if current month, divide by current day; if past, divide by days in month
  const now = new Date();
  const isCurrentMonth = now.getFullYear() === year && now.getMonth() + 1 === month;
  const divisor = isCurrentMonth ? Math.max(1, now.getDate()) : Math.max(1, lastDay);
  const averageDailySpend = totalSpent / divisor;

  const categoryBreakdown = Array.from(catMap.entries())
    .map(([categoryName, stats]) => ({
      categoryName,
      totalAmount: stats.totalAmount,
      count: stats.count,
      percentage: totalSpent > 0 ? (stats.totalAmount / totalSpent) * 100 : 0,
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount);

  return {
    monthLabel,
    year,
    month,
    totalSpent,
    transactionCount,
    averageDailySpend,
    largestExpense,
    largestExpenseDescription,
    categoryBreakdown,
  };
}

export async function getPersonalYearlySummary(
  userId: string,
  year: number,
  yearType: 'calendar' | 'financial' = 'calendar'
): Promise<PersonalExpenseYearlySummary> {
  let startDate: string;
  let endDate: string;
  let yearLabel: string;
  let monthKeys: Array<{ key: string; label: string }>;

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  if (yearType === 'financial') {
    startDate = `${year}-04-01`;
    endDate = `${year + 1}-03-31`;
    yearLabel = `Financial Year ${year}–${String(year + 1).slice(-2)}`;

    // Order: Apr, May, Jun, Jul, Aug, Sep, Oct, Nov, Dec, Jan, Feb, Mar
    monthKeys = [
      { key: `${year}-04`, label: 'April' },
      { key: `${year}-05`, label: 'May' },
      { key: `${year}-06`, label: 'June' },
      { key: `${year}-07`, label: 'July' },
      { key: `${year}-08`, label: 'August' },
      { key: `${year}-09`, label: 'September' },
      { key: `${year}-10`, label: 'October' },
      { key: `${year}-11`, label: 'November' },
      { key: `${year}-12`, label: 'December' },
      { key: `${year + 1}-01`, label: 'January' },
      { key: `${year + 1}-02`, label: 'February' },
      { key: `${year + 1}-03`, label: 'March' },
    ];
  } else {
    startDate = `${year}-01-01`;
    endDate = `${year}-12-31`;
    yearLabel = `Calendar Year ${year}`;

    monthKeys = Array.from({ length: 12 }, (_, i) => ({
      key: `${year}-${String(i + 1).padStart(2, '0')}`,
      label: monthNames[i],
    }));
  }

  const { data, error } = await supabase()
    .from('personal_expenses')
    .select('amount, category_name, expense_date')
    .eq('user_id', userId)
    .gte('expense_date', startDate)
    .lte('expense_date', endDate);

  if (error) {
    console.error('Error fetching yearly summary:', error);
    throw error;
  }

  const rows = data || [];
  let totalSpent = 0;
  let largestExpense = 0;

  const monthlyTotals = new Map<string, { total: number; count: number }>();
  monthKeys.forEach((m) => monthlyTotals.set(m.key, { total: 0, count: 0 }));

  const catMap = new Map<string, { totalAmount: number; count: number }>();

  rows.forEach((r) => {
    const amt = num(r.amount);
    totalSpent += amt;
    if (amt > largestExpense) largestExpense = amt;

    const monthKey = r.expense_date.slice(0, 7);
    if (monthlyTotals.has(monthKey)) {
      const cur = monthlyTotals.get(monthKey)!;
      cur.total += amt;
      cur.count += 1;
    }

    const cat = r.category_name || 'Other';
    const c = catMap.get(cat) || { totalAmount: 0, count: 0 };
    c.totalAmount += amt;
    c.count += 1;
    catMap.set(cat, c);
  });

  const transactionCount = rows.length;
  const averageMonthlySpending = totalSpent / 12;
  const averageDailySpending = totalSpent / 365;

  const monthlyBreakdown = monthKeys.map((m) => {
    const stats = monthlyTotals.get(m.key) || { total: 0, count: 0 };
    return {
      monthKey: m.key,
      monthName: m.label,
      totalAmount: stats.total,
      count: stats.count,
    };
  });

  const categoryBreakdown = Array.from(catMap.entries())
    .map(([categoryName, stats]) => ({
      categoryName,
      totalAmount: stats.totalAmount,
      count: stats.count,
      percentage: totalSpent > 0 ? (stats.totalAmount / totalSpent) * 100 : 0,
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount);

  return {
    yearLabel,
    yearType,
    totalSpent,
    transactionCount,
    averageMonthlySpending,
    averageDailySpending,
    largestExpense,
    monthlyBreakdown,
    categoryBreakdown,
  };
}

export async function getAllUniqueMerchants(userId: string): Promise<string[]> {
  const { data } = await supabase()
    .from('personal_expenses')
    .select('paid_to')
    .eq('user_id', userId)
    .not('paid_to', 'is', null)
    .limit(200);

  if (!data) return [];

  const unique = Array.from(
    new Set(data.map((r) => r.paid_to?.trim()).filter(Boolean) as string[])
  ).sort();

  return unique;
}
