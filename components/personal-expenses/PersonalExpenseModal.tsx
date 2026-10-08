"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Calendar,
  DollarSign,
  UploadCloud,
  FileText,
  Image as ImageIcon,
  X,
  Loader2,
  Trash2,
  Tag,
  CreditCard,
  Building,
} from "lucide-react"
import { toast } from "sonner"
import {
  createPersonalExpense,
  updatePersonalExpense,
  uploadExpenseAttachments,
  deleteExpenseAttachment,
  getPersonalSubcategories,
} from "@/services/personal-expenses.service"
import type {
  PersonalExpense,
  PersonalExpenseCategory,
  PersonalPaymentStatus,
} from "@/types/personal-expenses"

interface PersonalExpenseModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  expenseToEdit?: PersonalExpense | null
  categories: PersonalExpenseCategory[]
  paymentMethods: string[]
  existingMerchants?: string[]
  onSuccess: (saved: PersonalExpense) => void
}

export function PersonalExpenseModal({
  open,
  onOpenChange,
  userId,
  expenseToEdit,
  categories,
  paymentMethods,
  existingMerchants = [],
  onSuccess,
}: PersonalExpenseModalProps) {
  const isEditing = !!expenseToEdit
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form states
  const [expenseDate, setExpenseDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  )
  const [categoryId, setCategoryId] = useState<string>("")
  const [categoryName, setCategoryName] = useState<string>("")
  const [subcategoryId, setSubcategoryId] = useState<string>("")
  const [subcategoryName, setSubcategoryName] = useState<string>("")
  const [description, setDescription] = useState<string>("")
  const [amount, setAmount] = useState<string>("")
  const [paymentMethod, setPaymentMethod] = useState<string>("Cash")
  const [paymentStatus, setPaymentStatus] = useState<PersonalPaymentStatus>("Paid")
  const [paidAmount, setPaidAmount] = useState<string>("")
  const [paidTo, setPaidTo] = useState<string>("")
  const [notes, setNotes] = useState<string>("")

  // File uploads
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [existingDocs, setExistingDocs] = useState<PersonalExpense["documents"]>([])
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Dependent Subcategories state
  const [subcategories, setSubcategories] = useState<PersonalExpenseCategory[]>([])
  const [subcategoriesLoading, setSubcategoriesLoading] = useState(false)
  const [subcategoriesError, setSubcategoriesError] = useState<string | null>(null)

  const loadSubcategories = useCallback(
    async (catId: string, initialSubId?: string) => {
      if (!catId || !userId) {
        setSubcategories([])
        setSubcategoriesLoading(false)
        setSubcategoriesError(null)
        return
      }

      setSubcategoriesLoading(true)
      setSubcategoriesError(null)
      try {
        const list = await getPersonalSubcategories(userId, catId)
        setSubcategories(list)
        if (initialSubId) {
          const match = list.find((s) => s.id === initialSubId)
          if (match) {
            setSubcategoryId(match.id)
            setSubcategoryName(match.name)
          } else {
            setSubcategoryId("")
            setSubcategoryName("")
          }
        }
      } catch (err) {
        console.error("Failed to load subcategories:", err)
        setSubcategoriesError("Unable to load subcategories")
      } finally {
        setSubcategoriesLoading(false)
      }
    },
    [userId]
  )

  // Initialize or reset form
  useEffect(() => {
    if (open) {
      if (expenseToEdit) {
        setExpenseDate(expenseToEdit.expense_date)
        setCategoryId(expenseToEdit.category_id || "")
        setCategoryName(expenseToEdit.category_name)
        setDescription(expenseToEdit.description)
        setAmount(String(expenseToEdit.amount))
        setPaymentMethod(expenseToEdit.payment_method || "Cash")
        setPaymentStatus(expenseToEdit.payment_status || "Paid")
        setPaidAmount(String(expenseToEdit.paid_amount || ""))
        setPaidTo(expenseToEdit.paid_to || "")
        setNotes(expenseToEdit.notes || "")
        setExistingDocs(expenseToEdit.documents || [])
        setSelectedFiles([])

        if (expenseToEdit.category_id) {
          loadSubcategories(expenseToEdit.category_id, expenseToEdit.subcategory_id || undefined)
        } else {
          setSubcategories([])
          setSubcategoryId("")
          setSubcategoryName("")
        }
      } else {
        setExpenseDate(new Date().toISOString().split("T")[0])
        const firstCat = categories.length > 0 ? categories[0] : null
        const initialCatId = firstCat ? firstCat.id : ""
        setCategoryId(initialCatId)
        setCategoryName(firstCat ? firstCat.name : "General")
        setSubcategoryId("")
        setSubcategoryName("")
        setDescription("")
        setAmount("")
        setPaymentMethod(paymentMethods[0] || "Cash")
        setPaymentStatus("Paid")
        setPaidAmount("")
        setPaidTo("")
        setNotes("")
        setExistingDocs([])
        setSelectedFiles([])

        if (initialCatId) {
          loadSubcategories(initialCatId)
        } else {
          setSubcategories([])
        }
      }
    }
  }, [open, expenseToEdit, categories, paymentMethods, loadSubcategories])

  const handleCategoryChange = (catId: string | null) => {
    if (!catId) return
    setCategoryId(catId)
    const cat = categories.find((c) => c.id === catId)
    setCategoryName(cat ? cat.name : "")
    // Clear subcategory automatically on category change
    setSubcategoryId("")
    setSubcategoryName("")
    loadSubcategories(catId)
  }

  const handleSubcategoryChange = (subId: string | null) => {
    if (!subId || subId === "none") {
      setSubcategoryId("")
      setSubcategoryName("")
      return
    }
    setSubcategoryId(subId)
    const sub = subcategories.find((s) => s.id === subId)
    setSubcategoryName(sub ? sub.name : "")
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files)
      // Check file types (PDF, JPG, JPEG, PNG, WEBP)
      const valid = filesArray.filter((f) =>
        /\.(pdf|jpg|jpeg|png|webp)$/i.test(f.name)
      )
      if (valid.length < filesArray.length) {
        toast.warning("Some files were skipped. Only PDF, JPG, PNG, WEBP allowed.")
      }
      setSelectedFiles((prev) => [...prev, ...valid])
    }
  }

  const handleRemoveSelectedFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleDeleteExistingDoc = async (docId: string) => {
    if (!docId) return
    setDeletingDocId(docId)
    try {
      await deleteExpenseAttachment(docId, userId)
      setExistingDocs((prev) => (prev || []).filter((d) => d.id !== docId))
      toast.success("Document deleted")
    } catch (err) {
      console.error(err)
      toast.error("Failed to delete document")
    } finally {
      setDeletingDocId(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Please enter a valid expense amount")
      return
    }

    if (!description.trim()) {
      toast.error("Description is required")
      return
    }

    if (!categoryName) {
      toast.error("Please select a category")
      return
    }

    setIsSubmitting(true)

    try {
      let saved: PersonalExpense

      if (isEditing && expenseToEdit) {
        saved = await updatePersonalExpense(expenseToEdit.id, userId, {
          expense_date: expenseDate,
          category_id: categoryId || null,
          category_name: categoryName,
          subcategory_id: subcategoryId || null,
          subcategory_name: subcategoryName || null,
          description: description.trim(),
          amount: parsedAmount,
          payment_method: paymentMethod,
          payment_status: paymentStatus,
          paid_amount:
            paymentStatus === "Partially Paid"
              ? parseFloat(paidAmount) || 0
              : undefined,
          paid_to: paidTo.trim() || null,
          notes: notes.trim() || null,
        })

        // If new files were selected in edit mode, upload them
        if (selectedFiles.length > 0) {
          const newDocs = await uploadExpenseAttachments(saved.id, userId, selectedFiles)
          saved.documents = [...(saved.documents || []), ...newDocs]
        }

        toast.success("Expense updated successfully")
      } else {
        saved = await createPersonalExpense(
          userId,
          {
            expense_date: expenseDate,
            category_id: categoryId || null,
            category_name: categoryName,
            subcategory_id: subcategoryId || null,
            subcategory_name: subcategoryName || null,
            description: description.trim(),
            amount: parsedAmount,
            payment_method: paymentMethod,
            payment_status: paymentStatus,
            paid_amount:
              paymentStatus === "Partially Paid"
                ? parseFloat(paidAmount) || 0
                : undefined,
            paid_to: paidTo.trim() || null,
            notes: notes.trim() || null,
          },
          selectedFiles
        )

        toast.success(`Expense ${saved.expense_number} recorded!`)
      }

      onSuccess(saved)
      onOpenChange(false)
    } catch (err) {
      console.error(err)
      toast.error(isEditing ? "Failed to update expense" : "Failed to record expense")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl w-[95vw] max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden rounded-2xl bg-background border shadow-2xl">
        <DialogHeader className="p-4 sm:px-6 border-b shrink-0 bg-muted/20">
          <DialogTitle className="text-lg font-semibold flex items-center gap-2">
            <Tag className="h-5 w-5 text-primary" />
            {isEditing ? `Edit Expense: ${expenseToEdit.expense_number}` : "+ Record Personal Expense"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Simple & fast expense entry for personal & household spending.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Top Row: Date & Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="exp-date" className="text-xs font-semibold">
                Expense Date *
              </Label>
              <Input
                id="exp-date"
                type="date"
                required
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="text-sm font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="exp-amount" className="text-xs font-semibold">
                Amount (₹) *
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-sm font-bold text-muted-foreground">
                  ₹
                </span>
                <Input
                  id="exp-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-7 text-base font-bold text-foreground"
                />
              </div>
            </div>
          </div>

          {/* Category & Subcategory Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Category *</Label>
              <Select value={categoryId} onValueChange={handleCategoryChange}>
                <SelectTrigger className="text-xs sm:text-sm">
                  <SelectValue placeholder="Select Category">
                    {(val) => {
                      if (!val) return "Select Category"
                      const c = categories.find((x) => x.id === val)
                      return c ? c.name : "Select Category"
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: c.color || "#4f46e5" }}
                        />
                        <span>{c.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Subcategory (Optional)</Label>
                {subcategoriesError ? (
                  <button
                    type="button"
                    onClick={() => loadSubcategories(categoryId)}
                    className="text-[11px] text-destructive hover:underline font-medium"
                  >
                    Retry
                  </button>
                ) : null}
              </div>
              <Select
                value={subcategoryId || "none"}
                onValueChange={handleSubcategoryChange}
                disabled={!categoryId || subcategoriesLoading || subcategories.length === 0}
              >
                <SelectTrigger className="text-xs sm:text-sm">
                  <SelectValue
                    placeholder={
                      !categoryId
                        ? "Select a category first"
                        : subcategoriesLoading
                        ? "Loading subcategories..."
                        : subcategoriesError
                        ? "Unable to load subcategories"
                        : subcategories.length === 0
                        ? "No subcategories available"
                        : "Select Subcategory"
                    }
                  >
                    {(val) => {
                      if (!val || val === "none") {
                        return !categoryId
                          ? "Select a category first"
                          : subcategoriesLoading
                          ? "Loading subcategories..."
                          : subcategoriesError
                          ? "Unable to load subcategories"
                          : subcategories.length === 0
                          ? "No subcategories available"
                          : "Select Subcategory"
                      }
                      const sub = subcategories.find((x) => x.id === val)
                      return sub ? sub.name : "Select Subcategory"
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {subcategories.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="exp-desc" className="text-xs font-semibold">
              Description *
            </Label>
            <Input
              id="exp-desc"
              required
              placeholder="e.g. Weekly Groceries at Supermarket, Dinner with family, AC repair"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-sm"
            />
          </div>

          {/* Paid To / Merchant & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="exp-merchant" className="text-xs font-semibold">
                Paid To / Merchant
              </Label>
              <Input
                id="exp-merchant"
                list="merchants-list"
                placeholder="e.g. Swiggy, Amazon, Reliance, Landlord"
                value={paidTo}
                onChange={(e) => setPaidTo(e.target.value)}
                className="text-sm"
              />
              <datalist id="merchants-list">
                {existingMerchants.map((m) => (
                  <option key={m} value={m} />
                ))}
              </datalist>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Payment Method</Label>
              <Select
                value={paymentMethod}
                onValueChange={(val) => {
                  if (val) setPaymentMethod(val)
                }}
              >
                <SelectTrigger className="text-xs sm:text-sm">
                  <SelectValue placeholder="Select Method">
                    {(val) => val || "Select Method"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((pm) => (
                    <SelectItem key={pm} value={pm}>
                      {pm}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Payment Status & Partially Paid Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Payment Status</Label>
              <Select
                value={paymentStatus}
                onValueChange={(val) => {
                  if (val) setPaymentStatus(val as PersonalPaymentStatus)
                }}
              >
                <SelectTrigger className="text-xs sm:text-sm">
                  <SelectValue placeholder="Status">
                    {(val) => val || "Status"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Pending">Pending (Unpaid)</SelectItem>
                  <SelectItem value="Partially Paid">Partially Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {paymentStatus === "Partially Paid" && (
              <div className="space-y-1.5">
                <Label htmlFor="exp-paid-amt" className="text-xs font-semibold">
                  Paid Amount (₹)
                </Label>
                <Input
                  id="exp-paid-amt"
                  type="number"
                  step="0.01"
                  min="0"
                  max={amount}
                  placeholder="0.00"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  className="text-sm font-semibold"
                />
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="exp-notes" className="text-xs font-semibold">
              Personal Notes (Optional)
            </Label>
            <Textarea
              id="exp-notes"
              rows={2}
              placeholder="e.g. Paid via Google Pay, warrantied for 1 year"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="text-xs resize-none"
            />
          </div>

          {/* Bill / Document Uploads */}
          <div className="space-y-2 pt-1 border-t border-dashed">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <UploadCloud className="h-4 w-4 text-primary" />
                Bill & Receipt Attachments
              </Label>
              <span className="text-[11px] text-muted-foreground">PDF, JPG, PNG, WEBP</span>
            </div>

            {/* Existing Documents in Edit Mode */}
            {existingDocs && existingDocs.length > 0 && (
              <div className="space-y-1.5 mb-2">
                <p className="text-[11px] text-muted-foreground font-medium">
                  Current Attachments:
                </p>
                <div className="flex flex-wrap gap-2">
                  {existingDocs.map((doc) => (
                    <Badge
                      key={doc.id}
                      variant="secondary"
                      className="text-xs py-1 px-2.5 gap-2 flex items-center bg-muted/60"
                    >
                      <FileText className="h-3.5 w-3.5 text-primary" />
                      <span className="truncate max-w-[150px]">{doc.file_name}</span>
                      <button
                        type="button"
                        disabled={deletingDocId === doc.id}
                        onClick={() => handleDeleteExistingDoc(doc.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors ml-1"
                        title="Delete attachment"
                      >
                        {deletingDocId === doc.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <X className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Drop / Select button */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed rounded-xl p-3 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/10 transition-colors"
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                className="hidden"
                onChange={handleFileSelect}
              />
              <p className="text-xs font-medium text-foreground">
                Click to attach bills or receipts
              </p>
              <p className="text-[11px] text-muted-foreground">
                Supports multiple receipts per expense
              </p>
            </div>

            {/* Selected new files preview */}
            {selectedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {selectedFiles.map((file, idx) => (
                  <Badge
                    key={idx}
                    variant="outline"
                    className="text-xs py-1 px-2.5 gap-1.5 flex items-center bg-card border-primary/20"
                  >
                    <span className="truncate max-w-[150px]">{file.name}</span>
                    <span className="text-[10px] text-muted-foreground">
                      ({(file.size / 1024).toFixed(0)} KB)
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSelectedFile(idx)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="pt-3 border-t shrink-0 flex flex-row items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="rounded-xl px-5"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Save Changes" : "Save Expense"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
