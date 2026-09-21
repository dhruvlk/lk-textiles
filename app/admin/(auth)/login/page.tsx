"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PasswordInput } from "@/components/ui/password-input"
import { AuthShell } from "@/components/auth/AuthShell"

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const { login, isAuthenticated } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/")
    }
  }, [isAuthenticated, router])

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true)

    // 1. Try Challan Supabase login first
    const result = await login(values.email, values.password)
    if (!result.error) {
      toast.success("Welcome back!")
      router.push("/admin")
      setIsLoading(false)
      return
    }

    // 2. If Challan login fails, check if this is the Landing Page Admin
    try {
      const landingRes = await fetch("/api/admin/landing/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: values.email, password: values.password }),
      })
      if (landingRes.ok) {
        toast.success("Welcome back! Landing Admin authenticated.")
        router.push("/admin")
        setIsLoading(false)
        return
      }
    } catch {
      // Fall through
    }

    toast.error(result.error || "Invalid login credentials")
    setIsLoading(false)
  }

  if (isAuthenticated) return null

  return (
    <AuthShell
      title="Welcome back"
      description="Sign in to your company workspace"
      footer={
        <div className="space-y-3">
          <div>
            Don&apos;t have an account?{" "}
            <Link href="/admin/register" className="font-medium text-primary hover:underline">
              Register your company
            </Link>
          </div>
          <div className="pt-2 text-xs text-muted-foreground border-t">
            Managing Landing Page Content?{" "}
            <Link href="/admin" className="font-semibold text-slate-800 hover:underline">
              Open Landing Page Admin &rarr;
            </Link>
          </div>
        </div>
      }
    >
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@company.com"
            className="h-10"
            {...form.register("email")}
          />
          {form.formState.errors.email && (
            <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href="/admin/forgot-password" className="text-xs text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <PasswordInput
            id="password"
            placeholder="••••••••"
            className="h-10"
            {...form.register("password")}
          />
          {form.formState.errors.password && (
            <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
          )}
        </div>

        <Button type="submit" className="h-10 w-full" loading={isLoading}>
          {isLoading ? "Signing in..." : "Sign in"}
        </Button>
      </form>
    </AuthShell>
  )
}
