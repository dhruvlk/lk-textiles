"use client"

import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UploadCloud, FileText, CheckCircle2, Loader2, Tag, Building2 } from "lucide-react"
import { toast } from "sonner"
import { uploadVaultDocument } from "@/services/documents.service"
import { formatFinancialYearCode, formatFinancialYearLabel } from "@/types"
import type { Supplier, VaultDocument } from "@/types"

interface QuickUploadModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyId: string
  suppliers: Supplier[]
  userId?: string | null
  onSuccess: (newDoc: VaultDocument) => void
}

const DOCUMENT_TYPES: VaultDocument["document_type"][] = [
  "Purchase Bill",
  "Expense Bill",
  "GST Document",
  "Transport Bill",
  "Machine Bill",
  "Other",
]

const TAG_SUGGESTIONS = ["GST", "Non-GST", "Yarn", "Fabric", "Machine", "Transport", "Office", "Important"]

export function QuickUploadModal({
  open,
  onOpenChange,
  companyId,
  suppliers,
  userId,
  onSuccess,
}: QuickUploadModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [docType, setDocType] = useState<VaultDocument["document_type"]>("Purchase Bill")
  const [financialYear, setFinancialYear] = useState<string>(formatFinancialYearCode(new Date()))
  const [supplierId, setSupplierId] = useState<string>("none")
  const [selectedTags, setSelectedTags] = useState<string[]>(["Important"])
  const [description, setDescription] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (!selected) return
    // Max 20MB check
    if (selected.size > 20 * 1024 * 1024) {
      toast.error("File size exceeds 20MB limit.")
      return
    }
    setFile(selected)
  }

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const resetForm = () => {
    setFile(null)
    setDocType("Purchase Bill")
    setSupplierId("none")
    setSelectedTags(["Important"])
    setDescription("")
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please choose a file to upload.")
      return
    }

    setIsUploading(true)
    const toastId = toast.loading("Uploading bill to secure vault...")

    try {
      const doc = await uploadVaultDocument(companyId, file, {
        financialYear,
        documentType: docType,
        supplierId: supplierId === "none" ? null : supplierId,
        tags: selectedTags,
        description: description.trim() || undefined,
        status: "Active",
        userId,
      })

      toast.success("Bill uploaded and secured in vault!", { id: toastId })
      onSuccess(doc)
      resetForm()
      onOpenChange(false)
    } catch (err) {
      console.error("Upload error:", err)
      toast.error("Failed to upload bill. Please check your connection and try again.", { id: toastId })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-2xl p-6 sm:p-7">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <UploadCloud className="h-5 w-5 text-primary" />
            Upload Bill / Document
          </DialogTitle>
          <DialogDescription className="text-sm">
            Quickly digitize physical invoices, expense slips, and GST records into your company vault.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3">
          {/* File drop zone */}
          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
              Bill File (PDF, JPG, PNG, WEBP) *
            </Label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={handleFileChange}
              className="hidden"
              id="quick-bill-file"
            />
            {!file ? (
              <label
                htmlFor="quick-bill-file"
                className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer hover:bg-muted/40 transition-colors border-muted-foreground/30 text-center"
              >
                <UploadCloud className="h-9 w-9 text-muted-foreground mb-2" />
                <span className="text-sm font-medium">Click to select bill or drag file here</span>
                <span className="text-xs text-muted-foreground mt-1">
                  Supports original vendor PDF bills or clear phone photos (Max 20MB)
                </span>
              </label>
            ) : (
              <div className="flex items-center justify-between p-3.5 rounded-xl border bg-muted/30">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setFile(null)}
                  className="text-xs text-destructive hover:bg-destructive/10"
                >
                  Change
                </Button>
              </div>
            )}
          </div>

          {/* Document Type ("What is this?") */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">What is this bill?</Label>
              <Select
                value={docType}
                onValueChange={(val) => setDocType(val as VaultDocument["document_type"])}
              >
                <SelectTrigger className="h-10 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Financial Year</Label>
              <Input
                value={formatFinancialYearLabel(financialYear)}
                disabled
                className="h-10 rounded-xl bg-muted/40 font-medium"
              />
            </div>
          </div>

          {/* Supplier Link (Optional) */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Supplier / Vendor (Optional)</Label>
            <Select value={supplierId} onValueChange={(val) => setSupplierId(val || "none")}>
              <SelectTrigger className="h-10 rounded-xl">
                <SelectValue placeholder="Select supplier">
                  {(value: string | null) => {
                    if (!value || value === "none") return "-- General / Not Linked --"
                    const s = suppliers.find((x) => x.id === value)
                    return s ? `${s.name}${s.gstin ? ` (${s.gstin})` : ""}` : "Select supplier"
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">-- General / Not Linked --</SelectItem>
                {suppliers.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} {s.gstin ? `(${s.gstin})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Description / Bill Number</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Invoice #4587 - Yarn delivery lot #12"
              className="h-10 rounded-xl"
            />
          </div>

          {/* Quick Tags */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
              <Tag className="h-3.5 w-3.5" /> Quick Tags
            </Label>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {TAG_SUGGESTIONS.map((tag) => {
                const active = selectedTags.includes(tag)
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                      active
                        ? "bg-primary text-primary-foreground border-primary font-medium"
                        : "bg-muted/30 text-muted-foreground border-border hover:bg-muted"
                    }`}
                  >
                    {active && <CheckCircle2 className="h-3 w-3 inline mr-1" />}
                    {tag}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-end border-t pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isUploading}
            className="rounded-xl"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleUpload}
            disabled={!file || isUploading}
            className="rounded-xl shadow-xs"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <UploadCloud className="mr-2 h-4 w-4" />
                Save Bill to Vault
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
