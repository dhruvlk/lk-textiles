import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { SalarySlipPaymentStatus } from "@/types"

const STATUS_CONFIG: Record<
  SalarySlipPaymentStatus,
  { label: string; emoji: string; className: string }
> = {
  Pending: {
    label: "Pending",
    emoji: "🟡",
    className: "border-amber-200/60 bg-amber-50 text-amber-800",
  },
  "Partially Paid": {
    label: "Partially Paid",
    emoji: "🟠",
    className: "border-orange-200/60 bg-orange-50 text-orange-800",
  },
  Paid: {
    label: "Paid",
    emoji: "🟢",
    className: "border-emerald-200/60 bg-emerald-50 text-emerald-800",
  },
}

interface SalarySlipStatusBadgeProps {
  status: SalarySlipPaymentStatus
  className?: string
  showEmoji?: boolean
}

export function SalarySlipStatusBadge({
  status,
  className,
  showEmoji = true,
}: SalarySlipStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.Pending

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 px-2.5 py-0.5 text-xs font-medium shadow-sm",
        config.className,
        className
      )}
    >
      {showEmoji && <span aria-hidden>{config.emoji}</span>}
      {config.label}
    </Badge>
  )
}
