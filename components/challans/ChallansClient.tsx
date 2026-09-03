"use client"
/* eslint-disable */

import { useEffect, useMemo, useRef, useState } from "react"
import { useCompany } from "@/components/company-provider"
import { useAuth } from "@/hooks/useAuth"
import { usePermissions } from "@/context/PermissionContext"
import { PermissionGate } from "@/components/auth/PermissionGate"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { EmptyState } from "@/components/common/EmptyState"
import { PlusCircle, Eye, Printer, Edit, Copy, Trash2, Building2 } from "lucide-react"
import { useRouter } from "next/navigation"
import {
  getChallansPaginated,
  deleteChallan,
  duplicateChallan,
} from "@/services/challans.service"
import { getCustomers } from "@/services/customers.service"
import { Challan, ChallanFilters, ChallanPaymentStatus, ChallanStatus, TableSort } from "@/types"
import { useServerPagination } from "@/hooks/useServerPagination"

const SORT_OPTIONS: Array<{ value: string; label: string; sort: TableSort }> = [
  { value: "date:desc", label: "Newest first", sort: { column: "date", direction: "desc" } },
  { value: "date:asc", label: "Oldest first", sort: { column: "date", direction: "asc" } },
  { value: "challan_number:asc", label: "Invoice No. (A–Z)", sort: { column: "challan_number", direction: "asc" } },
  { value: "challan_number:desc", label: "Invoice No. (Z–A)", sort: { column: "challan_number", direction: "desc" } },
  { value: "grand_total:desc", label: "Amount (High–Low)", sort: { column: "grand_total", direction: "desc" } },
  { value: "grand_total:asc", label: "Amount (Low–High)", sort: { column: "grand_total", direction: "asc" } },
  { value: "due_date:asc", label: "Due Date (Earliest)", sort: { column: "due_date", direction: "asc" } },
]
import { DownloadChallanButton } from "@/components/challans/download-button"
import { PaymentStatusBadge } from "@/components/challans/PaymentStatusBadge"
import {
  formatCurrency,
  getAmountReceived,
  getChallanTotal,
  getRemainingBalance,
} from "@/lib/payment-status"
import { toast } from "sonner"
import { DataTable } from "@/components/tables/DataTable"
import { TablePagination } from "@/components/tables/TablePagination"
import { ConfirmationDialog } from "@/components/dialogs/ConfirmationDialog"
import { PageHeader } from "@/components/common/PageHeader"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"

