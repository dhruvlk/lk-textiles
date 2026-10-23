import crypto from "crypto"
import { cookies } from "next/headers"

export const LANDING_ADMIN_COOKIE = "landing_admin_session"

const MIN_SECRET_LENGTH = 32

/**
 * Returns the HMAC secret used to sign landing-admin sessions.
 * Fails closed: without a strong secret configured, no token can be
 * issued or verified (a hardcoded fallback would let anyone forge sessions).
 */
function getSecretKey(): string | null {
  const secret = process.env.LANDING_ADMIN_SECRET?.trim()
  if (!secret || secret.length < MIN_SECRET_LENGTH) {
    console.error(
      `[landing-admin] LANDING_ADMIN_SECRET is missing or shorter than ${MIN_SECRET_LENGTH} characters; landing admin login is disabled.`
    )
    return null
  }
  return secret
}

function stripQuotes(str: string): string {
  let s = str.trim()
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1).trim()
  }
  return s
}

export function verifyLandingAdminCredentials(email: string, password: string): boolean {
  const configuredEmail = process.env.LANDING_ADMIN_EMAIL
  const configuredPassword = process.env.LANDING_ADMIN_PASSWORD
  // Fail closed when credentials are not configured — never fall back to defaults.
  if (!configuredEmail?.trim() || !configuredPassword?.trim()) {
    console.error("[landing-admin] LANDING_ADMIN_EMAIL / LANDING_ADMIN_PASSWORD are not configured; login is disabled.")
    return false
  }
  const adminEmail = stripQuotes(configuredEmail).toLowerCase()
  const adminPassword = stripQuotes(configuredPassword)

  const normalizedInputEmail = stripQuotes(email || "").toLowerCase()
  const normalizedInputPassword = (password || "").trim()

  if (normalizedInputEmail !== adminEmail) {
    return false
  }

  // Timing-safe comparison to prevent side-channel timing attacks
  const passBufA = Buffer.from(normalizedInputPassword, "utf-8")
  const passBufB = Buffer.from(adminPassword, "utf-8")

  if (passBufA.length !== passBufB.length) {
    return false
  }

  return crypto.timingSafeEqual(passBufA, passBufB)
}

export function createLandingAdminToken(email: string): string | null {
  const secret = getSecretKey()
  if (!secret) return null
  const payload = {
    email: email.trim().toLowerCase(),
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
  }

  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url")
  const signature = crypto
    .createHmac("sha256", secret)
    .update(encodedPayload)
    .digest("base64url")

  return `${encodedPayload}.${signature}`
}

export function verifyLandingAdminToken(token: string): { valid: boolean; email?: string } {
  if (!token || typeof token !== "string") {
    return { valid: false }
  }

  const parts = token.split(".")
  if (parts.length !== 2) {
    return { valid: false }
  }

  const [encodedPayload, signature] = parts
  const secret = getSecretKey()
  if (!secret) {
    return { valid: false }
  }

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(encodedPayload)
    .digest("base64url")

  const sigBufA = Buffer.from(signature, "utf-8")
  const sigBufB = Buffer.from(expectedSignature, "utf-8")

  if (sigBufA.length !== sigBufB.length || !crypto.timingSafeEqual(sigBufA, sigBufB)) {
    return { valid: false }
  }

  try {
    const payloadJson = Buffer.from(encodedPayload, "base64url").toString("utf-8")
    const payload = JSON.parse(payloadJson)

    const now = Math.floor(Date.now() / 1000)
    // Require an expiry claim; tokens without one never expire otherwise.
    if (typeof payload.exp !== "number" || payload.exp < now) {
      return { valid: false }
    }
    if (typeof payload.email !== "string" || !payload.email) {
      return { valid: false }
    }

    return { valid: true, email: payload.email }
  } catch {
    return { valid: false }
  }
}

export async function isLandingAdminAuthenticated(): Promise<{ authenticated: boolean; email?: string }> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get(LANDING_ADMIN_COOKIE)
    if (!sessionCookie?.value) {
      return { authenticated: false }
    }

    const verification = verifyLandingAdminToken(sessionCookie.value)
    if (!verification.valid) {
      return { authenticated: false }
    }

    return { authenticated: true, email: verification.email }
  } catch {
    return { authenticated: false }
  }
}
