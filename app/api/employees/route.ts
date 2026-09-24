import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  assertCompanyOwner,
  rollbackEmployeeUser,
  writeAuditLog,
  writeEmployeePermissions,
} from '@/lib/employees-api';
import { emptyPermissionMatrix } from '@/constants/permissions';
import { sanitizeEmployeeMatrix } from '@/lib/permissions';
import { isValidIndianMobile, formatPhoneToStorage } from '@/lib/validations/phone';
import type { PermissionMatrix } from '@/types/permissions';
import type { CompanyMemberRow } from '@/types/database';

type CreateBody = {
  companyId: string;
  fullName: string;
  email: string;
  mobile?: string | null;
  password?: string;
  sendInvite?: boolean;
  designation?: string | null;
  isActive?: boolean;
  permissions?: PermissionMatrix;
  employeeCode?: string | null;
  department?: string | null;
  joiningDate?: string | null;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  bankIfsc?: string | null;
  panNumber?: string | null;
  uanNumber?: string | null;
  pfNumber?: string | null;
};

type UpdateBody = {
  companyId: string;
  membershipId: string;
  userId: string;
  fullName?: string;
  mobile?: string | null;
  designation?: string | null;
  isActive?: boolean;
  password?: string;
  permissions?: PermissionMatrix;
  statusOnly?: boolean;
  employeeCode?: string | null;
  department?: string | null;
  joiningDate?: string | null;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  bankIfsc?: string | null;
  panNumber?: string | null;
  uanNumber?: string | null;
  pfNumber?: string | null;
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function apiError(error: string, status: number, details?: unknown) {
  console.error('[api/employees]', status, error, details ?? '');
  return NextResponse.json(
    details ? { error, details } : { error },
    { status }
  );
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId')?.trim();
    const search = searchParams.get('search')?.trim().toLowerCase() ?? '';
    const status = (searchParams.get('status') || 'all') as 'all' | 'active' | 'inactive';
    const page = Math.max(1, Number(searchParams.get('page') || 1));
    const pageSize = Math.min(50, Math.max(1, Number(searchParams.get('pageSize') || 10)));

    if (!companyId) {
      return apiError('companyId is required', 400);
    }

    const gate = await assertCompanyOwner(companyId);
    if (!gate.ok) {
      return apiError(gate.error, gate.status);
    }

    const admin = createAdminClient();

    let query = admin
      .from('company_members')
      .select('*', { count: 'exact' })
      .eq('company_id', companyId)
      .neq('role', 'Owner')
      .order('created_at', { ascending: false });

    if (status === 'active') query = query.eq('is_active', true);
    if (status === 'inactive') query = query.eq('is_active', false);

    const { data: members, error: membersError, count } = await query;
    if (membersError) {
      return apiError(membersError.message, 400, membersError);
    }

    const rows = members ?? [];
    if (rows.length === 0) {
      return NextResponse.json({ data: [], total: 0 });
    }

    const userIds = rows.map((row) => row.user_id);
    const [{ data: profiles }, { data: permissionRows }, authUsers] = await Promise.all([
      admin.from('profiles').select('id, full_name, email, mobile, avatar_url').in('id', userIds),
      admin
        .from('employee_permissions')
        .select('user_id, module, can_view, can_create, can_edit, can_delete, can_export')
        .eq('company_id', companyId)
        .in('user_id', userIds),
      admin.auth.admin.listUsers({ perPage: 1000 }),
    ]);

    const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
    const authEmailMap = new Map(
      (authUsers.data?.users ?? []).map((u) => [u.id, u.email ?? ''])
    );

    const permissionsByUser = new Map<string, typeof permissionRows>();
    for (const row of permissionRows ?? []) {
      const list = permissionsByUser.get(row.user_id) ?? [];
      list.push(row);
      permissionsByUser.set(row.user_id, list);
    }

    let employees = rows.map((row) => {
      const profile = profileMap.get(row.user_id);
      return {
        membership_id: row.id,
        user_id: row.user_id,
        company_id: row.company_id,
        role: row.role,
        designation: row.designation,
        is_active: row.is_active,
        invited_by: row.invited_by,
        created_at: row.created_at,
        updated_at: row.updated_at,
        full_name: profile?.full_name ?? 'Employee',
        email: profile?.email || authEmailMap.get(row.user_id) || '',
        mobile: profile?.mobile ?? null,
        avatar_url: profile?.avatar_url ?? null,
        employee_code: row.employee_code ?? null,
        department: row.department ?? null,
        joining_date: row.joining_date ?? null,
        bank_name: row.bank_name ?? null,
        bank_account_number: row.bank_account_number ?? null,
        bank_ifsc: row.bank_ifsc ?? null,
        pan_number: row.pan_number ?? null,
        uan_number: row.uan_number ?? null,
        pf_number: row.pf_number ?? null,
        permissions: permissionsByUser.get(row.user_id) ?? [],
      };
    });

    if (search) {
      employees = employees.filter((employee) => {
        return (
          employee.full_name.toLowerCase().includes(search) ||
          employee.email.toLowerCase().includes(search) ||
          (employee.mobile ?? '').toLowerCase().includes(search) ||
          (employee.designation ?? '').toLowerCase().includes(search)
        );
      });
    }

    const total = employees.length;
    const from = (page - 1) * pageSize;
    const data = employees.slice(from, from + pageSize);

    return NextResponse.json({ data, total, page, pageSize, count: count ?? total });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to list employees';
    return apiError(message, 500);
  }
}

