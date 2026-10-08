"use client"

import { useState, useRef } from "react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { UploadCloud, FileText, Image as ImageIcon, X, Loader2, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { createPersonalExpense } from "@/services/personal-expenses.service"
import type {
  PersonalExpense,
  PersonalExpenseCategory,
} from "@/types/personal-expenses"

interface PersonalExpenseQuickUploadModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  categories: PersonalExpenseCategory[]
  paymentMethods: string[]
  existingMerchants?: string[]
  onSuccess: (saved: PersonalExpense) => void
}

export function PersonalExpenseQuickUploadModal({
  open,
  onOpenChange,
  userId,
  categories,
  paymentMethods,
  existingMerchants = [],
  onSuccess,
}: PersonalExpenseQuickUploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [amount, setAmount] = useState("")
  const [categoryId, setCategoryId] = useState(categories[0]?.id || "")
  const [categoryName, setCategoryName] = useState(categories[0]?.name || "Other")
  const [description, setDescription] = useState("")
  const [paidTo, setPaidTo] = useState("")
  const [expenseDate, setExpenseDate] = useState(
    new Date().toISOString().split("T")[0]
  )
  const [paymentMethod, setPaymentMethod] = useState(paymentMethods[0] || "UPI")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setSelectedFile(file)

      // Auto-populate description if blank
      if (!description.trim()) {
        const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ")
        setDescription(cleanName)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedFile) {
      toast.error("Please select a bill or receipt to upload")
      return
    }

    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Please enter a valid expense amount")
      return
    }

    if (!description.trim()) {
      toast.error("Description is required")
      return
    }

    setIsSubmitting(true)

    try {
      const saved = await createPersonalExpense(
        userId,
        {
          expense_date: expenseDate,
          category_id: categoryId || null,
          category_name: categoryName,
          description: description.trim(),
          amount: parsedAmount,
          payment_method: paymentMethod,
          payment_status: "Paid",
          paid_to: paidTo.trim() || null,
        },
        [selectedFile]
      )

      toast.success(`Bill uploaded & Expense ${saved.expense_number} recorded!`)
      setSelectedFile(null)
      setAmount("")
      setDescription("")
      setPaidTo("")
      onSuccess(saved)
      onOpenChange(false)
    } catch (err) {
      console.error(err)
      toast.error("Failed to upload bill and record expense")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-[95vw] max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden rounded-2xl bg-background border shadow-2xl">
        <DialogHeader className="p-4 sm:px-6 border-b shrink-0 bg-muted/20">
          <DialogTitle className="text-lg font-semibold flex items-center gap-2">
            <UploadCloud className="h-5 w-5 text-primary" />
            Quick Upload Bill / Receipt
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Drop an invoice, restaurant bill, or payment receipt to record it instantly.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* File Dropzone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer hover:border-primary/60 hover:bg-muted/15 transition-all flex flex-col items-center justify-center gap-2"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              className="hidden"
              onChange={handleFileChange}
            />

            {selectedFile ? (
              <div className="flex items-center gap-2.5 bg-primary/10 text-primary py-2 px-3.5 rounded-xl border border-primary/20">
                <FileText className="h-5 w-5 shrink-0" />
                <div className="text-left">
                  <p className="text-xs font-semibold truncate max-w-[200px]">
                    {selectedFile.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedFile(null)
                  }}
                  className="ml-2 hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-1">
                  <UploadCloud className="h-6 w-6" />
                </div>
                <p className="text-sm font-semibold text-foreground">
                  Choose file or drag & drop here
                </p>
                <p className="text-xs text-muted-foreground">
                  PDF, JPG, PNG, WEBP (Max 10 MB)
                </p>
              </>
            )}
          </div>

          {/* Quick Expense Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Amount (₹) *</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-sm font-bold text-muted-foreground">
                  ₹
                </span>
                <Input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-7 text-base font-bold text-foreground"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Expense Date *</Label>
              <Input
                type="date"
                required
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="text-sm font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Category *</Label>
              <Select
                value={categoryId}
                onValueChange={(catId) => {
                  if (catId) {
                    setCategoryId(catId)
                    const c = categories.find((x) => x.id === catId)
                    setCategoryName(c ? c.name : "")
                  }
                }}
              >
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
              <Label className="text-xs font-semibold">Payment Method</Label>
              <Select
                value={paymentMethod}
                onValueChange={(val) => {
                  if (val) setPaymentMethod(val)
                }}
              >
                <SelectTrigger className="text-xs sm:text-sm">
                  <SelectValue placeholder="Method">
                    {(val) => val || "Method"}
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

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Description *</Label>
            <Input
              required
              placeholder="e.g. Grocery Bill, Dinner, Home electricity bill"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Paid To / Merchant (Optional)</Label>
            <Input
              list="upload-merchants"
              placeholder="e.g. Swiggy, Reliance, D-Mart"
              value={paidTo}
              onChange={(e) => setPaidTo(e.target.value)}
              className="text-sm"
            />
            <datalist id="upload-merchants">
              {existingMerchants.map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
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
              disabled={isSubmitting || !selectedFile}
              className="rounded-xl px-5"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Upload & Save Expense
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
