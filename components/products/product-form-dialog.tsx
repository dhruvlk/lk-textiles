"use client"

import { useState } from "react"
import { useCompany } from "@/components/company-provider"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Loader2, PlusCircle } from "lucide-react"
import { Product } from "@/types"

interface ProductFormDialogProps {
  onProductSaved: (product: Product) => Promise<void> | void
  initialData?: Product
  trigger?: React.ReactElement
}

export function ProductFormDialog({ onProductSaved, initialData, trigger }: ProductFormDialogProps) {
  const { selectedCompany } = useCompany()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedCompany) return

    setIsLoading(true)
    const formData = new FormData(e.currentTarget)
    try {
      const product: Product = {
        id: initialData?.id ?? "",
        company_id: initialData?.company_id ?? selectedCompany.id,
        name: formData.get("name") as string,
        hsn_code: (formData.get("hsn_code") as string) || null,
        unit: (formData.get("unit") as string) || "Mtrs",
        default_rate: Number(formData.get("default_rate") || 0),
        description: (formData.get("description") as string) || null,
        is_active: true,
      }

      await onProductSaved(product)
      toast.success(initialData ? "Product updated." : "Product created.")
      setOpen(false)
    } catch {
      toast.error("Failed to save product.")
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
              Add Product
            </Button>
          )
        }
      />
      <DialogContent className="w-full max-w-[calc(100%-2rem)] sm:max-w-[560px] max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Product" : "Add Product"}</DialogTitle>
          <DialogDescription>Manage product master for {selectedCompany?.name}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="name">Product Name *</Label>
            <Input id="name" name="name" required defaultValue={initialData?.name} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hsn_code">HSN Code</Label>
              <Input id="hsn_code" name="hsn_code" defaultValue={initialData?.hsn_code || selectedCompany?.hsn_code || ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Input id="unit" name="unit" defaultValue={initialData?.unit || "Mtrs"} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="default_rate">Default Rate</Label>
            <Input id="default_rate" name="default_rate" type="number" step="0.01" defaultValue={initialData?.default_rate ?? 0} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" defaultValue={initialData?.description || ""} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
