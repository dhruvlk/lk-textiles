"use client"
/* eslint-disable */

import { useEffect, useMemo, useRef, useState } from "react"
import { useCompany } from "@/components/company-provider"
import { usePermissions } from "@/context/PermissionContext"
import { PermissionGate } from "@/components/auth/PermissionGate"
import { Card, CardContent } from "@/components/ui/card"
import { EmptyState } from "@/components/common/EmptyState"
import { PlusCircle, Eye, Printer, Edit, Trash2, Building2 } from "lucide-react"
import { useRouter } from "next/navigation"
import {
  getSalarySlipsPaginated,
  deleteSalarySlip,
} from "@/services/salary-slips.service"
import { getEmployeesPaginated } from "@/services/employees.service"
import type {
  SalarySlip,
  SalarySlipFilters,
  SalarySlipPaymentStatus,
  TableSort,
} from "@/types"
import type { Employee } from "@/types/permissions"
import { useServerPagination } from "@/hooks/useServerPagination"
import { DownloadSalarySlipButton } from "@/components/salary-slips/download-button"
import { SalarySlipStatusBadge } from "@/components/salary-slips/SalarySlipStatusBadge"
import { formatCurrency } from "@/lib/payment-status"
import { toast } from "sonner"
import { DataTable } from "@/components/tables/DataTable"
import { TablePagination } from "@/components/tables/TablePagination"
import { ConfirmationDialog } from "@/components/dialogs/ConfirmationDialog"
import { PageHeader } from "@/components/common/PageHeader"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { format } from "date-fns"

const SORT_OPTIONS: Array<{ value: string; label: string; sort: TableSort }> = [
  { value: "pay_date:desc", label: "Newest pay date", sort: { column: "pay_date", direction: "desc" } },
  { value: "pay_date:asc", label: "Oldest pay date", sort: { column: "pay_date", direction: "asc" } },
  { value: "salary_slip_number:asc", label: "Slip No. (A–Z)", sort: { column: "salary_slip_number", direction: "asc" } },
  { value: "salary_slip_number:desc", label: "Slip No. (Z–A)", sort: { column: "salary_slip_number", direction: "desc" } },
  { value: "net_salary:desc", label: "Net Salary (High–Low)", sort: { column: "net_salary", direction: "desc" } },
  { value: "net_salary:asc", label: "Net Salary (Low–High)", sort: { column: "net_salary", direction: "asc" } },
]

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
]

