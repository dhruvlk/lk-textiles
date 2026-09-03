import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { AuthGuard } from "@/components/auth/AuthGuard"
import { CompanyProvider } from "@/components/company-provider"
import {
  PermissionProvider,
  RoutePermissionGate,
} from "@/context/PermissionContext"
import { PageTransition } from "@/components/common/motion"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
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
