export const BROKERS = [
  "Mahesh Broker",
  "Raj Trading",
  "Shree Agency",
  "Patel Brokers",
  "Om Enterprise"
]

export const PAYMENT_UNITS = ["Days", "Weeks", "Months"]

export const PAYMENT_MODES = [
  "Cash",
  "Bank Transfer",
  "UPI",
  "Cheque",
  "NEFT/RTGS",
  "Other",
] as const

export type PaymentMode = (typeof PAYMENT_MODES)[number]

export const ROUTES = {
  HOME: '/admin',
  LOGIN: '/admin/login',
  REGISTER: '/admin/register',
  FORGOT_PASSWORD: '/admin/forgot-password',
  RESET_PASSWORD: '/admin/reset-password',
  COMPANIES: '/admin/companies',
  PARTIES: '/admin/parties',
  /** Disabled while FEATURES.productsModule is false */
  PRODUCTS: '/admin/products',
  CHALLANS: '/admin/invoices',
  DELIVERY_CHALLANS: '/admin/delivery-challans',
  REPORTS: '/admin/reports',
  /** Disabled while FEATURES.companySettingsModule is false */
  SETTINGS: '/admin/settings',
}

export const STATUS = {
  DRAFT: 'draft',
  SENT: 'sent',
  DELIVERED: 'delivered'
}
