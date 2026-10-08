"use client"

import { useState, useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  FileText,
  Download,
  Printer,
  Copy,
  Edit,
  Trash2,
  Paperclip,
  UploadCloud,
  Eye,
  Calendar,
  CreditCard,
  Building,
  Tag,
  Loader2,
  ExternalLink,
  Image as ImageIcon,
} from "lucide-react"
import { toast } from "sonner"
import {
  uploadExpenseAttachments,
  deleteExpenseAttachment,
  getPersonalDocumentSignedUrl,
} from "@/services/personal-expenses.service"
import { PersonalExpenseVoucherPDF } from "@/components/pdf/PersonalExpenseVoucherPDF"
import { downloadBlobFile } from "@/lib/reports/export"
import type {
  PersonalExpense,
  PersonalExpenseDocument,
} from "@/types/personal-expenses"

interface PersonalExpenseViewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  userName?: string
  expense: PersonalExpense | null
  onEdit: (expense: PersonalExpense) => void
  onDuplicate: (expense: PersonalExpense) => void
  onDelete: (expense: PersonalExpense) => void
  onPreviewDocument: (doc: PersonalExpenseDocument) => void
  onExpenseUpdated?: (updated: PersonalExpense) => void
}

export function PersonalExpenseViewDialog({
  open,
  onOpenChange,
  userId,
  userName,
  expense,
  onEdit,
  onDuplicate,
  onDelete,
  onPreviewDocument,
  onExpenseUpdated,
}: PersonalExpenseViewDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null)

  if (!expense) return null

  const documents = expense.documents || []

  const handleDownloadVoucherPdf = async () => {
    setIsGeneratingPdf(true)
    try {
      const { pdf } = await import("@react-pdf/renderer")
      const blob = await pdf(
        <PersonalExpenseVoucherPDF expense={expense} userName={userName} />
      ).toBlob()

      downloadBlobFile(`Expense_${expense.expense_number}.pdf`, blob)
      toast.success("Expense voucher PDF downloaded")
    } catch (err) {
      console.error(err)
      toast.error("Failed to generate expense voucher")
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  const handlePrintVoucher = async () => {
    setIsGeneratingPdf(true)
    try {
      const { pdf } = await import("@react-pdf/renderer")
      const blob = await pdf(
        <PersonalExpenseVoucherPDF expense={expense} userName={userName} />
      ).toBlob()

      const url = URL.createObjectURL(blob)
      const printWindow = window.open(url, "_blank")
      if (printWindow) {
        printWindow.focus()
      } else {
        toast.info("Please allow popups to print the voucher")
      }
    } catch (err) {
      console.error(err)
      toast.error("Failed to print voucher")
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  const handleAttachFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files)
      setIsUploading(true)
      try {
        const newDocs = await uploadExpenseAttachments(expense.id, userId, filesArray)
        const updatedExpense: PersonalExpense = {
          ...expense,
          documents: [...documents, ...newDocs],
        }
        toast.success(`Attached ${newDocs.length} document(s)`)
        onExpenseUpdated?.(updatedExpense)
      } catch (err) {
        console.error(err)
        toast.error("Failed to upload attachments")
      } finally {
        setIsUploading(false)
      }
    }
  }

  const handleDeleteDoc = async (docId: string) => {
    setDeletingDocId(docId)
    try {
      await deleteExpenseAttachment(docId, userId)
      const updatedExpense: PersonalExpense = {
        ...expense,
        documents: documents.filter((d) => d.id !== docId),
      }
      toast.success("Document deleted")
      onExpenseUpdated?.(updatedExpense)
    } catch (err) {
      console.error(err)
      toast.error("Failed to delete document")
    } finally {
      setDeletingDocId(null)
    }
  }

  const handleDownloadDoc = async (doc: PersonalExpenseDocument) => {
    try {
      const url = await getPersonalDocumentSignedUrl(doc.storage_path)
      if (!url) {
        toast.error("Could not obtain document URL")
        return
      }
      const a = window.document.createElement("a")
      a.href = url
      a.download = doc.file_name
      a.target = "_blank"
      window.document.body.appendChild(a)
      a.click()
      window.document.body.removeChild(a)
    } catch (err) {
      console.error(err)
      toast.error("Failed to download document")
    }
  }

  const isPaid = expense.payment_status === "Paid"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-[95vw] max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden rounded-2xl bg-background border shadow-2xl">
        <DialogHeader className="p-4 sm:px-6 border-b shrink-0 bg-muted/20 flex flex-row items-center justify-between space-y-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary">
                {expense.expense_number}
              </span>
              <Badge
                variant={isPaid ? "default" : "outline"}
                className={
                  isPaid
                    ? "bg-emerald-600 hover:bg-emerald-600 text-white text-[11px]"
                    : "text-amber-600 border-amber-300 text-[11px]"
                }
              >
                {expense.payment_status}
              </Badge>
            </div>
            <DialogTitle className="text-lg font-bold mt-1 text-foreground">
              {expense.description}
            </DialogTitle>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrintVoucher}
              disabled={isGeneratingPdf}
              title="Print voucher"
              className="h-8 text-xs rounded-xl"
            >
              <Printer className="h-3.5 w-3.5 mr-1" />
              <span className="hidden sm:inline">Print</span>
            </Button>
            <Button
              size="sm"
              onClick={handleDownloadVoucherPdf}
              disabled={isGeneratingPdf}
              title="Download voucher PDF"
              className="h-8 text-xs rounded-xl"
            >
              {isGeneratingPdf ? (
                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5 mr-1" />
              )}
              <span>Voucher PDF</span>
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Amount Card */}
          <div className="p-4 rounded-xl border bg-card/60 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Total Expense Amount
              </p>
              <p className="text-2xl sm:text-3xl font-extrabold text-foreground mt-0.5">
                ₹{expense.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </p>
              {expense.payment_status === "Partially Paid" && (
                <p className="text-xs text-muted-foreground mt-1">
                  Paid: ₹{expense.paid_amount.toLocaleString("en-IN")} · Pending: ₹
                  {expense.pending_amount.toLocaleString("en-IN")}
                </p>
              )}
            </div>
            <div className="text-right">
              <span className="text-xs text-muted-foreground">Expense Date</span>
              <p className="text-sm font-semibold">{expense.expense_date}</p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl border bg-muted/20 space-y-1">
              <span className="text-muted-foreground font-medium">Category</span>
              <p className="font-semibold text-foreground">
                {expense.category_name}
                {expense.subcategory_name && ` › ${expense.subcategory_name}`}
              </p>
            </div>

            <div className="p-3 rounded-xl border bg-muted/20 space-y-1">
              <span className="text-muted-foreground font-medium">Paid To / Merchant</span>
              <p className="font-semibold text-foreground">
                {expense.paid_to || "—"}
              </p>
            </div>

            <div className="p-3 rounded-xl border bg-muted/20 space-y-1">
              <span className="text-muted-foreground font-medium">Payment Method</span>
              <p className="font-semibold text-foreground">
                {expense.payment_method}
              </p>
            </div>
          </div>

          {/* Notes */}
          {expense.notes && (
            <div className="p-3.5 rounded-xl border bg-muted/10 space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Personal Notes
              </span>
              <p className="text-xs text-foreground whitespace-pre-wrap">
                {expense.notes}
              </p>
            </div>
          )}

          {/* Documents Section */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Paperclip className="h-4 w-4 text-primary" />
                Attached Bills & Documents ({documents.length})
              </h4>
              <Button
                size="sm"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="h-7 text-xs rounded-lg"
              >
                {isUploading ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                ) : (
                  <UploadCloud className="h-3.5 w-3.5 mr-1" />
                )}
                Upload Bill
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                className="hidden"
                onChange={handleAttachFiles}
              />
            </div>

            {documents.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-2">
                No bills or receipts attached yet.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-2.5 rounded-xl border bg-card hover:bg-muted/30 transition-colors"
                  >
                    <div
                      className="flex items-center gap-2 min-w-0 cursor-pointer flex-1"
                      onClick={() => onPreviewDocument(doc)}
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        {doc.file_type.includes("pdf") ? (
                          <FileText className="h-4 w-4" />
                        ) : (
                          <ImageIcon className="h-4 w-4" />
                        )}
                      </div>
                      <div className="min-w-0 pr-2">
                        <p className="text-xs font-semibold truncate" title={doc.file_name}>
                          {doc.file_name}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {(doc.file_size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-muted-foreground"
                        title="Preview document"
                        onClick={() => onPreviewDocument(doc)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-muted-foreground"
                        title="Download document"
                        onClick={() => handleDownloadDoc(doc)}
                      >
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive hover:bg-destructive/10"
                        title="Delete document"
                        disabled={deletingDocId === doc.id}
                        onClick={() => handleDeleteDoc(doc.id)}
                      >
                        {deletingDocId === doc.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="p-3 sm:px-6 border-t shrink-0 flex flex-row items-center justify-between bg-muted/20">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              onOpenChange(false)
              onDelete(expense)
            }}
            className="text-destructive hover:bg-destructive/10 text-xs rounded-xl"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            Delete
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                onOpenChange(false)
                onDuplicate(expense)
              }}
              className="text-xs rounded-xl"
            >
              <Copy className="h-3.5 w-3.5 mr-1" />
              Duplicate
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                onOpenChange(false)
                onEdit(expense)
              }}
              className="text-xs rounded-xl px-4"
            >
              <Edit className="h-3.5 w-3.5 mr-1" />
              Edit Expense
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
