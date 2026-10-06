import { createClient } from '@/lib/supabase/client';
import type { ExpenseCategory } from '@/types';
import type { ExpenseCategoryRow } from '@/types/database';

const supabase = () => createClient();

export const DEFAULT_EXPENSE_CATEGORIES = [
  { name: 'Raw Material', color: '#0284c7', description: 'Yarn, grey fabric, raw fibers' },
  { name: 'Yarn', color: '#6366f1', description: 'Yarn purchases' },
  { name: 'Fabric', color: '#8b5cf6', description: 'Finished and grey fabric' },
  { name: 'Dye & Chemical', color: '#ec4899', description: 'Colorants, bleaching, sizing' },
  { name: 'Packing Material', color: '#f59e0b', description: 'Bags, rolls, boxes, strapping' },
  { name: 'Transport & Freight', color: '#10b981', description: 'Goods delivery, dispatch, tempos' },
  { name: 'Machine Spare Parts', color: '#e11d48', description: 'Loom parts, shuttles, electrical spares' },
  { name: 'Machine Maintenance & Repair', color: '#f97316', description: 'Servicing, repairs, overhaul' },
  { name: 'Electricity & Power', color: '#eab308', description: 'Power bills, meter charges, generator' },
  { name: 'Factory / Office Rent', color: '#14b8a6', description: 'Gala, mill, warehouse, office rent' },
  { name: 'Telephone & Internet', color: '#06b6d4', description: 'Broadband, cellular bills' },
  { name: 'Office Supplies & Stationery', color: '#64748b', description: 'Stationery, bills books, printer ink' },
  { name: 'Printing & Xerox', color: '#78716c', description: 'Tags, challan books, copies' },
  { name: 'Salary & Wages Related', color: '#3b82f6', description: 'Staff allowances, tea/canteen' },
  { name: 'Travel & Conveyance', color: '#84cc16', description: 'Local conveyance, market visits' },
  { name: 'Fuel & Petrol', color: '#ef4444', description: 'Vehicles, diesel for generators' },
  { name: 'Professional & CA Fees', color: '#a855f7', description: 'Accounting, auditing, legal advisory' },
  { name: 'Bank Charges & Interest', color: '#d97706', description: 'Statement charges, cheque fees' },
  { name: 'Insurance', color: '#059669', description: 'Stock insurance, machine insurance' },
  { name: 'Advertisement & Marketing', color: '#f43f5e', description: 'Trade directory, sample distribution' },
  { name: 'Other Expenses', color: '#475569', description: 'Miscellaneous operational costs' },
];

function mapCategory(row: ExpenseCategoryRow): ExpenseCategory {
  return {
    id: row.id,
    company_id: row.company_id,
    name: row.name,
    description: row.description,
    color: row.color,
    is_system: row.is_system,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function getExpenseCategories(companyId: string): Promise<ExpenseCategory[]> {
  const { data, error } = await supabase()
    .from('expense_categories')
    .select('*')
    .eq('company_id', companyId)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching expense categories:', error);
    throw error;
  }

  if (!data || data.length === 0) {
    // Auto-seed default categories for company
    return await seedDefaultCategories(companyId);
  }

  return data.map(mapCategory);
}

export async function seedDefaultCategories(companyId: string): Promise<ExpenseCategory[]> {
  const toInsert = DEFAULT_EXPENSE_CATEGORIES.map((c) => ({
    company_id: companyId,
    name: c.name,
    color: c.color,
    description: c.description,
    is_system: true,
  }));

  const { data, error } = await supabase()
    .from('expense_categories')
    .upsert(toInsert, { onConflict: 'company_id, name' })
    .select();

  if (error) {
    console.error('Error seeding categories:', error);
    return [];
  }
  return (data || []).map(mapCategory);
}

export async function createExpenseCategory(
  companyId: string,
  category: { name: string; color?: string; description?: string }
): Promise<ExpenseCategory> {
  const { data, error } = await supabase()
    .from('expense_categories')
    .insert({
      company_id: companyId,
      name: category.name.trim(),
      color: category.color || '#64748b',
      description: category.description?.trim() || null,
      is_system: false,
    })
    .select()
    .single();

  if (error) throw error;
  return mapCategory(data);
}

export async function deleteExpenseCategory(companyId: string, id: string): Promise<void> {
  const { error } = await supabase()
    .from('expense_categories')
    .delete()
    .eq('company_id', companyId)
    .eq('id', id);

  if (error) throw error;
}
