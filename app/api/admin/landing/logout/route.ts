import { NextResponse } from "next/server"
import { LANDING_ADMIN_COOKIE } from "@/lib/landing-admin/auth"

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: "Logged out successfully",
  })

  response.cookies.set({
    name: LANDING_ADMIN_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  })

  return response
}
