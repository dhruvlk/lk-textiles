"use client"

import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"
import { Mail, CheckCircle2, ArrowLeft, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AuthShell } from "@/components/auth/AuthShell"
import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from "@/lib/validations/auth-recovery"

const RESEND_COOLDOWN_SECONDS = 60

export default function ForgotPasswordPage() {
  const { requestPasswordReset } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(0)
  const [submittedEmail, setSubmittedEmail] = useState("")
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  })

  useEffect(() => {
    if (cooldown > 0) {
      timerRef.current = setTimeout(() => {
        setCooldown((prev) => prev - 1)
      }, 1000)
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [cooldown])

  const handleSendReset = async (email: string) => {
    setIsLoading(true)
    setServerError(null)

    try {
      const result = await requestPasswordReset(email)
      if (result.error) {
        // Parse Supabase error message gracefully without exposing raw tech details
        const lowerErr = result.error.toLowerCase()
        if (lowerErr.includes("rate") || lowerErr.includes("security purposes") || lowerErr.includes("seconds")) {
          const msg = "Too many requests. Please wait a minute before requesting another link."
          setServerError(msg)
          toast.error(msg)
        } else if (lowerErr.includes("network") || lowerErr.includes("fetch")) {
          const msg = "Unable to connect to the server. Please check your internet connection and try again."
          setServerError(msg)
          toast.error(msg)
        } else {
          setServerError(result.error)
          toast.error(result.error)
        }
        setIsLoading(false)
        return
      }

      setIsSuccess(true)
      setSubmittedEmail(email)
      setCooldown(RESEND_COOLDOWN_SECONDS)
      toast.success("Password reset request submitted")
    } catch {
      const fallbackMsg = "An unexpected error occurred while processing your request. Please try again."
      setServerError(fallbackMsg)
      toast.error(fallbackMsg)
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    if (isLoading) return
    await handleSendReset(values.email)
  }

  const handleResend = async () => {
    if (cooldown > 0 || isLoading || !submittedEmail) return
    await handleSendReset(submittedEmail)
  }

  const handleDifferentEmail = () => {
    setIsSuccess(false)
    setServerError(null)
    form.reset({ email: "" })
  }

  return (
    <AuthShell
      title="Forgot your password?"
      description="Enter your registered email address and we'll send you a password reset link."
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
      {isSuccess ? (
        <div className="space-y-5">
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-center sm:p-5">
            <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium text-foreground">
              If an account exists for this email, you will receive a password reset link shortly.
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Please check your inbox at <span className="font-semibold text-foreground">{submittedEmail}</span> as well as your spam or junk folder.
            </p>
          </div>

          <div className="space-y-2.5">
            <Button
              type="button"
              variant="outline"
              className="h-10 w-full"
              onClick={handleResend}
              disabled={cooldown > 0 || isLoading}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              {cooldown > 0 ? `Resend link in ${cooldown}s` : "Resend reset link"}
            </Button>

            <button
              type="button"
              onClick={handleDifferentEmail}
              className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
            >
              Try a different email address
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
          {serverError && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
              {serverError}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email Address
            </Label>
            <div className="relative">
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                autoComplete="email"
                disabled={isLoading}
                aria-invalid={!!form.formState.errors.email}
                className="h-10 pr-9"
                {...form.register("email")}
              />
              <Mail className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
            {form.formState.errors.email && (
              <p className="text-xs text-destructive font-medium" role="alert">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="h-10 w-full"
            disabled={isLoading}
            loading={isLoading}
          >
            {isLoading ? "Sending reset link..." : "Send Reset Link"}
          </Button>
        </form>
      )}
    </AuthShell>
  )
}
