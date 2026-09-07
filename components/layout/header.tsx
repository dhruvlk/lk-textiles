"use client"

import { useCompany } from "@/components/company-provider"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Building2, Check } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { NotificationBell } from "@/components/notifications/NotificationBell"
import { useAuth } from "@/hooks/useAuth"

export function Header() {
  const { selectedCompany, companies, setSelectedCompany } = useCompany()
  const { user } = useAuth()
  const hasMultipleCompanies = companies.length > 1

  const companyLabel = (
    <>
      <Building2 className="h-4 w-4 shrink-0 text-primary" />
      <span className="truncate text-sm">{selectedCompany?.name || "Your company"}</span>
    </>
  )

  return (
    <header className="sticky top-0 z-40 flex h-14 w-full items-center justify-end gap-2 border-b border-border/60 glass pl-14 pr-3 sm:px-4 md:gap-3 md:pl-4 md:pr-6">
      <div className="mr-auto min-w-0 md:mr-0" />
      {hasMultipleCompanies ? (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="outline"
                className="h-9 max-w-[220px] gap-2 px-3 shadow-xs"
              />
            }
          >
            {companyLabel}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {companies.map((company) => (
              <DropdownMenuItem
                key={company.id}
                onClick={() => setSelectedCompany(company)}
                className="gap-2"
              >
                <span className="flex-1 truncate">{company.name}</span>
                {selectedCompany?.id === company.id && (
                  <Check className="h-4 w-4 shrink-0 text-primary" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <div className="flex h-9 max-w-[220px] items-center gap-2 rounded-md border border-border/60 bg-card px-3 shadow-xs">
          {companyLabel}
        </div>
      )}

      <NotificationBell />

      {user && (
        <div className="flex items-center gap-2.5 rounded-full border border-border/60 bg-card py-1 pl-1 pr-3 shadow-xs">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
              {user.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="hidden min-w-0 md:block">
            <p className="truncate text-sm font-medium leading-none">{user.name}</p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {user.role} · {user.email}
            </p>
          </div>
        </div>
      )}
    </header>
  )
}
