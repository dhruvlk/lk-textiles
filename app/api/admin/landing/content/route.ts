import { NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import { createAdminClient } from "@/lib/supabase/admin"
import { isLandingAdminAuthenticated } from "@/lib/landing-admin/auth"
import { defaultLandingContent } from "@/constants/default-landing-content"
import { LandingPageContent } from "@/types/landing-content"

const LOCAL_STORAGE_DIR = path.join(process.cwd(), "data")
const LOCAL_STORAGE_FILE = path.join(LOCAL_STORAGE_DIR, "landing-content.json")

function getLocalContent(): LandingPageContent | null {
  try {
    if (fs.existsSync(LOCAL_STORAGE_FILE)) {
      const raw = fs.readFileSync(LOCAL_STORAGE_FILE, "utf-8")
      return JSON.parse(raw) as LandingPageContent
    }
  } catch (err) {
    console.error("Error reading local landing content:", err)
  }
  return null
}

function saveLocalContent(content: LandingPageContent): void {
  try {
    if (!fs.existsSync(LOCAL_STORAGE_DIR)) {
      fs.mkdirSync(LOCAL_STORAGE_DIR, { recursive: true })
    }
    fs.writeFileSync(LOCAL_STORAGE_FILE, JSON.stringify(content, null, 2), "utf-8")
  } catch (err) {
    console.error("Error saving local landing content:", err)
  }
}

function mergeContent(saved: Partial<LandingPageContent> | null): LandingPageContent {
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

interface ContentRow {
  id: string
  content: LandingPageContent
  updated_at?: string
  updated_by?: string
}

export async function GET() {
  try {
    // 1. Try reading from Supabase table landing_page_content
    try {
      const supabase = createAdminClient()
      const client = supabase as unknown as {
        from: (table: string) => {
          select: (cols: string) => {
            eq: (col: string, val: string) => {
              maybeSingle: () => Promise<{ data: ContentRow | null; error: unknown }>
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
        const merged = mergeContent(data.content)
        return NextResponse.json(merged)
      }
    } catch {
      // Supabase table may not be created yet, fallback to local storage
    }

    // 2. Fallback to local storage if available
    const local = getLocalContent()
    if (local) {
      return NextResponse.json(mergeContent(local))
    }

    // 3. Return defaults
    return NextResponse.json(defaultLandingContent)
  } catch (err) {
    console.error("Error in GET /api/admin/landing/content:", err)
    return NextResponse.json(defaultLandingContent)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await isLandingAdminAuthenticated()
    if (!session.authenticated) {
      return NextResponse.json(
        { error: "Unauthorized. Landing Admin session required." },
        { status: 401 }
      )
    }

    const body = await request.json()
    const mergedContent = mergeContent(body)

    // Save to local backup first
    saveLocalContent(mergedContent)

    // Try saving to Supabase table landing_page_content
    try {
      const supabase = createAdminClient()
      const client = supabase as unknown as {
        from: (table: string) => {
          upsert: (record: ContentRow) => Promise<{ error: { message: string } | null }>
        }
      }
      const { error } = await client
        .from("landing_page_content")
        .upsert({
          id: "default",
          content: mergedContent,
          updated_at: new Date().toISOString(),
          updated_by: session.email || "lktextiles6165@gmail.com",
        })

      if (error) {
        console.warn("Supabase upsert warning (using local persistent store):", error.message)
      }
    } catch (err) {
      console.warn("Supabase table not reachable, saved to local store:", err)
    }

    return NextResponse.json({
      success: true,
      message: "Landing page content updated successfully.",
      content: mergedContent,
    })
  } catch (err) {
    console.error("Error in PUT /api/admin/landing/content:", err)
    return NextResponse.json(
      { error: "Failed to update landing page content." },
      { status: 500 }
    )
  }
}
