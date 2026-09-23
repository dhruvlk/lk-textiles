import { NextRequest, NextResponse } from "next/server"
import {
  verifyLandingAdminCredentials,
  createLandingAdminToken,
  LANDING_ADMIN_COOKIE,
} from "@/lib/landing-admin/auth"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      )
    }

    const isValid = verifyLandingAdminCredentials(email, password)
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      )
    }

    const token = createLandingAdminToken(email)

    const response = NextResponse.json({
      success: true,
      message: "Authenticated successfully",
      email: email.trim().toLowerCase(),
    })

    // Set secure HTTP-only cookie
    response.cookies.set({
      name: LANDING_ADMIN_COOKIE,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    })

    return response
  } catch (err) {
    console.error("Landing admin login error:", err)
    return NextResponse.json(
      { error: "An unexpected error occurred during login." },
      { status: 500 }
    )
  }
}
