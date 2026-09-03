"use client"
/* eslint-disable */

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { toast } from "sonner"
import {
  Building2,
  Copy,
  Edit,
  Eye,
  PlusCircle,
  Printer,
  Trash2,
} from "lucide-react"
import { useCompany } from "@/components/company-provider"
import { useAuth } from "@/hooks/useAuth"
import { usePermissions } from "@/context/PermissionContext"
import { PermissionGate } from "@/components/auth/PermissionGate"
import { EmptyState } from "@/components/common/EmptyState"
import { PageHeader } from "@/components/common/PageHeader"
import { DataTable } from "@/components/tables/DataTable"
import { TablePagination } from "@/components/tables/TablePagination"
import { ConfirmationDialog } from "@/components/dialogs/ConfirmationDialog"
import { DownloadDeliveryChallanButton } from "@/components/delivery-challans/download-button"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  deleteDeliveryChallan,
  duplicateDeliveryChallan,
  getDeliveryChallansPaginated,
} from "@/services/delivery-challans.service"
import { getCustomers } from "@/services/customers.service"
import { useServerPagination } from "@/hooks/useServerPagination"
import type { DeliveryChallan, DeliveryChallanFilters, DeliveryChallanStatus, TableSort } from "@/types"

const SORT_OPTIONS: Array<{ value: string; label: string; sort: TableSort }> = [
  { value: "date:desc", label: "Newest first", sort: { column: "date", direction: "desc" } },
  { value: "date:asc", label: "Oldest first", sort: { column: "date", direction: "asc" } },
  { value: "challan_number:asc", label: "Challan No. (A–Z)", sort: { column: "challan_number", direction: "asc" } },
  { value: "challan_number:desc", label: "Challan No. (Z–A)", sort: { column: "challan_number", direction: "desc" } },
  { value: "total_pieces:desc", label: "Pieces (High–Low)", sort: { column: "total_pieces", direction: "desc" } },
  { value: "quality:asc", label: "Quality (A–Z)", sort: { column: "quality", direction: "asc" } },
]

