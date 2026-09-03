"use client"

import { useState } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { AuthShell } from "@/components/auth/AuthShell"

const forgotSchema = z.object({
  email: z.string().email("Enter a valid email address"),
})

type ForgotFormValues = z.infer<typeof forgotSchema>

export default function ForgotPasswordPage() {
  const { requestPasswordReset } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const form = useForm<ForgotFormValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: "" },
  })

  const onSubmit = async (values: ForgotFormValues) => {
    setIsLoading(true)
    const result = await requestPasswordReset(values.email)
    if (result.error) {
      toast.error(result.error)
      setIsLoading(false)
      return
    }
    setSent(true)
    toast.success("Password reset link sent to your email")
    setIsLoading(false)
  }

  return (
    <AuthShell
      title="Forgot password"
      description={sent ? "Check your inbox for the reset link" : "We'll email you a secure reset link"}
      footer={
        <Link href="/admin/login" className="font-medium text-primary hover:underline">
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@company.com"
            disabled={sent}
            {...form.register("email")}
          />
          {form.formState.errors.email && (
            <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
          )}
        </div>

        <Button type="submit" className="h-10 w-full" disabled={isLoading || sent}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : sent ? (
            "Email sent"
          ) : (
            "Send reset link"
          )}
        </Button>
      </form>
    </AuthShell>
  )
}