export async function POST(request: Request) {
  let createdUserId: string | null = null;

  try {
    const body = (await request.json()) as CreateBody;
    const companyId = body.companyId?.trim();
    const fullName = body.fullName?.trim();
    const email = body.email?.trim().toLowerCase();
    const rawMobile = body.mobile?.trim() || null;
    if (rawMobile && !isValidIndianMobile(rawMobile)) {
      return apiError('Mobile number must be exactly 10 digits with +91', 400);
    }
    const mobile = formatPhoneToStorage(rawMobile);
    const designation = body.designation?.trim() || null;
    const password = body.password?.trim();
    const sendInvite = Boolean(body.sendInvite);
    const isActive = body.isActive !== false;
    const permissions = sanitizeEmployeeMatrix(
      body.permissions ?? emptyPermissionMatrix()
    );

    if (!companyId || !fullName || !email) {
      return apiError('Full name, email, and company are required', 400);
    }
    if (!isValidEmail(email)) {
      return apiError('Invalid email address', 400);
    }
    if (!sendInvite && (!password || password.length < 6)) {
      return apiError(
        'Password must be at least 6 characters, or choose Send Invite',
        400
      );
    }

    const gate = await assertCompanyOwner(companyId);
    if (!gate.ok) {
      return apiError(gate.error, gate.status);
    }

    let admin;
    try {
      admin = createAdminClient();
    } catch (error) {
      return apiError(
        error instanceof Error
          ? error.message
          : 'Server is missing SUPABASE_SERVICE_ROLE_KEY',
        500
      );
    }

    if (sendInvite && !password) {
      const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
        data: {
          name: fullName,
          mobile,
          designation,
        },
      });
      if (error || !data.user) {
        return apiError(error?.message || 'Failed to send invite', 400, error);
      }
      createdUserId = data.user.id;
    } else {
      const { data, error } = await admin.auth.admin.createUser({
        email,
        password: password!,
        email_confirm: true,
        user_metadata: {
          name: fullName,
          mobile,
          designation,
        },
      });
      if (error || !data.user) {
        return apiError(error?.message || 'Failed to create auth user', 400, error);
      }
      createdUserId = data.user.id;
    }

    const userId = createdUserId;

    const { error: profileError } = await admin.from('profiles').upsert({
      id: userId,
      full_name: fullName,
      mobile,
      email,
      avatar_url: null,
    });
    if (profileError) {
      await rollbackEmployeeUser(userId);
      return apiError(`Failed to save profile: ${profileError.message}`, 400, profileError);
    }

    const { data: membership, error: memberError } = await admin
      .from('company_members')
      .insert({
        company_id: companyId,
        user_id: userId,
        role: 'Staff',
        is_active: isActive,
        designation,
        invited_by: gate.user!.id,
        employee_code: body.employeeCode?.trim() || null,
        department: body.department?.trim() || null,
        joining_date: body.joiningDate?.trim() || null,
        bank_name: body.bankName?.trim() || null,
        bank_account_number: body.bankAccountNumber?.trim() || null,
        bank_ifsc: body.bankIfsc?.trim() || null,
        pan_number: body.panNumber?.trim() || null,
        uan_number: body.uanNumber?.trim() || null,
        pf_number: body.pfNumber?.trim() || null,
      })
      .select('id')
      .single();

    if (memberError || !membership) {
      await rollbackEmployeeUser(userId);
      return apiError(
        memberError?.message || 'Failed to add company member',
        400,
        memberError
      );
    }

    try {
      await writeEmployeePermissions(companyId, userId, permissions);
    } catch (error) {
      await rollbackEmployeeUser(userId);
      return apiError(
        error instanceof Error ? error.message : 'Failed to save permissions',
        400
      );
    }

    await writeAuditLog({
      companyId,
      userId: gate.user!.id,
      employeeName: fullName,
      action: 'Created Employee',
      entityId: userId,
      metadata: { email, designation, sendInvite },
    });

    return NextResponse.json({
      ok: true,
      userId,
      membershipId: membership.id,
    });
  } catch (error) {
    if (createdUserId) {
      await rollbackEmployeeUser(createdUserId);
    }
    const message =
      error instanceof Error ? error.message : 'Failed to create employee';
    return apiError(message, 500);
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as UpdateBody;
    const companyId = body.companyId?.trim();
    const membershipId = body.membershipId?.trim();
    const userId = body.userId?.trim();

    if (!companyId || !membershipId || !userId) {
      return apiError('Missing employee identifiers', 400);
    }

    const gate = await assertCompanyOwner(companyId);
    if (!gate.ok) {
      return apiError(gate.error, gate.status);
    }

    const admin = createAdminClient();

    const { data: membership, error: membershipError } = await admin
      .from('company_members')
      .select('id, role, user_id')
      .eq('id', membershipId)
      .eq('company_id', companyId)
      .eq('user_id', userId)
      .maybeSingle();

    if (membershipError) {
      return apiError(membershipError.message, 400, membershipError);
    }
    if (!membership) {
      return apiError('Employee not found', 404);
    }
    if (membership.role === 'Owner') {
      return apiError('Cannot modify the company owner through employees', 400);
    }

    if (body.statusOnly) {
      const { error } = await admin
        .from('company_members')
        .update({ is_active: Boolean(body.isActive) })
        .eq('id', membershipId);
      if (error) {
        return apiError(error.message, 400, error);
      }
      await writeAuditLog({
        companyId,
        userId: gate.user!.id,
        action: body.isActive ? 'Activated Employee' : 'Deactivated Employee',
        entityId: userId,
      });
      return NextResponse.json({ ok: true });
    }

    const fullName = body.fullName?.trim();
    let mobile: string | null | undefined = undefined;
    if (body.mobile !== undefined) {
      const rawMobile = body.mobile?.trim() || null;
      if (rawMobile && !isValidIndianMobile(rawMobile)) {
        return apiError('Mobile number must be exactly 10 digits with +91', 400);
      }
      mobile = formatPhoneToStorage(rawMobile);
    }
    const designation =
      body.designation === undefined ? undefined : body.designation?.trim() || null;

    if (fullName || mobile !== undefined) {
      const profilePatch: {
        full_name?: string;
        mobile?: string | null;
      } = {};
      if (fullName) profilePatch.full_name = fullName;
      if (mobile !== undefined) profilePatch.mobile = mobile;
      const { error: profileError } = await admin
        .from('profiles')
        .update(profilePatch)
        .eq('id', userId);
      if (profileError) {
        return apiError(profileError.message, 400, profileError);
      }
    }

    const memberPatch: Partial<CompanyMemberRow> = {};
    if (designation !== undefined) memberPatch.designation = designation;
    if (body.isActive !== undefined) memberPatch.is_active = Boolean(body.isActive);
    if (body.employeeCode !== undefined) memberPatch.employee_code = body.employeeCode?.trim() || null;
    if (body.department !== undefined) memberPatch.department = body.department?.trim() || null;
    if (body.joiningDate !== undefined) memberPatch.joining_date = body.joiningDate?.trim() || null;
    if (body.bankName !== undefined) memberPatch.bank_name = body.bankName?.trim() || null;
    if (body.bankAccountNumber !== undefined) memberPatch.bank_account_number = body.bankAccountNumber?.trim() || null;
    if (body.bankIfsc !== undefined) memberPatch.bank_ifsc = body.bankIfsc?.trim() || null;
    if (body.panNumber !== undefined) memberPatch.pan_number = body.panNumber?.trim() || null;
    if (body.uanNumber !== undefined) memberPatch.uan_number = body.uanNumber?.trim() || null;
    if (body.pfNumber !== undefined) memberPatch.pf_number = body.pfNumber?.trim() || null;

    if (Object.keys(memberPatch).length > 0) {
      const { error: memberError } = await admin
        .from('company_members')
        .update(memberPatch)
        .eq('id', membershipId);
      if (memberError) {
        return apiError(memberError.message, 400, memberError);
      }
    }

    if (body.password?.trim()) {
      if (body.password.trim().length < 6) {
        return apiError('Password must be at least 6 characters', 400);
      }
      const { error: passwordError } = await admin.auth.admin.updateUserById(userId, {
        password: body.password.trim(),
      });
      if (passwordError) {
        return apiError(passwordError.message, 400, passwordError);
      }
    }

    if (body.permissions) {
      await writeEmployeePermissions(
        companyId,
        userId,
        sanitizeEmployeeMatrix(body.permissions)
      );
    }

    await writeAuditLog({
      companyId,
      userId: gate.user!.id,
      employeeName: fullName,
      action: 'Updated Employee',
      entityId: userId,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to update employee';
    return apiError(message, 500);
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId')?.trim();
    const membershipId = searchParams.get('membershipId')?.trim();
    const userId = searchParams.get('userId')?.trim();

    if (!companyId || !membershipId || !userId) {
      return apiError('Missing employee identifiers', 400);
    }

    const gate = await assertCompanyOwner(companyId);
    if (!gate.ok) {
      return apiError(gate.error, gate.status);
    }

    const admin = createAdminClient();
    const { data: membership } = await admin
      .from('company_members')
      .select('id, role')
      .eq('id', membershipId)
      .eq('company_id', companyId)
      .eq('user_id', userId)
      .maybeSingle();

    if (!membership) {
      return apiError('Employee not found', 404);
    }
    if (membership.role === 'Owner') {
      return apiError('Cannot remove the company owner', 400);
    }

    await admin
      .from('employee_permissions')
      .delete()
      .eq('company_id', companyId)
      .eq('user_id', userId);

    const { error: memberError } = await admin
      .from('company_members')
      .delete()
      .eq('id', membershipId);

    if (memberError) {
      return apiError(memberError.message, 400, memberError);
    }

    await writeAuditLog({
      companyId,
      userId: gate.user!.id,
      action: 'Removed Employee',
      entityId: userId,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to remove employee';
    return apiError(message, 500);
  }
}
