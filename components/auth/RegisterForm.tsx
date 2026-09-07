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
import { Textarea } from "@/components/ui/textarea"
import { PasswordInput } from "@/components/ui/password-input"
import { AuthShell } from "@/components/auth/AuthShell"

export const registerSchema = z
  .object({
    companyName: z.string().min(2, "Company name is required"),
    ownerName: z.string().min(2, "Owner name is required"),
    email: z.string().email("Invalid email address"),
    mobile: z
      .string()
      .min(10, "Enter a valid mobile number")
      .regex(/^[0-9+\-\s()]+$/, "Invalid mobile number"),
    gstNumber: z.string().optional(),
    address: z.string().min(5, "Company address is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

export type RegisterFormValues = z.infer<typeof registerSchema>

export interface RegisterFormProps {
  loginHref?: string
  successRedirect?: string
  confirmationRedirect?: string
}

export function RegisterForm({
  loginHref = "/admin/login",
  successRedirect = "/admin",
  confirmationRedirect = "/admin/login",
}: RegisterFormProps) {
  const router = useRouter()
  const { register: registerAuth, isAuthenticated } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      router.replace(successRedirect)
    }
  }, [isAuthenticated, router, successRedirect])

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      companyName: "",
      ownerName: "",
      email: "",
      mobile: "",
      gstNumber: "",
      address: "",
      password: "",
      confirmPassword: "",
    },
  })

  const onSubmit = async (values: RegisterFormValues) => {
    setIsLoading(true)
    const result = await registerAuth({
      companyName: values.companyName,
      ownerName: values.ownerName,
      email: values.email,
      mobile: values.mobile,
      gstNumber: values.gstNumber,
      address: values.address,
      password: values.password,
    })

    if (result.error) {
      toast.error(result.error)
      setIsLoading(false)
      return
    }

    if (result.requiresConfirmation) {
      toast.success("Check your email to confirm your account before signing in.")
      router.push(confirmationRedirect)
      setIsLoading(false)
      return
    }

    toast.success("Company workspace created successfully!")
    router.push(successRedirect)
    setIsLoading(false)
  }

  if (isAuthenticated) return null

  return (
    <AuthShell
      title="Create your company"
      description="Register a secure workspace for your business"
      className="max-w-lg"
      footer={
        <>
          Already have an account?{" "}
          <Link href={loginHref} className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="companyName">Company Name</Label>
            <Input id="companyName" placeholder="Acme Textiles Pvt Ltd" {...form.register("companyName")} />
            {form.formState.errors.companyName && (
              <p className="text-sm text-destructive">{form.formState.errors.companyName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="ownerName">Owner Name</Label>
            <Input id="ownerName" placeholder="Full name" {...form.register("ownerName")} />
            {form.formState.errors.ownerName && (
              <p className="text-sm text-destructive">{form.formState.errors.ownerName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="mobile">Mobile Number</Label>
            <Input id="mobile" placeholder="+91 98765 43210" {...form.register("mobile")} />
            {form.formState.errors.mobile && (
              <p className="text-sm text-destructive">{form.formState.errors.mobile.message}</p>
            )}
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" type="email" placeholder="you@company.com" {...form.register("email")} />
            {form.formState.errors.email && (
              <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="gstNumber">GST Number (Optional)</Label>
            <Input id="gstNumber" placeholder="22AAAAA0000A1Z5" {...form.register("gstNumber")} />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="address">Company Address</Label>
            <Textarea id="address" rows={3} placeholder="Street, city, state" {...form.register("address")} />
            {form.formState.errors.address && (
              <p className="text-sm text-destructive">{form.formState.errors.address.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <PasswordInput
              id="password"
              {...form.register("password")}
            />
            {form.formState.errors.password && (
              <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <PasswordInput
              id="confirmPassword"
              {...form.register("confirmPassword")}
            />
            {form.formState.errors.confirmPassword && (
              <p className="text-sm text-destructive">{form.formState.errors.confirmPassword.message}</p>
            )}
          </div>
        </div>

        <Button type="submit" className="h-10 w-full" loading={isLoading}>
          {isLoading ? "Creating workspace..." : "Create company account"}
        </Button>
      </form>
    </AuthShell>
  )
}
