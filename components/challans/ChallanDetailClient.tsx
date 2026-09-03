"use client"
/* eslint-disable */

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { motion } from "framer-motion"
import {
  ArrowLeft,
  Building2,
  Calendar,
  CreditCard,
  Edit,
  FileText,
  IndianRupee,
  Printer,
  Receipt,
} from "lucide-react"
import { useCompany } from "@/components/company-provider"
import { useAuth } from "@/hooks/useAuth"
import { PageHeader } from "@/components/common/PageHeader"
import { PageTransition } from "@/components/common/motion"
import { EmptyState } from "@/components/common/EmptyState"
import { PaymentStatusBadge } from "@/components/challans/PaymentStatusBadge"
import { UpdatePaymentDialog } from "@/components/challans/UpdatePaymentDialog"
import { DownloadChallanButton } from "@/components/challans/download-button"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  formatCurrency,
  getAmountReceived,
  getChallanTotal,
  getRemainingBalance,
} from "@/lib/payment-status"
import { getItemPieces, getItemQuantityDisplay } from "@/lib/challan-item"
import { itemDescription } from "@/lib/pdf-utils"
import { getChallanPayments } from "@/services/challan-payments.service"
import { getChallanById } from "@/services/challans.service"
import type { Challan, ChallanPayment } from "@/types"
import { toast } from "sonner"
import { staggerContainer, staggerItem } from "@/lib/motion"

function DetailRow({
  label,
  value,
  highlight,
}: {
  label: string
  value: React.ReactNode
  highlight?: boolean
}) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className={
          highlight
            ? "text-sm font-semibold text-foreground"
            : "text-sm font-medium text-foreground"
        }
      >
        {value ?? "—"}
      </span>
    </div>
  )
}

