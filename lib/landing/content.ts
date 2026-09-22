import fs from "fs"
import path from "path"
import { createAdminClient } from "@/lib/supabase/admin"
import { defaultLandingContent } from "@/constants/default-landing-content"
import { LandingPageContent } from "@/types/landing-content"

const LOCAL_STORAGE_DIR = path.join(process.cwd(), "data")
const LOCAL_STORAGE_FILE = path.join(LOCAL_STORAGE_DIR, "landing-content.json")

/**
 * Validates landing page content before saving/publishing.
 */
export function validateLandingContent(data: unknown): { valid: boolean; error?: string } {
  if (!data || typeof data !== "object") {
    return { valid: false, error: "Content payload is empty or invalid." }
  }

  const content = data as Partial<LandingPageContent>

  if (content.brand && typeof content.brand.name === "string" && !content.brand.name.trim()) {
    return { valid: false, error: "Brand name cannot be empty." }
  }

  if (content.contact?.email && typeof content.contact.email === "string") {
    const email = content.contact.email.trim()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (email && !emailRegex.test(email)) {
      return { valid: false, error: "Please enter a valid contact email address." }
    }
  }

  return { valid: true }
}

/**
 * Deeply merges saved content with defaultLandingContent to ensure complete schema.
 */
export function mergeLandingContent(saved: Partial<LandingPageContent> | null): LandingPageContent {
  if (!saved) return defaultLandingContent
  return {
    ...defaultLandingContent,
    ...saved,
    brand: { ...defaultLandingContent.brand, ...(saved.brand || {}) },
    seo: { ...defaultLandingContent.seo, ...(saved.seo || {}) },
    hero: { ...defaultLandingContent.hero, ...(saved.hero || {}) },
    heritage: { ...defaultLandingContent.heritage, ...(saved.heritage || {}) },
    capabilities: {
      ...defaultLandingContent.capabilities,
      ...(saved.capabilities || {}),
      products: saved.capabilities?.products?.length
        ? saved.capabilities.products
        : defaultLandingContent.capabilities.products,
    },
    advantages: {
      ...defaultLandingContent.advantages,
      ...(saved.advantages || {}),
      items: saved.advantages?.items?.length
        ? saved.advantages.items
        : defaultLandingContent.advantages.items,
    },
    contact: { ...defaultLandingContent.contact, ...(saved.contact || {}) },
    footer: {
      ...defaultLandingContent.footer,
      ...(saved.footer || {}),
      socialLinks: {
        ...defaultLandingContent.footer.socialLinks,
        ...(saved.footer?.socialLinks || {}),
      },
    },
  }
}

/**
 * Reads published landing content from Supabase first, falling back to local file.
 */
export async function getPublishedLandingContent(): Promise<LandingPageContent> {
  // 1. Try reading from Supabase table landing_page_content
  try {
    const supabase = createAdminClient()
    const client = supabase as unknown as {
      from: (table: string) => {
        select: (cols: string) => {
          eq: (col: string, val: string) => {
            maybeSingle: () => Promise<{ data: { content: LandingPageContent } | null; error: unknown }>
          }
        }
      }
    }
    const { data, error } = await client
      .from("landing_page_content")
      .select("content")
      .eq("id", "default")
      .maybeSingle()

    if (!error && data?.content) {
      return mergeLandingContent(data.content)
    }
  } catch (err) {
    console.warn("Could not fetch landing content from Supabase, falling back to local file:", err)
  }

  // 2. Fallback to local storage file
  try {
    if (fs.existsSync(LOCAL_STORAGE_FILE)) {
      const raw = fs.readFileSync(LOCAL_STORAGE_FILE, "utf-8")
      const parsed = JSON.parse(raw) as Partial<LandingPageContent>
      return mergeLandingContent(parsed)
    }
  } catch (err) {
    console.error("Error reading local landing content file:", err)
  }

  // 3. Fallback to default constants
  return defaultLandingContent
}

/**
 * Saves published landing content to both local storage and Supabase table.
 */
export async function saveLandingContent(
  content: Partial<LandingPageContent>,
  updatedBy: string = "lktextiles6165@gmail.com"
): Promise<{ success: boolean; content: LandingPageContent; error?: string }> {
  const validation = validateLandingContent(content)
  if (!validation.valid) {
    return {
      success: false,
      content: defaultLandingContent,
      error: validation.error,
    }
  }

  const merged = mergeLandingContent(content)

  // 1. Save to local storage file
  try {
    if (!fs.existsSync(LOCAL_STORAGE_DIR)) {
      fs.mkdirSync(LOCAL_STORAGE_DIR, { recursive: true })
    }
    fs.writeFileSync(LOCAL_STORAGE_FILE, JSON.stringify(merged, null, 2), "utf-8")
  } catch (err) {
    console.error("Error saving local landing content file:", err)
  }

  // 2. Save to Supabase table landing_page_content
  try {
    const supabase = createAdminClient()
    const client = supabase as unknown as {
      from: (table: string) => {
        upsert: (record: {
          id: string
          content: LandingPageContent
          updated_at: string
          updated_by: string
        }) => Promise<{ error: { message: string } | null }>
      }
    }
    const { error } = await client
      .from("landing_page_content")
      .upsert({
        id: "default",
        content: merged,
        updated_at: new Date().toISOString(),
        updated_by: updatedBy,
      })

    if (error) {
      console.warn("Supabase upsert warning for landing_page_content:", error.message)
    }
  } catch (err) {
    console.warn("Could not save to Supabase landing_page_content:", err)
  }

  return {
    success: true,
    content: merged,
  }
}
