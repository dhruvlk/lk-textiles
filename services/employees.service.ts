import {
  DEFAULT_EMPLOYEE_PERMISSIONS,
  emptyPermissionMatrix,
} from '@/constants/permissions';
import { matrixFromRows } from '@/lib/permissions';
import type { Employee } from '@/types/permissions';

type ListEmployeeRow = {
  membership_id: string;
  user_id: string;
  company_id: string;
  role: string;
  designation: string | null;
  is_active: boolean;
  invited_by: string | null;
  created_at: string;
  updated_at: string;
  full_name: string;
  email: string;
  mobile: string | null;
  avatar_url: string | null;
  permissions: Array<{
    user_id?: string;
    module: string;
    can_view: boolean;
    can_create: boolean;
    can_edit: boolean;
    can_delete: boolean;
    can_export: boolean;
  }>;
};

async function parseApiError(response: Response) {
  const data = await response.json().catch(() => ({} as { error?: string }));
  return data.error || `Request failed (${response.status})`;
}

function mapEmployee(row: ListEmployeeRow): Employee {
  return {
    membership_id: row.membership_id,
    user_id: row.user_id,
    company_id: row.company_id,
    role: row.role,
    designation: row.designation,
    is_active: row.is_active,
    invited_by: row.invited_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
    full_name: row.full_name,
    email: row.email,
    mobile: row.mobile,
    avatar_url: row.avatar_url,
    permissions: row.permissions?.length
      ? matrixFromRows(row.permissions)
      : emptyPermissionMatrix(),
  };
}

export async function getEmployeesPaginated(
  companyId: string,
  search = '',
  options?: { page?: number; pageSize?: number; status?: 'all' | 'active' | 'inactive' }
): Promise<{ data: Employee[]; total: number }> {
  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? 10;
  const status = options?.status ?? 'all';

  const params = new URLSearchParams({
    companyId,
    page: String(page),
    pageSize: String(pageSize),
    status,
  });
  if (search.trim()) params.set('search', search.trim());

  params.set('t', Date.now().toString());

  const response = await fetch(`/api/employees?${params.toString()}`, {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
    },
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  const payload = (await response.json()) as {
    data: ListEmployeeRow[];
    total: number;
  };

  return {
    data: (payload.data ?? []).map(mapEmployee),
    total: payload.total ?? 0,
  };
}

export async function getEmployeeByMembershipId(
  companyId: string,
  membershipId: string
): Promise<Employee | null> {
  const { data } = await getEmployeesPaginated(companyId, '', {
    page: 1,
    pageSize: 100,
    status: 'all',
  });
  return data.find((employee) => employee.membership_id === membershipId) ?? null;
}

export async function createEmployeeRequest(payload: unknown) {
  const response = await fetch('/api/employees', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Failed to create employee');
  }
  return data;
}

export async function updateEmployeeRequest(payload: unknown) {
  const response = await fetch('/api/employees', {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Failed to update employee');
  }
  return data;
}

export async function setEmployeeStatusRequest(input: {
  companyId: string;
  membershipId: string;
  userId: string;
  isActive: boolean;
}) {
  return updateEmployeeRequest({
    companyId: input.companyId,
    membershipId: input.membershipId,
    userId: input.userId,
    isActive: input.isActive,
    statusOnly: true,
  });
}

export { DEFAULT_EMPLOYEE_PERMISSIONS };
