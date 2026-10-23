import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { matrixToRows, sanitizeEmployeeMatrix } from '@/lib/permissions';
import type { PermissionMatrix } from '@/types/permissions';

export async function assertCompanyOwner(companyId: string) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false as const, status: 401, error: 'Unauthorized', user: null };
  }

  const { data: membership, error } = await supabase
    .from('company_members')
    .select('id, role, is_active')
    .eq('company_id', companyId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    return { ok: false as const, status: 500, error: error.message, user: null };
  }

  const isMembershipOwner =
    Boolean(membership) && membership!.is_active && membership!.role === 'Owner';

  // Fallback for legacy companies created before company_members existed:
  // company.user_id is the registering owner. Only applies when the caller has
  // NO membership row for this company — a Staff/Admin member must never be
  // promoted to owner just because companies.user_id matches.
  if (!isMembershipOwner && membership) {
    return {
      ok: false as const,
      status: 403,
      error: 'Only the company owner can manage employees',
      user: null,
    };
  }

  if (!isMembershipOwner) {
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, user_id')
      .eq('id', companyId)
      .maybeSingle();

    if (companyError) {
      return { ok: false as const, status: 500, error: companyError.message, user: null };
    }

    if (!company || company.user_id !== user.id) {
      return {
        ok: false as const,
        status: 403,
        error: 'Only the company owner can manage employees',
        user: null,
      };
    }
  }

  return { ok: true as const, user, membership: membership ?? null };
}

export async function writeEmployeePermissions(
  companyId: string,
  userId: string,
  matrix: PermissionMatrix
) {
  const admin = createAdminClient();
  const rows = matrixToRows(companyId, userId, sanitizeEmployeeMatrix(matrix));

  const { error: deleteError } = await admin
    .from('employee_permissions')
    .delete()
    .eq('company_id', companyId)
    .eq('user_id', userId);

  if (deleteError) {
    throw new Error(`Failed to clear permissions: ${deleteError.message}`);
  }

  if (rows.length === 0) return;

  const { error: insertError } = await admin.from('employee_permissions').insert(rows);
  if (insertError) {
    throw new Error(`Failed to save permissions: ${insertError.message}`);
  }
}

export async function writeAuditLog(input: {
  companyId: string;
  userId: string;
  employeeName?: string | null;
  action: string;
  module?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  try {
    const admin = createAdminClient();
    const { error } = await admin.from('audit_logs').insert({
      company_id: input.companyId,
      user_id: input.userId,
      employee_name: input.employeeName ?? null,
      action: input.action,
      module: input.module ?? 'employees',
      entity_type: input.entityType ?? 'employee',
      entity_id: input.entityId ?? null,
      metadata: (input.metadata ?? {}) as never,
      ip_address: null,
    });
    if (error) {
      console.error('[audit_logs]', error.message);
    }
  } catch (error) {
    console.error('[audit_logs]', error);
  }
}

export async function rollbackEmployeeUser(userId: string) {
  try {
    const admin = createAdminClient();
    await admin.from('employee_permissions').delete().eq('user_id', userId);
    await admin.from('company_members').delete().eq('user_id', userId);
    await admin.from('profiles').delete().eq('id', userId);
    await admin.auth.admin.deleteUser(userId);
  } catch (error) {
    console.error('[rollbackEmployeeUser]', error);
  }
}

/**
 * True when the user belongs to any company other than `companyId`.
 * Used to stop the owner of one company from changing the credentials or
 * profile of a user whose account is also used in another tenant.
 */
export async function userHasOtherCompanyMemberships(
  userId: string,
  companyId: string
): Promise<boolean> {
  const admin = createAdminClient();
  const { count, error } = await admin
    .from('company_members')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .neq('company_id', companyId);
  if (error) {
    // Fail closed: treat lookup errors as "shared account".
    console.error('[userHasOtherCompanyMemberships]', error.message);
    return true;
  }
  return (count ?? 0) > 0;
}
