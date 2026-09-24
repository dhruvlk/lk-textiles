"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { SearchInput } from "@/components/common/SearchInput"
import { TableSkeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface Column<T> {
  header: string
  accessorKey?: keyof T
  cell?: (item: T) => React.ReactNode
  className?: string
  /** Hide this field on mobile card layout */
  hideOnMobile?: boolean
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  searchPlaceholder?: string
  searchValue?: string
  onSearchChange?: (val: string) => void
  emptyMessage?: string
  isLoading?: boolean
  hideSearch?: boolean
  /** Prefer cards below `md` (default true) */
  mobileCards?: boolean
}

function cellValue<T>(col: Column<T>, row: T) {
  if (col.cell) return col.cell(row)
  if (col.accessorKey) return String(row[col.accessorKey] || "")
  return ""
}

export function DataTable<T>({
  data,
  columns,
  searchPlaceholder = "Search...",
  searchValue,
  onSearchChange,
  emptyMessage = "No results found.",
  isLoading = false,
  hideSearch = false,
  mobileCards = true,
}: DataTableProps<T>) {
  const cardColumns = columns.filter((col) => !col.hideOnMobile)
  const primary = cardColumns[0]
  const nonPrimary = cardColumns.slice(1)
  const actionCol = nonPrimary.find((col) => col.header.toLowerCase().includes("action"))
  const rest = nonPrimary.filter((col) => !col.header.toLowerCase().includes("action"))

  return (
    <div className="space-y-4">
      {onSearchChange && !hideSearch && (
        <SearchInput
          placeholder={searchPlaceholder}
          className="min-h-11"
          containerClassName="w-full max-w-md"
          value={searchValue || ""}
          onChange={onSearchChange}
        />
      )}

      {mobileCards && (
        <div className="space-y-3 md:hidden">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-xl border bg-muted/40" />
            ))
          ) : data.length === 0 ? (
            <div className="rounded-xl border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
              {emptyMessage}
            </div>
          ) : (
            data.map((row, rowIndex) => (
              <article
                key={rowIndex}
                className="rounded-xl border border-border/60 bg-card p-4 shadow-soft"
              >
                {primary && (
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        {primary.header}
                      </p>
                      <div className="mt-0.5 text-base font-semibold leading-snug">
                        {cellValue(primary, row)}
                      </div>
                    </div>
                  </div>
                )}
                <dl className="grid gap-2.5">
                  {rest.map((col, colIndex) => (
                    <div
                      key={colIndex}
                      className={cn(
                        "flex items-start justify-between gap-3 text-sm",
                        col.className?.includes("text-right") && "items-center"
                      )}
                    >
                      <dt className="shrink-0 text-muted-foreground">{col.header}</dt>
                      <dd className={cn("min-w-0 text-right", col.className)}>{cellValue(col, row)}</dd>
                    </div>
                  ))}
                </dl>
                {actionCol && (
                  <div className="mt-3.5 border-t border-border/60 pt-3 flex flex-wrap items-center justify-end gap-1.5">
                    {cellValue(actionCol, row)}
                  </div>
                )}
              </article>
            ))
          )}
        </div>
      )}

      <div
        className={cn(
          "overflow-hidden rounded-xl border border-border/60 bg-card shadow-soft",
          mobileCards && "hidden md:block"
        )}
      >
        <div className="overflow-x-auto">
          {isLoading ? (
            <TableSkeleton rows={6} cols={columns.length} />
          ) : (
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent">
                  {columns.map((col, index) => {
                    const isAction = col.header.toLowerCase().includes("action")
                    return (
                      <TableHead
                        key={index}
                        className={cn(col.className, isAction && "whitespace-nowrap")}
                      >
                        {col.header}
                      </TableHead>
                    )
                  })}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell
                      colSpan={columns.length}
                      className="h-28 text-center text-muted-foreground"
                    >
                      {emptyMessage}
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {columns.map((col, colIndex) => {
                        const isAction = col.header.toLowerCase().includes("action")
                        return (
                          <TableCell
                            key={colIndex}
                            className={cn(col.className, isAction && "whitespace-nowrap py-2")}
                          >
                            {cellValue(col, row)}
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  )
}
