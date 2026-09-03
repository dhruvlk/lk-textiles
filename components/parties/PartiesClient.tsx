"use client"
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react"
import { useCompany } from "@/components/company-provider"
import { usePermissions } from "@/context/PermissionContext"
import { PermissionGate } from "@/components/auth/PermissionGate"
import { PartyFormDialog } from "@/components/parties/party-form-dialog"
import { Pencil, Trash2, Users } from "lucide-react"
import {
  getCustomersPaginated,
  addCustomer,
  updateCustomer,
  deleteCustomer,
} from "@/services/customers.service"
import { getChallans } from "@/services/challans.service"
import { Customer } from "@/types"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { DataTable } from "@/components/tables/DataTable"
import { ConfirmationDialog } from "@/components/dialogs/ConfirmationDialog"
import { PageHeader } from "@/components/common/PageHeader"
import { EmptyState } from "@/components/common/EmptyState"
import { TablePagination } from "@/components/tables/TablePagination"
import { useServerPagination } from "@/hooks/useServerPagination"

export default function PartiesClient() {
  const { selectedCompany } = useCompany()
  const { can } = usePermissions()
  const { page, pageSize, setPage, setPageSize, resetPage } = useServerPagination()
  const [parties, setParties] = useState<Customer[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [partyToDelete, setPartyToDelete] = useState<Customer | null>(null)
  const companyId = selectedCompany?.id

  const loadParties = async (opts?: { silent?: boolean }) => {
    if (!companyId) return
    const silent = opts?.silent ?? parties.length > 0
    if (!silent) setIsLoading(true)
    try {
      const result = await getCustomersPaginated(companyId, search, { page, pageSize })
      setParties(result.data)
      setTotal(result.total)
    } catch {
      toast.error("Failed to load customers")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadParties({ silent: false })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, search, page, pageSize])

  const handlePartyAddedOrUpdated = async (updatedParty: Customer) => {
    if (updatedParty.id && parties.find((p) => p.id === updatedParty.id)) {
      await updateCustomer(updatedParty)
    } else {
      await addCustomer(updatedParty)
    }
    await loadParties()
  }

  const confirmDelete = async () => {
    if (!partyToDelete || !selectedCompany) return

    try {
      const challans = await getChallans(selectedCompany.id)
      const isLinked = challans.some((c) => c.customer_id === partyToDelete.id)

      if (isLinked) {
        toast.error("This customer cannot be deleted because it is linked to existing challans.")
      } else {
        await deleteCustomer(partyToDelete.id)
        toast.success("Customer deleted successfully.")
        await loadParties()
      }
    } catch {
      toast.error("Failed to delete customer")
    }
    setDeleteDialogOpen(false)
    setPartyToDelete(null)
  }

  if (!selectedCompany) {
    return (
      <EmptyState
        icon={Users}
        title="Select a company"
        description="Choose a company from the header to manage customers."
      />
    )
  }

  const columns = [
    { header: "Name", accessorKey: "name" as keyof Customer, className: "font-medium" },
    { header: "Mobile", cell: (p: Customer) => p.mobile || "-" },
    { header: "Email", cell: (p: Customer) => p.email || "-" },
    { header: "Broker", cell: (p: Customer) => p.broker || "-" },
    { header: "City", cell: (p: Customer) => p.city || "-" },
    { header: "GST Number", cell: (p: Customer) => p.gst_number || "-" },
    {
      header: "Actions",
      className: "text-right",
      cell: (p: Customer) => (
        <div className="flex justify-end gap-2">
          <PermissionGate module="customers" action="edit">
            <PartyFormDialog
              initialData={p}
              onPartyAdded={handlePartyAddedOrUpdated}
              trigger={
                <Button variant="ghost" size="icon">
                  <Pencil className="h-4 w-4" />
                </Button>
              }
            />
          </PermissionGate>
          <PermissionGate module="customers" action="delete">
            <Button variant="destructive" size="icon" onClick={() => { setPartyToDelete(p); setDeleteDialogOpen(true) }}>
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
        eyebrow="Directory"
        title="Customers"
        description={`Manage customers for ${selectedCompany.name}`}
        action={
          can("customers", "create") ? (
            <PartyFormDialog onPartyAdded={handlePartyAddedOrUpdated} />
          ) : undefined
        }
      />

      <DataTable
        data={parties}
        columns={columns}
        searchValue={search}
        onSearchChange={(value) => { setSearch(value); resetPage() }}
        isLoading={isLoading}
        searchPlaceholder="Search by name, GST, mobile, broker..."
      />

      <TablePagination
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        isLoading={isLoading}
        itemName="Customers"
      />

      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Customer"
        description={`Are you sure you want to delete ${partyToDelete?.name}?`}
        confirmText="Delete"
        onConfirm={confirmDelete}
        variant="destructive"
      />
    </div>
  )
}
