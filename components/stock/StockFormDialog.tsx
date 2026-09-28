"use client"

import { useState } from "react"
import { useCompany } from "@/components/company-provider"
import { useAuth } from "@/hooks/useAuth"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Loader2, PlusCircle } from "lucide-react"
import type { Stock } from "@/types"
import { addStock, parseStockError, updateStock } from "@/services/stocks.service"

interface StockFormDialogProps {
  onSaved: () => Promise<void> | void
  initialData?: Stock
  trigger?: React.ReactElement
}

export function StockFormDialog({ onSaved, initialData, trigger }: StockFormDialogProps) {
  const { selectedCompany } = useCompany()
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedCompany) return

    setIsLoading(true)
    const formData = new FormData(e.currentTarget)

    try {
      const payload = {
        company_id: initialData?.company_id ?? selectedCompany.id,
        quality_name: String(formData.get("quality_name") || "").trim(),
        total_taka: Number(formData.get("total_taka") || 0),
        hsn_code: (formData.get("hsn_code") as string) || null,
        remarks: (formData.get("remarks") as string) || null,
      }

      if (!payload.quality_name) {
        toast.error("Quality name is required.")
        return
      }

      if (initialData && payload.total_taka < initialData.sold_taka) {
        toast.error(`Total Taka cannot be less than Sold Taka (${initialData.sold_taka}).`)
        return
      }

      if (initialData) {
        await updateStock(initialData.id, payload, user?.id)
        toast.success("Stock updated.")
      } else {
        await addStock(payload, user?.id)
        toast.success("Stock created.")
      }

      await onSaved()
      setOpen(false)
    } catch (error) {
      toast.error(parseStockError(error))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          trigger || (
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Stock
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Stock" : "Create Stock"}</DialogTitle>
          <DialogDescription>
            Add manufactured quality stock for {selectedCompany?.name}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="quality_name">Quality Name *</Label>
            <Input
              id="quality_name"
              name="quality_name"
              required
              placeholder="e.g. Cotton 60x60"
              defaultValue={initialData?.quality_name}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="total_taka">Total Taka *</Label>
            <Input
              id="total_taka"
              name="total_taka"
              type="number"
              min={initialData?.sold_taka ?? 0}
              step="0.01"
              required
              defaultValue={initialData?.total_taka ?? 0}
            />
            <p className="text-xs text-muted-foreground">
              Sold Taka is updated automatically from Delivery Challans.
            </p>
          </div>
          {initialData && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Sold Taka</Label>
                <Input value={initialData.sold_taka} readOnly className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>Available Taka</Label>
                <Input value={initialData.available_taka} readOnly className="bg-muted" />
              </div>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="hsn_code">HSN Code</Label>
            <Input
              id="hsn_code"
              name="hsn_code"
              placeholder="Optional"
              defaultValue={initialData?.hsn_code || selectedCompany?.hsn_code || ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="remarks">Remarks</Label>
            <Textarea
              id="remarks"
              name="remarks"
              placeholder="Optional"
              defaultValue={initialData?.remarks || ""}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {initialData ? "Update" : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
