import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/utils"

/**
 * Standard table skeleton with search bar simulation and rows.
 */
export function TableSkeleton({
  rows = 5,
  cols = 5,
  showSearchBar = true,
  className,
}: {
  rows?: number
  cols?: number
  showSearchBar?: boolean
  className?: string
}) {
  return (
    <div className={cn("space-y-4", className)}>
      {showSearchBar && (
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <Skeleton className="h-10 w-full sm:w-72 rounded-lg" />
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Skeleton className="h-10 w-28 rounded-lg" />
            <Skeleton className="h-10 w-28 rounded-lg" />
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/40 flex gap-4">
          {Array.from({ length: cols }).map((_, i) => (
            <Skeleton key={i} className="h-5 flex-1 rounded" />
          ))}
        </div>
        <div className="divide-y divide-border">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="p-4 flex gap-4 items-center">
              {Array.from({ length: cols }).map((_, j) => (
                <Skeleton
                  key={j}
                  className={cn("h-4 rounded flex-1", j === 0 && "w-1/4 flex-none")}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * Card grid skeleton for companies, products, etc.
 */
export function CardGridSkeleton({
  count = 6,
  columns = "md:grid-cols-2 xl:grid-cols-3",
  className,
}: {
  count?: number
  columns?: string
  className?: string
}) {
  return (
    <div className={cn("grid gap-4", columns, className)}>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <CardHeader className="flex flex-row items-center gap-3 pb-3">
            <Skeleton className="h-12 w-12 rounded-xl shrink-0" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-5 w-3/4 rounded" />
              <Skeleton className="h-3.5 w-1/2 rounded" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2 pt-2">
            <Skeleton className="h-3.5 w-full rounded" />
            <Skeleton className="h-3.5 w-2/3 rounded" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

/**
 * Stat cards skeleton row.
 */
export function StatCardsSkeleton({ count = 4, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-4", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
            <Skeleton className="h-8 w-32 rounded" />
            <Skeleton className="h-3 w-20 rounded" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

/**
 * Standard Form Skeleton.
 */
export function FormSkeleton({ fields = 6, className }: { fields?: number; className?: string }) {
  return (
    <Card className={cn("p-6", className)}>
      <div className="space-y-6">
        <div className="space-y-2 pb-4 border-b border-border">
          <Skeleton className="h-6 w-48 rounded" />
          <Skeleton className="h-4 w-80 rounded" />
        </div>
        <div className="grid sm:grid-cols-2 gap-6">
          {Array.from({ length: fields }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-28 rounded" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Skeleton className="h-10 w-24 rounded-lg" />
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
      </div>
    </Card>
  )
}

/**
 * Full page skeleton with header and content.
 */
export function PageSkeleton({
  variant = "table",
  className,
}: {
  variant?: "table" | "cards" | "form"
  className?: string
}) {
  return (
    <div className={cn("space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto", className)}>
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border/60">
        <div className="space-y-1.5">
          <Skeleton className="h-3.5 w-20 rounded" />
          <Skeleton className="h-7 w-48 rounded" />
          <Skeleton className="h-4 w-72 rounded" />
        </div>
        <Skeleton className="h-10 w-36 rounded-lg" />
      </div>

      {/* Content Skeleton */}
      {variant === "table" && <TableSkeleton rows={6} cols={5} />}
      {variant === "cards" && <CardGridSkeleton count={6} />}
      {variant === "form" && <FormSkeleton fields={6} />}
    </div>
  )
}