export default function DeliveryChallansClient() {
  const { selectedCompany } = useCompany()
  const { user } = useAuth()
  const { can } = usePermissions()
  const router = useRouter()
  const { page, pageSize, setPage, setPageSize, resetPage } = useServerPagination()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<DeliveryChallanStatus | "">("")
  const [customerFilter, setCustomerFilter] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [sortKey, setSortKey] = useState(SORT_OPTIONS[0].value)
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([])
  const [challans, setChallans] = useState<DeliveryChallan[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [toDelete, setToDelete] = useState<DeliveryChallan | null>(null)

  const companyId = selectedCompany?.id
  const customersLoadedRef = useRef(false)

  const sort = useMemo(
    () => SORT_OPTIONS.find((option) => option.value === sortKey)?.sort ?? SORT_OPTIONS[0].sort,
    [sortKey]
  )

  const filters: DeliveryChallanFilters = {
    search,
    status: statusFilter,
    customerId: customerFilter,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    sort,
  }

  const load = async (opts?: { silent?: boolean }) => {
    if (!companyId) return
    const silent = opts?.silent ?? challans.length > 0
    if (!silent) setIsLoading(true)
    try {
      const resultPromise = getDeliveryChallansPaginated(companyId, filters, { page, pageSize })
      const customersPromise = customersLoadedRef.current
        ? Promise.resolve(null)
        : getCustomers(companyId)

      const [result, customerList] = await Promise.all([resultPromise, customersPromise])
      setChallans(result.data)
      setTotal(result.total)
      if (customerList) {
        setCustomers(customerList.map((c) => ({ id: c.id, name: c.name })))
        customersLoadedRef.current = true
      }
    } catch {
      toast.error("Failed to load delivery challans")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    customersLoadedRef.current = false
  }, [companyId])

  useEffect(() => {
    void load({ silent: challans.length > 0 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, search, statusFilter, customerFilter, dateFrom, dateTo, sortKey, page, pageSize])

  const confirmDelete = async () => {
    if (!toDelete) return
    try {
      await deleteDeliveryChallan(toDelete.id)
      toast.success("Delivery challan deleted successfully.")
      await load()
    } catch {
      toast.error("Failed to delete delivery challan")
    }
    setDeleteDialogOpen(false)
    setToDelete(null)
  }

  const handleDuplicate = async (challan: DeliveryChallan) => {
    if (!selectedCompany) return
    try {
      await duplicateDeliveryChallan(challan.id, selectedCompany.id, user?.id)
      toast.success("Delivery challan duplicated successfully.")
      await load()
    } catch {
      toast.error("Failed to duplicate delivery challan")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Draft":
        return "bg-muted text-muted-foreground"
      case "Pending":
        return "bg-amber-500/10 text-amber-700"
      case "Delivered":
        return "bg-emerald-500/10 text-emerald-700"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  if (!selectedCompany) {
    return (
      <EmptyState
        icon={Building2}
        title="No company selected"
        description="Select a company to manage delivery challans."
      />
    )
  }

  const columns = [
    {
      header: "Challan No",
      cell: (row: DeliveryChallan) => (
        <button
          type="button"
          className="font-medium text-primary hover:underline"
          onClick={() => router.push(`/admin/delivery-challans/${row.id}`)}
        >
          {row.challan_number}
        </button>
      ),
    },
    {
      header: "Date",
      cell: (row: DeliveryChallan) => format(new Date(row.date), "dd MMM yyyy"),
    },
    {
      header: "Customer",
      cell: (row: DeliveryChallan) => row.customer?.name ?? "—",
    },
    {
      header: "Quality",
      cell: (row: DeliveryChallan) => row.quality || "—",
    },
    {
      header: "Pieces",
      cell: (row: DeliveryChallan) => row.total_pieces,
    },
    {
      header: "MTS",
      cell: (row: DeliveryChallan) => Number(row.total_meters).toFixed(2),
    },
    {
      header: "Status",
      cell: (row: DeliveryChallan) => (
        <Badge variant="secondary" className={getStatusColor(row.status)}>
          {row.status}
        </Badge>
      ),
    },
    {
      header: "Actions",
      cell: (row: DeliveryChallan) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            title="View"
            onClick={() => router.push(`/admin/delivery-challans/${row.id}`)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title="Print"
            onClick={() => router.push(`/admin/delivery-challans/${row.id}/print`)}
          >
            <Printer className="h-4 w-4" />
          </Button>
          <DownloadDeliveryChallanButton challan={row} company={selectedCompany} />
          <PermissionGate module="delivery_challans" action="edit">
            <Button
              variant="ghost"
              size="icon"
              title="Edit"
              onClick={() => router.push(`/admin/delivery-challans/${row.id}/edit`)}
            >
              <Edit className="h-4 w-4" />
            </Button>
          </PermissionGate>
          <PermissionGate module="delivery_challans" action="create">
            <Button variant="ghost" size="icon" title="Duplicate" onClick={() => handleDuplicate(row)}>
              <Copy className="h-4 w-4" />
            </Button>
          </PermissionGate>
          <PermissionGate module="delivery_challans" action="delete">
            <Button
              variant="destructive"
              size="icon"
              title="Delete"
              onClick={() => {
                setToDelete(row)
                setDeleteDialogOpen(true)
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
        eyebrow="Documents"
        title="Delivery Challans"
        description="Create and manage textile delivery challans."
        action={
          can("delivery_challans", "create") ? (
            <Button onClick={() => router.push("/admin/delivery-challans/new")}>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Delivery Challan
            </Button>
          ) : undefined
        }
      />

      <Card>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="dc-filter-search" className="text-xs font-medium text-muted-foreground">
                Search
              </Label>
              <Input
                id="dc-filter-search"
                placeholder="Challan no., customer, quality..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  resetPage()
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Sort</Label>
              <Select
                value={sortKey}
                onValueChange={(val) => {
                  setSortKey(val || SORT_OPTIONS[0].value)
                  resetPage()
                }}
              >
                <SelectTrigger>
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
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Status</Label>
              <Select
                value={statusFilter || "__all"}
                onValueChange={(val) => {
                  setStatusFilter(val === "__all" || !val ? "" : (val as DeliveryChallanStatus))
                  resetPage()
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status">
                    {(value: string | null) => {
                      if (!value || value === "__all") return "All"
                      return value
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all">All</SelectItem>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Delivered">Delivered</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Customer</Label>
              <Select
                value={customerFilter || "__all"}
                onValueChange={(val) => {
                  setCustomerFilter(val === "__all" || !val ? "" : val)
                  resetPage()
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Customer">
                    {(value: string | null) => {
                      if (!value || value === "__all") return "All"
                      return customers.find((c) => c.id === value)?.name ?? "Customer"
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all">All</SelectItem>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dc-filter-date-from" className="text-xs font-medium text-muted-foreground">
                From Date
              </Label>
              <Input
                id="dc-filter-date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value)
                  resetPage()
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dc-filter-date-to" className="text-xs font-medium text-muted-foreground">
                To Date
              </Label>
              <Input
                id="dc-filter-date-to"
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value)
                  resetPage()
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      <DataTable columns={columns} data={challans} isLoading={isLoading} hideSearch />

      <TablePagination
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        isLoading={isLoading}
      />


      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete delivery challan?"
        description={`This will permanently delete ${toDelete?.challan_number ?? "this delivery challan"}.`}
        confirmText="Delete"
        onConfirm={confirmDelete}
        variant="destructive"
      />
    </div>
  )
}
