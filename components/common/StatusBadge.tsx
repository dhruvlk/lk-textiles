import React from "react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export type StatusBadgeVariant =
  | "draft"
  | "pending"
  | "delivered"
  | "returned"
  | "cancelled"
  | "paid"
  | "partial"
  | "partially_paid"
  | "unpaid"
  | "overdue"
  | "in_stock"
  | "low_stock"
  | "out_of_stock"
  | "active"
  | "inactive"
  | "new"
  | "read"
  | "default"

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status?: string | boolean | null
  variant?: StatusBadgeVariant
  showDot?: boolean
  pulseDot?: boolean
}

function normalizeStatus(status?: string | boolean | null): {
  normalized: StatusBadgeVariant
  label: string
} {
  if (typeof status === "boolean") {
    return status
      ? { normalized: "active", label: "Active" }
      : { normalized: "inactive", label: "Inactive" }
  }

  if (!status) {
    return { normalized: "default", label: "—" }
  }

  const raw = String(status).trim()
  const lower = raw.toLowerCase().replace(/[\s-_]+/g, "_")

  switch (lower) {
    case "draft":
      return { normalized: "draft", label: raw }
    case "pending":
      return { normalized: "pending", label: raw }
    case "delivered":
      return { normalized: "delivered", label: raw }
    case "returned":
      return { normalized: "returned", label: raw }
    case "cancelled":
    case "canceled":
      return { normalized: "cancelled", label: raw }
    case "paid":
      return { normalized: "paid", label: raw }
    case "partially_paid":
    case "partial":
      return { normalized: "partial", label: raw }
    case "unpaid":
      return { normalized: "unpaid", label: raw }
    case "overdue":
      return { normalized: "overdue", label: raw }
    case "in_stock":
      return { normalized: "in_stock", label: raw }
    case "low_stock":
      return { normalized: "low_stock", label: raw }
    case "out_of_stock":
      return { normalized: "out_of_stock", label: raw }
    case "active":
      return { normalized: "active", label: "Active" }
    case "inactive":
      return { normalized: "inactive", label: "Inactive" }
    case "new":
      return { normalized: "new", label: "New" }
    case "read":
      return { normalized: "read", label: "Read" }
    default:
      return { normalized: "default", label: raw }
  }
}

const statusStyleMap: Record<
  StatusBadgeVariant,
  {
    badgeClass: string
    dotClass?: string
    pulse?: boolean
  }
> = {
  draft: {
    badgeClass: "bg-muted text-muted-foreground border-transparent",
  },
  read: {
    badgeClass: "bg-muted text-muted-foreground border-transparent",
  },
  inactive: {
    badgeClass: "bg-muted/50 text-muted-foreground border-border/40",
  },
  pending: {
    badgeClass: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
    dotClass: "bg-amber-500",
  },
  low_stock: {
    badgeClass: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
    dotClass: "bg-amber-500",
    pulse: true,
  },
  new: {
    badgeClass: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
    dotClass: "bg-amber-500",
    pulse: true,
  },
  delivered: {
    badgeClass: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
    dotClass: "bg-emerald-500",
  },
  paid: {
    badgeClass: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
    dotClass: "bg-emerald-500",
  },
  in_stock: {
    badgeClass: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
    dotClass: "bg-emerald-500",
  },
  active: {
    badgeClass: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
    dotClass: "bg-emerald-500",
  },
  partial: {
    badgeClass: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
    dotClass: "bg-blue-500",
  },
  partially_paid: {
    badgeClass: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
    dotClass: "bg-blue-500",
  },
  returned: {
    badgeClass: "bg-primary/10 text-primary border-primary/20",
    dotClass: "bg-primary",
  },
  cancelled: {
    badgeClass: "bg-destructive/10 text-destructive border-destructive/20",
    dotClass: "bg-destructive",
  },
  overdue: {
    badgeClass: "bg-destructive/10 text-destructive border-destructive/20",
    dotClass: "bg-destructive",
    pulse: true,
  },
  out_of_stock: {
    badgeClass: "bg-destructive/10 text-destructive border-destructive/20",
    dotClass: "bg-destructive",
  },
  unpaid: {
    badgeClass: "bg-destructive/10 text-destructive border-destructive/20",
    dotClass: "bg-destructive",
  },
  default: {
    badgeClass: "bg-muted text-muted-foreground border-transparent",
  },
}

export function StatusBadge({
  status,
  variant,
  showDot = false,
  pulseDot,
  className,
  children,
  ...props
}: StatusBadgeProps) {
  const parsed = normalizeStatus(status)
  const resolvedVariant = variant || parsed.normalized
  const styleInfo = statusStyleMap[resolvedVariant] || statusStyleMap.default
  const shouldPulse = pulseDot ?? styleInfo.pulse

  return (
    <Badge
      variant="outline"
      className={cn(
        "inline-flex items-center gap-1.5 font-medium transition-colors",
        styleInfo.badgeClass,
        className
      )}
      {...props}
    >
      {showDot && styleInfo.dotClass && (
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            styleInfo.dotClass,
            shouldPulse && "animate-pulse"
          )}
        />
      )}
      {children || parsed.label}
    </Badge>
  )
}
