export const PAYMENT_MODES = [
  "Cash",
  "Bank Transfer",
  "UPI",
  "Cheque",
  "NEFT/RTGS",
  "Other",
] as const

export type PaymentMode = (typeof PAYMENT_MODES)[number]

