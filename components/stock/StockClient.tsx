"use client"
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { Boxes, PackageMinus, PackageOpen, Pencil, Trash2, TriangleAlert, Warehouse } from "lucide-react"
import { useCompany } from "@/components/company-provider"
import { usePermissions } from "@/context/PermissionContext"
import { PermissionGate } from "@/components/auth/PermissionGate"
import { StockFormDialog } from "@/components/stock/StockFormDialog"
import { StockStatusBadge } from "@/components/stock/StockStatusBadge"
import { StatCard } from "@/components/common/StatCard"
import { PageHeader } from "@/components/common/PageHeader"
import { EmptyState } from "@/components/common/EmptyState"
import { DataTable } from "@/components/tables/DataTable"
import { TablePagination } from "@/components/tables/TablePagination"
import { ConfirmationDialog } from "@/components/dialogs/ConfirmationDialog"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { fadeInUp, staggerContainer, staggerItem } from "@/lib/motion"
import { useServerPagination } from "@/hooks/useServerPagination"
import type { TableSort } from "@/types"
import {
  deleteStock,
  getStockSummary,
  getStocksPaginated,
  parseStockError,
} from "@/services/stocks.service"
import type { Stock, StockStatus, StockSummary } from "@/types"

const STATUS_FILTERS: Array<{ value: string; label: string }> = [
  { value: "__all", label: "All statuses" },
  { value: "Available", label: "Available" },
  { value: "Low Stock", label: "Low Stock" },
  { value: "Out Of Stock", label: "Out Of Stock" },
]

const SORT_OPTIONS: Array<{ value: string; label: string; sort: TableSort }> = [
  { value: "quality_name:asc", label: "Quality (A–Z)", sort: { column: "quality_name", direction: "asc" } },
  { value: "quality_name:desc", label: "Quality (Z–A)", sort: { column: "quality_name", direction: "desc" } },
  { value: "available_taka:desc", label: "Available (High–Low)", sort: { column: "available_taka", direction: "desc" } },
  { value: "available_taka:asc", label: "Available (Low–High)", sort: { column: "available_taka", direction: "asc" } },
  { value: "total_taka:desc", label: "Total Taka (High–Low)", sort: { column: "total_taka", direction: "desc" } },
  { value: "created_at:desc", label: "Newest first", sort: { column: "created_at", direction: "desc" } },
  { value: "created_at:asc", label: "Oldest first", sort: { column: "created_at", direction: "asc" } },
]

