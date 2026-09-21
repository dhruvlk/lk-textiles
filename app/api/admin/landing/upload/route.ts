import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { isLandingAdminAuthenticated } from "@/lib/landing-admin/auth"

const BUCKET_NAME = "landing-assets"

export async function POST(request: NextRequest) {
  try {
    const session = await isLandingAdminAuthenticated()
    if (!session.authenticated) {
      return NextResponse.json(
        { error: "Unauthorized. Landing Admin session required." },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const oldUrl = formData.get("oldUrl") as string | null

    if (!file) {
      return NextResponse.json({ error: "No image file provided." }, { status: 400 })
    }

    // Validate type
    const validMimes = ["image/jpeg", "image/png", "image/webp", "image/svg+xml", "image/gif"]
    if (!validMimes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, WebP, SVG, and GIF are permitted." },
        { status: 400 }
      )
    }

    // Validate size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size exceeds maximum allowed limit of 10MB." },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Ensure bucket exists
    try {
      const { data: buckets } = await supabase.storage.listBuckets()
      const bucketExists = buckets?.some((b) => b.id === BUCKET_NAME)
      if (!bucketExists) {
        await supabase.storage.createBucket(BUCKET_NAME, { public: true })
      }
    } catch {
      // Ignore if check fails
    }

    // Generate unique filename
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg"
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 8)
    const filePath = `images/${timestamp}-${randomStr}.${ext}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload new image
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error("Storage upload error:", uploadError)
      return NextResponse.json(
        { error: `Upload failed: ${uploadError.message}` },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath)

    const newUrl = publicUrlData.publicUrl

    // Clean up old image if it belonged to our bucket
    if (oldUrl && oldUrl.includes(`/${BUCKET_NAME}/`)) {
      try {
        const oldPath = oldUrl.split(`/${BUCKET_NAME}/`)[1]
        if (oldPath) {
          await supabase.storage.from(BUCKET_NAME).remove([oldPath])
        }
      } catch (err) {
        console.warn("Could not remove old image:", err)
      }
    }

    return NextResponse.json({
      success: true,
      url: newUrl,
      message: "Image uploaded successfully",
    })
  } catch (err) {
    console.error("Error in upload route:", err)
    return NextResponse.json(
      { error: "An unexpected error occurred during image upload." },
      { status: 500 }
    )
  }
}
