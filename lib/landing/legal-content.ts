import fs from "fs"
import path from "path"
import { createAdminClient } from "@/lib/supabase/admin"
import { LegalContent, LegalContentType } from "@/types/landing-legal"
import {
  defaultPrivacyPolicyContent,
  defaultTermsConditionsContent,
  defaultLegalContentMap,
} from "@/constants/default-legal-content"

const LOCAL_STORAGE_DIR = path.join(process.cwd(), "data")
const LOCAL_LEGAL_FILE = path.join(LOCAL_STORAGE_DIR, "landing-legal-content.json")

/**
 * Initializes local legal storage if it does not yet exist.
 */
function ensureLocalFile(): Record<string, LegalContent> {
  try {
    if (!fs.existsSync(LOCAL_STORAGE_DIR)) {
      fs.mkdirSync(LOCAL_STORAGE_DIR, { recursive: true })
    }
    if (fs.existsSync(LOCAL_LEGAL_FILE)) {
      const raw = fs.readFileSync(LOCAL_LEGAL_FILE, "utf-8")
      return JSON.parse(raw) as Record<string, LegalContent>
    }
  } catch (err) {
    console.error("Error reading local landing legal file:", err)
  }

  // Populate with initial defaults
  const initialMap: Record<string, LegalContent> = {
    privacy_policy: { ...defaultPrivacyPolicyContent },
    terms_conditions: { ...defaultTermsConditionsContent },
  }

  try {
    fs.writeFileSync(LOCAL_LEGAL_FILE, JSON.stringify(initialMap, null, 2), "utf-8")
  } catch (err) {
    console.error("Error writing initial local landing legal file:", err)
  }

  return initialMap
}

function writeLocalLegalMap(map: Record<string, LegalContent | null>) {
  try {
    if (!fs.existsSync(LOCAL_STORAGE_DIR)) {
      fs.mkdirSync(LOCAL_STORAGE_DIR, { recursive: true })
    }
    fs.writeFileSync(LOCAL_LEGAL_FILE, JSON.stringify(map, null, 2), "utf-8")
  } catch (err) {
    console.error("Error persisting local landing legal file:", err)
  }
}

/**
 * Fetches legal content for admin view (published or draft).
 */
export async function getLegalContent(type: LegalContentType): Promise<LegalContent | null> {
  // 1. Try reading from Supabase table landing_legal_content
  try {
    const supabase = createAdminClient()
    const client = supabase as unknown as {
      from: (table: string) => {
        select: (cols: string) => {
          eq: (col: string, val: string) => {
            maybeSingle: () => Promise<{ data: LegalContent | null; error: unknown }>
          }
        }
      }
    }
    const { data, error } = await client
      .from("landing_legal_content")
      .select("*")
      .eq("type", type)
      .maybeSingle()

    if (!error && data) {
      return data
    }
  } catch (err) {
    console.warn(`Supabase fetch warning for legal content (${type}):`, err)
  }

  // 2. Fallback to local storage
  const localMap = ensureLocalFile()
  if (localMap[type]) {
    return localMap[type]
  }

  // 3. Fallback to default
  return defaultLegalContentMap[type] || null
}

/**
 * Fetches legal content for public view. Only returns content if is_published === true.
 */
export async function getPublishedLegalContent(type: LegalContentType): Promise<LegalContent | null> {
  // 1. Try reading published record from Supabase
  try {
    const supabase = createAdminClient()
    const client = supabase as unknown as {
      from: (table: string) => {
        select: (cols: string) => {
          eq: (col1: string, val1: string) => {
            eq: (col2: string, val2: boolean) => {
              maybeSingle: () => Promise<{ data: LegalContent | null; error: unknown }>
            }
          }
        }
      }
    }
    const { data, error } = await client
      .from("landing_legal_content")
      .select("*")
      .eq("type", type)
      .eq("is_published", true)
      .maybeSingle()

    if (!error && data && data.is_published && data.content && data.content.trim()) {
      return data
    }
  } catch (err) {
    console.warn(`Supabase fetch warning for published legal content (${type}):`, err)
  }

  // 2. Fallback to local storage
  const localMap = ensureLocalFile()
  const item = localMap[type]
  if (item && item.is_published && item.content && item.content.trim()) {
    return item
  }

  return null
}

/**
 * Validates legal content fields before saving.
 */
export function validateLegalContent(data: Partial<LegalContent>): { valid: boolean; error?: string } {
  if (!data || typeof data !== "object") {
    return { valid: false, error: "Content payload is invalid." }
  }

  if (!data.title || !data.title.trim()) {
    return { valid: false, error: "Page title is required." }
  }

  if (typeof data.content !== "string" || !data.content.trim()) {
    return { valid: false, error: "Legal document content cannot be empty." }
  }

  return { valid: true }
}

/**
 * Saves and optionally publishes legal content.
 */
export async function saveLegalContent(
  payload: Partial<LegalContent> & { type: LegalContentType },
  publish: boolean = false
): Promise<{ success: boolean; data?: LegalContent; error?: string }> {
  const validation = validateLegalContent(payload)
  if (!validation.valid) {
    return { success: false, error: validation.error }
  }

  const existing = await getLegalContent(payload.type)
  const now = new Date().toISOString()

  const record: LegalContent = {
    id: existing?.id || payload.type,
    type: payload.type,
    title: payload.title!.trim(),
    description: (payload.description || "").trim(),
    content: payload.content!.trim(),
    is_published: publish ? true : (payload.is_published ?? existing?.is_published ?? false),
    created_at: existing?.created_at || now,
    updated_at: now,
  }

  // 1. Save to local storage file
  const localMap = ensureLocalFile()
  localMap[payload.type] = record
  writeLocalLegalMap(localMap)

  // 2. Save to Supabase table landing_legal_content
  try {
    const supabase = createAdminClient()
    const client = supabase as unknown as {
      from: (table: string) => {
        upsert: (
          record: LegalContent,
          options?: { onConflict: string }
        ) => Promise<{ error: { message: string } | null }>
      }
    }
    const { error } = await client
      .from("landing_legal_content")
      .upsert(record, { onConflict: "type" })

    if (error) {
      console.warn(`Supabase upsert warning for landing_legal_content (${payload.type}):`, error.message)
    }
  } catch (err) {
    console.warn(`Could not save to Supabase landing_legal_content (${payload.type}):`, err)
  }

  return {
    success: true,
    data: record,
  }
}

/**
 * Deletes legal content for the specified type.
 */
export async function deleteLegalContent(type: LegalContentType): Promise<{ success: boolean; error?: string }> {
  // 1. Delete from local storage
  const localMap = ensureLocalFile()
  delete localMap[type]
  writeLocalLegalMap(localMap)

  // 2. Delete from Supabase
  try {
    const supabase = createAdminClient()
    const client = supabase as unknown as {
      from: (table: string) => {
        delete: () => {
          eq: (col: string, val: string) => Promise<{ error: { message: string } | null }>
        }
      }
    }
    const { error } = await client
      .from("landing_legal_content")
      .delete()
      .eq("type", type)

    if (error) {
      console.warn(`Supabase delete warning for landing_legal_content (${type}):`, error.message)
    }
  } catch (err) {
    console.warn(`Could not delete from Supabase landing_legal_content (${type}):`, err)
  }

  return { success: true }
}
