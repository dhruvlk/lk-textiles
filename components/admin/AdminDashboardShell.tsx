"use client"

import React from "react"
import { usePathname } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { AuthGuard } from "@/components/auth/AuthGuard"
import { CompanyProvider } from "@/components/company-provider"
import {
  PermissionProvider,
  RoutePermissionGate,
} from "@/context/PermissionContext"
import { PageTransition } from "@/components/common/motion"

const subscribe = () => () => {}

export function AdminDashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { isAuthenticated, isLoading } = useAuth()
  const mounted = React.useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  )

  // Check if we are on root /admin
  const isExactAdmin = !pathname || pathname === "/admin" || pathname === "/admin/"

  // While mounting or while Challan auth is loading on /admin, show clean loading spinner
  // so AuthGuard never mounts or triggers an unwanted redirect
  if (!mounted || (isExactAdmin && isLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  // If on /admin and NOT authenticated with Challan, render children directly.
  // This allows the Landing Admin Login and Landing Admin Dashboard to render
  // without Challan's sidebar, header, or Challan auth guard.
  if (isExactAdmin && !isAuthenticated) {
    return <>{children}</>
  }

  // 3. In all other cases:
  // - User is authenticated with Challan on /admin (renders Challan dashboard with sidebar & header)
  // - Or user is accessing any Challan subroute (/admin/invoices, /admin/delivery-challans, /admin/stock, etc.)
  return (
    <AuthGuard>
      <CompanyProvider>
        <PermissionProvider>
          <div className="flex min-h-screen bg-background">
            <Sidebar />
            <div className="flex min-w-0 flex-1 flex-col">
              <Header />
              <main className="scrollbar-stable min-h-0 flex-1 overflow-x-hidden">
                <PageTransition className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-4 sm:py-5 md:px-6 md:py-6 lg:px-8">
                  <RoutePermissionGate>{children}</RoutePermissionGate>
                </PageTransition>
              </main>
            </div>
          </div>
        </PermissionProvider>
      </CompanyProvider>
    </AuthGuard>
  )
}
