export type LegalContentType = "privacy_policy" | "terms_conditions"

export interface LegalContent {
  id: string
  type: LegalContentType
  title: string
  description: string
  content: string
  is_published: boolean
  created_at: string
  updated_at: string
}

export interface LegalContentFormData {
  title: string
  description: string
  content: string
}