export default function SalarySlipsClient() {
  const { selectedCompany } = useCompany()
  const { can } = usePermissions()
  const router = useRouter()
  const { page, pageSize, setPage, setPageSize, resetPage } = useServerPagination()

  const [search, setSearch] = useState("")
  const [employeeFilter, setEmployeeFilter] = useState("")
  const [monthFilter, setMonthFilter] = useState("")
  const [yearFilter, setYearFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState<SalarySlipPaymentStatus | "">("")
  const [sortKey, setSortKey] = useState(SORT_OPTIONS[0].value)

  const [employees, setEmployees] = useState<Employee[]>([])
  const [salarySlips, setSalarySlips] = useState<SalarySlip[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [slipToDelete, setSlipToDelete] = useState<SalarySlip | null>(null)

  const sort = useMemo(
    () => SORT_OPTIONS.find((option) => option.value === sortKey)?.sort ?? SORT_OPTIONS[0].sort,
    [sortKey]
  )

  const filters: SalarySlipFilters = {
    search,
    employeeId: employeeFilter,
    salaryMonth: monthFilter,
    salaryYear: yearFilter || undefined,
    paymentStatus: statusFilter,
    sort,
  }

  const companyId = selectedCompany?.id
  const employeesLoadedRef = useRef(false)

  const loadSalarySlips = async (opts?: { silent?: boolean }) => {
    if (!companyId) return
    const silent = opts?.silent ?? salarySlips.length > 0
    if (!silent) setIsLoading(true)
    try {
      const resultPromise = getSalarySlipsPaginated(companyId, filters, { page, pageSize })
      const employeesPromise = employeesLoadedRef.current
        ? Promise.resolve(null)
        : getEmployeesPaginated(companyId, "", { page: 1, pageSize: 200, status: "all" })

      const [result, employeeList] = await Promise.all([resultPromise, employeesPromise])
      setSalarySlips(result.data)
      setTotal(result.total)

      if (employeeList) {
        setEmployees(employeeList.data)
        employeesLoadedRef.current = true
      }
    } catch {
      toast.error("Failed to load salary slips")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    employeesLoadedRef.current = false
  }, [companyId])

  useEffect(() => {
    void loadSalarySlips({ silent: salarySlips.length > 0 })
  }, [
    companyId,
    search,
    employeeFilter,
    monthFilter,
    yearFilter,
    statusFilter,
    sortKey,
    page,
    pageSize,
  ])

  const confirmDelete = async () => {
    if (!slipToDelete) return
    try {
      await deleteSalarySlip(slipToDelete.id)
      toast.success("Salary slip deleted successfully.")
      await loadSalarySlips()
    } catch {
      toast.error("Failed to delete salary slip")
    }
    setDeleteDialogOpen(false)
    setSlipToDelete(null)
  }

  if (!selectedCompany) {
    return (
      <EmptyState
        icon={Building2}
        title="Select a company"
        description="Choose a company from the header to view and manage salary slips."
      />
    )
  }

  const currentYear = new Date().getFullYear()
  const years = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1, currentYear + 2]

  const columns = [
    {
      header: "Slip No.",
      accessorKey: "salary_slip_number" as keyof SalarySlip,
      className: "font-medium",
    },
    {
      header: "Employee Name",
      cell: (s: SalarySlip) => (
        <div>
          <span className="font-medium text-foreground">{s.employee_name}</span>
          {s.designation && (
            <p className="text-xs text-muted-foreground">{s.designation}</p>
          )}
        </div>
      ),
    },
    {
      header: "Employee ID",
      cell: (s: SalarySlip) => s.employee_code || "—",
    },
    {
      header: "Period",
      cell: (s: SalarySlip) => `${s.salary_month} ${s.salary_year}`,
    },
    {
      header: "Basic Salary",
      cell: (s: SalarySlip) => formatCurrency(s.basic_salary),
    },
    {
      header: "Gross Salary",
      cell: (s: SalarySlip) => formatCurrency(s.gross_earnings),
    },
    {
      header: "Deductions",
      cell: (s: SalarySlip) => formatCurrency(s.total_deductions),
    },
    {
      header: "Net Salary",
      cell: (s: SalarySlip) => (
        <span className="font-semibold text-foreground">
          {formatCurrency(s.net_salary)}
        </span>
      ),
    },
    {
      header: "Payment Status",
      cell: (s: SalarySlip) => (
        <SalarySlipStatusBadge status={s.payment_status} />
      ),
    },
    {
      header: "Pay Date",
      cell: (s: SalarySlip) => {
        try {
          return format(new Date(s.pay_date), "dd/MM/yyyy")
        } catch {
          return s.pay_date
        }
      },
    },
    {
      header: "Actions",
      className: "text-right",
      cell: (s: SalarySlip) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/admin/salary-slips/${s.id}`)}
            title="View details"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/admin/salary-slips/${s.id}/print`)}
            title="Print"
          >
            <Printer className="h-4 w-4" />
          </Button>
          <DownloadSalarySlipButton salarySlip={s} company={selectedCompany} />
          <PermissionGate module="salary_slips" action="edit">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push(`/admin/salary-slips/${s.id}/edit`)}
              title="Edit"
            >
              <Edit className="h-4 w-4" />
            </Button>
          </PermissionGate>
          <PermissionGate module="salary_slips" action="delete">
            <Button
              variant="destructive"
              size="icon"
              onClick={() => {
                setSlipToDelete(s)
                setDeleteDialogOpen(true)
              }}
              title="Delete"
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
        eyebrow="Payroll"
        title="Salary Slips"
        description={`Manage and generate employee salary slips for ${selectedCompany.name}`}
        action={
          can("salary_slips", "create") ? (
            <Button onClick={() => router.push("/admin/salary-slips/new")}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Salary Slip
            </Button>
          ) : undefined
        }
      />

      <Card>
        <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 pt-4">
          <div className="space-y-1.5 xl:col-span-2">
            <Label htmlFor="salary-search" className="text-xs font-medium text-muted-foreground">
              Search
            </Label>
            <Input
              id="salary-search"
              placeholder="Search slip no, employee, ID..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                resetPage()
              }}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Employee</Label>
            <Select
              value={employeeFilter || "all"}
              onValueChange={(v) => {
                setEmployeeFilter(!v || v === "all" ? "" : v)
                resetPage()
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Employees">
                  {(value: string | null) => {
                    if (!value || value === "all") return "All Employees"
                    return employees.find((e) => e.user_id === value)?.full_name ?? "Employee"
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Employees</SelectItem>
                {employees.map((e) => (
                  <SelectItem key={e.user_id} value={e.user_id}>
                    {e.full_name} {e.employee_code ? `(${e.employee_code})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Salary Month</Label>
            <Select
              value={monthFilter || "all"}
              onValueChange={(v) => {
                setMonthFilter(!v || v === "all" ? "" : v)
                resetPage()
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Months">
                  {(value: string | null) => (!value || value === "all" ? "All Months" : value)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Months</SelectItem>
                {MONTHS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Salary Year</Label>
            <Select
              value={yearFilter || "all"}
              onValueChange={(v) => {
                setYearFilter(!v || v === "all" ? "" : v)
                resetPage()
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Years">
                  {(value: string | null) => (!value || value === "all" ? "All Years" : value)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {years.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Payment Status</Label>
            <Select
              value={statusFilter || "all"}
              onValueChange={(v) => {
                setStatusFilter(!v || v === "all" ? "" : (v as SalarySlipPaymentStatus))
                resetPage()
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Status">
                  {(value: string | null) => (!value || value === "all" ? "All Status" : value)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Partially Paid">Partially Paid</SelectItem>
                <SelectItem value="Paid">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <DataTable
        data={salarySlips}
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
        title="Delete Salary Slip"
        description={`Are you sure you want to delete salary slip ${slipToDelete?.salary_slip_number}? This action cannot be undone.`}
        confirmText="Delete"
        onConfirm={confirmDelete}
        variant="destructive"
      />
    </div>
  )
}
