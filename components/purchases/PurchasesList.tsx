"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  FileText,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Copy,
  Plus,
  Paperclip,
  IndianRupee,
  CheckCircle2,
  AlertCircle,
  Building2,
  Calendar,
  Layers,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { EmptyState } from "@/components/common/EmptyState"
import { ConfirmationDialog } from "@/components/dialogs/ConfirmationDialog"
import { TablePagination } from "@/components/tables/TablePagination"
import type { TablePageSize } from "@/lib/table/pagination"
import { format } from "date-fns"
import { toast } from "sonner"
import { deletePurchase } from "@/services/purchases.service"
import type { PaginatedResult, Purchase, PurchaseFilters, PurchasePaymentStatus, PurchaseType, VaultDocument } from "@/types"

interface PurchasesListProps {
  companyId: string
  purchasesResult: PaginatedResult<Purchase> | null
  isLoading: boolean
  filters: PurchaseFilters
  onFiltersChange: (patch: Partial<PurchaseFilters>) => void
  page: number
  pageSize: TablePageSize
  onPageChange: (page: number) => void
  onPageSizeChange: (size: TablePageSize) => void
  onRefresh: () => void
  onViewPurchase: (purchase: Purchase) => void
  onAddPayment: (purchase: Purchase) => void
  onPreviewDocument: (doc: VaultDocument) => void
}

