"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Calendar,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  ShoppingBag,
  Wallet,
  Warehouse,
  BadgePercent,
  FileCheck2,
  AlertCircle,
  Loader2,
  Sparkles,
  Download,
  FileSpreadsheet,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { ConfirmationDialog } from "@/components/dialogs/ConfirmationDialog"
import {
  closeFinancialYear,
  reopenFinancialYear,
  getCompleteYearEndReportData,
  exportYearEndDataCsv,
} from "@/services/financial-years.service"
import { formatFinancialYearLabel } from "@/types"
import { toast } from "sonner"
import type { FinancialYear, YearEndReviewData } from "@/types"
import { pdf } from "@react-pdf/renderer"
import { YearEndClosingReportPDF } from "@/components/pdf/YearEndClosingReportPDF"

interface MarchClosingViewProps {
  companyId: string
  financialYears: FinancialYear[]
  currentYearLabel: string
  reviewData: YearEndReviewData | null
  isLoading: boolean
  userId?: string | null
  onFinancialYearChange: (fy: string) => void
  onRefresh: () => void
  onNavigateTab: (tab: string) => void
}

export function MarchClosingView({
  companyId,
  financialYears,
  currentYearLabel,
  reviewData,
  isLoading,
  userId,
  onFinancialYearChange,
  onRefresh,
  onNavigateTab,
}: MarchClosingViewProps) {
  const router = useRouter()

  const currentFyRecord = financialYears.find((fy) => fy.year_label === currentYearLabel)
  const isClosed = currentFyRecord?.status === "Closed"

  // Close Dialog state
  const [closeDialogOpen, setCloseDialogOpen] = useState(false)
  const [closingNotes, setClosingNotes] = useState("")
  const [isSubmittingClose, setIsSubmittingClose] = useState(false)

  // Reopen Dialog state
  const [reopenDialogOpen, setReopenDialogOpen] = useState(false)
  const [isSubmittingReopen, setIsSubmittingReopen] = useState(false)

  // PDF & CSV download states
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false)
  const [isExportingCsv, setIsExportingCsv] = useState(false)

  const handleDownloadPdf = async () => {
    setIsDownloadingPdf(true)
    const toastId = toast.loading("Generating Complete Financial Year Audit Report PDF...")
    try {
      const reportData = await getCompleteYearEndReportData(companyId, currentYearLabel)
      const blob = await pdf(<YearEndClosingReportPDF data={reportData} />).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      const safeName = reportData.company.name.replace(/[^a-zA-Z0-9]/g, "_")
      a.download = `${safeName}_FY_${currentYearLabel}_Annual_Audit_Report.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success("Complete Year Report PDF downloaded successfully!", { id: toastId })
    } catch (err) {
      console.error("PDF error:", err)
      toast.error("Failed to generate Year Report PDF.", { id: toastId })
    } finally {
      setIsDownloadingPdf(false)
    }
  }

  const handleExportCsv = async () => {
    setIsExportingCsv(true)
    const toastId = toast.loading("Preparing Financial Year CSV export...")
    try {
      const reportData = await getCompleteYearEndReportData(companyId, currentYearLabel)
      const csvContent = exportYearEndDataCsv(reportData)
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      const safeName = reportData.company.name.replace(/[^a-zA-Z0-9]/g, "_")
      a.download = `${safeName}_FY_${currentYearLabel}_Data.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success("Financial Year CSV exported successfully!", { id: toastId })
    } catch (err) {
      console.error("CSV error:", err)
      toast.error("Failed to export CSV.", { id: toastId })
    } finally {
      setIsExportingCsv(false)
    }
  }

  // Interactive checklist state (persisted locally per company/fy)
  const [checklist, setChecklist] = useState<Record<string, boolean>>({
    purchases_entered: true,
    expenses_uploaded: true,
    gst_reviewed: true,
    duplicates_checked: true,
    unpaid_reviewed: false,
    stock_verified: true,
    sales_completed: true,
    itc_reviewed: true,
    output_reviewed: true,
    bank_cash_reviewed: false,
  })

  const toggleCheck = (key: string) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleCloseYear = async () => {
    setIsSubmittingClose(true)
    try {
      await closeFinancialYear(
        companyId,
        currentYearLabel,
        closingNotes.trim() || "March Year-End Closing completed.",
        userId
      )
      toast.success(`Financial Year ${formatFinancialYearLabel(currentYearLabel)} closed and locked!`)
      setCloseDialogOpen(false)
      setClosingNotes("")
      onRefresh()
    } catch (err) {
      console.error("Close year error:", err)
      toast.error("Failed to close financial year.")
    } finally {
      setIsSubmittingClose(false)
    }
  }

  const handleReopenYear = async () => {
    setIsSubmittingReopen(true)
    try {
      await reopenFinancialYear(companyId, currentYearLabel, userId)
      toast.success(`Financial Year ${formatFinancialYearLabel(currentYearLabel)} reopened for adjustments.`)
      setReopenDialogOpen(false)
      onRefresh()
    } catch (err) {
      console.error("Reopen year error:", err)
      toast.error("Failed to reopen financial year.")
    } finally {
      setIsSubmittingReopen(false)
    }
  }

  const warnings = reviewData?.warnings || {
    unpaidBillsCount: 0,
    missingDocumentsCount: 0,
    missingGstinGstBillsCount: 0,
    duplicateInvoicesCount: 0,
  }

  const hasWarnings =
    warnings.unpaidBillsCount > 0 ||
    warnings.missingDocumentsCount > 0 ||
    warnings.missingGstinGstBillsCount > 0 ||
    warnings.duplicateInvoicesCount > 0

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 sm:p-6 rounded-2xl border bg-gradient-to-r from-muted/50 via-muted/30 to-background flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary flex items-center gap-1.5">
              <Calendar className="h-4 w-4" /> March / Year-End Closing
            </span>
            <Badge
              variant={isClosed ? "destructive" : "default"}
              className="rounded-lg text-xs font-semibold px-2 py-0.5"
            >
              {isClosed ? "Closed / Locked" : "Open for Entries"}
            </Badge>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            Financial Year: {formatFinancialYearLabel(currentYearLabel)}
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Audit your purchases, company expenses, stock position, and Net GST reconciliation before closing books on 31 March.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Select value={currentYearLabel} onValueChange={(val) => val && onFinancialYearChange(val)}>
            <SelectTrigger className="h-10 w-[140px] rounded-xl text-xs font-semibold">
              <SelectValue>
                {(val: string | null) => (val ? formatFinancialYearLabel(val) : "Select FY")}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {financialYears.map((fy) => (
                <SelectItem key={fy.id} value={fy.year_label}>
                  {formatFinancialYearLabel(fy.year_label)} ({fy.status})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={handleExportCsv}
            disabled={isExportingCsv}
            className="rounded-xl h-10 text-xs"
            title="Export complete financial year data to CSV"
          >
            {isExportingCsv ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <FileSpreadsheet className="h-4 w-4 mr-1.5 text-emerald-600" />}
            Export CSV
          </Button>

          <Button
            variant="outline"
            onClick={handleDownloadPdf}
            disabled={isDownloadingPdf}
            className="rounded-xl h-10 text-xs border-primary/30 text-primary hover:bg-primary/5 font-medium"
            title="Download multi-page professional year-end audit report PDF"
          >
            {isDownloadingPdf ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Download className="h-4 w-4 mr-1.5" />}
            Download Complete Year Report
          </Button>

          {!isClosed ? (
            <Button onClick={() => setCloseDialogOpen(true)} className="rounded-xl shadow-xs">
              <Lock className="h-4 w-4 mr-1.5" /> Close Financial Year
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => setReopenDialogOpen(true)}
              className="rounded-xl border-amber-300 text-amber-700 hover:bg-amber-50"
            >
              <Unlock className="h-4 w-4 mr-1.5" /> Reopen Financial Year
            </Button>
          )}
        </div>
      </div>

      {/* Warnings & Actionable Alerts */}
      {hasWarnings && !isClosed && (
        <div className="p-4 rounded-2xl border border-amber-200/80 bg-amber-50/70 text-amber-900 shadow-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
            Actionable Year-End Audit Alerts
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs pt-1">
            {warnings.unpaidBillsCount > 0 && (
              <div
                className="flex items-center justify-between p-2 rounded-xl bg-white/80 border border-amber-200 cursor-pointer hover:bg-white"
                onClick={() => onNavigateTab("purchases")}
              >
                <span>{warnings.unpaidBillsCount} supplier bills unpaid</span>
                <ArrowRight className="h-3 w-3 text-amber-700 ml-1 shrink-0" />
              </div>
            )}
            {warnings.missingDocumentsCount > 0 && (
              <div
                className="flex items-center justify-between p-2 rounded-xl bg-white/80 border border-amber-200 cursor-pointer hover:bg-white"
                onClick={() => onNavigateTab("vault")}
              >
                <span>{warnings.missingDocumentsCount} purchases lack bill upload</span>
                <ArrowRight className="h-3 w-3 text-amber-700 ml-1 shrink-0" />
              </div>
            )}
            {warnings.missingGstinGstBillsCount > 0 && (
              <div
                className="flex items-center justify-between p-2 rounded-xl bg-white/80 border border-amber-200 cursor-pointer hover:bg-white"
                onClick={() => onNavigateTab("gst")}
              >
                <span>{warnings.missingGstinGstBillsCount} GST bills missing GSTIN</span>
                <ArrowRight className="h-3 w-3 text-amber-700 ml-1 shrink-0" />
              </div>
            )}
            {warnings.duplicateInvoicesCount > 0 && (
              <div
                className="flex items-center justify-between p-2 rounded-xl bg-white/80 border border-amber-200 cursor-pointer hover:bg-white"
                onClick={() => onNavigateTab("purchases")}
              >
                <span>{warnings.duplicateInvoicesCount} duplicate invoice numbers</span>
                <ArrowRight className="h-3 w-3 text-amber-700 ml-1 shrink-0" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5 Core Review Cards (Sales, Purchases, Expenses, Stock, GST) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 1. Sales */}
        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                Sales & Invoices
              </CardTitle>
              <CardDescription className="text-xs">Outward supply ledger</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/admin/invoices")}
              className="h-8 px-2 text-xs text-primary"
            >
              View Invoices <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b">
              <span className="text-muted-foreground">Total Sales:</span>
              <span className="font-bold text-foreground">
                ₹{(reviewData?.sales.totalSales ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b">
              <span className="text-muted-foreground">Total Invoices Generated:</span>
              <span className="font-medium text-foreground">{reviewData?.sales.totalInvoices ?? 0}</span>
            </div>
            <div className="flex justify-between py-1 border-b">
              <span className="text-muted-foreground">Taxable Sales:</span>
              <span className="font-medium text-foreground">
                ₹{(reviewData?.sales.taxableSales ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between py-1 text-emerald-600 font-semibold">
              <span>Output GST Liability:</span>
              <span>₹{(reviewData?.sales.outputGst ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>
          </CardContent>
        </Card>

        {/* 2. Purchases */}
        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-sky-600" />
                Purchases & Inward
              </CardTitle>
              <CardDescription className="text-xs">Raw material & goods</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigateTab("purchases")}
              className="h-8 px-2 text-xs text-primary"
            >
              View Bills <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b">
              <span className="text-muted-foreground">Total Purchases:</span>
              <span className="font-bold text-foreground">
                ₹{(reviewData?.purchases.totalPurchases ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b">
              <span className="text-muted-foreground">Purchase Bills Count:</span>
              <span className="font-medium text-foreground">{reviewData?.purchases.purchaseBillsCount ?? 0}</span>
            </div>
            <div className="flex justify-between py-1 text-sky-600 font-semibold">
              <span>Input GST Credit (ITC):</span>
              <span>
                ₹{(reviewData?.purchases.inputGst ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* 3. Company Expenses */}
        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Wallet className="h-4 w-4 text-amber-600" />
                Company Expenses
              </CardTitle>
              <CardDescription className="text-xs">Rent, power, maintenance</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigateTab("expenses")}
              className="h-8 px-2 text-xs text-primary"
            >
              View Expenses <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b">
              <span className="text-muted-foreground">Total Expenses:</span>
              <span className="font-bold text-foreground">
                ₹{(reviewData?.expenses.totalExpenses ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b">
              <span className="text-muted-foreground">Paid Amount:</span>
              <span className="font-medium text-emerald-600">
                ₹{(reviewData?.expenses.paidExpenses ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between py-1 text-rose-600 font-semibold">
              <span>Outstanding / Due:</span>
              <span>
                ₹{(reviewData?.expenses.outstandingExpenses ?? 0).toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* 4. Stock Reconciliation */}
        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Warehouse className="h-4 w-4 text-purple-600" />
                Stock Position
              </CardTitle>
              <CardDescription className="text-xs">Quality ledger balance</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/admin/stock")}
              className="h-8 px-2 text-xs text-primary"
            >
              Stock Ledger <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b">
              <span className="text-muted-foreground">Active Qualities:</span>
              <span className="font-medium text-foreground">{reviewData?.stock.totalQualities ?? 0}</span>
            </div>
            <div className="flex justify-between py-1 border-b">
              <span className="text-muted-foreground">Sold / Delivered:</span>
              <span className="font-medium text-foreground">{reviewData?.stock.soldStockTaka ?? 0} Taka</span>
            </div>
            <div className="flex justify-between py-1 text-purple-600 font-bold">
              <span>Closing Available Stock:</span>
              <span>{reviewData?.stock.closingStockTaka ?? 0} Taka</span>
            </div>
          </CardContent>
        </Card>

        {/* 5. GST Net Position */}
        <Card className="rounded-2xl border shadow-xs bg-card md:col-span-2">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <BadgePercent className="h-4 w-4 text-primary" />
                GST Net Position (Input vs Output)
              </CardTitle>
              <CardDescription className="text-xs">
                Comparison of GST paid on purchases against GST collected on invoices
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigateTab("gst")}
              className="h-8 px-2 text-xs text-primary"
            >
              Detailed ITC <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-muted/20 text-xs">
              <div>
                <p className="text-muted-foreground uppercase text-[10px] font-semibold">Total Input GST (ITC)</p>
                <p className="text-base font-bold text-sky-600 mt-0.5">
                  ₹{(reviewData?.gst.inputGst ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground uppercase text-[10px] font-semibold">Total Output GST</p>
                <p className="text-base font-bold text-indigo-600 mt-0.5">
                  ₹{(reviewData?.gst.outputGst ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground uppercase text-[10px] font-semibold">
                  {(reviewData?.gst.netGstPosition ?? 0) >= 0 ? "Net GST Payable" : "Carryforward ITC Credit"}
                </p>
                <p
                  className={`text-base font-bold mt-0.5 ${
                    (reviewData?.gst.netGstPosition ?? 0) >= 0 ? "text-rose-600" : "text-emerald-600"
                  }`}
                >
                  ₹{Math.abs(reviewData?.gst.netGstPosition ?? 0).toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {(reviewData?.gst.netGstPosition ?? 0) >= 0
                ? "Output GST exceeds Input GST. Net GST balance payable to government after ITC adjustment."
                : "Input GST exceeds Output GST. Net surplus Input Tax Credit (ITC) available to carry forward into next financial year."}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* March Closing Checklist */}
      <Card className="rounded-2xl border shadow-xs bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <FileCheck2 className="h-5 w-5 text-primary" />
            March Closing Checklist
          </CardTitle>
          <CardDescription className="text-xs">
            Review and check off these mandatory accounting and compliance tasks before locking the year.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {[
              {
                key: "purchases_entered",
                label: "All purchase bills entered",
                action: () => onNavigateTab("purchases"),
                actionText: "Purchases",
              },
              {
                key: "expenses_uploaded",
                label: "All expense bills & slips uploaded",
                action: () => onNavigateTab("expenses"),
                actionText: "Expenses",
              },
              {
                key: "gst_reviewed",
                label: "GST purchase bills reviewed",
                action: () => onNavigateTab("gst"),
                actionText: "GST Input",
              },
              {
                key: "duplicates_checked",
                label: "Duplicate supplier invoices verified",
                action: () => onNavigateTab("purchases"),
                actionText: "Verify",
              },
              {
                key: "unpaid_reviewed",
                label: "Unpaid vendor & supplier balances reviewed",
                action: () => onNavigateTab("suppliers"),
                actionText: "Suppliers",
              },
              {
                key: "stock_verified",
                label: "Physical vs recorded stock closing verified",
                action: () => router.push("/admin/stock"),
                actionText: "Stock",
              },
              {
                key: "sales_completed",
                label: "All sales invoices & delivery challans completed",
                action: () => router.push("/admin/invoices"),
                actionText: "Invoices",
              },
              {
                key: "itc_reviewed",
                label: "Input Tax Credit (ITC) statement exported for CA",
                action: () => onNavigateTab("gst"),
                actionText: "Export ITC",
              },
              {
                key: "output_reviewed",
                label: "Output GST reconciled with sales",
                action: () => router.push("/admin/reports"),
                actionText: "Reports",
              },
              {
                key: "bank_cash_reviewed",
                label: "Bank accounts & cash entries reconciled",
                action: () => router.push("/admin/settings"),
                actionText: "Bank Accounts",
              },
            ].map((item) => {
              const checked = checklist[item.key] ?? false
              return (
                <div
                  key={item.key}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                    checked ? "bg-emerald-500/5 border-emerald-500/20" : "bg-muted/20 border-border"
                  }`}
                >
                  <label className="flex items-center gap-2.5 cursor-pointer flex-1 select-none">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleCheck(item.key)}
                      className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className={checked ? "font-medium text-foreground" : "text-muted-foreground"}>
                      {item.label}
                    </span>
                  </label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={item.action}
                    className="h-7 px-2 text-[11px] text-primary hover:bg-primary/10 ml-2 shrink-0"
                  >
                    {item.actionText}
                  </Button>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Close Financial Year Dialog */}
      <Dialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
        <DialogContent className="sm:max-w-xl md:max-w-2xl rounded-2xl p-6 sm:p-7">
          <DialogHeader className="space-y-1.5 pr-8">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              Close Financial Year {formatFinancialYearLabel(currentYearLabel)}?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Locking the financial year archives all transactions to prevent accidental modifications after filing.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {/* Live Financial Position Snapshot */}
            <div className="rounded-xl border border-border/70 bg-muted/20 p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 pb-1 border-b border-border/50">
                <span className="font-bold text-foreground text-xs uppercase tracking-wider">
                  Financial Year-End Position Snapshot
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Derived live from verified ledger & vault entries
                </span>
              </div>

              {/* 4 Primary KPI cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-xl bg-card border border-border/60 shadow-2xs">
                  <div className="text-[11px] font-medium text-muted-foreground">Total Sales</div>
                  <div className="text-sm sm:text-base font-bold text-emerald-600 mt-0.5">
                    ₹{(reviewData?.sales.totalSales || 0).toLocaleString("en-IN")}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-card border border-border/60 shadow-2xs">
                  <div className="text-[11px] font-medium text-muted-foreground">Purchases</div>
                  <div className="text-sm sm:text-base font-bold text-blue-600 mt-0.5">
                    ₹{(reviewData?.purchases.totalPurchases || 0).toLocaleString("en-IN")}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-card border border-border/60 shadow-2xs">
                  <div className="text-[11px] font-medium text-muted-foreground">Expenses</div>
                  <div className="text-sm sm:text-base font-bold text-amber-600 mt-0.5">
                    ₹{(reviewData?.expenses.totalExpenses || 0).toLocaleString("en-IN")}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-card border border-border/60 shadow-2xs">
                  <div className="text-[11px] font-medium text-muted-foreground">Closing Stock</div>
                  <div className="text-sm sm:text-base font-bold text-foreground mt-0.5">
                    {reviewData?.stock.closingStockTaka || 0} Taka
                  </div>
                </div>
              </div>

              {/* 4 Secondary audit indicators */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-2.5 rounded-lg bg-card/60 border border-border/50">
                  <div className="text-[10px] text-muted-foreground">Input GST (ITC)</div>
                  <div className="text-xs font-semibold text-foreground mt-0.5">
                    ₹{(reviewData?.gst.inputGst || 0).toLocaleString("en-IN")}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-card/60 border border-border/50">
                  <div className="text-[10px] text-muted-foreground">Output GST</div>
                  <div className="text-xs font-semibold text-foreground mt-0.5">
                    ₹{(reviewData?.gst.outputGst || 0).toLocaleString("en-IN")}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-card/60 border border-border/50">
                  <div className="text-[10px] text-muted-foreground">Missing Docs</div>
                  <div className={`text-xs font-bold mt-0.5 ${warnings.missingDocumentsCount > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                    {warnings.missingDocumentsCount === 0 ? "0 (All Uploaded)" : `${warnings.missingDocumentsCount} Bills`}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-card/60 border border-border/50">
                  <div className="text-[10px] text-muted-foreground">Unpaid Bills</div>
                  <div className={`text-xs font-bold mt-0.5 ${warnings.unpaidBillsCount > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                    {warnings.unpaidBillsCount === 0 ? "0 (Settled)" : `${warnings.unpaidBillsCount} Bills`}
                  </div>
                </div>
              </div>

              {/* Net GST Position */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-card border border-border/60">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-foreground">Net GST Position</span>
                  <span className="text-[10px] text-muted-foreground hidden sm:inline">(Output GST − Input GST ITC)</span>
                </div>
                <span className={`text-sm font-bold ${(reviewData?.gst.netGstPosition || 0) > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                  {(reviewData?.gst.netGstPosition || 0) > 0
                    ? `+₹${Math.round(reviewData?.gst.netGstPosition || 0).toLocaleString("en-IN")} (Net Payable)`
                    : `₹${Math.round(Math.abs(reviewData?.gst.netGstPosition || 0)).toLocaleString("en-IN")} (Net ITC Credit Available)`}
                </span>
              </div>
            </div>

            {hasWarnings ? (
              <div className="p-3.5 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  Notice: Warnings Detected Before Closing
                </p>
                <ul className="list-disc pl-5 space-y-0.5 mt-1 text-[11px]">
                  {warnings.unpaidBillsCount > 0 && <li>{warnings.unpaidBillsCount} supplier bills remain unpaid.</li>}
                  {warnings.missingDocumentsCount > 0 && (
                    <li>{warnings.missingDocumentsCount} purchases are missing digital bill uploads.</li>
                  )}
                  {warnings.missingGstinGstBillsCount > 0 && (
                    <li>{warnings.missingGstinGstBillsCount} GST purchase bills do not have vendor GSTIN.</li>
                  )}
                </ul>
                <p className="text-[10px] text-amber-800 pt-1">
                  You can close now and reopen later if audit adjustments are requested by your CA.
                </p>
              </div>
            ) : (
              <div className="p-3 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-900 flex items-center gap-2 font-medium">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                All audit checks look clean for year closing.
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Closing Notes / CA Audit Remarks</Label>
              <Textarea
                value={closingNotes}
                onChange={(e) => setClosingNotes(e.target.value)}
                placeholder="e.g. Audit completed by CA Sharma & Co. Net ITC carried forward to FY 2026-27."
                className="rounded-xl min-h-[70px]"
              />
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="rounded-xl text-xs w-full sm:w-auto shadow-2xs"
            >
              {isDownloadingPdf ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="mr-1.5 h-3.5 w-3.5 text-primary" />
              )}
              Download Report
            </Button>
            <div className="flex items-center justify-end gap-2.5 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCloseDialogOpen(false)}
                disabled={isSubmittingClose}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleCloseYear}
                disabled={isSubmittingClose}
                className="rounded-xl shadow-xs"
              >
                {isSubmittingClose && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Close Financial Year
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reopen Financial Year Dialog */}
      <ConfirmationDialog
        open={reopenDialogOpen}
        onOpenChange={setReopenDialogOpen}
        title={`Reopen Financial Year ${formatFinancialYearLabel(currentYearLabel)}?`}
        description="Reopening will unlock historical records for this financial year, allowing you to edit or adjust bills and vouchers. Proceed only if authorized."
        confirmText="Reopen Year"
        variant="default"
        isLoading={isSubmittingReopen}
        onConfirm={handleReopenYear}
      />
    </div>
  )
}
