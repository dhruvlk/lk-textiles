import { LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  iconClassName?: string
  isLoading?: boolean
  className?: string
  /** Future-ready trend label (e.g. "+12% vs last month") */
  trendLabel?: string
  trendDirection?: "up" | "down" | "neutral"
}

export function StatCard({
  title,
  value,
  icon: Icon,
  iconClassName,
  isLoading,
  className,
  trendLabel,
  trendDirection = "neutral",
}: StatCardProps) {
  const valueText = String(value)
  const isLongValue = valueText.length > 12

  return (
    <Card
      className={cn(
        "h-full transition-shadow duration-200 hover:shadow-elevated",
        className
      )}
    >
      <CardContent className="flex h-full items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-2 pr-1">
          <p className="line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-5 text-muted-foreground">
            {title}
          </p>
          {isLoading ? (
            <Skeleton className="h-8 w-28" />
          ) : (
            <p
              className={cn(
                "break-words font-semibold tracking-tight text-foreground tabular-nums",
                isLongValue ? "text-lg leading-7 sm:text-xl sm:leading-8" : "text-2xl leading-8"
              )}
              title={valueText}
            >
              {value}
            </p>
          )}
          <p
            className={cn(
              "min-h-4 text-xs font-medium leading-4",
              !trendLabel && "invisible",
              trendLabel && trendDirection === "up" && "text-emerald-600",
              trendLabel && trendDirection === "down" && "text-rose-600",
              trendLabel && trendDirection === "neutral" && "text-muted-foreground"
            )}
          >
            {trendLabel || "—"}
          </p>
        </div>
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/8 ring-1 ring-primary/10",
            iconClassName
          )}
        >
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </CardContent>
    </Card>
  )
}
