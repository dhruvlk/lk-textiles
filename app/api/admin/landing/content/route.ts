import { NextRequest, NextResponse } from "next/server"
import { revalidatePath, revalidateTag } from "next/cache"
import { isLandingAdminAuthenticated } from "@/lib/landing-admin/auth"
import {
  getPublishedLandingContent,
  saveLandingContent,
  validateLandingContent,
} from "@/lib/landing/content"

export async function GET() {
  try {
    const content = await getPublishedLandingContent()
    return NextResponse.json(content)
  } catch (err) {
    console.error("Error in GET /api/admin/landing/content:", err)
    const fallback = await getPublishedLandingContent()
    return NextResponse.json(fallback)
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

    // 1. Server-side field validation
    const validation = validateLandingContent(body)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error || "Invalid content fields." }, { status: 400 })
    }

    // 2. Persist to Supabase and local storage
    const saveResult = await saveLandingContent(body, session.email || "lktextiles6165@gmail.com")
    if (!saveResult.success) {
      return NextResponse.json(
        { error: saveResult.error || "Failed to persist landing content." },
        { status: 500 }
      )
    }

    // 3. Immediately revalidate Next.js App Router cache for public landing routes
    try {
      revalidatePath("/", "page")
      revalidatePath("/", "layout")
      revalidatePath("/(landing)", "page")
      revalidateTag("landing-content", "max")
    } catch (revalErr) {
      console.warn("Cache revalidation warning:", revalErr)
    }

    return NextResponse.json({
      success: true,
      message: "Changes published successfully.",
      content: saveResult.content,
    })
  } catch (err) {
    console.error("Error in PUT /api/admin/landing/content:", err)
    return NextResponse.json(
      { error: "An unexpected error occurred while publishing changes." },
      { status: 500 }
    )
  }
}
