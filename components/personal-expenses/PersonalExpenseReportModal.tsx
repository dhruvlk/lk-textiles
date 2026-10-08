"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  FileText,
  Download,
  Printer,
  FileSpreadsheet,
  Calendar,
  Layers,
  Tag,
  Loader2,
  CheckCircle2,
} from "lucide-react"
import { toast } from "sonner"
import {
  getPersonalMonthlySummary,
  getPersonalYearlySummary,
  getPersonalExpensesPaginated,
} from "@/services/personal-expenses.service"
import {
  PersonalExpenseReportPDF,
  type PersonalReportData,
} from "@/components/pdf/PersonalExpenseReportPDF"
import { downloadBlobFile, downloadCsv, downloadExcel } from "@/lib/reports/export"
import type {
  PersonalExpense,
  PersonalExpenseCategory,
  PersonalExpenseFilters,
} from "@/types/personal-expenses"

interface PersonalExpenseReportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  userName?: string
  categories: PersonalExpenseCategory[]
  currentFilters?: PersonalExpenseFilters
}

type ReportType = "monthly" | "yearly" | "category" | "filtered"

const MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
]

export function PersonalExpenseReportModal({
  open,
  onOpenChange,
  userId,
  userName,
  categories,
  currentFilters,
}: PersonalExpenseReportModalProps) {
  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth() + 1

  const [reportType, setReportType] = useState<ReportType>("monthly")

  // Monthly state
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth)
  const [selectedYear, setSelectedYear] = useState<number>(currentYear)

  // Yearly state
  const [selectedYearlyYear, setSelectedYearlyYear] = useState<number>(currentYear)
  const [yearType, setYearType] = useState<"calendar" | "financial">("financial")

  // Category state
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    categories[0]?.id || ""
  )
  const [categoryDateFrom, setCategoryDateFrom] = useState<string>(
    `${currentYear}-01-01`
  )
  const [categoryDateTo, setCategoryDateTo] = useState<string>(
    new Date().toISOString().split("T")[0]
  )

  // Custom filter state
  const [customDateFrom, setCustomDateFrom] = useState<string>(
    currentFilters?.dateFrom || `${currentYear}-01-01`
  )
  const [customDateTo, setCustomDateTo] = useState<string>(
    currentFilters?.dateTo || new Date().toISOString().split("T")[0]
  )

  const [isGenerating, setIsGenerating] = useState(false)

  const buildReportData = async (): Promise<PersonalReportData> => {
    if (reportType === "monthly") {
      const summary = await getPersonalMonthlySummary(
        userId,
        selectedYear,
        selectedMonth
      )
      const mStr = String(selectedMonth).padStart(2, "0")
      const list = await getPersonalExpensesPaginated(
        userId,
        {
          month: `${selectedYear}-${mStr}`,
          sortBy: "newest",
        },
        1,
        1000
      )

      return {
        reportTitle: "Personal Expense Report",
        periodLabel: summary.monthLabel,
        userName,
        summaryKpis: [
          {
            label: "Total Expenses",
            value: `₹${summary.totalSpent.toLocaleString("en-IN")}`,
          },
          {
            label: "Transactions",
            value: String(summary.transactionCount),
          },
          {
            label: "Average Daily Spend",
            value: `₹${Math.round(summary.averageDailySpend).toLocaleString("en-IN")}`,
          },
          {
            label: "Largest Expense",
            value: `₹${summary.largestExpense.toLocaleString("en-IN")}`,
          },
        ],
        categoryBreakdown: summary.categoryBreakdown,
        expenses: list.data,
        totalAmount: summary.totalSpent,
      }
    } else if (reportType === "yearly") {
      const summary = await getPersonalYearlySummary(
        userId,
        selectedYearlyYear,
        yearType
      )
      const list = await getPersonalExpensesPaginated(
        userId,
        {
          year: String(selectedYearlyYear),
          yearType,
          sortBy: "newest",
        },
        1,
        2000
      )

      return {
        reportTitle: "Personal Expense Report",
        periodLabel: summary.yearLabel,
        userName,
        summaryKpis: [
          {
            label: "Total Annual Spending",
            value: `₹${summary.totalSpent.toLocaleString("en-IN")}`,
          },
          {
            label: "Total Transactions",
            value: String(summary.transactionCount),
          },
          {
            label: "Avg Monthly Spending",
            value: `₹${Math.round(summary.averageMonthlySpending).toLocaleString("en-IN")}`,
          },
          {
            label: "Avg Daily Spending",
            value: `₹${Math.round(summary.averageDailySpending).toLocaleString("en-IN")}`,
          },
          {
            label: "Largest Expense",
            value: `₹${summary.largestExpense.toLocaleString("en-IN")}`,
          },
        ],
        monthlyBreakdown: summary.monthlyBreakdown,
        categoryBreakdown: summary.categoryBreakdown,
        expenses: list.data,
        totalAmount: summary.totalSpent,
      }
    } else if (reportType === "category") {
      const cat = categories.find((c) => c.id === selectedCategoryId)
      const catName = cat?.name || "Selected Category"

      const list = await getPersonalExpensesPaginated(
        userId,
        {
          categoryId: selectedCategoryId,
          dateFrom: categoryDateFrom,
          dateTo: categoryDateTo,
          sortBy: "newest",
        },
        1,
        1000
      )

      const totalSpent = list.data.reduce((sum, e) => sum + e.amount, 0)
      const maxExp = list.data.reduce((max, e) => Math.max(max, e.amount), 0)
      const avgExp = list.data.length > 0 ? totalSpent / list.data.length : 0

      return {
        reportTitle: `Category Expense Report: ${catName}`,
        periodLabel: `${categoryDateFrom} to ${categoryDateTo}`,
        userName,
        summaryKpis: [
          {
            label: "Total Spent",
            value: `₹${totalSpent.toLocaleString("en-IN")}`,
          },
          {
            label: "Transactions",
            value: String(list.data.length),
          },
          {
            label: "Average Transaction",
            value: `₹${Math.round(avgExp).toLocaleString("en-IN")}`,
          },
          {
            label: "Largest Expense",
            value: `₹${maxExp.toLocaleString("en-IN")}`,
          },
        ],
        expenses: list.data,
        totalAmount: totalSpent,
      }
    } else {
      // Filtered / Custom date range
      const list = await getPersonalExpensesPaginated(
        userId,
        {
          ...currentFilters,
          dateFrom: customDateFrom,
          dateTo: customDateTo,
          sortBy: "newest",
        },
        1,
        2000
      )

      const totalSpent = list.data.reduce((sum, e) => sum + e.amount, 0)
      const maxExp = list.data.reduce((max, e) => Math.max(max, e.amount), 0)

      // Category breakdown
      const catMap = new Map<string, { count: number; total: number }>()
      list.data.forEach((e) => {
        const c = e.category_name || "Other"
        const cur = catMap.get(c) || { count: 0, total: 0 }
        cur.count += 1
        cur.total += e.amount
        catMap.set(c, cur)
      })

      const categoryBreakdown = Array.from(catMap.entries()).map(([k, v]) => ({
        categoryName: k,
        count: v.count,
        totalAmount: v.total,
        percentage: totalSpent > 0 ? (v.total / totalSpent) * 100 : 0,
      }))

      return {
        reportTitle: "Personal Expense Summary",
        periodLabel: `${customDateFrom} to ${customDateTo}`,
        userName,
        summaryKpis: [
          {
            label: "Total Expenses",
            value: `₹${totalSpent.toLocaleString("en-IN")}`,
          },
          {
            label: "Total Transactions",
            value: String(list.data.length),
          },
          {
            label: "Largest Expense",
            value: `₹${maxExp.toLocaleString("en-IN")}`,
          },
        ],
        categoryBreakdown,
        expenses: list.data,
        totalAmount: totalSpent,
      }
    }
  }

  const handleDownloadPdf = async () => {
    setIsGenerating(true)
    try {
      const data = await buildReportData()
      const { pdf } = await import("@react-pdf/renderer")
      const blob = await pdf(<PersonalExpenseReportPDF data={data} />).toBlob()

      const filename = `${data.reportTitle.replace(/\s+/g, "_")}_${data.periodLabel.replace(/\s+/g, "_")}.pdf`
      downloadBlobFile(filename, blob)
      toast.success("PDF report downloaded!")
    } catch (err) {
      console.error(err)
      toast.error("Failed to generate PDF report")
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePrintPdf = async () => {
    setIsGenerating(true)
    try {
      const data = await buildReportData()
      const { pdf } = await import("@react-pdf/renderer")
      const blob = await pdf(<PersonalExpenseReportPDF data={data} />).toBlob()
      const url = URL.createObjectURL(blob)
      const w = window.open(url, "_blank")
      if (w) {
        w.focus()
      } else {
        toast.info("Please allow popups to print report")
      }
    } catch (err) {
      console.error(err)
      toast.error("Failed to open print preview")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleExportCsv = async () => {
    setIsGenerating(true)
    try {
      const data = await buildReportData()
      const headers = [
        "Expense Date",
        "Expense No",
        "Category",
        "Subcategory",
        "Description",
        "Paid To / Merchant",
        "Payment Method",
        "Status",
        "Amount (INR)",
        "Notes",
      ]
      const rows = data.expenses.map((e) => [
        e.expense_date,
        e.expense_number,
        e.category_name,
        e.subcategory_name || "",
        e.description,
        e.paid_to || "",
        e.payment_method,
        e.payment_status,
        e.amount.toFixed(2),
        e.notes || "",
      ])

      const filename = `${data.reportTitle.replace(/\s+/g, "_")}_${data.periodLabel.replace(/\s+/g, "_")}.csv`
      downloadCsv(filename, headers, rows)
      toast.success("CSV export downloaded!")
    } catch (err) {
      console.error(err)
      toast.error("Failed to export CSV")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleExportExcel = async () => {
    setIsGenerating(true)
    try {
      const data = await buildReportData()
      const headers = [
        "Expense Date",
        "Expense No",
        "Category",
        "Subcategory",
        "Description",
        "Paid To / Merchant",
        "Payment Method",
        "Status",
        "Amount (INR)",
        "Notes",
      ]
      const rows = data.expenses.map((e) => [
        e.expense_date,
        e.expense_number,
        e.category_name,
        e.subcategory_name || "",
        e.description,
        e.paid_to || "",
        e.payment_method,
        e.payment_status,
        e.amount.toFixed(2),
        e.notes || "",
      ])

      const filename = `${data.reportTitle.replace(/\s+/g, "_")}_${data.periodLabel.replace(/\s+/g, "_")}.xls`
      downloadExcel(filename, headers, rows)
      toast.success("Excel export downloaded!")
    } catch (err) {
      console.error(err)
      toast.error("Failed to export Excel")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl w-[95vw] max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden rounded-2xl bg-background border shadow-2xl">
        <DialogHeader className="p-4 sm:px-6 border-b shrink-0 bg-muted/20">
          <DialogTitle className="text-lg font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Generate Personal Expense Report
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Download professional, shareable PDF reports or export data to Excel/CSV.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Report Type Selector */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: "monthly", label: "Monthly Report", icon: Calendar },
              { id: "yearly", label: "Yearly Report", icon: Layers },
              { id: "category", label: "Category Report", icon: Tag },
              { id: "filtered", label: "Custom Summary", icon: FileText },
            ].map((t) => {
              const Icon = t.icon
              const isSelected = reportType === t.id
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setReportType(t.id as ReportType)}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                    isSelected
                      ? "border-primary bg-primary/10 text-primary font-semibold shadow-xs"
                      : "border-border/60 hover:bg-muted/30 text-muted-foreground"
                  }`}
                >
                  <Icon className="h-5 w-5 mb-1.5" />
                  <span className="text-xs">{t.label}</span>
                </button>
              )
            })}
          </div>

          {/* Report Specific Parameters */}
          <div className="p-4 rounded-xl border bg-card/60 space-y-4">
            {reportType === "monthly" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Select Month</Label>
                  <Select
                    value={String(selectedMonth)}
                    onValueChange={(val) => {
                      if (val) setSelectedMonth(Number(val))
                    }}
                  >
                    <SelectTrigger className="text-xs">
                      <SelectValue>
                        {(val) => {
                          const m = MONTHS.find((x) => String(x.value) === String(val))
                          return m ? m.label : "Select Month"
                        }}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((m) => (
                        <SelectItem key={m.value} value={String(m.value)}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Select Year</Label>
                  <Input
                    type="number"
                    min="2020"
                    max="2035"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="text-xs"
                  />
                </div>
              </div>
            )}

            {reportType === "yearly" && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Year</Label>
                    <Input
                      type="number"
                      min="2020"
                      max="2035"
                      value={selectedYearlyYear}
                      onChange={(e) => setSelectedYearlyYear(Number(e.target.value))}
                      className="text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Calendar vs Financial Year</Label>
                    <Select
                      value={yearType}
                      onValueChange={(val) => {
                        if (val) setYearType(val as "calendar" | "financial")
                      }}
                    >
                      <SelectTrigger className="text-xs">
                        <SelectValue>
                          {(val) =>
                            val === "financial"
                              ? "Financial Year (Apr – Mar)"
                              : "Calendar Year (Jan – Dec)"
                          }
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="financial">
                          Financial Year (Apr – Mar)
                        </SelectItem>
                        <SelectItem value="calendar">
                          Calendar Year (Jan – Dec)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <p className="text-[11px] text-muted-foreground italic">
                  {yearType === "financial"
                    ? `Covers 01 April ${selectedYearlyYear} to 31 March ${selectedYearlyYear + 1}`
                    : `Covers 01 January ${selectedYearlyYear} to 31 December ${selectedYearlyYear}`}
                </p>
              </div>
            )}

            {reportType === "category" && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Category</Label>
                  <Select
                    value={selectedCategoryId}
                    onValueChange={(val) => {
                      if (val) setSelectedCategoryId(val)
                    }}
                  >
                    <SelectTrigger className="text-xs">
                      <SelectValue placeholder="Choose Category">
                        {(val) => {
                          if (!val) return "Choose Category"
                          const c = categories.find((x) => x.id === val)
                          return c ? c.name : "Choose Category"
                        }}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Date From</Label>
                    <Input
                      type="date"
                      value={categoryDateFrom}
                      onChange={(e) => setCategoryDateFrom(e.target.value)}
                      className="text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Date To</Label>
                    <Input
                      type="date"
                      value={categoryDateTo}
                      onChange={(e) => setCategoryDateTo(e.target.value)}
                      className="text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            {reportType === "filtered" && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Date From</Label>
                    <Input
                      type="date"
                      value={customDateFrom}
                      onChange={(e) => setCustomDateFrom(e.target.value)}
                      className="text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Date To</Label>
                    <Input
                      type="date"
                      value={customDateTo}
                      onChange={(e) => setCustomDateTo(e.target.value)}
                      className="text-xs"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Generates summary based on selected date range and currently active dashboard filters.
                </p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="p-4 sm:px-6 border-t shrink-0 flex flex-col sm:flex-row items-center justify-between gap-2.5 bg-muted/20">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              disabled={isGenerating}
              className="text-xs rounded-xl flex-1 sm:flex-none"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 mr-1" />
              CSV
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExportExcel}
              disabled={isGenerating}
              className="text-xs rounded-xl flex-1 sm:flex-none"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 mr-1" />
              Excel
            </Button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrintPdf}
              disabled={isGenerating}
              className="text-xs rounded-xl"
            >
              <Printer className="h-3.5 w-3.5 mr-1" />
              Print
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleDownloadPdf}
              disabled={isGenerating}
              className="text-xs rounded-xl px-4"
            >
              {isGenerating ? (
                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5 mr-1" />
              )}
              Download PDF Report
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
