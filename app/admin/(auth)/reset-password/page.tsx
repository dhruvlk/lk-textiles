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

  const isExchangingRef = useRef(false)
  const isResolvedValidRef = useRef(false)
  const recoveryMarkerRef = useRef(false)

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
    mode: "onTouched",
  })

  // Helper to check whether recovery was previously authorized in this browser session
  const isRecoveryMarked = useCallback(() => {
    if (recoveryMarkerRef.current) return true
    if (typeof window !== "undefined") {
      try {
        return sessionStorage.getItem(RECOVERY_STORAGE_KEY) === "true"
      } catch {
        return false
      }
    }
    return false
  }, [])

  // Helper to mark recovery authorization as successfully verified
  const markRecoveryValid = useCallback(() => {
    isResolvedValidRef.current = true
    recoveryMarkerRef.current = true
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem(RECOVERY_STORAGE_KEY, "true")
      } catch {
        // ignore storage errors
      }
      // Strip sensitive code/token parameters from the URL without triggering a page reload
      if (window.location.search || window.location.hash) {
        window.history.replaceState({}, "", window.location.pathname)
      }
    }
    setPageState({ type: "valid" })
  }, [])

  // Helper to mark recovery authorization as invalid
  const markRecoveryInvalid = useCallback((errorMsg: string) => {
    // If a valid recovery session was already confirmed, do not let background retries overwrite it
    if (isResolvedValidRef.current) return

    recoveryMarkerRef.current = false
    if (typeof window !== "undefined") {
      try {
        sessionStorage.removeItem(RECOVERY_STORAGE_KEY)
      } catch {
        // ignore storage errors
      }
    }
    setPageState({ type: "invalid", error: errorMsg })
  }, [])

  useEffect(() => {
    let isMounted = true
    const supabase = createClient()

    // 1. Listen continuously to auth state changes.
    // In @supabase/ssr, when detectSessionInUrl is true (default),
    // GoTrueClient automatically exchanges code/hash during init and emits PASSWORD_RECOVERY.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return

        if (event === "PASSWORD_RECOVERY") {
          markRecoveryValid()
          return
        }

        if (event === "SIGNED_IN" && session) {
          const hasCodeOrHash =
            Boolean(searchParams.get("code")) ||
            Boolean(searchParams.get("token_hash")) ||
            searchParams.get("recovery") === "1" ||
            (typeof window !== "undefined" &&
              (window.location.hash.includes("access_token") ||
                window.location.hash.includes("type=recovery")))

          if (hasCodeOrHash || isRecoveryMarked()) {
            markRecoveryValid()
          }
        }
      }
    )

    async function verifyRecoverySession() {
      // Step A: Check for query error parameters (?error=access_denied&error_description=...)
      const queryError = searchParams.get("error")
      const queryErrorDescription = searchParams.get("error_description")
      if (queryError) {
        const msg =
          queryErrorDescription ||
          "This password reset link is invalid or has expired. Please request a new link."
        markRecoveryInvalid(msg)
        return
      }

      // Step B: Check for hash error parameters (#error=access_denied&error_description=...)
      if (typeof window !== "undefined" && window.location.hash) {
        const hash = window.location.hash.substring(1)
        const params = new URLSearchParams(hash)
        if (params.get("error")) {
          const desc =
            params.get("error_description") ||
            "This password reset link is invalid or has expired. Please request a new link."
          markRecoveryInvalid(desc)
          return
        }
      }

      // Step C: Check for token_hash (?token_hash=... or in hash) - Cross-browser OTP verification
      let tokenHash = searchParams.get("token_hash")
      if (!tokenHash && typeof window !== "undefined" && window.location.hash) {
        const hash = window.location.hash.substring(1)
        const params = new URLSearchParams(hash)
        tokenHash = params.get("token_hash")
      }

      if (tokenHash) {
        if (isExchangingRef.current) return
        isExchangingRef.current = true
        try {
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: "recovery",
          })

          if (!isMounted) return

          if (error || !data.session) {
            markRecoveryInvalid(
              error?.message ||
                "The password reset link is invalid or has expired. Please request a new link."
            )
            return
          }

          markRecoveryValid()
          return
        } catch (err) {
          if (!isMounted) return
          markRecoveryInvalid(
            err instanceof Error ? err.message : "Failed to verify password reset link."
          )
          return
        }
      }

      // Step D: Check for callback route recovery redirect (?recovery=1)
      if (searchParams.get("recovery") === "1") {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (!isMounted) return
        if (session) {
          markRecoveryValid()
          return
        }
      }

      // Step E: Check for PKCE auth code (?code=...)
      const code = searchParams.get("code")

      // Step F: Check active session from Supabase SDK.
      // In @supabase/ssr, getSession() automatically awaits GoTrueClient's initializePromise.
      // If code was present and code-verifier was in cookies, initializePromise ALREADY exchanged it!
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!isMounted) return

      const hasHashRecovery =
        typeof window !== "undefined" &&
        (window.location.hash.includes("type=recovery") ||
          window.location.hash.includes("access_token"))

      if (session && (code || hasHashRecovery || isRecoveryMarked())) {
        markRecoveryValid()
        return
      }

      // If code is in URL but getSession() returned no session yet,
      // exchange it explicitly while preserving the code verifier
      if (code) {
        if (isExchangingRef.current) return
        isExchangingRef.current = true

        try {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code)
          if (!isMounted) return

          if (error || !data.session) {
            const lowerMsg = (error?.message || "").toLowerCase()
            if (
              lowerMsg.includes("pkce") ||
              lowerMsg.includes("code verifier") ||
              lowerMsg.includes("non-empty")
            ) {
              markRecoveryInvalid(
                "This reset link was opened in a different browser, device, or incognito window than where you requested it. For security, please open the link in the same browser where you submitted the reset request, or request a new link."
              )
              return
            }

            // Before failing, check if the session was established in parallel by the SDK init
            const {
              data: { session: parallelSession },
            } = await supabase.auth.getSession()
            if (parallelSession) {
              markRecoveryValid()
              return
            }

            markRecoveryInvalid(
              error?.message ||
                "The password reset code is invalid or has already been used. Please request a new link."
            )
            return
          }

          markRecoveryValid()
          return
        } catch (err) {
          if (!isMounted) return
          // Check if session was established despite exception
          const {
            data: { session: parallelSession },
          } = await supabase.auth.getSession()
          if (parallelSession) {
            markRecoveryValid()
            return
          }

          markRecoveryInvalid(
            err instanceof Error ? err.message : "Failed to verify password reset code."
          )
          return
        }
      }

      // Step G: Implicit flow with hash fragment (#access_token=...&type=recovery)
      if (hasHashRecovery) {
        let attempts = 0
        const interval = setInterval(async () => {
          attempts++
          if (!isMounted) {
            clearInterval(interval)
            return
          }
          const {
            data: { session: hashSession },
          } = await supabase.auth.getSession()
          if (hashSession) {
            clearInterval(interval)
            markRecoveryValid()
          } else if (attempts >= 6) {
            clearInterval(interval)
            markRecoveryInvalid(
              "Unable to verify your password reset session. Please request a new link."
            )
          }
        }, 250)
        return
      }

      // Step H: Page reload or back navigation with existing recovery marker
      if (session && isRecoveryMarked()) {
        markRecoveryValid()
        return
      }

      // Step I: No valid code, token, hash, or recovery session: Reject unauthorized access
      markRecoveryInvalid(
        "No valid password reset session was found. Please open the link sent to your email or request a new one."
      )
    }

    verifyRecoverySession()

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [searchParams, markRecoveryValid, markRecoveryInvalid, isRecoveryMarked])

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
      const supabase = createClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        const expiredMsg =
          "Your password reset session has expired or is no longer active. Please request a new link."
        setFormError(expiredMsg)
        setPageState({ type: "invalid", error: expiredMsg })
        setIsSubmitting(false)
        return
      }

      const { error } = await supabase.auth.updateUser({
        password: values.password,
      })

      if (error) {
        setFormError(error.message)
        toast.error(error.message)
        setIsSubmitting(false)
        return
      }

      // Password updated successfully!
      form.reset({ password: "", confirmPassword: "" })
      recoveryMarkerRef.current = false
      if (typeof window !== "undefined") {
        try {
          sessionStorage.removeItem(RECOVERY_STORAGE_KEY)
        } catch {
          // ignore
        }
      }

      // Cleanly sign out recovery session so user can log in fresh with new password
      try {
        await supabase.auth.signOut()
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
