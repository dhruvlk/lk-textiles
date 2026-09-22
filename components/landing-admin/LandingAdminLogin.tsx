"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldAlert,
  Loader2,
  ArrowRight,
  Building2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

interface LandingAdminLoginProps {
  onLoginSuccess: (email: string) => void
}

export function LandingAdminLogin({ onLoginSuccess }: LandingAdminLoginProps) {
  const [email, setEmail] = useState("lktextiles6165@gmail.com")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg("")

    if (!email.trim()) {
      setErrorMsg("Please enter your admin email.")
      return
    }
    if (!password) {
      setErrorMsg("Please enter your admin password.")
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch("/api/admin/landing/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Authentication failed.")
      }

      toast.success("Welcome back! Landing Admin authenticated.")
      onLoginSuccess(data.email || email)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Invalid credentials. Please verify and try again."
      setErrorMsg(msg)
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-center items-center px-4 py-12 bg-[#FAF9F5] overflow-y-auto overflow-x-hidden selection:bg-slate-900 selection:text-white">
      {/* Background Decorative Mesh & Glows */}
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-amber-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-slate-300/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -top-24 right-1/3 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main Card Container */}
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-white/95 backdrop-blur-2xl rounded-[2rem] p-7 sm:p-9 shadow-[0_20px_60px_-15px_rgba(15,23,42,0.12)] border border-slate-200/90 relative overflow-hidden">
          {/* Header & Logo */}
          <div className="flex flex-col items-center text-center space-y-4 pt-1 mb-7">
            {/* Logo Wrapper */}
            <div className="relative h-16 w-48 flex items-center justify-center shadow-xs transition-transform hover:scale-[1.02]">
              <Image
                src="/logo-1.png"
                alt="LK Textiles"
                width={200}
                height={60}
                className="object-contain max-h-25 w-auto"
                priority
              />
            </div>

            {/* Title & Description */}
            <div className="space-y-1.5">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Admin Portal
              </h1>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                Sign in to manage homepage hero, fabric collections, heritage story, and company info.
              </p>
            </div>
          </div>

          {/* Error Message Callout */}
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mb-5 p-3.5 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-start gap-2.5 text-xs text-destructive font-medium"
            >
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <Label
                htmlFor="admin-email"
                className="text-[11px] font-bold uppercase tracking-wider text-slate-600"
              >
                Admin Email
              </Label>
              <div className="relative group">
                <Mail className="w-4 h-4 text-slate-400 group-focus-within:text-slate-900 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors pointer-events-none" />
                <Input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="lktextiles6165@gmail.com"
                  className="pl-10 h-12 text-sm rounded-xl bg-slate-50/70 border-slate-200 hover:bg-slate-50 focus:bg-white focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 transition-all font-medium text-slate-900 [&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_#f8fafc]"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <Label
                htmlFor="admin-password"
                className="text-[11px] font-bold uppercase tracking-wider text-slate-600"
              >
                Password
              </Label>
              <div className="relative group">
                <Lock className="w-4 h-4 text-slate-400 group-focus-within:text-slate-900 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors pointer-events-none" />
                <Input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="pl-10 pr-11 h-12 text-sm rounded-xl bg-slate-50/70 border-slate-200 hover:bg-slate-50 focus:bg-white focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 transition-all font-medium text-slate-900 [&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_#f8fafc]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 rounded-md transition-colors focus:outline-none"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-xl bg-primary text-white hover:bg-primary font-bold text-sm shadow-md hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Content Manager</span>
                  <ArrowRight className="w-4 h-4 text-slate-300" />
                </>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200/80" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
              <span className="bg-white px-3 text-slate-400">Isolated CMS Access</span>
            </div>
          </div>

          {/* Challan Switch Link */}
          <div className="text-center">
            <Link
              href="/admin/login"
              className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-950 font-semibold group transition-colors"
            >
              <Building2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 transition-colors" />
              <span>Looking for company billing?</span>
              <span className="text-primary underline underline-offset-2">Challan System Login &rarr;</span>
            </Link>
          </div>
        </div>

        {/* Security Footer Note */}
        <div className="mt-6 text-center space-y-1.5 text-xs text-slate-400">
          <p className="text-[11px]">&copy; {new Date().getFullYear()} LK Textiles. Internal use only.</p>
        </div>
      </motion.div>
    </div>
  )
}
