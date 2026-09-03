"use client"
/* eslint-disable */

import { useEffect, useState } from "react"
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
import { PAYMENT_MODES } from "@/constants"
import {
  formatCurrency,
  getAmountReceived,
  getChallanTotal,
  getRemainingBalance,
} from "@/lib/payment-status"
import { recordChallanPayment } from "@/services/challan-payments.service"
import type { Challan } from "@/types"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface UpdatePaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  challan: Challan
  companyId: string
  userId?: string
  onSuccess: (challan: Challan) => void
}

export function UpdatePaymentDialog({
  open,
  onOpenChange,
  challan,
  companyId,
  userId,
  onSuccess,
}: UpdatePaymentDialogProps) {
  const grandTotal = getChallanTotal(challan)
  const received = getAmountReceived(challan)
  const remaining = getRemainingBalance(grandTotal, received)

  const [amount, setAmount] = useState("")
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split("T")[0]
  )
  const [paymentMode, setPaymentMode] = useState<string>("")
  const [reference, setReference] = useState("")
  const [notes, setNotes] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setAmount(remaining > 0 ? remaining.toFixed(2) : "")
      setPaymentDate(new Date().toISOString().split("T")[0])
      setPaymentMode("")
      setReference("")
      setNotes("")
    }
  }, [open, remaining])

  const handleSave = async () => {
    const parsedAmount = parseFloat(amount)
    if (!parsedAmount || parsedAmount <= 0) {
      toast.error("Enter a valid payment amount")
      return
    }
    if (parsedAmount > remaining + 0.01) {
      toast.error(`Amount cannot exceed remaining balance of ${formatCurrency(remaining)}`)
      return
    }
    if (!paymentDate) {
      toast.error("Select a payment date")
      return
    }

    setIsSaving(true)
    try {
      const updated = await recordChallanPayment({
        challanId: challan.id,
        companyId,
        amount: parsedAmount,
        paymentDate,
        paymentMode: paymentMode || null,
        referenceNumber: reference || null,
        notes: notes || null,
        userId,
      })
      toast.success("Payment recorded successfully")
      onSuccess(updated)
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to record payment")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="space-y-2">
          <DialogTitle>Update Payment</DialogTitle>
          <DialogDescription>
            Record a payment for challan {challan.challan_number}. Remaining balance:{" "}
            <span className="font-medium text-foreground">{formatCurrency(remaining)}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="payment-amount">Payment Amount</Label>
            <Input
              id="payment-amount"
              type="number"
              min="0"
              step="0.01"
              max={remaining}
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="payment-date">Payment Date</Label>
            <Input
              id="payment-date"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label>Payment Method</Label>
            <Select value={paymentMode || "none"} onValueChange={(v) => setPaymentMode(!v || v === "none" ? "" : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Not specified</SelectItem>
                {PAYMENT_MODES.map((mode) => (
                  <SelectItem key={mode} value={mode}>
                    {mode}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="payment-reference">Reference Number</Label>
            <Input
              id="payment-reference"
              placeholder="UTR, cheque no., etc."
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="payment-notes">Notes</Label>
            <Textarea
              id="payment-notes"
              placeholder="Optional payment notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 pt-2 sm:justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || remaining <= 0}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
