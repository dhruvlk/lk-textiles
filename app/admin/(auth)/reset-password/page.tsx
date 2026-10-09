"use client"

import { Suspense, useEffect, useState, useRef, useCallback } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"
import {
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  KeyRound,
  ShieldCheck,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { PasswordInput } from "@/components/ui/password-input"
import { AuthShell } from "@/components/auth/AuthShell"
import { createClient } from "@/lib/supabase/client"
import {
  resetPasswordSchema,
  type ResetPasswordFormValues,
} from "@/lib/validations/auth-recovery"

const RECOVERY_STORAGE_KEY = "challan_recovery_session_active"

type PageState =
  | { type: "checking" }
  | { type: "valid" }
  | { type: "invalid"; error: string }
  | { type: "success" }

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { updatePassword, logout } = useAuth()

  const [pageState, setPageState] = useState<PageState>({ type: "checking" })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [redirectCountdown, setRedirectCountdown] = useState(3)
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null)

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
    mode: "onTouched",
  })

  // Validate recovery authorization
  const validateRecoveryAuth = useCallback(async () => {
    const supabase = createClient()

    // 1. Check for query error parameters (?error=access_denied&error_description=...)
    const queryError = searchParams.get("error")
    const queryErrorDescription = searchParams.get("error_description")
    if (queryError) {
      const msg =
        queryErrorDescription ||
        "This password reset link is invalid or has expired. Please request a new link."
      setPageState({ type: "invalid", error: msg })
      return
    }

    // 2. Check for hash error parameters (#error=access_denied&error_description=...)
    if (typeof window !== "undefined" && window.location.hash) {
      const hash = window.location.hash.substring(1)
      const params = new URLSearchParams(hash)
      if (params.get("error")) {
        const desc =
          params.get("error_description") ||
          "This password reset link is invalid or has expired. Please request a new link."
        setPageState({ type: "invalid", error: desc })
        return
      }
    }

    // 3. Check for token_hash (?token_hash=... or in hash) - Cross-browser friendly without PKCE storage dependency
    let tokenHash = searchParams.get("token_hash")
    if (!tokenHash && typeof window !== "undefined" && window.location.hash) {
      const hash = window.location.hash.substring(1)
      const params = new URLSearchParams(hash)
      tokenHash = params.get("token_hash")
    }

    if (tokenHash) {
      try {
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: "recovery",
        })

        if (error || !data.session) {
          setPageState({
            type: "invalid",
            error:
              error?.message ||
              "The password reset link is invalid or has expired.",
          })
          return
        }

        try {
          sessionStorage.setItem(RECOVERY_STORAGE_KEY, "true")
        } catch {
          // ignore
        }

        if (typeof window !== "undefined") {
          window.history.replaceState({}, "", window.location.pathname)
        }

        setPageState({ type: "valid" })
        return
      } catch (err) {
        setPageState({
          type: "invalid",
          error:
            err instanceof Error
              ? err.message
              : "Failed to verify password reset link.",
        })
        return
      }
    }

    // 4. Check for PKCE auth code in searchParams (?code=...)
    const code = searchParams.get("code")
    if (code) {
      try {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)
        if (error || !data.session) {
          const lowerMsg = (error?.message || "").toLowerCase()
          if (lowerMsg.includes("pkce") || lowerMsg.includes("code verifier")) {
            setPageState({
              type: "invalid",
              error:
                "This reset link was opened in a different browser, device, or incognito window than where you requested it. For security, please open the link in the same browser where you submitted the reset request, or request a new link.",
            })
            return
          }

          setPageState({
            type: "invalid",
            error:
              error?.message ||
              "The password reset code is invalid or has already been used.",
          })
          return
        }

        // Recovery session established! Mark in sessionStorage for reload tolerance
        try {
          sessionStorage.setItem(RECOVERY_STORAGE_KEY, "true")
        } catch {
          // ignore
        }

        // Strip sensitive one-time code from URL without reloading
        if (typeof window !== "undefined") {
          window.history.replaceState({}, "", window.location.pathname)
        }

        setPageState({ type: "valid" })
        return
      } catch (err) {
        setPageState({
          type: "invalid",
          error:
            err instanceof Error
              ? err.message
              : "Failed to verify password reset code.",
        })
        return
      }
    }

    // 5. Check for implicit hash fragment (#access_token=...&type=recovery)
    let isHashRecovery = false
    if (typeof window !== "undefined" && window.location.hash) {
      const hash = window.location.hash.substring(1)
      const params = new URLSearchParams(hash)
      if (
        params.get("type") === "recovery" ||
        params.get("access_token")
      ) {
        isHashRecovery = true
      }
    }

    // 6. Check active session AND verify recovery authorization marker
    const { data: { session } } = await supabase.auth.getSession()

    let hasRecoveryMarker = false
    try {
      hasRecoveryMarker =
        sessionStorage.getItem(RECOVERY_STORAGE_KEY) === "true"
    } catch {
      hasRecoveryMarker = false
    }

    if (session && (isHashRecovery || hasRecoveryMarker)) {
      try {
        sessionStorage.setItem(RECOVERY_STORAGE_KEY, "true")
      } catch {
        // ignore
      }

      if (typeof window !== "undefined" && window.location.hash) {
        window.history.replaceState({}, "", window.location.pathname)
      }

      setPageState({ type: "valid" })
      return
    }

    // 7. Listen for auth state change if Supabase is still parsing hash
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && isHashRecovery)) {
          try {
            sessionStorage.setItem(RECOVERY_STORAGE_KEY, "true")
          } catch {
            // ignore
          }
          if (typeof window !== "undefined" && window.location.hash) {
            window.history.replaceState({}, "", window.location.pathname)
          }
          setPageState({ type: "valid" })
        }
      }
    )

    // Wait a brief tick for onAuthStateChange to resolve if hash exists
    if (isHashRecovery) {
      setTimeout(async () => {
        const { data: { session: retrySession } } = await supabase.auth.getSession()
        if (retrySession) {
          setPageState({ type: "valid" })
        } else {
          setPageState({
            type: "invalid",
            error:
              "Unable to verify your password reset session. Please request a new link.",
          })
        }
        subscription.unsubscribe()
      }, 500)
      return
    }

    subscription.unsubscribe()

    // 8. No token_hash, no code, no hash, no recovery marker: reject unauthorized access!
    setPageState({
      type: "invalid",
      error:
        "No valid password reset session was found. Please open the link sent to your email or request a new one.",
    })
  }, [searchParams])

  useEffect(() => {
    validateRecoveryAuth()
  }, [validateRecoveryAuth])

  // Countdown timer for automatic redirect on success
  useEffect(() => {
    if (pageState.type === "success") {
      if (redirectCountdown > 0) {
        countdownTimerRef.current = setTimeout(() => {
          setRedirectCountdown((prev) => prev - 1)
        }, 1000)
      } else {
        router.replace("/admin/login")
      }
    }
    return () => {
      if (countdownTimerRef.current) clearTimeout(countdownTimerRef.current)
    }
  }, [pageState.type, redirectCountdown, router])

  const onSubmit = async (values: ResetPasswordFormValues) => {
    if (isSubmitting || pageState.type !== "valid") return
    setIsSubmitting(true)
    setFormError(null)

    try {
      const result = await updatePassword(values.password)
      if (result.error) {
        setFormError(result.error)
        toast.error(result.error)
        setIsSubmitting(false)
        return
      }

      // Password updated successfully!
      form.reset({ password: "", confirmPassword: "" })
      try {
        sessionStorage.removeItem(RECOVERY_STORAGE_KEY)
      } catch {
        // ignore
      }

      // Cleanly sign out recovery session so user can log in fresh with new password
      try {
        await logout()
      } catch {
        // ignore sign-out error
      }

      setPageState({ type: "success" })
      toast.success("Password reset successfully")
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "An unexpected error occurred while resetting your password."
      setFormError(msg)
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  // State: Checking authorization
  if (pageState.type === "checking") {
    return (
      <AuthShell
        title="Verifying reset link"
        description="Please wait while we verify your password reset authorization..."
      >
        <div className="flex flex-col items-center justify-center py-8 space-y-4">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-xs text-muted-foreground">Checking recovery session...</p>
        </div>
      </AuthShell>
    )
  }

  // State: Invalid or expired link
  if (pageState.type === "invalid") {
    return (
      <AuthShell
        title="Reset Link Invalid"
        description="We couldn't verify your password reset authorization."
        footer={
          <div className="flex items-center justify-center gap-1.5 text-sm">
            <ArrowLeft className="h-4 w-4 text-muted-foreground" />
            <Link
              href="/admin/login"
              className="font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
            >
              Back to Sign In
            </Link>
          </div>
        }
      >
        <div className="space-y-5">
          <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-center sm:p-5">
            <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium text-foreground">
              {pageState.error}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              For security, password reset links expire after a limited time and can only be used once.
            </p>
          </div>

          <div className="space-y-2">
            <Button
              type="button"
              className="h-10 w-full"
              onClick={() => router.push("/admin/forgot-password")}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Request a New Reset Link
            </Button>
          </div>
        </div>
      </AuthShell>
    )
  }

  // State: Success
  if (pageState.type === "success") {
    return (
      <AuthShell
        title="Password updated"
        description="Your password has been changed successfully."
      >
        <div className="space-y-5">
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-center sm:p-5">
            <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-foreground">
              Password Reset Complete!
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              You can now sign in to your workspace using your new password.
            </p>
            <p className="mt-3 text-xs font-medium text-primary">
              Redirecting to Sign In in {redirectCountdown}s...
            </p>
          </div>

          <Button
            type="button"
            className="h-10 w-full"
            onClick={() => router.replace("/admin/login")}
          >
            Sign In Now
          </Button>
        </div>
      </AuthShell>
    )
  }

  // State: Valid - Display reset form
  return (
    <AuthShell
      title="Reset your password"
      description="Choose a strong, secure new password for your account."
      footer={
        <div className="flex items-center justify-center gap-1.5 text-sm">
          <ArrowLeft className="h-4 w-4 text-muted-foreground" />
          <Link
            href="/admin/login"
            className="font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
          >
            Back to Sign In
          </Link>
        </div>
      }
    >
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {formError && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
            {formError}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="password">New Password</Label>
          <PasswordInput
            id="password"
            placeholder="Minimum 8 characters"
            autoComplete="new-password"
            disabled={isSubmitting}
            aria-invalid={!!form.formState.errors.password}
            className="h-10"
            {...form.register("password")}
          />
          {form.formState.errors.password && (
            <p className="text-xs text-destructive font-medium" role="alert">
              {form.formState.errors.password.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm New Password</Label>
          <PasswordInput
            id="confirmPassword"
            placeholder="Re-enter your new password"
            autoComplete="new-password"
            disabled={isSubmitting}
            aria-invalid={!!form.formState.errors.confirmPassword}
            className="h-10"
            {...form.register("confirmPassword")}
          />
          {form.formState.errors.confirmPassword && (
            <p className="text-xs text-destructive font-medium" role="alert">
              {form.formState.errors.confirmPassword.message}
            </p>
          )}
        </div>

        <div className="rounded-lg border bg-muted/40 p-3 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            Password requirements:
          </div>
          <ul className="text-[11px] text-muted-foreground list-disc list-inside space-y-0.5">
            <li>At least 8 characters long</li>
            <li>Both passwords must match exactly</li>
          </ul>
        </div>

        <Button
          type="submit"
          className="h-10 w-full"
          disabled={isSubmitting}
          loading={isSubmitting}
        >
          <KeyRound className="mr-2 h-4 w-4" />
          {isSubmitting ? "Updating Password..." : "Reset Password"}
        </Button>
      </form>
    </AuthShell>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <AuthShell
          title="Reset password"
          description="Loading password recovery..."
        >
          <div className="flex flex-col items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        </AuthShell>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  )
}
