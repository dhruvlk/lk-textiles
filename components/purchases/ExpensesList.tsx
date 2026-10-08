"use client"

import { useState } from "react"
import {
  Search,
  Plus,
  Trash2,
  Edit,
  Paperclip,
  Wallet,
  Building2,
  Calendar,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ConfirmationDialog } from "@/components/dialogs/ConfirmationDialog"
import { TablePagination } from "@/components/tables/TablePagination"
import type { TablePageSize } from "@/lib/table/pagination"
import { format } from "date-fns"
import { toast } from "sonner"
import { deleteExpense } from "@/services/expenses.service"
import type { Expense, ExpenseCategory, ExpenseFilters, PaginatedResult, VaultDocument } from "@/types"

interface ExpensesListProps {
  companyId: string
  expensesResult: PaginatedResult<Expense> | null
  isLoading: boolean
  categories: ExpenseCategory[]
  filters: ExpenseFilters
  onFiltersChange: (patch: Partial<ExpenseFilters>) => void
  page: number
  pageSize: TablePageSize
  onPageChange: (page: number) => void
  onPageSizeChange: (size: TablePageSize) => void
  onRefresh: () => void
  onAddExpense: () => void
  onEditExpense: (expense: Expense) => void
  onPreviewDocument: (doc: VaultDocument) => void
}

