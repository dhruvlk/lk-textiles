import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database';
import {
  buildPaginatedResult,
  paginatedRange,
} from '@/lib/table/pagination';
import type {
  PaginatedResult,
  PaginationParams,
  SalarySlip,
  SalarySlipFilters,
} from '@/types';

type SalarySlipInsert = Database['public']['Tables']['salary_slips']['Insert'];
type SalarySlipUpdate = Database['public']['Tables']['salary_slips']['Update'];

const supabase = () => createClient();

const SALARY_SLIP_SELECT = `*`;

function mapSalarySlip(row: Record<string, unknown>): SalarySlip {
  return {
    id: row.id as string,
    company_id: row.company_id as string,
    employee_id: (row.employee_id as string) || null,
    employee_name: (row.employee_name as string) || '',
    employee_code: (row.employee_code as string) || null,
    designation: (row.designation as string) || null,
    department: (row.department as string) || null,
    joining_date: (row.joining_date as string) || null,
    bank_name: (row.bank_name as string) || null,
    bank_account_number: (row.bank_account_number as string) || null,
    bank_ifsc: (row.bank_ifsc as string) || null,
    pan_number: (row.pan_number as string) || null,
    uan_number: (row.uan_number as string) || null,
    pf_number: (row.pf_number as string) || null,
    salary_slip_number: (row.salary_slip_number as string) || '',
    salary_month: (row.salary_month as string) || '',
    salary_year: Number(row.salary_year || new Date().getFullYear()),
    pay_date: (row.pay_date as string) || new Date().toISOString().split('T')[0],
    basic_salary: Number(row.basic_salary || 0),
    hra: Number(row.hra || 0),
    conveyance: Number(row.conveyance || 0),
    medical_allowance: Number(row.medical_allowance || 0),
    special_allowance: Number(row.special_allowance || 0),
    bonus: Number(row.bonus || 0),
    overtime: Number(row.overtime || 0),
    other_earnings: Number(row.other_earnings || 0),
    gross_earnings: Number(row.gross_earnings || 0),
    pf: Number(row.pf || 0),
    professional_tax: Number(row.professional_tax || 0),
    tds: Number(row.tds || 0),
    esic: Number(row.esic || 0),
    loan_deduction: Number(row.loan_deduction || 0),
    advance_deduction: Number(row.advance_deduction || 0),
    other_deduction: Number(row.other_deduction || 0),
    total_deductions: Number(row.total_deductions || 0),
    net_salary: Number(row.net_salary || 0),
    amount_in_words: (row.amount_in_words as string) || null,
    notes: (row.notes as string) || null,
    payment_status: (row.payment_status as SalarySlip['payment_status']) || 'Pending',
    payment_mode: (row.payment_mode as string) || null,
    payment_date: (row.payment_date as string) || null,
    created_by: (row.created_by as string) || null,
    created_at: (row.created_at as string) || new Date().toISOString(),
    updated_at: (row.updated_at as string) || new Date().toISOString(),
  };
}

export async function generateSalarySlipNumber(
  companyId: string,
  month?: string,
  year?: number
): Promise<string> {
  const { data, error } = await supabase().rpc('generate_salary_slip_number', {
    p_company_id: companyId,
    p_month: month ?? null,
    p_year: year ?? null,
  });

  if (error) {
    console.error('Error generating salary slip number via RPC:', error);
    // Fallback if RPC is pending migration
    const timestamp = Date.now().toString().slice(-4);
    const m = month ? String(month).slice(0, 3).toUpperCase() : 'SAL';
    const y = year ?? new Date().getFullYear();
    return `SAL-${y}-${m}-${timestamp}`;
  }

  return data ?? `SAL-${Date.now()}`;
}

export async function getSalarySlipsPaginated(
  companyId: string,
  filters: SalarySlipFilters = {},
  { page = 1, pageSize = 50 }: PaginationParams = {}
): Promise<PaginatedResult<SalarySlip>> {
  const { from, to } = paginatedRange(page, pageSize);

  let query = supabase()
    .from('salary_slips')
    .select(SALARY_SLIP_SELECT, { count: 'exact' })
    .eq('company_id', companyId);

  if (filters.search?.trim()) {
    const s = filters.search.trim();
    query = query.or(
      `salary_slip_number.ilike.%${s}%,employee_name.ilike.%${s}%,employee_code.ilike.%${s}%`
    );
  }

  if (filters.employeeId?.trim()) {
    query = query.eq('employee_id', filters.employeeId.trim());
  }

  if (filters.salaryMonth && filters.salaryMonth !== 'all') {
    query = query.eq('salary_month', filters.salaryMonth);
  }

  if (filters.salaryYear && filters.salaryYear !== 'all') {
    query = query.eq('salary_year', Number(filters.salaryYear));
  }

  if (filters.paymentStatus) {
    query = query.eq('payment_status', filters.paymentStatus);
  }

  if (filters.sort?.column) {
    query = query.order(filters.sort.column, {
      ascending: filters.sort.direction === 'asc',
    });
  } else {
    query = query
      .order('pay_date', { ascending: false })
      .order('created_at', { ascending: false });
  }

  query = query.range(from, to);

  const { data, error, count } = await query;
  if (error) throw error;

  return buildPaginatedResult(
    (data ?? []).map(mapSalarySlip),
    count ?? 0,
    page,
    pageSize
  );
}

export async function getSalarySlipById(id: string): Promise<SalarySlip | null> {
  const { data, error } = await supabase()
    .from('salary_slips')
    .select(SALARY_SLIP_SELECT)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return mapSalarySlip(data);
}

