import {
  emptyPermissionMatrix,
  fullPermissionMatrix,
  MODULE_CONFIG,
  type PermissionAction,
  type PermissionModule,
} from '@/constants/permissions';
import type { PermissionFlags, PermissionMatrix } from '@/types/permissions';

const OWNER_ONLY_MODULES = new Set(
  MODULE_CONFIG.filter((m) => m.ownerOnly).map((m) => m.module)
);

export function actionToFlag(action: PermissionAction): keyof PermissionFlags {
  switch (action) {
    case 'view':
      return 'can_view';
    case 'create':
      return 'can_create';
    case 'edit':
      return 'can_edit';
    case 'delete':
      return 'can_delete';
    case 'export':
      return 'can_export';
  }
}

export function hasPermission(
  matrix: PermissionMatrix | null | undefined,
  module: PermissionModule,
  action: PermissionAction,
  options?: { isOwner?: boolean }
): boolean {
  if (OWNER_ONLY_MODULES.has(module) && !options?.isOwner) return false;
  if (options?.isOwner) return true;
  if (!matrix) return false;
  const flags = matrix[module];
  if (!flags) return false;
  return Boolean(flags[actionToFlag(action)]);
}

export function matrixFromRows(
  rows: Array<{
    module: string;
    can_view: boolean;
    can_create: boolean;
    can_edit: boolean;
    can_delete: boolean;
    can_export: boolean;
  }>
): PermissionMatrix {
  const matrix = emptyPermissionMatrix();
  for (const row of rows) {
    const mod = row.module as PermissionModule;
    if (!(mod in matrix)) continue;
    matrix[mod] = {
      can_view: row.can_view,
      can_create: row.can_create,
      can_edit: row.can_edit,
      can_delete: row.can_delete,
      can_export: row.can_export,
    };
  }
  return matrix;
}

export function ownerMatrix(): PermissionMatrix {
  return fullPermissionMatrix();
}

export function sanitizeEmployeeMatrix(matrix: PermissionMatrix): PermissionMatrix {
  const next = emptyPermissionMatrix();
  for (const mod of Object.keys(next) as PermissionModule[]) {
    const flags = matrix[mod] ?? next[mod];
    next[mod] = {
      can_view: Boolean(flags.can_view),
      can_create: Boolean(flags.can_create),
      can_edit: Boolean(flags.can_edit),
      can_delete: Boolean(flags.can_delete),
      can_export: Boolean(flags.can_export),
    };
    // Owner-only modules cannot be granted to employees
    if (OWNER_ONLY_MODULES.has(mod)) {
      next[mod] = {
        can_view: false,
        can_create: false,
        can_edit: false,
        can_delete: false,
        can_export: false,
      };
    }
  }
  return next;
}

export function matrixToRows(
  companyId: string,
  userId: string,
  matrix: PermissionMatrix
): Array<{
  company_id: string;
  user_id: string;
  module: PermissionModule;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_export: boolean;
}> {
  const sanitized = sanitizeEmployeeMatrix(matrix);
  return (Object.keys(sanitized) as PermissionModule[])
    .filter((module) => !OWNER_ONLY_MODULES.has(module))
    .map((module) => ({
      company_id: companyId,
      user_id: userId,
      module,
      ...sanitized[module],
    }));
}