export function ExpensesList({
  companyId,
  expensesResult,
  isLoading,
  categories,
  filters,
  onFiltersChange,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onRefresh,
  onAddExpense,
  onEditExpense,
  onPreviewDocument,
}: ExpensesListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const expenses = expensesResult?.data || []
  const total = expensesResult?.total || 0

  const handleDeleteClick = (expense: Expense) => {
    setExpenseToDelete(expense)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!expenseToDelete) return
    setIsDeleting(true)
    try {
      await deleteExpense(companyId, expenseToDelete.id)
      toast.success(`Expense paid to "${expenseToDelete.paid_to}" deleted.`)
      setDeleteDialogOpen(false)
      setExpenseToDelete(null)
      onRefresh()
    } catch (err) {
      console.error("Delete expense error:", err)
      toast.error("Failed to delete expense.")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search paid to, category, reference..."
              value={filters.search || ""}
              onChange={(e) => onFiltersChange({ search: e.target.value })}
              className="pl-9 h-10 rounded-xl"
            />
          </div>

          {/* Category filter */}
          <Select
            value={filters.categoryId || "all"}
            onValueChange={(val) =>
              onFiltersChange({ categoryId: !val || val === "all" ? "" : val })
            }
          >
            <SelectTrigger className="h-10 w-[160px] rounded-xl text-xs">
              <SelectValue placeholder="All Categories">
                {(value: string | null) => {
                  if (!value || value === "all") return "All Categories"
                  return categories.find((c) => c.id === value)?.name ?? "Category"
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="max-h-[240px]">
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Payment Status filter */}
          <Select
            value={filters.paymentStatus || "all"}
            onValueChange={(val) =>
              onFiltersChange({
                paymentStatus: !val || val === "all" ? "" : (val as Expense["payment_status"]),
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
        </div>

        <Button onClick={onAddExpense} className="rounded-xl shadow-xs shrink-0">
          <Plus className="h-4 w-4 mr-1.5" /> Add Expense
        </Button>
      </div>

      {/* Main Expenses Table */}
      <div className="rounded-2xl border bg-card shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/40 border-b text-muted-foreground uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-3.5 text-left font-semibold">Date</th>
                <th className="py-3 px-3.5 text-left font-semibold">Category</th>
                <th className="py-3 px-3.5 text-left font-semibold">Paid To / Vendor</th>
                <th className="py-3 px-3.5 text-left font-semibold">Reference</th>
                <th className="py-3 px-3.5 text-right font-semibold">Amount</th>
                <th className="py-3 px-3.5 text-right font-semibold">GST</th>
                <th className="py-3 px-3.5 text-center font-semibold">Payment Status</th>
                <th className="py-3 px-3.5 text-center font-semibold">Doc</th>
                <th className="py-3 px-3.5 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-muted-foreground">
                    Loading company expenses...
                  </td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center">
                    <div className="max-w-xs mx-auto text-center space-y-2">
                      <Wallet className="h-10 w-10 mx-auto text-muted-foreground/50" />
                      <p className="text-sm font-semibold text-foreground">No expenses recorded yet</p>
                      <p className="text-xs text-muted-foreground">
                        Keep track of rent, electricity, transport, machine repair, and office costs.
                      </p>
                      <Button size="sm" onClick={onAddExpense} className="rounded-xl mt-2">
                        <Plus className="h-4 w-4 mr-1.5" /> Record Expense
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                expenses.map((e) => {
                  const hasDoc = e.documents && e.documents.length > 0
                  const isPaid = e.payment_status === "Paid"
                  const isPartial = e.payment_status === "Partially Paid"

                  return (
                    <tr
                      key={e.id}
                      className="hover:bg-muted/30 transition-colors cursor-pointer group"
                      onClick={() => onEditExpense(e)}
                    >
                      {/* Date */}
                      <td className="py-3 px-3.5 whitespace-nowrap text-muted-foreground font-medium">
                        {format(new Date(e.expense_date), "dd MMM yyyy")}
                      </td>

                      {/* Category Badge */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-muted border">
                          <span
                            className="h-2 w-2 rounded-full shrink-0"
                            style={{ backgroundColor: e.category?.color || "#64748b" }}
                          />
                          {e.category_name}
                        </span>
                      </td>

                      {/* Paid To */}
                      <td className="py-3 px-3.5">
                        <p className="font-semibold text-foreground truncate max-w-[200px]">
                          {e.paid_to}
                        </p>
                        {e.vendor_gstin && (
                          <p className="text-[10px] font-mono text-muted-foreground">
                            GSTIN: {e.vendor_gstin}
                          </p>
                        )}
                      </td>

                      {/* Reference */}
                      <td className="py-3 px-3.5 text-muted-foreground whitespace-nowrap">
                        {e.reference_number || "—"}
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-3.5 text-right font-bold text-foreground tabular-nums whitespace-nowrap">
                        ₹{e.total_amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>

                      {/* GST */}
                      <td className="py-3 px-3.5 text-right tabular-nums whitespace-nowrap">
                        {e.is_gst_applicable ? (
                          <span className="font-medium text-primary">
                            ₹{e.total_gst.toFixed(2)} ({e.gst_rate}%)
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Non-GST</span>
                        )}
                      </td>

                      {/* Payment Status */}
                      <td className="py-3 px-3.5 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            isPaid
                              ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                              : isPartial
                              ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                              : "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                          }`}
                        >
                          {e.payment_status}
                        </span>
                      </td>

                      {/* Doc */}
                      <td
                        className="py-3 px-3.5 text-center whitespace-nowrap"
                        onClick={(evt) => {
                          if (hasDoc && e.documents?.[0]) {
                            evt.stopPropagation()
                            onPreviewDocument(e.documents[0])
                          }
                        }}
                      >
                        {hasDoc ? (
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-medium text-[11px]"
                            title="Click to view attached original receipt"
                          >
                            <Paperclip className="h-3 w-3" />
                            receipt
                          </button>
                        ) : (
                          <span className="text-[11px] text-muted-foreground/60 italic">No bill</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3.5 text-right whitespace-nowrap" onClick={(evt) => evt.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => onEditExpense(e)}
                            className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
                            title="Edit expense"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(e)}
                            className="h-7 w-7 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            title="Delete expense"
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
              itemName="expenses"
            />
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Expense Record?"
        description={
          expenseToDelete
            ? `Are you sure you want to delete this expense of ₹${expenseToDelete.total_amount.toLocaleString("en-IN")} paid to "${expenseToDelete.paid_to}"?`
            : "Are you sure you want to delete this expense?"
        }
        confirmText="Delete Expense"
        variant="destructive"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}