export async function createSalarySlip(
  payload: Omit<SalarySlip, 'id' | 'created_at' | 'updated_at'>,
  userId?: string
): Promise<SalarySlip> {
  // Validate/Recalculate totals on backend/service
  const gross_earnings =
    Number(payload.basic_salary || 0) +
    Number(payload.hra || 0) +
    Number(payload.conveyance || 0) +
    Number(payload.medical_allowance || 0) +
    Number(payload.special_allowance || 0) +
    Number(payload.bonus || 0) +
    Number(payload.overtime || 0) +
    Number(payload.other_earnings || 0);

  const total_deductions =
    Number(payload.pf || 0) +
    Number(payload.professional_tax || 0) +
    Number(payload.tds || 0) +
    Number(payload.esic || 0) +
    Number(payload.loan_deduction || 0) +
    Number(payload.advance_deduction || 0) +
    Number(payload.other_deduction || 0);

  const net_salary = Math.max(0, gross_earnings - total_deductions);

  const insertData: SalarySlipInsert = {
    ...payload,
    gross_earnings,
    total_deductions,
    net_salary,
    created_by: userId ?? null,
  };

  const { data, error } = await supabase()
    .from('salary_slips')
    .insert(insertData)
    .select()
    .single();

  if (error) throw error;
  return mapSalarySlip(data);
}

export async function updateSalarySlip(
  payload: Partial<SalarySlip> & { id: string }
): Promise<SalarySlip> {
  const { id, ...updates } = payload;

  if (
    updates.basic_salary !== undefined ||
    updates.hra !== undefined ||
    updates.conveyance !== undefined ||
    updates.medical_allowance !== undefined ||
    updates.special_allowance !== undefined ||
    updates.bonus !== undefined ||
    updates.overtime !== undefined ||
    updates.other_earnings !== undefined ||
    updates.pf !== undefined ||
    updates.professional_tax !== undefined ||
    updates.tds !== undefined ||
    updates.esic !== undefined ||
    updates.loan_deduction !== undefined ||
    updates.advance_deduction !== undefined ||
    updates.other_deduction !== undefined
  ) {
    const gross_earnings =
      Number(updates.basic_salary || 0) +
      Number(updates.hra || 0) +
      Number(updates.conveyance || 0) +
      Number(updates.medical_allowance || 0) +
      Number(updates.special_allowance || 0) +
      Number(updates.bonus || 0) +
      Number(updates.overtime || 0) +
      Number(updates.other_earnings || 0);

    const total_deductions =
      Number(updates.pf || 0) +
      Number(updates.professional_tax || 0) +
      Number(updates.tds || 0) +
      Number(updates.esic || 0) +
      Number(updates.loan_deduction || 0) +
      Number(updates.advance_deduction || 0) +
      Number(updates.other_deduction || 0);

    updates.gross_earnings = gross_earnings;
    updates.total_deductions = total_deductions;
    updates.net_salary = Math.max(0, gross_earnings - total_deductions);
  }

  const { data, error } = await supabase()
    .from('salary_slips')
    .update(updates as SalarySlipUpdate)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return mapSalarySlip(data);
}

export async function deleteSalarySlip(id: string): Promise<void> {
  const { error } = await supabase().from('salary_slips').delete().eq('id', id);
  if (error) throw error;
}

const MONTH_INDEX: Record<string, number> = {
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12,
};

export async function getSalarySlipsByEmployee(
  companyId: string,
  employeeId: string,
  limit?: number
): Promise<SalarySlip[]> {
  let query = supabase()
    .from('salary_slips')
    .select(SALARY_SLIP_SELECT)
    .eq('company_id', companyId)
    .eq('employee_id', employeeId)
    .order('salary_year', { ascending: false })
    .order('pay_date', { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;
  if (error) throw error;

  const slips = (data ?? []).map(mapSalarySlip);

  // Sort chronologically (ascending) for history display
  return slips.sort((a, b) => {
    if (a.salary_year !== b.salary_year) {
      return a.salary_year - b.salary_year;
    }
    const mA = MONTH_INDEX[a.salary_month.toLowerCase()] || 0;
    const mB = MONTH_INDEX[b.salary_month.toLowerCase()] || 0;
    return mA - mB;
  });
}

export async function getSalarySlipsForMonths(
  companyId: string,
  employeeId: string,
  months: { month: string; year: number }[]
): Promise<SalarySlip[]> {
  if (months.length === 0) return [];

  const { data, error } = await supabase()
    .from('salary_slips')
    .select(SALARY_SLIP_SELECT)
    .eq('company_id', companyId)
    .eq('employee_id', employeeId);

  if (error) throw error;

  const allSlips = (data ?? []).map(mapSalarySlip);

  // Filter to matching months
  const matched = allSlips.filter((slip) =>
    months.some(
      (m) =>
        m.month.toLowerCase() === slip.salary_month.toLowerCase() &&
        m.year === slip.salary_year
    )
  );

  return matched.sort((a, b) => {
    if (a.salary_year !== b.salary_year) {
      return a.salary_year - b.salary_year;
    }
    const mA = MONTH_INDEX[a.salary_month.toLowerCase()] || 0;
    const mB = MONTH_INDEX[b.salary_month.toLowerCase()] || 0;
    return mA - mB;
  });
}

export async function checkSalarySlipExists(
  companyId: string,
  employeeId: string,
  month: string,
  year: number,
  excludeId?: string
): Promise<SalarySlip | null> {
  let query = supabase()
    .from('salary_slips')
    .select(SALARY_SLIP_SELECT)
    .eq('company_id', companyId)
    .eq('employee_id', employeeId)
    .eq('salary_month', month)
    .eq('salary_year', year);

  if (excludeId) {
    query = query.neq('id', excludeId);
  }

  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data ? mapSalarySlip(data) : null;
}

