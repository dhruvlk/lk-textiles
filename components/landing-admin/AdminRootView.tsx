"use client"

import { useEffect, useState } from "react"
import DashboardClient from "@/components/dashboard/DashboardClient"
import { useAuth } from "@/hooks/useAuth"
import { LandingAdminLogin } from "@/components/landing-admin/LandingAdminLogin"
import { LandingAdminDashboard } from "@/components/landing-admin/LandingAdminDashboard"
import { Loader2 } from "lucide-react"

export function AdminRootView() {
  const { isAuthenticated, isLoading: isChallanAuthLoading } = useAuth()
  const [landingAdminEmail, setLandingAdminEmail] = useState<string | null>(null)
  const [isLandingAuthLoading, setIsLandingAuthLoading] = useState(true)

  useEffect(() => {
    if (isChallanAuthLoading || isAuthenticated) return

    let cancelled = false
    fetch("/api/admin/landing/me", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled) {
          setLandingAdminEmail(data?.authenticated ? (data.email || "lktextiles6165@gmail.com") : null)
          setIsLandingAuthLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLandingAdminEmail(null)
          setIsLandingAuthLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [isAuthenticated, isChallanAuthLoading])

  // 1. If Challan authentication is loading, display clean spinner
  if (isChallanAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  // 2. If user is authenticated with Challan system, render full Challan Dashboard
  if (isAuthenticated) {
    return <DashboardClient />
  }

  // 3. If landing admin session check is underway, show clean loading state
  if (isLandingAuthLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FA] space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-slate-800" />
        <span className="text-xs font-semibold text-slate-500">Checking admin session...</span>
      </div>
    )
  }

  // 4. If landing admin session is active, render Landing Admin Dashboard
  if (landingAdminEmail) {
    return (
      <LandingAdminDashboard
        adminEmail={landingAdminEmail}
        onLogout={() => {
          setLandingAdminEmail(null)
        }}
      />
    )
  }

  // 5. Otherwise, render Landing Admin Login
  return (
    <LandingAdminLogin
      onLoginSuccess={(email) => {
        setLandingAdminEmail(email)
      }}
    />
  )
}
