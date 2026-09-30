"use client"

import { useCompany } from "@/components/company-provider"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Building2, Check, ChevronDown, PlusCircle } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { NotificationBell } from "@/components/notifications/NotificationBell"
import { useAuth } from "@/hooks/useAuth"

export function Header() {
  const router = useRouter()
  const { selectedCompany, companies, setSelectedCompany } = useCompany()
  const { user } = useAuth()

  const companyLabel = (
    <>
      <Building2 className="h-4 w-4 shrink-0 text-primary" />
      <span className="truncate text-sm">{selectedCompany?.name || "Your company"}</span>
    </>
  )

  return (
    <header className="sticky top-0 z-40 flex h-14 w-full items-center justify-end gap-1.5 sm:gap-2 border-b border-border/60 glass pl-13 pr-2.5 sm:px-4 md:gap-3 md:pl-4 md:pr-6">
      <div className="mr-auto min-w-0 md:mr-0" />
      {companies.length > 0 ? (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="outline"
                className="h-9 max-w-[140px] sm:max-w-[200px] md:max-w-[240px] gap-1.5 sm:gap-2 px-2 sm:px-3 shadow-xs"
              />
            }
          >
            {companyLabel}
            <ChevronDown className="h-3 w-3 opacity-60 ml-auto shrink-0" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <div className="px-2 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Switch Company
            </div>
            {companies.map((company) => (
              <DropdownMenuItem
                key={company.id}
                onClick={() => setSelectedCompany(company)}
                className="flex items-center justify-between gap-2 py-2"
              >
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-xs font-medium">{company.name}</span>
                    {company.is_primary && (
                      <span className="text-[9px] px-1 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-semibold leading-none">
                        Primary
                      </span>
                    )}
                  </div>
                  {company.parent_company_id ? (
                    <span className="text-[10px] text-muted-foreground truncate">
                      Child of {companies.find((c) => c.id === company.parent_company_id)?.name || "Parent"}
                    </span>
                  ) : companies.some((c) => c.parent_company_id === company.id) ? (
                    <span className="text-[10px] text-primary truncate font-medium">Parent Entity</span>
                  ) : null}
                </div>
                {selectedCompany?.id === company.id && (
                  <Check className="h-4 w-4 shrink-0 text-primary" />
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => router.push("/admin/companies/new")}
              className="gap-2 text-primary font-medium cursor-pointer"
            >
              <PlusCircle className="h-4 w-4 shrink-0" />
              <span>+ Add Company</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <div className="flex h-9 max-w-[130px] sm:max-w-[180px] md:max-w-[220px] items-center gap-1.5 sm:gap-2 rounded-md border border-border/60 bg-card px-2 sm:px-3 shadow-xs">
          {companyLabel}
        </div>
      )}

      <NotificationBell />

      {user && (
        <div className="flex items-center gap-2 rounded-full border border-border/60 bg-card p-0.5 md:py-1 md:pl-1 md:pr-3 shadow-xs">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
              {user.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="hidden min-w-0 md:block">
            <p className="truncate text-sm font-medium leading-none">{user.name}</p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {user.role}
            </p>
          </div>
        </div>
      )}
    </header>
  )
}
