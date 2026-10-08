"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { IndianRupee, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { addPurchasePayment } from "@/services/purchases.service"
import type { Purchase, PurchasePayment } from "@/types"

interface AddPaymentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyId: string
  purchase: Purchase | null
  userId?: string | null
  onSuccess: (payment: PurchasePayment) => void
}

const PAYMENT_METHODS: PurchasePayment["payment_method"][] = [
  "Bank Transfer",
  "Cash",
  "UPI",
  "Cheque",
  "Card",
  "Other",
]

export function AddPaymentModal({
  open,
  onOpenChange,
  companyId,
  purchase,
  userId,
  onSuccess,
}: AddPaymentModalProps) {
  const [amount, setAmount] = useState("")
  const [method, setMethod] = useState<PurchasePayment["payment_method"]>("Bank Transfer")
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10))
  const [refNo, setRefNo] = useState("")
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!purchase) return null

  const outstanding = Math.max(0, purchase.grand_total - purchase.paid_amount)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payAmt = parseFloat(amount)
    if (!payAmt || payAmt <= 0) {
      toast.error("Please enter a valid payment amount.")
      return
    }

    setIsSubmitting(true)
    try {
      const payment = await addPurchasePayment(
        companyId,
        purchase.id,
        {
          amount: payAmt,
          payment_method: method,
          reference_number: refNo.trim() || null,
          notes: notes.trim() || null,
          payment_date: paymentDate,
          created_by: userId,
        }
      )
      toast.success("Payment recorded successfully!")
      onSuccess(payment)
      setAmount("")
      setRefNo("")
      setNotes("")
      onOpenChange(false)
    } catch (err) {
      console.error("Payment error:", err)
      toast.error("Failed to record payment.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl p-6 sm:p-7">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <IndianRupee className="h-5 w-5 text-primary" />
            Add Supplier Payment
          </DialogTitle>
          <DialogDescription className="text-sm">
            Bill #{purchase.invoice_number} · {purchase.supplier_name}
          </DialogDescription>
        </DialogHeader>

        {/* Bill Balance Summary Card */}
        <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-muted/40 border text-center">
          <div>
            <p className="text-[11px] text-muted-foreground uppercase font-medium">Bill Total</p>
            <p className="text-sm font-bold text-foreground">₹{purchase.grand_total.toLocaleString("en-IN")}</p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground uppercase font-medium">Paid So Far</p>
            <p className="text-sm font-bold text-emerald-600">₹{purchase.paid_amount.toLocaleString("en-IN")}</p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground uppercase font-medium">Outstanding</p>
            <p className="text-sm font-bold text-rose-600">₹{outstanding.toLocaleString("en-IN")}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold">Payment Amount (₹) *</Label>
              <button
                type="button"
                onClick={() => setAmount(String(outstanding))}
                className="text-xs text-primary font-medium hover:underline"
              >
                Pay Full (₹{outstanding.toFixed(2)})
              </button>
            </div>
            <Input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
              className="h-10 rounded-xl font-semibold text-base"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Payment Date *</Label>
              <Input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                required
                className="h-10 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Payment Method</Label>
              <Select
                value={method}
                onValueChange={(val) => val && setMethod(val as PurchasePayment["payment_method"])}
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
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Reference / UTR / Cheque No.</Label>
            <Input
              value={refNo}
              onChange={(e) => setRefNo(e.target.value)}
              placeholder="e.g. UTR-9821829 or Chq #481023"
              className="h-10 rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Payment Notes</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Paid via HDFC current account"
              className="h-10 rounded-xl"
            />
          </div>

          <DialogFooter className="gap-2 sm:justify-end border-t pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="rounded-xl shadow-xs">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Payment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
