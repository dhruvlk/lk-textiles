"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Building2,
  Users,
  Package,
  FileText,
  FileSignature,
  PieChart,
  LogOut,
  Menu,
  Truck,
  Warehouse,
  UsersRound,
  Settings,
  type LucideIcon,
} from "lucide-react"
import { FEATURES } from "@/lib/features"
import type { PermissionModule } from "@/constants/permissions"
import { useCompany } from "@/components/company-provider"
import { usePermissions } from "@/context/PermissionContext"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useState } from "react"
import { LogoutDialog } from "@/components/auth/LogoutDialog"
import { CompanyAvatar } from "@/components/companies/CompanyAvatar"
import type { Company } from "@/types"

const navigation: {
  name: string
  href: string
  icon: LucideIcon
  feature?: keyof typeof FEATURES
  module: PermissionModule
}[] = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard, module: "dashboard" },
  { name: "Companies", href: "/admin/companies", icon: Building2, module: "companies" },
  { name: "Customers", href: "/admin/parties", icon: Users, module: "customers" },
  { name: "Products", href: "/admin/products", icon: Package, feature: "productsModule", module: "products" },
  { name: "Stock", href: "/admin/stock", icon: Warehouse, module: "stock" },
  { name: "Delivery Challans", href: "/admin/delivery-challans", icon: Truck, module: "delivery_challans" },
  { name: "Invoice", href: "/admin/invoices", icon: FileText, module: "invoices" },
  { name: "Letter Pad", href: "/admin/letter-pads", icon: FileSignature, module: "letter_pads" },
  { name: "Reports", href: "/admin/reports", icon: PieChart, module: "reports" },
  { name: "Employees", href: "/admin/employees", icon: UsersRound, module: "employees" },
  {
    name: "Settings",
    href: "/admin/settings",
    icon: Settings,
    feature: "companySettingsModule",
    module: "settings",
  },
]

interface SidebarContentProps {
  pathname: string
  selectedCompany: Company | null
  navItems: typeof navigation
  onNavigate?: () => void
  onLogoutClick: () => void
  collapsed?: boolean
}

function SidebarContent({
  pathname,
  selectedCompany,
  navItems,
  onNavigate,
  onLogoutClick,
  collapsed = false,
}: SidebarContentProps) {
  return (
    <div className="flex h-full flex-col bg-sidebar">
      <div className={cn("border-b border-sidebar-border py-4", collapsed ? "px-2" : "px-4")}>
        <Link
          href="/admin"
          className={cn(
            "group flex items-center rounded-xl p-2 transition-colors hover:bg-sidebar-accent/60",
            collapsed ? "justify-center" : "gap-3.5"
          )}
          onClick={onNavigate}
          title={selectedCompany?.name ?? "Company"}
        >
          <CompanyAvatar
            name={selectedCompany?.name ?? "Company"}
            logoUrl={selectedCompany?.logo_url}
            size="sidebar"
            interactive
          />
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-[18px] font-semibold leading-tight tracking-tight text-sidebar-foreground">
                {selectedCompany?.name ?? "Select company"}
              </p>
              {selectedCompany?.gst_number ? (
                <p className="mt-1 truncate text-[13px] text-muted-foreground">
                  GST {selectedCompany.gst_number}
                </p>
              ) : (
                <p className="mt-1 text-xs text-muted-foreground">Company workspace</p>
              )}
            </div>
          )}
        </Link>
      </div>

      <nav className={cn("flex-1 space-y-0.5 overflow-auto py-4", collapsed ? "px-1.5" : "px-3")}>
        {navItems.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname === item.href || pathname.startsWith(`${item.href}/`)
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onNavigate}
              title={item.name}
              className={cn(
                "relative flex items-center rounded-lg py-2.5 text-sm font-medium transition-colors duration-200",
                collapsed ? "justify-center px-2" : "gap-3 px-3",
                isActive
                  ? "text-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              {isActive && (
                <motion.span
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-lg bg-primary/10 ring-1 ring-primary/15"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <item.icon className={cn("relative z-10 h-4 w-4 shrink-0", isActive && "text-primary")} />
              {!collapsed && <span className="relative z-10">{item.name}</span>}
            </Link>
          )
        })}
      </nav>

      <div className={cn("space-y-2 border-t border-sidebar-border", collapsed ? "p-2" : "p-4")}>
        <Button
          variant="ghost"
          className={cn(
            "text-muted-foreground hover:text-destructive",
            collapsed ? "mx-auto flex h-10 w-10" : "w-full justify-start"
          )}
          size={collapsed ? "icon" : "default"}
          onClick={onLogoutClick}
          title="Log out"
        >
          <LogOut className={cn("h-4 w-4", !collapsed && "mr-2")} />
          {!collapsed && "Log out"}
        </Button>
      </div>
    </div>
  )
}

export function Sidebar() {
  const pathname = usePathname()
  const { selectedCompany } = useCompany()
  const { canView, isLoading } = usePermissions()
  const [open, setOpen] = useState(false)
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)

  const closeMobileMenu = () => setOpen(false)

  const navItems = navigation.filter((item) => {
    if (item.feature && !FEATURES[item.feature]) return false
    if (isLoading) return item.module === "dashboard"
    return canView(item.module)
  })

  const sidebarProps: SidebarContentProps = {
    pathname,
    selectedCompany,
    navItems,
    onLogoutClick: () => setLogoutDialogOpen(true),
  }

  return (
    <>
      {/* Mobile: hamburger + drawer */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          render={
            <Button
              variant="outline"
              size="icon"
              className="absolute top-3 left-3 z-50 h-11 w-11 md:hidden"
            />
          }
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle navigation menu</span>
        </SheetTrigger>
        <SheetContent side="left" className="w-[min(100vw-3rem,20rem)] border-sidebar-border bg-sidebar p-0">
          <SidebarContent {...sidebarProps} onNavigate={closeMobileMenu} />
        </SheetContent>
      </Sheet>

      {/* Tablet: collapsed icon rail */}
      <aside className="sticky top-0 hidden h-screen w-[4.5rem] shrink-0 border-r border-sidebar-border bg-sidebar md:block lg:hidden">
        <SidebarContent {...sidebarProps} collapsed />
      </aside>

      {/* Desktop: full sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-sidebar-border bg-sidebar lg:block xl:w-[17.5rem]">
        <SidebarContent {...sidebarProps} />
      </aside>

      <LogoutDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen} />
    </>
  )
}
