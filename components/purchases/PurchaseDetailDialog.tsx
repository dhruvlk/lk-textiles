"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  FileText,
  Calendar,
  Building2,
  Tag,
  IndianRupee,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  Paperclip,
} from "lucide-react"
import { format } from "date-fns"
import type { Purchase, VaultDocument } from "@/types"

interface PurchaseDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  purchase: Purchase | null
  onPreviewDocument: (doc: VaultDocument) => void
  onAddPayment: (purchase: Purchase) => void
}

export function PurchaseDetailDialog({
  open,
  onOpenChange,
  purchase,
  onPreviewDocument,
  onAddPayment,
}: PurchaseDetailDialogProps) {
  if (!purchase) return null

  const isPaid = purchase.payment_status === "Paid"
  const isPartial = purchase.payment_status === "Partially Paid"
  const outstanding = Math.max(0, purchase.grand_total - purchase.paid_amount)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl p-6 sm:p-8">
        <DialogHeader className="space-y-2 border-b pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2.5">
                <DialogTitle className="text-xl sm:text-2xl font-bold">
                  Purchase #{purchase.invoice_number}
                </DialogTitle>
                <Badge
                  variant={isPaid ? "default" : isPartial ? "secondary" : "destructive"}
                  className="rounded-lg text-xs"
                >
                  {purchase.payment_status}
                </Badge>
                <Badge variant="outline" className="rounded-lg text-xs font-medium">
                  {purchase.purchase_type}
                </Badge>
              </div>
              <DialogDescription className="text-xs text-muted-foreground mt-1 flex items-center gap-3">
                <span>FY {purchase.financial_year}</span>
                <span>·</span>
                <span>Date: {format(new Date(purchase.invoice_date), "dd MMM yyyy")}</span>
                {purchase.due_date && (
                  <>
                    <span>·</span>
                    <span>Due: {format(new Date(purchase.due_date), "dd MMM yyyy")}</span>
                  </>
                )}
              </DialogDescription>
            </div>

            {outstanding > 0 && (
              <Button size="sm" onClick={() => onAddPayment(purchase)} className="rounded-xl shadow-xs shrink-0">
                <IndianRupee className="h-4 w-4 mr-1" />
                Add Payment
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Supplier details card */}
          <div className="p-4 rounded-xl border bg-muted/20 flex flex-col sm:flex-row justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" /> Supplier / Vendor
              </p>
              <p className="text-base font-bold text-foreground">{purchase.supplier_name}</p>
              {purchase.supplier_gstin && (
                <p className="text-xs font-mono font-medium text-primary mt-0.5">
                  GSTIN: {purchase.supplier_gstin}
                </p>
              )}
              {purchase.supplier?.address && (
                <p className="text-xs text-muted-foreground mt-1">
                  {purchase.supplier.address}, {purchase.supplier.city} {purchase.supplier.state}
                </p>
              )}
            </div>

            <div className="sm:text-right shrink-0">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Payment Summary
              </p>
              <p className="text-lg font-bold text-foreground">
                ₹{purchase.grand_total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-emerald-600 font-medium">
                Paid: ₹{purchase.paid_amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </p>
              {outstanding > 0 && (
                <p className="text-xs text-rose-600 font-semibold mt-0.5">
                  Due: ₹{outstanding.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </p>
              )}
            </div>
          </div>

          {/* Items Table */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Purchase Items & Line Details
            </h4>
            <div className="rounded-xl border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="py-2.5 px-3 text-left font-semibold">Item & Details</th>
                      <th className="py-2.5 px-3 text-left font-semibold">HSN</th>
                      <th className="py-2.5 px-3 text-right font-semibold">Qty</th>
                      <th className="py-2.5 px-3 text-right font-semibold">Rate</th>
                      <th className="py-2.5 px-3 text-right font-semibold">Taxable</th>
                      <th className="py-2.5 px-3 text-right font-semibold">GST</th>
                      <th className="py-2.5 px-3 text-right font-semibold">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {(purchase.items || []).map((it, idx) => (
                      <tr key={it.id || idx} className="hover:bg-muted/20">
                        <td className="py-2.5 px-3">
                          <p className="font-medium text-foreground">{it.item_name}</p>
                          {/* Textile optional details */}
                          <div className="text-[11px] text-muted-foreground flex flex-wrap gap-x-2 gap-y-0.5 mt-0.5">
                            {it.yarn_type && <span>Yarn: {it.yarn_type}</span>}
                            {it.count && <span>Count: {it.count}</span>}
                            {it.quality && <span>Quality: {it.quality}</span>}
                            {it.lot_number && <span>Lot: {it.lot_number}</span>}
                            {it.color && <span>Color: {it.color}</span>}
                            {it.meters && <span>{it.meters} Mtrs</span>}
                            {it.weight && <span>{it.weight} Kg</span>}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-muted-foreground font-mono">{it.hsn_sac || "—"}</td>
                        <td className="py-2.5 px-3 text-right font-medium">
                          {it.quantity} {it.unit}
                        </td>
                        <td className="py-2.5 px-3 text-right">₹{it.rate.toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-right">₹{it.taxable_amount.toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-right">
                          ₹{it.gst_amount.toFixed(2)} ({it.gst_rate}%)
                        </td>
                        <td className="py-2.5 px-3 text-right font-semibold">
                          ₹{it.total_amount.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Tax Breakdown Totals */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 p-4 rounded-xl border bg-muted/10">
            <div className="space-y-1 text-xs text-muted-foreground max-w-sm">
              {purchase.notes && (
                <p>
                  <span className="font-semibold text-foreground">Notes:</span> {purchase.notes}
                </p>
              )}
              <p>
                <span className="font-semibold text-foreground">GST Status:</span>{" "}
                {purchase.is_gst_bill ? "GST Input Eligible" : "Non-GST Purchase"}
              </p>
            </div>

            <div className="w-full sm:w-64 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Taxable Subtotal:</span>
                <span className="font-medium">₹{purchase.subtotal.toFixed(2)}</span>
              </div>
              {purchase.discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount:</span>
                  <span>- ₹{purchase.discount.toFixed(2)}</span>
                </div>
              )}
              {purchase.cgst_amount > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>CGST:</span>
                  <span>₹{purchase.cgst_amount.toFixed(2)}</span>
                </div>
              )}
              {purchase.sgst_amount > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>SGST:</span>
                  <span>₹{purchase.sgst_amount.toFixed(2)}</span>
                </div>
              )}
              {purchase.igst_amount > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>IGST:</span>
                  <span>₹{purchase.igst_amount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-muted-foreground">
                <span>Total GST:</span>
                <span className="font-medium">₹{purchase.total_gst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold border-t pt-1.5 text-foreground">
                <span>Grand Total:</span>
                <span>₹{purchase.grand_total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Attached Digital Documents */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Paperclip className="h-3.5 w-3.5" /> Attached Original Bills & Slips (
              {purchase.documents?.length || 0})
            </h4>

            {purchase.documents && purchase.documents.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {purchase.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 rounded-xl border bg-card hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate">{doc.file_name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {(doc.file_size / 1024).toFixed(1)} KB · {doc.document_type}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onPreviewDocument(doc)}
                        className="h-8 px-2 text-xs"
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        Preview
                      </Button>
                      {doc.public_url && (
                        <a
                          href={doc.public_url}
                          download={doc.file_name}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                          title="Download"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic p-3 rounded-xl border bg-muted/20">
                No original bill attached yet. You can upload the bill from the main list or document vault.
              </p>
            )}
          </div>

          {/* Payment History */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" /> Payment Records ({purchase.payments?.length || 0})
            </h4>

            {purchase.payments && purchase.payments.length > 0 ? (
              <div className="rounded-xl border overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-muted/40 border-b">
                    <tr>
                      <th className="py-2 px-3 text-left">Date</th>
                      <th className="py-2 px-3 text-left">Method</th>
                      <th className="py-2 px-3 text-left">Reference / Notes</th>
                      <th className="py-2 px-3 text-right">Amount Paid</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {purchase.payments.map((pm) => (
                      <tr key={pm.id}>
                        <td className="py-2 px-3">{format(new Date(pm.payment_date), "dd MMM yyyy")}</td>
                        <td className="py-2 px-3 font-medium">{pm.payment_method}</td>
                        <td className="py-2 px-3 text-muted-foreground">
                          {pm.reference_number || "—"} {pm.notes ? `(${pm.notes})` : ""}
                        </td>
                        <td className="py-2 px-3 text-right font-semibold text-emerald-600">
                          ₹{pm.amount.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic p-3 rounded-xl border bg-muted/20">
                No payments recorded yet.
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