export default function StockClient() {
  const { selectedCompany } = useCompany()
  const { can } = usePermissions()
  const { page, pageSize, setPage, setPageSize, resetPage } = useServerPagination()
  const [stocks, setStocks] = useState<Stock[]>([])
  const [total, setTotal] = useState(0)
  const [summary, setSummary] = useState<StockSummary | null>(null)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<string>("__all")
  const [sortKey, setSortKey] = useState(SORT_OPTIONS[0].value)
  const [isLoading, setIsLoading] = useState(true)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [stockToDelete, setStockToDelete] = useState<Stock | null>(null)

  const companyId = selectedCompany?.id

  const sort = useMemo(
    () => SORT_OPTIONS.find((option) => option.value === sortKey)?.sort ?? SORT_OPTIONS[0].sort,
    [sortKey]
  )

  const load = async (opts?: { silent?: boolean }) => {
    if (!companyId) return
    const silent = opts?.silent ?? stocks.length > 0
    if (!silent) setIsLoading(true)
    try {
      const [result, stats] = await Promise.all([
        getStocksPaginated(
          companyId,
          {
            search,
            status: status === "__all" ? "" : (status as StockStatus),
            sort,
          },
          { page, pageSize }
        ),
        getStockSummary(companyId),
      ])
      setStocks(result.data)
      setTotal(result.total)
      setSummary(stats)
    } catch {
      toast.error("Failed to load stock")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void load({ silent: false })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, search, status, sortKey, page, pageSize])

  const confirmDelete = async () => {
    if (!stockToDelete) return
    try {
      await deleteStock(stockToDelete.id)
      toast.success("Stock deleted.")
      await load()
    } catch (error) {
      toast.error(parseStockError(error))
    }
    setDeleteOpen(false)
    setStockToDelete(null)
  }

  if (!selectedCompany) {
    return (
      <EmptyState
        icon={Warehouse}
        title="Select a company"
        description="Choose a company from the header to manage quality-wise stock."
      />
    )
  }

  const columns = [
    {
      header: "Quality Name",
      accessorKey: "quality_name" as keyof Stock,
      className: "font-medium",
    },
    {
      header: "Total Taka",
      cell: (row: Stock) => (
        <span className="tabular-nums">{row.total_taka}</span>
      ),
    },
    {
      header: "Sold Taka",
      cell: (row: Stock) => (
        <span className="tabular-nums text-muted-foreground">{row.sold_taka}</span>
      ),
    },
    {
      header: "Available Taka",
      cell: (row: Stock) => (
        <span className="tabular-nums font-medium">{row.available_taka}</span>
      ),
    },
    {
      header: "Status",
      cell: (row: Stock) => <StockStatusBadge stock={row} />,
    },
    {
      header: "HSN Code",
      cell: (row: Stock) => row.hsn_code || "—",
    },
    {
      header: "Actions",
      className: "text-right",
      cell: (row: Stock) => (
        <div className="flex justify-end gap-2">
          <PermissionGate module="stock" action="edit">
            <StockFormDialog
              initialData={row}
              onSaved={load}
              trigger={
                <Button variant="ghost" size="icon">
                  <Pencil className="h-4 w-4" />
                </Button>
              }
            />
          </PermissionGate>
          <PermissionGate module="stock" action="delete">
            <Button
              variant="destructive"
              size="icon"
              onClick={() => {
                setStockToDelete(row)
                setDeleteOpen(true)
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </PermissionGate>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Inventory"
        title="Stock"
        description={`Quality-wise textile stock for ${selectedCompany.name}`}
        action={can("stock", "create") ? <StockFormDialog onSaved={load} /> : undefined}
      />

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"
      >
        <motion.div variants={staggerItem}>
          <StatCard
            title="Total Qualities"
            value={summary?.totalQualities ?? 0}
            icon={Boxes}
            isLoading={isLoading}
          />
        </motion.div>
        <motion.div variants={staggerItem}>
          <StatCard
            title="Total Taka"
            value={summary?.totalTaka ?? 0}
            icon={Boxes}
            isLoading={isLoading}
          />
        </motion.div>
        <motion.div variants={staggerItem}>
          <StatCard
            title="Sold Taka"
            value={summary?.totalSoldTaka ?? 0}
            icon={PackageMinus}
            isLoading={isLoading}
          />
        </motion.div>
        <motion.div variants={staggerItem}>
          <StatCard
            title="Available Taka"
            value={summary?.totalAvailableTaka ?? 0}
            icon={PackageOpen}
            isLoading={isLoading}
          />
        </motion.div>
        <motion.div variants={staggerItem}>
          <StatCard
            title="Low / Out"
            value={`${summary?.lowStockCount ?? 0} / ${summary?.outOfStockCount ?? 0}`}
            icon={TriangleAlert}
            isLoading={isLoading}
          />
        </motion.div>
      </motion.div>

      <motion.div variants={fadeInUp} initial="hidden" animate="show" className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <p className="text-sm text-muted-foreground">
            Available = Total − Sold. Sold updates automatically from Delivery Challans.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Select
              value={sortKey}
              onValueChange={(val) => {
                setSortKey(val || SORT_OPTIONS[0].value)
                resetPage()
              }}
            >
              <SelectTrigger className="w-full sm:w-[220px]">
                <SelectValue>
                  {SORT_OPTIONS.find((option) => option.value === sortKey)?.label ?? "Sort"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={status}
              onValueChange={(val) => {
                setStatus(val || "__all")
                resetPage()
              }}
            >
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue>
                  {STATUS_FILTERS.find((f) => f.value === status)?.label ?? "All statuses"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {STATUS_FILTERS.map((filter) => (
                  <SelectItem key={filter.value} value={filter.value}>
                    {filter.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {total === 0 && !isLoading ? (
          <EmptyState
            icon={Warehouse}
            title="No stock qualities yet"
            description="Add stock when new cloth is manufactured. Delivery Challans will deduct Taka automatically."
            action={<StockFormDialog onSaved={load} />}
          />
        ) : (
          <>
            <DataTable
              data={stocks}
              columns={columns}
              searchValue={search}
              onSearchChange={(value) => {
                setSearch(value)
                resetPage()
              }}
              isLoading={isLoading}
              searchPlaceholder="Search by quality or HSN..."
            />
            <TablePagination
              page={page}
              pageSize={pageSize}
              total={total}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              isLoading={isLoading}
            />
          </>
        )}
      </motion.div>

      <ConfirmationDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Stock"
        description={`Delete ${stockToDelete?.quality_name}? This removes the quality and its history.`}
        confirmText="Delete"
        onConfirm={confirmDelete}
        variant="destructive"
      />
    </div>
  )
}