export function PurchasesList({
  companyId,
  purchasesResult,
  isLoading,
  filters,
  onFiltersChange,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onRefresh,
  onViewPurchase,
  onAddPayment,
  onPreviewDocument,
}: PurchasesListProps) {
  const router = useRouter()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [purchaseToDelete, setPurchaseToDelete] = useState<Purchase | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const purchases = purchasesResult?.data || []
  const total = purchasesResult?.total || 0

  const handleDeleteClick = (purchase: Purchase) => {
    setPurchaseToDelete(purchase)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!purchaseToDelete) return
    setIsDeleting(true)
    try {
      await deletePurchase(companyId, purchaseToDelete.id)
      toast.success(`Purchase #${purchaseToDelete.invoice_number} deleted and stock adjusted.`)
      setDeleteDialogOpen(false)
      setPurchaseToDelete(null)
      onRefresh()
    } catch (err) {
      console.error("Delete error:", err)
      toast.error("Failed to delete purchase.")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search invoice number, supplier, GSTIN..."
            value={filters.search || ""}
            onChange={(e) => onFiltersChange({ search: e.target.value })}
            className="pl-9 h-10 rounded-xl"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Purchase Type Filter */}
          <Select
            value={filters.purchaseType || "all"}
            onValueChange={(val) =>
              onFiltersChange({ purchaseType: !val || val === "all" ? "" : (val as PurchaseType) })
            }
          >
            <SelectTrigger className="h-10 w-[150px] rounded-xl text-xs">
              <SelectValue placeholder="Purchase Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Stock Purchase">Stock Purchase</SelectItem>
              <SelectItem value="Expense Purchase">Expense Purchase</SelectItem>
              <SelectItem value="Asset Purchase">Asset Purchase</SelectItem>
              <SelectItem value="Service Purchase">Service Purchase</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>

          {/* Payment Status Filter */}
          <Select
            value={filters.paymentStatus || "all"}
            onValueChange={(val) =>
              onFiltersChange({
                paymentStatus: !val || val === "all" ? "" : (val as PurchasePaymentStatus),
              })
            }
          >
            <SelectTrigger className="h-10 w-[130px] rounded-xl text-xs">
              <SelectValue placeholder="Payment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payments</SelectItem>
              <SelectItem value="Paid">Paid</SelectItem>
              <SelectItem value="Partially Paid">Partially Paid</SelectItem>
              <SelectItem value="Unpaid">Unpaid</SelectItem>
            </SelectContent>
          </Select>

          {/* GST Status Filter */}
          <Select
            value={filters.gstStatus || "all"}
            onValueChange={(val) =>
              onFiltersChange({
                gstStatus: !val || val === "all" ? "" : (val as "gst" | "non_gst"),
              })
            }
          >
            <SelectTrigger className="h-10 w-[130px] rounded-xl text-xs">
              <SelectValue placeholder="GST Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tax Types</SelectItem>
              <SelectItem value="gst">GST Bills</SelectItem>
              <SelectItem value="non_gst">Non-GST</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-2xl border bg-card shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/40 border-b text-muted-foreground uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-3.5 text-left font-semibold">Date</th>
                <th className="py-3 px-3.5 text-left font-semibold">Invoice No.</th>
                <th className="py-3 px-3.5 text-left font-semibold">Supplier</th>
                <th className="py-3 px-3.5 text-left font-semibold">Type</th>
                <th className="py-3 px-3.5 text-right font-semibold">Taxable</th>
                <th className="py-3 px-3.5 text-right font-semibold">GST</th>
                <th className="py-3 px-3.5 text-right font-semibold">Total Amount</th>
                <th className="py-3 px-3.5 text-center font-semibold">Payment</th>
                <th className="py-3 px-3.5 text-center font-semibold">Bill Doc</th>
                <th className="py-3 px-3.5 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-muted-foreground">
                    Loading purchase bills...
                  </td>
                </tr>
              ) : purchases.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center">
                    <div className="max-w-xs mx-auto text-center space-y-2">
                      <FileText className="h-10 w-10 mx-auto text-muted-foreground/50" />
                      <p className="text-sm font-semibold text-foreground">No purchase bills found</p>
                      <p className="text-xs text-muted-foreground">
                        Record your first purchase bill to track stock, GST input, and payments.
                      </p>
                      <Button
                        size="sm"
                        onClick={() => router.push("/admin/purchases/new")}
                        className="rounded-xl mt-2"
                      >
                        <Plus className="h-4 w-4 mr-1.5" /> Add Purchase
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                purchases.map((p) => {
                  const hasDoc = p.documents && p.documents.length > 0
                  const isPaid = p.payment_status === "Paid"
                  const isPartial = p.payment_status === "Partially Paid"
                  const isUnpaid = p.payment_status === "Unpaid"

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-muted/30 transition-colors cursor-pointer group"
                      onClick={() => onViewPurchase(p)}
                    >
                      {/* Date */}
                      <td className="py-3 px-3.5 whitespace-nowrap text-muted-foreground font-medium">
                        {format(new Date(p.invoice_date), "dd MMM yyyy")}
                      </td>

                      {/* Invoice No. */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span className="font-bold text-foreground group-hover:text-primary transition-colors">
                          {p.invoice_number}
                        </span>
                        {p.status === "Draft" && (
                          <Badge variant="outline" className="ml-1.5 text-[10px] rounded-md py-0">
                            Draft
                          </Badge>
                        )}
                      </td>

                      {/* Supplier */}
                      <td className="py-3 px-3.5">
                        <p className="font-semibold text-foreground truncate max-w-[180px]">
                          {p.supplier_name}
                        </p>
                        {p.supplier_gstin && (
                          <p className="text-[10px] font-mono text-muted-foreground">
                            {p.supplier_gstin}
                          </p>
                        )}
                      </td>

                      {/* Purchase Type */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-muted text-muted-foreground border">
                          {p.purchase_type}
                        </span>
                      </td>

                      {/* Taxable */}
                      <td className="py-3 px-3.5 text-right font-medium tabular-nums whitespace-nowrap">
                        ₹{p.subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>

                      {/* GST */}
                      <td className="py-3 px-3.5 text-right tabular-nums whitespace-nowrap">
                        {p.is_gst_bill ? (
                          <span className="font-medium text-primary">
                            ₹{p.total_gst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Exempt</span>
                        )}
                      </td>

                      {/* Total Amount */}
                      <td className="py-3 px-3.5 text-right font-bold text-foreground tabular-nums whitespace-nowrap">
                        ₹{p.grand_total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>

                      {/* Payment Status */}
                      <td className="py-3 px-3.5 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                            isPaid
                              ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                              : isPartial
                              ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                              : "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                          }`}
                        >
                          {p.payment_status}
                        </span>
                      </td>

                      {/* Documents */}
                      <td
                        className="py-3 px-3.5 text-center whitespace-nowrap"
                        onClick={(e) => {
                          if (hasDoc && p.documents?.[0]) {
                            e.stopPropagation()
                            onPreviewDocument(p.documents[0])
                          }
                        }}
                      >
                        {hasDoc ? (
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-medium text-[11px]"
                            title="Click to view attached original bill"
                          >
                            <Paperclip className="h-3 w-3" />
                            {p.documents!.length} bill{p.documents!.length > 1 ? "s" : ""}
                          </button>
                        ) : (
                          <span className="text-[11px] text-muted-foreground/60 italic">No bill</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3.5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => onViewPurchase(p)}
                            className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
                            title="View details"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => onAddPayment(p)}
                            className="h-7 w-7 rounded-lg text-emerald-600 hover:bg-emerald-500/10"
                            title="Add Payment"
                          >
                            <IndianRupee className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(p)}
                            className="h-7 w-7 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            title="Delete purchase"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Server Pagination */}
        {total > 0 && (
          <div className="border-t p-3 bg-muted/15">
            <TablePagination
              page={page}
              total={total}
              pageSize={pageSize}
              onPageChange={onPageChange}
              onPageSizeChange={onPageSizeChange}
              isLoading={isLoading}
              itemName="purchases"
            />
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog with conservative warning */}
      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Purchase Bill?"
        description={
          purchaseToDelete
            ? `This purchase bill (#${purchaseToDelete.invoice_number} from ${purchaseToDelete.supplier_name}) has ₹${purchaseToDelete.grand_total.toLocaleString("en-IN")} transaction value, ₹${purchaseToDelete.total_gst.toLocaleString("en-IN")} GST input, and ${purchaseToDelete.documents?.length || 0} attached document(s). Deleting this will reverse any stock added and remove payment records. Are you sure you want to proceed?`
            : "Are you sure you want to delete this purchase bill?"
        }
        confirmText="Delete Purchase"
        variant="destructive"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}
