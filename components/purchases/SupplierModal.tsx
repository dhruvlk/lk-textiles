"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Building2, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { createSupplier, updateSupplier } from "@/services/suppliers.service"
import { isValidGstin } from "@/types"
import type { Supplier } from "@/types"

interface SupplierModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyId: string
  supplierToEdit?: Supplier | null
  onSuccess: (supplier: Supplier) => void
}

export function SupplierModal({
  open,
  onOpenChange,
  companyId,
  supplierToEdit,
  onSuccess,
}: SupplierModalProps) {
  const [name, setName] = useState("")
  const [contactPerson, setContactPerson] = useState("")
  const [mobile, setMobile] = useState("")
  const [email, setEmail] = useState("")
  const [gstin, setGstin] = useState("")
  const [pan, setPan] = useState("")
  const [address, setAddress] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [pincode, setPincode] = useState("")
  const [paymentTerms, setPaymentTerms] = useState("Net 30")
  const [openingBalance, setOpeningBalance] = useState("0")
  const [notes, setNotes] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const isEditing = Boolean(supplierToEdit)

  useEffect(() => {
    if (supplierToEdit) {
      setName(supplierToEdit.name || "")
      setContactPerson(supplierToEdit.contact_person || "")
      setMobile(supplierToEdit.mobile || "")
      setEmail(supplierToEdit.email || "")
      setGstin(supplierToEdit.gstin || "")
      setPan(supplierToEdit.pan || "")
      setAddress(supplierToEdit.address || "")
      setCity(supplierToEdit.city || "")
      setState(supplierToEdit.state || "")
      setPincode(supplierToEdit.pincode || "")
      setPaymentTerms(supplierToEdit.payment_terms || "Net 30")
      setOpeningBalance(String(supplierToEdit.opening_balance ?? 0))
      setNotes(supplierToEdit.notes || "")
    } else {
      setName("")
      setContactPerson("")
      setMobile("")
      setEmail("")
      setGstin("")
      setPan("")
      setAddress("")
      setCity("")
      setState("Gujarat")
      setPincode("")
      setPaymentTerms("Net 30")
      setOpeningBalance("0")
      setNotes("")
    }
  }, [supplierToEdit, open])

  // Auto-fill PAN when GSTIN is typed
  const handleGstinChange = (val: string) => {
    const upper = val.toUpperCase().trim()
    setGstin(upper)
    if (upper.length >= 12 && !pan) {
      const derivedPan = upper.substring(2, 12)
      if (/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(derivedPan)) {
        setPan(derivedPan)
      }
    }
  }

  const gstinStatus = gstin
    ? isValidGstin(gstin)
      ? "valid"
      : "invalid"
    : "empty"

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error("Supplier name is required.")
      return
    }

    if (gstin && !isValidGstin(gstin)) {
      toast.warning("GSTIN format looks invalid. Please verify 15-character GSTIN format.")
    }

    setIsSaving(true)
    try {
      if (isEditing && supplierToEdit) {
        const updated = await updateSupplier(companyId, supplierToEdit.id, {
          name: name.trim(),
          contact_person: contactPerson.trim() || null,
          mobile: mobile.trim() || null,
          email: email.trim() || null,
          gstin: gstin.trim().toUpperCase() || null,
          pan: pan.trim().toUpperCase() || null,
          address: address.trim() || null,
          city: city.trim() || null,
          state: state.trim() || null,
          pincode: pincode.trim() || null,
          payment_terms: paymentTerms || null,
          opening_balance: parseFloat(openingBalance) || 0,
          notes: notes.trim() || null,
        })
        toast.success("Supplier updated successfully!")
        onSuccess(updated)
      } else {
        const created = await createSupplier(companyId, {
          name: name.trim(),
          contact_person: contactPerson.trim() || null,
          mobile: mobile.trim() || null,
          email: email.trim() || null,
          gstin: gstin.trim().toUpperCase() || null,
          pan: pan.trim().toUpperCase() || null,
          address: address.trim() || null,
          city: city.trim() || null,
          state: state.trim() || null,
          pincode: pincode.trim() || null,
          payment_terms: paymentTerms || null,
          opening_balance: parseFloat(openingBalance) || 0,
          notes: notes.trim() || null,
          is_active: true,
        })
        toast.success("Supplier added successfully!")
        onSuccess(created)
      }
      onOpenChange(false)
    } catch (err) {
      console.error("Error saving supplier:", err)
      toast.error("Failed to save supplier.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-6 sm:p-7">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            {isEditing ? "Edit Supplier" : "Add New Supplier / Vendor"}
          </DialogTitle>
          <DialogDescription className="text-sm">
            Save vendor details once to easily create purchase bills and track outstanding payments.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4 py-2">
          {/* Company Name & Contact Person */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Supplier / Business Name <span className="text-destructive">*</span>
              </Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Radhey Krishna Spinners"
                required
                className="h-10 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Contact Person</Label>
              <Input
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="e.g. Ramesh Patel"
                className="h-10 rounded-xl"
              />
            </div>
          </div>

          {/* Mobile & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Mobile Number</Label>
              <Input
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="e.g. 9825123456"
                className="h-10 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Email Address</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. billing@radheyspinners.com"
                className="h-10 rounded-xl"
              />
            </div>
          </div>

          {/* GSTIN & PAN with instant validation banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">GSTIN</Label>
                {gstinStatus === "valid" && (
                  <span className="text-[11px] font-medium text-emerald-600 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" /> GSTIN format valid
                  </span>
                )}
                {gstinStatus === "invalid" && (
                  <span className="text-[11px] font-medium text-amber-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> Check format (15 chars)
                  </span>
                )}
              </div>
              <Input
                value={gstin}
                onChange={(e) => handleGstinChange(e.target.value)}
                placeholder="e.g. 24AAAAA0000A1Z5"
                maxLength={15}
                className="h-10 rounded-xl uppercase font-mono tracking-wider"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">PAN Number</Label>
              <Input
                value={pan}
                onChange={(e) => setPan(e.target.value.toUpperCase())}
                placeholder="e.g. AAAAA0000A"
                maxLength={10}
                className="h-10 rounded-xl uppercase font-mono tracking-wider"
              />
            </div>
          </div>

          {/* Address */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Address</Label>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Plot / Mill address, Ring Road"
              className="h-10 rounded-xl"
            />
          </div>

          {/* City, State, Pincode */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">City</Label>
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Surat"
                className="h-10 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">State</Label>
              <Input
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="Gujarat"
                className="h-10 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Pincode</Label>
              <Input
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                placeholder="395002"
                maxLength={6}
                className="h-10 rounded-xl"
              />
            </div>
          </div>

          {/* Payment Terms & Opening Balance */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Payment Terms</Label>
              <Input
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                placeholder="e.g. Net 30 days, Immediate"
                className="h-10 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Opening Balance (₹)</Label>
              <Input
                type="number"
                step="0.01"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
                placeholder="0.00"
                className="h-10 rounded-xl"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Internal Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Yarn delivery directly to loom warehouse 2"
              className="rounded-xl min-h-[70px]"
            />
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
              {isEditing ? "Save Changes" : "Create Supplier"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
