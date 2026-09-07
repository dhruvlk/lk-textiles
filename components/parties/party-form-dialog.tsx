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
import { Customer } from "@/types"

interface PartyFormDialogProps {
  onPartyAdded: (party: Customer) => Promise<void> | void
  initialData?: Customer
  trigger?: React.ReactElement
}

export function PartyFormDialog({ onPartyAdded, initialData, trigger }: PartyFormDialogProps) {
  const { selectedCompany } = useCompany()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedCompany) return

    setIsLoading(true)
    const formData = new FormData(e.currentTarget)
    try {
      const newParty: Customer = {
        id: initialData ? initialData.id : '',
        company_id: initialData ? initialData.company_id : selectedCompany.id,
        name: formData.get('name') as string,
        contact_person: (formData.get('contact_person') as string) || null,
        mobile: (formData.get('mobile') as string) || null,
        email: (formData.get('email') as string) || null,
        gst_number: (formData.get('gst_number') as string) || null,
        address: (formData.get('address') as string) || null,
        city: (formData.get('city') as string) || null,
        state: (formData.get('state') as string) || null,
        pincode: (formData.get('pincode') as string) || null,
        broker: (formData.get('broker') as string) || null,
        notes: (formData.get('notes') as string) || null,
      }
      
      await onPartyAdded(newParty)
      toast.success(initialData ? "Party updated successfully." : "Party created successfully!")
      setOpen(false)
    } catch {
      toast.error("Failed to save party.")
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
              Add Party
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Customer" : "Add New Customer"}</DialogTitle>
          <DialogDescription>
            {initialData ? `Edit details for ${initialData.name}` : `Create a new customer for ${selectedCompany?.name}`}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Customer Name *</Label>
            <Input id="name" name="name" required placeholder="XYZ Textiles" defaultValue={initialData?.name} />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact_person">Contact Person</Label>
              <Input id="contact_person" name="contact_person" placeholder="John Doe" defaultValue={initialData?.contact_person || ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile Number</Label>
              <Input id="mobile" name="mobile" placeholder="+91 9876543210" defaultValue={initialData?.mobile || ""} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="gst_number">GST Number</Label>
            <Input id="gst_number" name="gst_number" placeholder="22AAAAA0000A1Z5" defaultValue={initialData?.gst_number || ""} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" defaultValue={initialData?.email || ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="broker">Broker</Label>
              <Input id="broker" name="broker" defaultValue={initialData?.broker || ""} />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea id="address" name="address" placeholder="123 Textile Market" defaultValue={initialData?.address || ""} />
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" name="city" placeholder="Surat" defaultValue={initialData?.city || ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input id="state" name="state" placeholder="Gujarat" defaultValue={initialData?.state || ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pincode">Pincode</Label>
              <Input id="pincode" name="pincode" placeholder="395002" defaultValue={initialData?.pincode || ""} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" placeholder="Any additional information..." defaultValue={initialData?.notes || ""} />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {initialData ? "Update Party" : "Save Party"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
