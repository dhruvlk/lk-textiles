"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Wallet, Plus, UploadCloud, FileText, Loader2, IndianRupee } from "lucide-react"
import { toast } from "sonner"
import { createExpense, updateExpense } from "@/services/expenses.service"
import { createExpenseCategory } from "@/services/expense-categories.service"
import { uploadVaultDocument } from "@/services/documents.service"
import { formatFinancialYearCode, formatFinancialYearLabel, isValidGstin } from "@/types"
import type { Expense, ExpenseCategory, Supplier } from "@/types"

interface ExpenseModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyId: string
  categories: ExpenseCategory[]
  suppliers: Supplier[]
  expenseToEdit?: Expense | null
  userId?: string | null
  onSuccess: (expense: Expense) => void
  onCategoryAdded?: (newCategory: ExpenseCategory) => void
}

const PAYMENT_METHODS: Expense["payment_method"][] = [
  "Bank Transfer",
  "Cash",
  "UPI",
  "Cheque",
  "Card",
  "Other",
]

const GST_RATES = [0, 5, 12, 18, 28]

export function ExpenseModal({
  open,
  onOpenChange,
  companyId,
  categories,
  suppliers,
  expenseToEdit,
  userId,
  onSuccess,
  onCategoryAdded,
}: ExpenseModalProps) {
  const isEditing = Boolean(expenseToEdit)

  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10))
  const [categoryId, setCategoryId] = useState("")
  const [paidTo, setPaidTo] = useState("")
  const [supplierId, setSupplierId] = useState<string>("none")
  const [amount, setAmount] = useState("")
  const [isGst, setIsGst] = useState(false)
  const [vendorGstin, setVendorGstin] = useState("")
  const [hsnSac, setHsnSac] = useState("")
  const [gstRate, setGstRate] = useState(18)
  const [paymentMethod, setPaymentMethod] = useState<Expense["payment_method"]>("Bank Transfer")
  const [paymentStatus, setPaymentStatus] = useState<Expense["payment_status"]>("Paid")
  const [paidAmount, setPaidAmount] = useState("")
  const [referenceNumber, setReferenceNumber] = useState("")
  const [notes, setNotes] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Quick Category creation state
  const [isCreatingCategory, setIsCreatingCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")

  const financialYear = formatFinancialYearCode(expenseDate)

  useEffect(() => {
    if (expenseToEdit) {
      setExpenseDate(expenseToEdit.expense_date)
      setCategoryId(expenseToEdit.category_id || "")
      setPaidTo(expenseToEdit.paid_to)
      setSupplierId(expenseToEdit.supplier_id || "none")
      setAmount(String(expenseToEdit.amount))
      setIsGst(expenseToEdit.is_gst_applicable)
      setVendorGstin(expenseToEdit.vendor_gstin || "")
      setHsnSac(expenseToEdit.hsn_sac || "")
      setGstRate(expenseToEdit.gst_rate || 18)
      setPaymentMethod(expenseToEdit.payment_method)
      setPaymentStatus(expenseToEdit.payment_status)
      setPaidAmount(String(expenseToEdit.paid_amount ?? expenseToEdit.amount))
      setReferenceNumber(expenseToEdit.reference_number || "")
      setNotes(expenseToEdit.notes || "")
      setFile(null)
    } else {
      setExpenseDate(new Date().toISOString().slice(0, 10))
      setCategoryId(categories[0]?.id || "")
      setPaidTo("")
      setSupplierId("none")
      setAmount("")
      setIsGst(false)
      setVendorGstin("")
      setHsnSac("")
      setGstRate(18)
      setPaymentMethod("Bank Transfer")
      setPaymentStatus("Paid")
      setPaidAmount("")
      setReferenceNumber("")
      setNotes("")
      setFile(null)
    }
  }, [expenseToEdit, open, categories])

  // Calculate GST breakdowns
  const numAmount = parseFloat(amount) || 0
  let taxableAmount = numAmount
  let cgst = 0
  let sgst = 0
  let igst = 0
  let totalGst = 0
  let totalAmount = numAmount

  if (isGst && numAmount > 0) {
    taxableAmount = numAmount
    totalGst = (taxableAmount * gstRate) / 100
    cgst = totalGst / 2
    sgst = totalGst / 2
    totalAmount = taxableAmount + totalGst
  }

  // Auto-sync paidAmount when paymentStatus is 'Paid'
  useEffect(() => {
    if (paymentStatus === "Paid") {
      setPaidAmount(String(totalAmount.toFixed(2)))
    } else if (paymentStatus === "Unpaid") {
      setPaidAmount("0")
    }
  }, [paymentStatus, totalAmount])

  const handleCreateNewCategory = async () => {
    if (!newCategoryName.trim()) return
    try {
      const created = await createExpenseCategory(companyId, { name: newCategoryName.trim() })
      toast.success(`Category "${created.name}" created!`)
      onCategoryAdded?.(created)
      setCategoryId(created.id)
      setNewCategoryName("")
      setIsCreatingCategory(false)
    } catch {
      toast.error("Failed to create category")
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!paidTo.trim()) {
      toast.error("Please enter who this was paid to.")
      return
    }
    if (numAmount <= 0) {
      toast.error("Please enter a valid expense amount.")
      return
    }

    const selectedCategory = categories.find((c) => c.id === categoryId)
    const categoryName = selectedCategory ? selectedCategory.name : "Other Expenses"

    setIsSaving(true)
    try {
      let savedExpense: Expense
      if (isEditing && expenseToEdit) {
        savedExpense = await updateExpense(
          companyId,
          expenseToEdit.id,
          {
            expense_date: expenseDate,
            financial_year: financialYear,
            category_id: categoryId || null,
            category_name: categoryName,
            paid_to: paidTo.trim(),
            supplier_id: supplierId === "none" ? null : supplierId,
            amount: numAmount,
            is_gst_applicable: isGst,
            vendor_gstin: isGst && vendorGstin ? vendorGstin.trim().toUpperCase() : null,
            hsn_sac: isGst && hsnSac ? hsnSac.trim() : null,
            taxable_amount: taxableAmount,
            gst_rate: isGst ? gstRate : 0,
            cgst_amount: cgst,
            sgst_amount: sgst,
            igst_amount: igst,
            total_gst: totalGst,
            total_amount: totalAmount,
            payment_method: paymentMethod,
            payment_status: paymentStatus,
            paid_amount: parseFloat(paidAmount) || 0,
            reference_number: referenceNumber.trim() || null,
            notes: notes.trim() || null,
          },
          userId
        )
        toast.success("Expense updated successfully!")
      } else {
        savedExpense = await createExpense(
          companyId,
          {
            expense_date: expenseDate,
            financial_year: financialYear,
            category_id: categoryId || null,
            category_name: categoryName,
            paid_to: paidTo.trim(),
            supplier_id: supplierId === "none" ? null : supplierId,
            amount: numAmount,
            is_gst_applicable: isGst,
            vendor_gstin: isGst && vendorGstin ? vendorGstin.trim().toUpperCase() : null,
            hsn_sac: isGst && hsnSac ? hsnSac.trim() : null,
            taxable_amount: taxableAmount,
            gst_rate: isGst ? gstRate : 0,
            cgst_amount: cgst,
            sgst_amount: sgst,
            igst_amount: igst,
            total_gst: totalGst,
            total_amount: totalAmount,
            payment_method: paymentMethod,
            payment_status: paymentStatus,
            paid_amount: parseFloat(paidAmount) || 0,
            reference_number: referenceNumber.trim() || null,
            notes: notes.trim() || null,
            status: "Active",
          },
          userId
        )
        toast.success("Expense recorded successfully!")
      }

      // If document attached, upload to vault linked to this expense
      if (file && savedExpense) {
        try {
          await uploadVaultDocument(companyId, file, {
            financialYear,
            documentType: "Expense Bill",
            expenseId: savedExpense.id,
            supplierId: supplierId === "none" ? null : supplierId,
            description: `Expense: ${categoryName} - Paid to ${paidTo}`,
            tags: ["Expense", categoryName],
            userId,
          })
          toast.success("Expense bill document attached to vault!")
        } catch (uploadErr) {
          console.error("Document upload error:", uploadErr)
          toast.error("Expense saved, but bill file upload failed.")
        }
      }

      onSuccess(savedExpense)
      onOpenChange(false)
    } catch (err) {
      console.error("Error saving expense:", err)
      toast.error("Failed to save expense.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl p-6 sm:p-7">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            {isEditing ? "Edit Expense" : "Record Expense"}
          </DialogTitle>
          <DialogDescription className="text-sm">
            Track business operating expenses, factory costs, repairs, and GST bills.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4 py-2">
          {/* Date & Financial Year */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Expense Date *</Label>
              <Input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                required
                className="h-10 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Financial Year</Label>
              <Input
                value={formatFinancialYearLabel(financialYear)}
                disabled
                className="h-10 rounded-xl bg-muted/40 font-medium"
              />
            </div>
          </div>

          {/* Category with quick creation */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold">Category *</Label>
              {!isCreatingCategory ? (
                <button
                  type="button"
                  onClick={() => setIsCreatingCategory(true)}
                  className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
                >
                  <Plus className="h-3 w-3" /> New Category
                </button>
              ) : null}
            </div>

            {!isCreatingCategory ? (
              <Select value={categoryId} onValueChange={(val) => setCategoryId(val || "")}>
                <SelectTrigger className="h-10 rounded-xl">
                  <SelectValue placeholder="Select expense category">
                    {(value: string | null) => {
                      if (!value) return "Select expense category"
                      const c = categories.find((x) => x.id === value)
                      return c ? c.name : "Select expense category"
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-[220px]">
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <span className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 rounded-full shrink-0"
                          style={{ backgroundColor: c.color || "#64748b" }}
                        />
                        {c.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="flex items-center gap-2">
                <Input
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Category Name (e.g. Loom Oil, Courier)"
                  className="h-10 rounded-xl flex-1"
                />
                <Button type="button" size="sm" onClick={handleCreateNewCategory}>
                  Add
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsCreatingCategory(false)}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>

          {/* Paid To & Optional Supplier Link */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Paid To / Vendor *</Label>
              <Input
                value={paidTo}
                onChange={(e) => setPaidTo(e.target.value)}
                placeholder="e.g. Torrent Power, Sharma Transports"
                required
                className="h-10 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Link Supplier (Optional)</Label>
              <Select value={supplierId} onValueChange={(val) => setSupplierId(val || "")}>
                <SelectTrigger className="h-10 rounded-xl">
                  <SelectValue placeholder="Optional supplier">
                    {(value: string | null) => {
                      if (!value || value === "none") return "-- Not Linked --"
                      const s = suppliers.find((x) => x.id === value)
                      return s ? `${s.name}${s.gstin ? ` (${s.gstin})` : ""}` : "Optional supplier"
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- Not Linked --</SelectItem>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} {s.gstin ? `(${s.gstin})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Amount & GST applicable toggle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Amount (₹) *</Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  required
                  className="pl-9 h-10 rounded-xl font-semibold"
                />
              </div>
            </div>

            <div className="flex flex-col justify-end space-y-1.5">
              <label className="flex items-center gap-2 p-2.5 rounded-xl border bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors">
                <input
                  type="checkbox"
                  checked={isGst}
                  onChange={(e) => setIsGst(e.target.checked)}
                  className="h-4 w-4 rounded text-primary focus:ring-primary"
                />
                <span className="text-xs font-medium">GST Applicable Bill</span>
              </label>
            </div>
          </div>

          {/* GST Configuration (Shown if GST applicable) */}
          {isGst && (
            <div className="p-3.5 rounded-xl border bg-muted/30 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold">Vendor GSTIN</Label>
                  <Input
                    value={vendorGstin}
                    onChange={(e) => setVendorGstin(e.target.value.toUpperCase())}
                    placeholder="24AAAAA0000A1Z5"
                    maxLength={15}
                    className="h-9 rounded-lg uppercase font-mono text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold">HSN / SAC</Label>
                  <Input
                    value={hsnSac}
                    onChange={(e) => setHsnSac(e.target.value)}
                    placeholder="996511"
                    className="h-9 rounded-lg text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold">GST Rate (%)</Label>
                  <Select value={String(gstRate)} onValueChange={(val) => setGstRate(Number(val || 0))}>
                    <SelectTrigger className="h-9 rounded-lg text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GST_RATES.map((r) => (
                        <SelectItem key={r} value={String(r)}>
                          {r}%
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Tax calculations summary */}
              <div className="flex items-center justify-between text-xs pt-1 text-muted-foreground border-t">
                <span>Taxable: ₹{taxableAmount.toFixed(2)}</span>
                <span>CGST: ₹{cgst.toFixed(2)}</span>
                <span>SGST: ₹{sgst.toFixed(2)}</span>
                <span className="font-semibold text-foreground">Total: ₹{totalAmount.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Payment Method & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Payment Method</Label>
              <Select
                value={paymentMethod}
                onValueChange={(val) => val && setPaymentMethod(val as Expense["payment_method"])}
              >
                <SelectTrigger className="h-10 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Payment Status</Label>
              <Select
                value={paymentStatus}
                onValueChange={(val) => val && setPaymentStatus(val as Expense["payment_status"])}
              >
                <SelectTrigger className="h-10 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Partially Paid">Partially Paid</SelectItem>
                  <SelectItem value="Unpaid">Unpaid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Paid Amount (₹)</Label>
              <Input
                type="number"
                step="0.01"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                placeholder="0.00"
                className="h-10 rounded-xl"
              />
            </div>
          </div>

          {/* Reference Number & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Ref / Cheque / UTR No.</Label>
              <Input
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="e.g. UTR-9842187"
                className="h-10 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Notes</Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional remark"
                className="h-10 rounded-xl"
              />
            </div>
          </div>

          {/* Attachment / Bill Document */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Attach Original Bill / Slip</Label>
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
              />
              {file && (
                <span className="text-xs text-muted-foreground truncate">
                  ({(file.size / 1024).toFixed(1)} KB)
                </span>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:justify-end border-t pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving} className="rounded-xl shadow-xs">
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Update Expense" : "Record Expense"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
