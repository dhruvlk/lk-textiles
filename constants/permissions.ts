export const PERMISSION_MODULES = [
  'dashboard',
  'companies',
  'customers',
  'delivery_challans',
  'invoices',
  'stock',
  'reports',
  'employees',
  'settings',
  'products',
  'letter_pads',
] as const;

export type PermissionModule = (typeof PERMISSION_MODULES)[number];

export const PERMISSION_ACTIONS = [
  'view',
  'create',
  'edit',
  'delete',
  'export',
] as const;

export type PermissionAction = (typeof PERMISSION_ACTIONS)[number];

export type ModuleActionConfig = {
  key: PermissionAction;
  label: string;
};

export type ModuleConfig = {
  module: PermissionModule;
  label: string;
  description: string;
  actions: ModuleActionConfig[];
  /** When true, only Company Owners may access (not grantable to employees). */
  ownerOnly?: boolean;
};

const CRUD: ModuleActionConfig[] = [
  { key: 'view', label: 'View' },
  { key: 'create', label: 'Create' },
  { key: 'edit', label: 'Edit' },
  { key: 'delete', label: 'Delete' },
];

export const MODULE_CONFIG: ModuleConfig[] = [
  {
    module: 'dashboard',
    label: 'Dashboard',
    description: 'Overview and KPIs',
    actions: [{ key: 'view', label: 'View' }],
  },
  {
    module: 'companies',
    label: 'Companies',
    description: 'Company profiles and details',
    actions: CRUD,
  },
  {
    module: 'customers',
    label: 'Customers',
    description: 'Customer directory',
    actions: CRUD,
  },
  {
    module: 'delivery_challans',
    label: 'Delivery Challans',
    description: 'Dispatch and delivery notes',
    actions: CRUD,
  },
  {
    module: 'invoices',
    label: 'Invoices',
    description: 'Billing and invoices',
    actions: CRUD,
  },
  {
    module: 'stock',
    label: 'Stock',
    description: 'Quality-wise stock ledger',
    actions: CRUD,
  },
  {
    module: 'reports',
    label: 'Reports',
    description: 'Analytics and exports',
    actions: [
      { key: 'view', label: 'View' },
      { key: 'export', label: 'Export' },
    ],
  },
  {
    module: 'employees',
    label: 'Employee Management',
    description: 'Staff accounts and permissions',
    actions: CRUD,
    ownerOnly: true,
  },
  {
    module: 'settings',
    label: 'Settings',
    description: 'Company settings and branding',
    actions: [
      { key: 'view', label: 'View' },
      { key: 'edit', label: 'Edit' },
    ],
    ownerOnly: true,
  },
  {
    module: 'products',
    label: 'Products',
    description: 'Product catalog',
    actions: CRUD,
  },
  {
    module: 'letter_pads',
    label: 'Letter Pads',
    description: 'Create and manage dynamic letters',
    actions: CRUD,
  },
];

/** Route prefix → permission module */
export const ROUTE_MODULE_MAP: { prefix: string; module: PermissionModule }[] = [
  { prefix: '/admin/employees', module: 'employees' },
  { prefix: '/admin/companies', module: 'companies' },
  { prefix: '/admin/parties', module: 'customers' },
  { prefix: '/admin/products', module: 'products' },
  { prefix: '/admin/stock', module: 'stock' },
  { prefix: '/admin/delivery-challans', module: 'delivery_challans' },
  { prefix: '/admin/invoices', module: 'invoices' },
  { prefix: '/admin/letter-pads', module: 'letter_pads' },
  { prefix: '/admin/reports', module: 'reports' },
  { prefix: '/admin/settings', module: 'settings' },
  { prefix: '/admin/notifications', module: 'dashboard' },
  { prefix: '/admin', module: 'dashboard' },
];

export function moduleFromPathname(pathname: string): PermissionModule | null {
  if (!pathname) return null;
  const match = ROUTE_MODULE_MAP.find((entry) => {
    if (entry.prefix === '/admin') return pathname === '/admin';
    return pathname === entry.prefix || pathname.startsWith(`${entry.prefix}/`);
  });
  return match?.module ?? null;
}

export function emptyPermissionMatrix(): Record<
  PermissionModule,
  {
    can_view: boolean;
    can_create: boolean;
    can_edit: boolean;
    can_delete: boolean;
    can_export: boolean;
  }
> {
  return Object.fromEntries(
    PERMISSION_MODULES.map((module) => [
      module,
      {
        can_view: false,
        can_create: false,
        can_edit: false,
        can_delete: false,
        can_export: false,
      },
    ])
  ) as Record<
    PermissionModule,
    {
      can_view: boolean;
      can_create: boolean;
      can_edit: boolean;
      can_delete: boolean;
      can_export: boolean;
    }
  >;
}

export function fullPermissionMatrix(): ReturnType<typeof emptyPermissionMatrix> {
  const matrix = emptyPermissionMatrix();
  for (const mod of PERMISSION_MODULES) {
    matrix[mod] = {
      can_view: true,
      can_create: true,
      can_edit: true,
      can_delete: true,
      can_export: true,
    };
  }
  return matrix;
}

export const DEFAULT_EMPLOYEE_PERMISSIONS = emptyPermissionMatrix();