export default function ChallansClient() {
  const { selectedCompany } = useCompany()
  const { user } = useAuth()
  const { can } = usePermissions()
  const router = useRouter()
  const { page, pageSize, setPage, setPageSize, resetPage } = useServerPagination()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<ChallanStatus | "">("")
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<ChallanPaymentStatus | "">("")
  const [customerFilter, setCustomerFilter] = useState("")
  const [brokerFilter, setBrokerFilter] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [sortKey, setSortKey] = useState(SORT_OPTIONS[0].value)
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([])
  const [challans, setChallans] = useState<Challan[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [challanToDelete, setChallanToDelete] = useState<Challan | null>(null)

  const sort = useMemo(
    () => SORT_OPTIONS.find((option) => option.value === sortKey)?.sort ?? SORT_OPTIONS[0].sort,
    [sortKey]
  )

  const filters: ChallanFilters = {
    search,
    status: statusFilter,
    paymentStatus: paymentStatusFilter,
    customerId: customerFilter,
    broker: brokerFilter,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    sort,
  }

  const companyId = selectedCompany?.id
  const customersLoadedRef = useRef(false)

  const loadChallans = async (opts?: { silent?: boolean }) => {
    if (!companyId) return
    const silent = opts?.silent ?? challans.length > 0
    if (!silent) setIsLoading(true)
    try {
      const resultPromise = getChallansPaginated(companyId, filters, { page, pageSize })
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
      toast.error("Failed to load invoices")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    customersLoadedRef.current = false
  }, [companyId])

  useEffect(() => {
    void loadChallans({ silent: challans.length > 0 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    companyId,
    search,
    statusFilter,
    paymentStatusFilter,
    customerFilter,
    brokerFilter,
    dateFrom,
    dateTo,
    sortKey,
    page,
    pageSize,
  ])

  const confirmDelete = async () => {
    if (!challanToDelete) return
    try {
      await deleteChallan(challanToDelete.id)
      toast.success("Challan deleted successfully.")
      await loadChallans()
    } catch {
      toast.error("Failed to delete invoice")
    }
    setDeleteDialogOpen(false)
    setChallanToDelete(null)
  }

  const handleDuplicate = async (challan: Challan) => {
    if (!selectedCompany) return
    try {
      await duplicateChallan(challan.id, selectedCompany.id, user?.id)
      toast.success("Challan duplicated successfully.")
      await loadChallans()
    } catch {
      toast.error("Failed to duplicate invoice")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Draft": return "bg-muted text-muted-foreground"
      case "Pending": return "bg-amber-500/10 text-amber-700"
      case "Delivered": return "bg-emerald-500/10 text-emerald-700"
      case "Returned": return "bg-primary/10 text-primary"
      case "Cancelled": return "bg-destructive/10 text-destructive"
      default: return "bg-muted text-muted-foreground"
    }
  }

  if (!selectedCompany) {
    return (
      <EmptyState
        icon={Building2}
        title="Select a company"
        description="Choose a company from the header to view and manage invoices."
      />
    )
  }

  const columns = [
    { header: "Invoice No.", accessorKey: "challan_number" as keyof Challan, className: "font-medium" },
    { header: "Date", cell: (c: Challan) => format(new Date(c.date), "dd/MM/yyyy") },
    { header: "Customer", cell: (c: Challan) => c.customer?.name || c.party?.name || "-" },
    { header: "Broker", cell: (c: Challan) => c.broker || "-" },
    { header: "Total", cell: (c: Challan) => formatCurrency(getChallanTotal(c)) },
    {
      header: "Payment Status",
      cell: (c: Challan) => (
        <PaymentStatusBadge status={c.payment_status ?? "Pending"} />
      ),
    },
    {
      header: "Due Date",
      cell: (c: Challan) =>
        c.due_date ? format(new Date(c.due_date), "dd/MM/yyyy") : "—",
    },
    {
      header: "Received Date",
      cell: (c: Challan) =>
        c.payment_received_date
          ? format(new Date(c.payment_received_date), "dd/MM/yyyy")
          : "—",
    },
    {
      header: "Amount Received",
      cell: (c: Challan) => formatCurrency(getAmountReceived(c)),
    },
    {
      header: "Remaining",
      cell: (c: Challan) => {
        const remaining = getRemainingBalance(getChallanTotal(c), getAmountReceived(c))
        return (
          <span className={remaining > 0 ? "font-medium text-amber-700" : "text-muted-foreground"}>
            {formatCurrency(remaining)}
          </span>
        )
      },
    },
    {
      header: "Status",
      cell: (c: Challan) => (
        <Badge variant="secondary" className={getStatusColor(c.status)}>{c.status}</Badge>
      ),
    },
    {
      header: "Actions",
      className: "text-right",
      cell: (c: Challan) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="icon" onClick={() => router.push(`/invoices/${c.id}`)} title="View details">
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => router.push(`/invoices/${c.id}/print`)} title="Print">
            <Printer className="h-4 w-4" />
          </Button>
          <DownloadChallanButton challan={c} company={selectedCompany} />
          <PermissionGate module="invoices" action="edit">
            <Button variant="ghost" size="icon" onClick={() => router.push(`/invoices/${c.id}/edit`)}>
              <Edit className="h-4 w-4" />
            </Button>
          </PermissionGate>
          <PermissionGate module="invoices" action="create">
            <Button variant="ghost" size="icon" onClick={() => handleDuplicate(c)}>
              <Copy className="h-4 w-4" />
            </Button>
          </PermissionGate>
          <PermissionGate module="invoices" action="delete">
            <Button variant="destructive" size="icon" onClick={() => { setChallanToDelete(c); setDeleteDialogOpen(true) }}>
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
        eyebrow="Operations"
        title="Invoice"
        description={`Manage invoices for ${selectedCompany.name}`}
        action={
          can("invoices", "create") ? (
            <Button onClick={() => router.push("/admin/invoices/new")}>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Invoice
            </Button>
          ) : undefined
        }
      />

      <Card>
        <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="challan-filter-search" className="text-xs font-medium text-muted-foreground">
              Search Invoice No.
            </Label>
            <Input
              id="challan-filter-search"
              placeholder="Search invoice, customer, quality..."
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
            <Label className="text-xs font-medium text-muted-foreground">Delivery Status</Label>
            <Select
              value={statusFilter || "all"}
              onValueChange={(v) => {
                setStatusFilter(!v || v === "all" ? "" : (v as ChallanStatus))
                resetPage()
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Delivery status">
                  {(value: string | null) => {
                    if (!value || value === "all") return "All"
                    return value
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Delivered">Delivered</SelectItem>
                <SelectItem value="Returned">Returned</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Payment Status</Label>
            <Select
              value={paymentStatusFilter || "all"}
              onValueChange={(v) => {
                setPaymentStatusFilter(!v || v === "all" ? "" : (v as ChallanPaymentStatus))
                resetPage()
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Payment status">
                  {(value: string | null) => {
                    if (!value || value === "all") return "All"
                    return value
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Partially Paid">Partially Paid</SelectItem>
                <SelectItem value="Paid">Paid</SelectItem>
                <SelectItem value="Overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Customer</Label>
            <Select
              value={customerFilter || "all"}
              onValueChange={(v) => {
                setCustomerFilter(!v || v === "all" ? "" : v)
                resetPage()
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Customer">
                  {(value: string | null) => {
                    if (!value || value === "all") return "All"
                    return customers.find((c) => c.id === value)?.name ?? "Customer"
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="challan-filter-date-from" className="text-xs font-medium text-muted-foreground">
              From Date
            </Label>
            <Input
              id="challan-filter-date-from"
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value)
                resetPage()
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="challan-filter-date-to" className="text-xs font-medium text-muted-foreground">
              To Date
            </Label>
            <Input
              id="challan-filter-date-to"
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value)
                resetPage()
              }}
            />
          </div>
          <div className="space-y-1.5 xl:col-span-2">
            <Label htmlFor="challan-filter-broker" className="text-xs font-medium text-muted-foreground">
              Broker
            </Label>
            <Input
              id="challan-filter-broker"
              placeholder="Broker"
              value={brokerFilter}
              onChange={(e) => {
                setBrokerFilter(e.target.value)
                resetPage()
              }}
            />
          </div>
        </CardContent>
      </Card>

      <DataTable
        data={challans}
        columns={columns}
        isLoading={isLoading}
        hideSearch
      />

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
        title="Delete Invoice"
        description={`Are you sure you want to delete invoice ${challanToDelete?.challan_number}?`}
        confirmText="Delete"
        onConfirm={confirmDelete}
        variant="destructive"
      />
    </div>
  )
}