function PaymentTimeline({ payments }: { payments: ChallanPayment[] }) {
  if (payments.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No payment history yet. Record the first payment to start tracking.
      </p>
    )
  }

  return (
    <div className="relative space-y-0">
      {payments.map((payment, index) => (
        <motion.div
          key={payment.id}
          variants={staggerItem}
          className="relative flex gap-4 pb-6 last:pb-0"
        >
          {index < payments.length - 1 && (
            <span
              className="absolute left-[7px] top-4 h-[calc(100%-4px)] w-px bg-border"
              aria-hidden
            />
          )}
          <span className="relative z-10 mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-primary bg-background ring-4 ring-primary/10" />
          <div className="min-w-0 flex-1 rounded-xl border bg-muted/30 p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-foreground">
                  {formatCurrency(Number(payment.amount))}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(payment.payment_date), "dd MMM yyyy")}
                </p>
              </div>
              {payment.payment_mode && (
                <Badge variant="secondary" className="text-xs">
                  {payment.payment_mode}
                </Badge>
              )}
            </div>
            {(payment.reference_number || payment.notes) && (
              <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                {payment.reference_number && (
                  <p>Ref: {payment.reference_number}</p>
                )}
                {payment.notes && <p>{payment.notes}</p>}
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  )
}

export default function ChallanDetailClient({ id }: { id: string }) {
  const router = useRouter()
  const { selectedCompany } = useCompany()
  const { user } = useAuth()
  const [challan, setChallan] = useState<Challan | null>(null)
  const [payments, setPayments] = useState<ChallanPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)

  const loadChallan = useCallback(async () => {
    setLoading(true)
    try {
      const [data, paymentHistory] = await Promise.all([
        getChallanById(id),
        getChallanPayments(id),
      ])
      setChallan(data ?? null)
      setPayments(paymentHistory)
    } catch {
      toast.error("Failed to load challan details")
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadChallan()
  }, [loadChallan])

  if (!selectedCompany) {
    return (
      <EmptyState
        icon={Building2}
        title="Select a company"
        description="Choose a company from the header to view challan details."
      />
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }

  if (!challan) {
    return (
      <EmptyState
        icon={FileText}
        title="Invoice not found"
        description="This invoice may have been deleted or you don't have access."
        action={
          <Button variant="outline" onClick={() => router.push("/admin/invoices")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Invoice
          </Button>
        }
      />
    )
  }

  const grandTotal = getChallanTotal(challan)
  const received = getAmountReceived(challan)
  const remaining = getRemainingBalance(grandTotal, received)
  const isFullyPaid = remaining <= 0.01

  const handlePaymentSuccess = async (updated: Challan) => {
    setChallan(updated)
    const history = await getChallanPayments(id)
    setPayments(history)
  }

  return (
    <PageTransition className="space-y-6">
      <PageHeader
        eyebrow="Invoice Details"
        title={challan.challan_number}
        description={`${challan.customer?.name ?? "Customer"} · ${format(new Date(challan.date), "dd MMM yyyy")}`}
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => router.push("/admin/invoices")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button variant="outline" onClick={() => router.push(`/invoices/${id}/print`)}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
            <DownloadChallanButton challan={challan} company={selectedCompany} />
            <Button variant="outline" onClick={() => router.push(`/invoices/${id}/edit`)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            {!isFullyPaid && (
              <Button onClick={() => setPaymentDialogOpen(true)}>
                <IndianRupee className="mr-2 h-4 w-4" />
                Update Payment
              </Button>
            )}
          </div>
        }
      />

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="grid gap-6 lg:grid-cols-2"
      >
        <motion.div variants={staggerItem}>
          <Card className="h-full shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Receipt className="h-5 w-5 text-primary" />
                Payment Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Payment Status</span>
                <PaymentStatusBadge status={challan.payment_status ?? "Pending"} />
              </div>
              <Separator />
              <DetailRow
                label="Payment Due Date"
                value={
                  challan.due_date
                    ? format(new Date(challan.due_date), "dd MMM yyyy")
                    : "—"
                }
              />
              <DetailRow
                label="Payment Received Date"
                value={
                  challan.payment_received_date
                    ? format(new Date(challan.payment_received_date), "dd MMM yyyy")
                    : "—"
                }
              />
              <DetailRow
                label="Amount Paid"
                value={formatCurrency(received)}
                highlight
              />
              <DetailRow
                label="Remaining Balance"
                value={formatCurrency(remaining)}
                highlight={remaining > 0}
              />
              <DetailRow label="Grand Total" value={formatCurrency(grandTotal)} />
              <Separator />
              <DetailRow label="Payment Method" value={challan.payment_mode} />
              <DetailRow label="Reference Number" value={challan.payment_reference} />
              <DetailRow
                label="Notes"
                value={challan.payment_notes || "—"}
              />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card className="h-full shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CreditCard className="h-5 w-5 text-primary" />
                Payment History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PaymentTimeline payments={payments} />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem} className="lg:col-span-2">
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-primary" />
                Invoice Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(challan.items?.length ?? 0) === 0 ? (
                <p className="text-sm text-muted-foreground">No line items on this challan.</p>
              ) : (
                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Pieces</TableHead>
                        <TableHead className="text-right">Total Mts./Kgs</TableHead>
                        <TableHead className="text-right">Rate</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {challan.items?.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            {itemDescription(item) || "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            {getItemPieces(item)}
                          </TableCell>
                          <TableCell className="text-right">
                            {getItemQuantityDisplay(item)}
                          </TableCell>
                          <TableCell className="text-right">
                            {item.rate != null ? formatCurrency(item.rate) : "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            {item.amount != null ? formatCurrency(item.amount) : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem} className="lg:col-span-2">
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5 text-primary" />
                Invoice Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <DetailRow label="Customer" value={challan.customer?.name} />
                <DetailRow label="Broker" value={challan.broker} />
                <DetailRow label="Delivery Status" value={challan.status} />
                <DetailRow
                  label="Payment Terms"
                  value={challan.payment_terms ?? "—"}
                />
                <DetailRow
                  label="Items"
                  value={`${challan.items?.length ?? 0} line item(s)`}
                />
                <DetailRow
                  label="Delivered By"
                  value={challan.delivered_by ?? challan.driver_name ?? "—"}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <UpdatePaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        challan={challan}
        companyId={selectedCompany.id}
        userId={user?.id}
        onSuccess={handlePaymentSuccess}
      />
    </PageTransition>
  )
}
