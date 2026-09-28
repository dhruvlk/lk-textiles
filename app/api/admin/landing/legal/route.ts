import { NextRequest, NextResponse } from "next/server"
import { revalidatePath, revalidateTag } from "next/cache"
import { isLandingAdminAuthenticated } from "@/lib/landing-admin/auth"
import {
  getLegalContent,
  saveLegalContent,
  deleteLegalContent,
  validateLegalContent,
} from "@/lib/landing/legal-content"
import { LegalContentType } from "@/types/landing-legal"

function revalidateLegalPaths(type: LegalContentType) {
  try {
    if (type === "privacy_policy") {
      revalidatePath("/privacy-policy", "page")
      revalidatePath("/privacy-policy", "layout")
    } else if (type === "terms_conditions") {
      revalidatePath("/terms-and-conditions", "page")
      revalidatePath("/terms-and-conditions", "layout")
      revalidatePath("/terms-of-service", "page")
      revalidatePath("/terms-of-service", "layout")
    }
    revalidatePath("/", "layout")
    revalidateTag("landing-legal-content", "max")
    revalidateTag("landing-content", "max")
  } catch (err) {
    console.warn("Path revalidation warning:", err)
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await isLandingAdminAuthenticated()
    if (!session.authenticated) {
      return NextResponse.json(
        { error: "Unauthorized. Landing Admin session required." },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") as LegalContentType | null

    if (type) {
      if (type !== "privacy_policy" && type !== "terms_conditions") {
        return NextResponse.json({ error: "Invalid legal content type." }, { status: 400 })
      }
      const content = await getLegalContent(type)
      return NextResponse.json({ success: true, data: content })
    }

    const [privacy, terms] = await Promise.all([
      getLegalContent("privacy_policy"),
      getLegalContent("terms_conditions"),
    ])

    return NextResponse.json({
      success: true,
      data: {
        privacy_policy: privacy,
        terms_conditions: terms,
      },
    })
  } catch (err) {
    console.error("Error in GET /api/admin/landing/legal:", err)
    return NextResponse.json(
      { error: "Failed to retrieve legal content." },
      { status: 500 }
    )
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
    const { type, title, description, content, is_published } = body

    if (type !== "privacy_policy" && type !== "terms_conditions") {
      return NextResponse.json(
        { error: "Invalid type. Must be 'privacy_policy' or 'terms_conditions'." },
        { status: 400 }
      )
    }

    const validation = validateLegalContent({ title, content })
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // Save with explicit publish flag if provided
    const shouldPublish = is_published === true
    const saveResult = await saveLegalContent(
      {
        type,
        title,
        description: description || "",
        content,
        is_published: shouldPublish,
      },
      shouldPublish
    )

    if (!saveResult.success) {
      return NextResponse.json(
        { error: saveResult.error || "Failed to persist legal content." },
        { status: 500 }
      )
    }

    // Revalidate public page caches immediately
    revalidateLegalPaths(type)

    return NextResponse.json({
      success: true,
      message: shouldPublish ? "Changes published successfully." : "Changes saved successfully.",
      data: saveResult.data,
    })
  } catch (err) {
    console.error("Error in PUT /api/admin/landing/legal:", err)
    return NextResponse.json(
      { error: "An unexpected error occurred while saving legal content." },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await isLandingAdminAuthenticated()
    if (!session.authenticated) {
      return NextResponse.json(
        { error: "Unauthorized. Landing Admin session required." },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") as LegalContentType | null

    if (!type || (type !== "privacy_policy" && type !== "terms_conditions")) {
      return NextResponse.json(
        { error: "Invalid or missing legal content type." },
        { status: 400 }
      )
    }

    const deleteResult = await deleteLegalContent(type)
    if (!deleteResult.success) {
      return NextResponse.json(
        { error: deleteResult.error || "Failed to delete legal content." },
        { status: 500 }
      )
    }

    // Invalidate public page caches so empty/not-found state renders immediately
    revalidateLegalPaths(type)

    return NextResponse.json({
      success: true,
      message: "Legal content deleted successfully.",
    })
  } catch (err) {
    console.error("Error in DELETE /api/admin/landing/legal:", err)
    return NextResponse.json(
      { error: "An unexpected error occurred while deleting legal content." },
      { status: 500 }
    )
  }
}
