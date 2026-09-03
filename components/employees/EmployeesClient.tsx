"use client"
/* eslint-disable */

import { useEffect, useState, useCallback } from "react"
import { motion } from "framer-motion"
import { Pencil, Trash2, UserCog, UsersRound } from "lucide-react"
import { useCompany } from "@/components/company-provider"
import { useAuth } from "@/hooks/useAuth"
import { usePermissions } from "@/context/PermissionContext"
import { EmployeeFormDialog } from "@/components/employees/employee-form-dialog"
import {
  getEmployeesPaginated,
  setEmployeeStatusRequest,
} from "@/services/employees.service"
import type { Employee } from "@/types/permissions"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { DataTable } from "@/components/tables/DataTable"
import { ConfirmationDialog } from "@/components/dialogs/ConfirmationDialog"
import { PageHeader } from "@/components/common/PageHeader"
import { EmptyState } from "@/components/common/EmptyState"
import { AccessDenied } from "@/components/auth/AccessDenied"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function EmployeesClient() {
  const { selectedCompany } = useCompany()
  const { user } = useAuth()
  const { isOwner: permissionOwner, isLoading: permissionsLoading } = usePermissions()
  const isOwner =
    permissionOwner ||
    user?.role === "Owner" ||
    (Boolean(selectedCompany && user && selectedCompany.user_id === user.id))
  const [employees, setEmployees] = useState<Employee[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [employeeToRemove, setEmployeeToRemove] = useState<Employee | null>(null)
  const pageSize = 10

  const loadEmployees = useCallback(async () => {
    if (!selectedCompany) return
    setIsLoading(true)
    try {
      const result = await getEmployeesPaginated(selectedCompany.id, search, {
        page,
        pageSize,
        status: statusFilter,
      })
      setEmployees(result.data)
      setTotal(result.total)
    } catch (error) {
      console.error('[employees]', error)
      toast.error(error instanceof Error ? error.message : "Failed to load employees")
      setEmployees([])
      setTotal(0)
    } finally {
      setIsLoading(false)
    }
  }, [selectedCompany, search, page, statusFilter])

  useEffect(() => {
    if (isOwner) loadEmployees()
  }, [isOwner, loadEmployees])

  const confirmRemove = async () => {
    if (!employeeToRemove || !selectedCompany) return
    try {
      const response = await fetch(
        `/api/employees?companyId=${encodeURIComponent(selectedCompany.id)}&membershipId=${encodeURIComponent(employeeToRemove.membership_id)}&userId=${encodeURIComponent(employeeToRemove.user_id)}`,
        { method: "DELETE" }
      )
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || "Failed to remove employee")
      toast.success("Employee removed")
      await loadEmployees()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to remove employee")
    }
    setDeleteDialogOpen(false)
    setEmployeeToRemove(null)
  }

  const toggleStatus = async (employee: Employee) => {
    if (!selectedCompany) return
    try {
      await setEmployeeStatusRequest({
        companyId: selectedCompany.id,
        membershipId: employee.membership_id,
        userId: employee.user_id,
        isActive: !employee.is_active,
      })
      toast.success(employee.is_active ? "Employee deactivated" : "Employee activated")
      await loadEmployees()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update status")
    }
  }

  if (permissionsLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    )
  }

  if (!isOwner) {
    return <AccessDenied />
  }

  if (!selectedCompany) {
    return (
      <EmptyState
        icon={UsersRound}
        title="Select a company"
        description="Choose a company from the header to manage employees."
      />
    )
  }

  const columns = [
    {
      header: "Employee",
      cell: (row: Employee) => (
        <div>
          <p className="font-medium">{row.full_name}</p>
          <p className="text-xs text-muted-foreground">{row.email || "—"}</p>
        </div>
      ),
    },
    {
      header: "Designation",
      cell: (row: Employee) => row.designation || "—",
    },
    {
      header: "Mobile",
      cell: (row: Employee) => row.mobile || "—",
    },
    {
      header: "Status",
      cell: (row: Employee) => (
        <Badge variant={row.is_active ? "secondary" : "outline"}>
          {row.is_active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      header: "Access",
      cell: (row: Employee) => {
        const modules = Object.values(row.permissions).filter((p) => p.can_view).length
        return (
          <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <UserCog className="h-3.5 w-3.5" />
            {modules} modules
          </span>
        )
      },
    },
    {
      header: "Actions",
      className: "text-right",
      cell: (row: Employee) => (
        <div className="flex justify-end gap-1">
          <EmployeeFormDialog
            initialData={row}
            onSaved={loadEmployees}
            trigger={
              <Button variant="ghost" size="icon">
                <Pencil className="h-4 w-4" />
              </Button>
            }
          />
          <Button
            variant={row.is_active ? "destructive" : "default"}
            size="lg"
            onClick={() => toggleStatus(row)}
          >
            {row.is_active ? "Deactivate" : "Activate"}
          </Button>
          <Button
            variant="destructive"
            size="lg"
            onClick={() => {
              setEmployeeToRemove(row)
              setDeleteDialogOpen(true)
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <PageHeader
        eyebrow="Access control"
        title="Employees"
        description={`Manage logins and module permissions for ${selectedCompany.name}`}
        action={<EmployeeFormDialog onSaved={loadEmployees} />}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Only the company owner can create employees and grant access.
        </p>
        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value as "all" | "active" | "inactive")
            setPage(1)
          }}
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue>
              {statusFilter === "all"
                ? "All statuses"
                : statusFilter === "active"
                  ? "Active"
                  : "Inactive"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        data={employees}
        columns={columns}
        searchValue={search}
        onSearchChange={(value) => {
          setSearch(value)
          setPage(1)
        }}
        isLoading={isLoading}
        searchPlaceholder="Search by name, email, mobile, designation..."
      />

      {total > pageSize && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page * pageSize >= total}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Remove Employee"
        description={`Remove ${employeeToRemove?.full_name} from this company? They will lose access immediately.`}
        confirmText="Remove"
        onConfirm={confirmRemove}
        variant="destructive"
      />
    </motion.div>
  )
}
