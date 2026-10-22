import { NextRequest, NextResponse } from "next/server"
import {
  verifyLandingAdminCredentials,
  createLandingAdminToken,
  LANDING_ADMIN_COOKIE,
} from "@/lib/landing-admin/auth"
import { checkRateLimit, getClientIp, resetRateLimit } from "@/lib/security/rate-limit"

const LOGIN_LIMIT = 10
const LOGIN_WINDOW_MS = 15 * 60 * 1000

export async function POST(request: NextRequest) {
  const rateKey = `landing-login:${getClientIp(request.headers)}`
  const rate = checkRateLimit(rateKey, LOGIN_LIMIT, LOGIN_WINDOW_MS)
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many login attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
    )
  }

  try {
    const body = await request.json()
    const { email, password } = body ?? {}

    if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
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

    resetRateLimit(rateKey)
    const token = createLandingAdminToken(email)
    if (!token) {
      return NextResponse.json(
        { error: "Landing admin login is not configured on the server." },
        { status: 503 }
      )
    }

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
