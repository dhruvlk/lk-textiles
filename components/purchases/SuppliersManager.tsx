"use client"

import { useState } from "react"
import {
  Building2,
  Search,
  Plus,
  Edit,
  Trash2,
  ExternalLink,
  Phone,
  Mail,
  MapPin,
  FileText,
  IndianRupee,
  Clock,
  ArrowRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { ConfirmationDialog } from "@/components/dialogs/ConfirmationDialog"
import { SupplierModal } from "@/components/purchases/SupplierModal"
import { deleteSupplier, getSupplierStats } from "@/services/suppliers.service"
import { format } from "date-fns"
import { toast } from "sonner"
import type { Supplier } from "@/types"

interface SuppliersManagerProps {
  companyId: string
  suppliers: Supplier[]
  isLoading: boolean
  onRefresh: () => void
  onSelectSupplierForPurchase?: (supplierId: string) => void
}

export function SuppliersManager({
  companyId,
  suppliers,
  isLoading,
  onRefresh,
  onSelectSupplierForPurchase,
}: SuppliersManagerProps) {
  const [search, setSearch] = useState("")
  const [supplierModalOpen, setSupplierModalOpen] = useState(false)
  const [supplierToEdit, setSupplierToEdit] = useState<Supplier | null>(null)

  // Drawer / Details modal state
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [supplierStats, setSupplierStats] = useState<{
    totalPurchases: number
    totalPaid: number
    outstanding: number
    inputGst: number
    lastPurchaseDate: string | null
    purchases: Array<{
      id: string
      invoice_number: string
      invoice_date: string
      grand_total: number
      paid_amount: number
      balance_amount: number
      payment_status: string
    }>
  } | null>(null)
  const [isLoadingStats, setIsLoadingStats] = useState(false)

  // Delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const filteredSuppliers = suppliers.filter((s) => {
    if (!search.trim()) return true
    const q = search.toLowerCase().trim()
    return (
      s.name.toLowerCase().includes(q) ||
      s.contact_person?.toLowerCase().includes(q) ||
      s.mobile?.includes(q) ||
      s.gstin?.toLowerCase().includes(q) ||
      s.city?.toLowerCase().includes(q)
    )
  })

  const openSupplierProfile = async (s: Supplier) => {
    setSelectedSupplier(s)
    setIsLoadingStats(true)
    try {
      const stats = await getSupplierStats(companyId, s.id)
      setSupplierStats(stats)
    } catch {
      toast.error("Failed to load supplier history")
    } finally {
      setIsLoadingStats(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!supplierToDelete) return
    setIsDeleting(true)
    try {
      await deleteSupplier(companyId, supplierToDelete.id)
      toast.success(`Supplier "${supplierToDelete.name}" deleted.`)
      setDeleteDialogOpen(false)
      setSupplierToDelete(null)
      onRefresh()
    } catch (err) {
      console.error("Delete error:", err)
      toast.error("Cannot delete supplier with active purchase bills.")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Search and Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search suppliers by name, contact, mobile, GSTIN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 rounded-xl"
          />
        </div>

        <Button
          onClick={() => {
            setSupplierToEdit(null)
            setSupplierModalOpen(true)
          }}
          className="rounded-xl shadow-xs shrink-0"
        >
          <Plus className="h-4 w-4 mr-1.5" /> Add Supplier
        </Button>
      </div>

      {/* Suppliers Table */}
      <div className="rounded-2xl border bg-card shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/40 border-b text-muted-foreground uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-3.5 text-left font-semibold">Supplier Name</th>
                <th className="py-3 px-3.5 text-left font-semibold">Contact Person</th>
                <th className="py-3 px-3.5 text-left font-semibold">Mobile & Email</th>
                <th className="py-3 px-3.5 text-left font-semibold">GSTIN & PAN</th>
                <th className="py-3 px-3.5 text-left font-semibold">Location</th>
                <th className="py-3 px-3.5 text-right font-semibold">Opening Bal</th>
                <th className="py-3 px-3.5 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    Loading suppliers directory...
                  </td>
                </tr>
              ) : filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <div className="max-w-xs mx-auto text-center space-y-2">
                      <Building2 className="h-10 w-10 mx-auto text-muted-foreground/50" />
                      <p className="text-sm font-semibold text-foreground">No suppliers found</p>
                      <p className="text-xs text-muted-foreground">
                        Add yarn spinners, fabric weavers, chemical vendors, and spare parts suppliers.
                      </p>
                      <Button
                        size="sm"
                        onClick={() => {
                          setSupplierToEdit(null)
                          setSupplierModalOpen(true)
                        }}
                        className="rounded-xl mt-2"
                      >
                        <Plus className="h-4 w-4 mr-1.5" /> Add Supplier
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map((s) => (
                  <tr
                    key={s.id}
                    className="hover:bg-muted/30 transition-colors cursor-pointer group"
                    onClick={() => openSupplierProfile(s)}
                  >
                    <td className="py-3 px-3.5">
                      <p className="font-bold text-foreground group-hover:text-primary transition-colors">
                        {s.name}
                      </p>
                      {s.payment_terms && (
                        <span className="text-[10px] text-muted-foreground">Terms: {s.payment_terms}</span>
                      )}
                    </td>
                    <td className="py-3 px-3.5 text-muted-foreground font-medium">
                      {s.contact_person || "—"}
                    </td>
                    <td className="py-3 px-3.5 text-muted-foreground">
                      <p>{s.mobile || "—"}</p>
                      {s.email && <p className="text-[10px] text-muted-foreground/80">{s.email}</p>}
                    </td>
                    <td className="py-3 px-3.5 font-mono text-[11px]">
                      {s.gstin ? (
                        <span className="text-primary font-medium">{s.gstin}</span>
                      ) : (
                        <span className="text-muted-foreground/70">Unregistered</span>
                      )}
                      {s.pan && <p className="text-[10px] text-muted-foreground">PAN: {s.pan}</p>}
                    </td>
                    <td className="py-3 px-3.5 text-muted-foreground">
                      {s.city ? `${s.city}, ${s.state || ""}` : s.state || "—"}
                    </td>
                    <td className="py-3 px-3.5 text-right font-medium tabular-nums">
                      ₹{s.opening_balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3.5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => openSupplierProfile(s)}
                          className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
                          title="View Ledger & Profile"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSupplierToEdit(s)
                            setSupplierModalOpen(true)
                          }}
                          className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
                          title="Edit supplier"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSupplierToDelete(s)
                            setDeleteDialogOpen(true)
                          }}
                          className="h-7 w-7 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          title="Delete supplier"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Supplier Profile & Ledger Dialog */}
      <Dialog open={Boolean(selectedSupplier)} onOpenChange={(open) => !open && setSelectedSupplier(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl p-6 sm:p-8">
          {selectedSupplier && (
            <>
              <DialogHeader className="border-b pb-4 space-y-1">
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    {selectedSupplier.name}
                  </DialogTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSupplierToEdit(selectedSupplier)
                      setSupplierModalOpen(true)
                    }}
                    className="rounded-xl text-xs"
                  >
                    <Edit className="h-3.5 w-3.5 mr-1" /> Edit Profile
                  </Button>
                </div>
                <DialogDescription className="text-xs text-muted-foreground flex flex-wrap items-center gap-3">
                  {selectedSupplier.contact_person && <span>Contact: {selectedSupplier.contact_person}</span>}
                  {selectedSupplier.mobile && <span>· Mobile: {selectedSupplier.mobile}</span>}
                  {selectedSupplier.gstin && (
                    <span className="font-mono text-primary font-medium">· GSTIN: {selectedSupplier.gstin}</span>
                  )}
                  {selectedSupplier.city && <span>· {selectedSupplier.city}, {selectedSupplier.state}</span>}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-3">
                {/* 4 KPI Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3 rounded-xl border bg-muted/20">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase">Total Purchases</p>
                    <p className="text-base font-bold text-foreground mt-0.5">
                      ₹{(supplierStats?.totalPurchases ?? 0).toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl border bg-muted/20">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase">Total Paid</p>
                    <p className="text-base font-bold text-emerald-600 mt-0.5">
                      ₹{(supplierStats?.totalPaid ?? 0).toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl border bg-muted/20">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase">Outstanding</p>
                    <p className="text-base font-bold text-rose-600 mt-0.5">
                      ₹{(supplierStats?.outstanding ?? 0).toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl border bg-muted/20">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase">Input GST Paid</p>
                    <p className="text-base font-bold text-primary mt-0.5">
                      ₹{(supplierStats?.inputGst ?? 0).toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>

                {/* Purchase History Table */}
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Purchase Bills History
                  </h4>
                  <div className="rounded-xl border overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/40 border-b">
                        <tr>
                          <th className="py-2.5 px-3 text-left">Date</th>
                          <th className="py-2.5 px-3 text-left">Invoice No.</th>
                          <th className="py-2.5 px-3 text-right">Bill Total</th>
                          <th className="py-2.5 px-3 text-right">Paid</th>
                          <th className="py-2.5 px-3 text-right">Balance Due</th>
                          <th className="py-2.5 px-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {isLoadingStats ? (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-muted-foreground">
                              Loading history...
                            </td>
                          </tr>
                        ) : !supplierStats?.purchases.length ? (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-muted-foreground">
                              No purchase bills recorded for this supplier yet.
                            </td>
                          </tr>
                        ) : (
                          supplierStats.purchases.map((p) => (
                            <tr key={p.id}>
                              <td className="py-2.5 px-3">{format(new Date(p.invoice_date), "dd MMM yyyy")}</td>
                              <td className="py-2.5 px-3 font-semibold">{p.invoice_number}</td>
                              <td className="py-2.5 px-3 text-right font-medium">₹{p.grand_total.toFixed(2)}</td>
                              <td className="py-2.5 px-3 text-right text-emerald-600 font-medium">
                                ₹{p.paid_amount.toFixed(2)}
                              </td>
                              <td className="py-2.5 px-3 text-right text-rose-600 font-bold">
                                ₹{p.balance_amount.toFixed(2)}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <Badge variant="outline" className="text-[10px]">
                                  {p.payment_status}
                                </Badge>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Supplier Add/Edit Modal */}
      <SupplierModal
        open={supplierModalOpen}
        onOpenChange={setSupplierModalOpen}
        companyId={companyId}
        supplierToEdit={supplierToEdit}
        onSuccess={() => onRefresh()}
      />

      {/* Delete Confirmation */}
      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Supplier?"
        description={
          supplierToDelete
            ? `Are you sure you want to delete supplier "${supplierToDelete.name}"? If there are active purchase bills for this vendor, delete or reassign them first.`
            : "Are you sure you want to delete this supplier?"
        }
        confirmText="Delete Supplier"
        variant="destructive"
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  )
}
