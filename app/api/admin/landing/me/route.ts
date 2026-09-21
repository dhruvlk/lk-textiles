import { NextResponse } from "next/server"
import { isLandingAdminAuthenticated } from "@/lib/landing-admin/auth"

export async function GET() {
  const session = await isLandingAdminAuthenticated()

  if (!session.authenticated) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }

  return NextResponse.json({
    authenticated: true,
    email: session.email,
  })
}
