"use client"

import { useState, useEffect, useMemo, useTransition } from "react"
import {
  WalletCards,
  Plus,
  UploadCloud,
  FileText,
  Calendar,
  Search,
  Filter,
  ArrowUpDown,
  Download,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Edit,
  Copy,
  Trash2,
  Eye,
  FileSpreadsheet,
  Settings2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Paperclip,
  TrendingUp,
  Tag,
  CreditCard,
  Building,
  RotateCcw,
  Loader2,
  DollarSign,
  PieChart as PieChartIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { StatCard } from "@/components/common/StatCard"
import { EmptyState } from "@/components/common/EmptyState"
import { ConfirmationDialog } from "@/components/dialogs/ConfirmationDialog"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
} from "recharts"

// Services & Types
import {
  getPersonalExpenseOverviewStats,
  getPersonalMonthlySummary,
  getPersonalYearlySummary,
  getPersonalExpensesPaginated,
  getPersonalCategories,
  getPersonalExpenseSettings,
  getAllUniqueMerchants,
  deletePersonalExpense,
  duplicatePersonalExpense,
} from "@/services/personal-expenses.service"
import { PersonalExpenseVoucherPDF } from "@/components/pdf/PersonalExpenseVoucherPDF"
import { downloadBlobFile, downloadCsv, downloadExcel } from "@/lib/reports/export"
import type {
  PersonalExpense,
  PersonalExpenseCategory,
  PersonalExpenseDocument,
  PersonalExpenseFilters,
  PersonalExpenseMonthlySummary,
  PersonalExpenseOverviewStats,
  PersonalExpenseSettings,
  PersonalPaymentStatus,
} from "@/types/personal-expenses"

// Modals
import { PersonalExpenseModal } from "./PersonalExpenseModal"
import { PersonalExpenseQuickUploadModal } from "./PersonalExpenseQuickUploadModal"
import { PersonalExpenseViewDialog } from "./PersonalExpenseViewDialog"
import { PersonalDocumentPreviewModal } from "./PersonalDocumentPreviewModal"
import { PersonalExpenseReportModal } from "./PersonalExpenseReportModal"
import { PersonalExpenseSettingsModal } from "./PersonalExpenseSettingsModal"

export default function PersonalExpensesDashboardClient() {
  const { user } = useAuth()
  const userId = user?.id || ""
  const userName = user?.name || user?.email || "Personal User"

  // Overview Stats
  const [stats, setStats] = useState<PersonalExpenseOverviewStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)

  // Monthly Summary & Month Navigation
  const now = new Date()
  const [navYear, setNavYear] = useState<number>(now.getFullYear())
  const [navMonth, setNavMonth] = useState<number>(now.getMonth() + 1)
  const [monthlySummary, setMonthlySummary] = useState<PersonalExpenseMonthlySummary | null>(null)
  const [summaryLoading, setSummaryLoading] = useState(true)

  // Chart data (Yearly trend)
  const [yearlyTrendData, setYearlyTrendData] = useState<
    Array<{ monthName: string; totalAmount: number }>
  >([])

  // Categories & Settings
  const [categories, setCategories] = useState<PersonalExpenseCategory[]>([])
  const [settings, setSettings] = useState<PersonalExpenseSettings | null>(null)
  const [merchants, setMerchants] = useState<string[]>([])

  // Expenses Table / List State
  const [expenses, setExpenses] = useState<PersonalExpense[]>([])
  const [totalExpenses, setTotalExpenses] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [totalPages, setTotalPages] = useState(1)
  const [listLoading, setListLoading] = useState(true)

  // Filters State
  const [filters, setFilters] = useState<PersonalExpenseFilters>({
    search: "",
    categoryId: undefined,
    paymentMethod: undefined,
    paymentStatus: undefined,
    paidTo: "",
    sortBy: "newest",
  })
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  // Modals state
  const [addExpenseModalOpen, setAddExpenseModalOpen] = useState(false)
  const [quickUploadModalOpen, setQuickUploadModalOpen] = useState(false)
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [settingsModalOpen, setSettingsModalOpen] = useState(false)

  const [viewExpense, setViewExpense] = useState<PersonalExpense | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)

  const [editExpense, setEditExpense] = useState<PersonalExpense | null>(null)

  const [previewDoc, setPreviewDoc] = useState<PersonalExpenseDocument | null>(null)
  const [previewModalOpen, setPreviewModalOpen] = useState(false)

  // Delete Confirmation state
  const [deleteExpenseItem, setDeleteExpenseItem] = useState<PersonalExpense | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // 1. Initial Masters Load
  const loadMasters = async () => {
    if (!userId) return
    try {
      const [cats, setts, merches] = await Promise.all([
        getPersonalCategories(userId),
        getPersonalExpenseSettings(userId),
        getAllUniqueMerchants(userId),
      ])
      setCategories(cats)
      setSettings(setts)
      setMerchants(merches)
    } catch (err) {
      console.error(err)
    }
  }

  // 2. Load KPIs
  const loadStats = async () => {
    if (!userId) return
    setStatsLoading(true)
    try {
      const data = await getPersonalExpenseOverviewStats(userId)
      setStats(data)
    } catch (err) {
      console.error(err)
    } finally {
      setStatsLoading(false)
    }
  }

  // 3. Load Monthly Summary & Trend
  const loadMonthlySummary = async () => {
    if (!userId) return
    setSummaryLoading(true)
    try {
      const [summary, yearly] = await Promise.all([
        getPersonalMonthlySummary(userId, navYear, navMonth),
        getPersonalYearlySummary(userId, navYear, "calendar"),
      ])
      setMonthlySummary(summary)
      setYearlyTrendData(
        yearly.monthlyBreakdown.map((m) => ({
          monthName: m.monthName.slice(0, 3),
          totalAmount: m.totalAmount,
        }))
      )
    } catch (err) {
      console.error(err)
    } finally {
      setSummaryLoading(false)
    }
  }

  // 4. Load Paginated Expenses List
  const loadExpenses = async () => {
    if (!userId) return
    setListLoading(true)
    try {
      const res = await getPersonalExpensesPaginated(userId, filters, page, pageSize)
      setExpenses(res.data)
      setTotalExpenses(res.total)
      setTotalPages(res.totalPages)
    } catch (err) {
      console.error(err)
      toast.error("Failed to load expenses")
    } finally {
      setListLoading(false)
    }
  }

  // Trigger loads on userId ready
  useEffect(() => {
    if (userId) {
      loadMasters()
      loadStats()
    }
  }, [userId])

  useEffect(() => {
    if (userId) {
      loadMonthlySummary()
    }
  }, [userId, navYear, navMonth])

  useEffect(() => {
    if (userId) {
      loadExpenses()
    }
  }, [userId, page, pageSize, filters])

  // Month navigation helpers
  const handlePrevMonth = () => {
    if (navMonth === 1) {
      setNavMonth(12)
      setNavYear((y) => y - 1)
    } else {
      setNavMonth((m) => m - 1)
    }
  }

  const handleNextMonth = () => {
    if (navMonth === 12) {
      setNavMonth(1)
      setNavYear((y) => y + 1)
    } else {
      setNavMonth((m) => m + 1)
    }
  }

  // Handlers for expense CRUD
  const handleExpenseSaved = (saved: PersonalExpense) => {
    loadExpenses()
    loadStats()
    loadMonthlySummary()
    if (viewExpense?.id === saved.id) {
      setViewExpense(saved)
    }
  }

  const handleDuplicate = async (exp: PersonalExpense) => {
    try {
      const dup = await duplicatePersonalExpense(exp.id, userId)
      toast.success(`Duplicated as ${dup.expense_number}`)
      handleExpenseSaved(dup)
    } catch (err) {
      console.error(err)
      toast.error("Failed to duplicate expense")
    }
  }

  const handleConfirmDelete = async () => {
    if (!deleteExpenseItem) return
    setIsDeleting(true)
    try {
      await deletePersonalExpense(deleteExpenseItem.id, userId)
      toast.success(`Expense ${deleteExpenseItem.expense_number} deleted`)
      setDeleteModalOpen(false)
      setDeleteExpenseItem(null)
      loadExpenses()
      loadStats()
      loadMonthlySummary()
    } catch (err) {
      console.error(err)
      toast.error("Failed to delete expense")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDownloadSingleVoucherPdf = async (exp: PersonalExpense) => {
    try {
      const { pdf } = await import("@react-pdf/renderer")
      const blob = await pdf(
        <PersonalExpenseVoucherPDF expense={exp} userName={userName} />
      ).toBlob()
      downloadBlobFile(`Expense_${exp.expense_number}.pdf`, blob)
      toast.success("Expense voucher downloaded")
    } catch (err) {
      console.error(err)
      toast.error("Failed to generate voucher PDF")
    }
  }

  const handleQuickExportCsv = () => {
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
    const rows = expenses.map((e) => [
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
    downloadCsv(`Personal_Expenses_Page_${page}.csv`, headers, rows)
    toast.success("CSV export downloaded")
  }

  const handleQuickExportExcel = () => {
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
    const rows = expenses.map((e) => [
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
    downloadExcel(`Personal_Expenses_Page_${page}.xls`, headers, rows)
    toast.success("Excel export downloaded")
  }

  const clearFilters = () => {
    setFilters({
      search: "",
      categoryId: undefined,
      paymentMethod: undefined,
      paymentStatus: undefined,
      paidTo: "",
      dateFrom: undefined,
      dateTo: undefined,
      minAmount: undefined,
      maxAmount: undefined,
      sortBy: "newest",
    })
    setPage(1)
  }

  const hasActiveFilters =
    Boolean(filters.search) ||
    Boolean(filters.categoryId) ||
    Boolean(filters.paymentMethod) ||
    Boolean(filters.paymentStatus) ||
    Boolean(filters.paidTo) ||
    Boolean(filters.dateFrom) ||
    Boolean(filters.dateTo) ||
    Boolean(filters.minAmount) ||
    Boolean(filters.maxAmount) ||
    filters.sortBy !== "newest"

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header & Quick Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Personal Expenses
            </h1>
            <Badge variant="outline" className="text-xs font-medium text-primary border-primary/20 bg-primary/5">
              Personal Diary
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Track your personal and household spending. Keep all your bills organized in one place.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => setAddExpenseModalOpen(true)}
            size="sm"
            className="rounded-xl px-4 shadow-sm font-semibold"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Add Expense
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setQuickUploadModalOpen(true)}
            className="rounded-xl px-3.5 shadow-2xs font-medium"
          >
            <UploadCloud className="mr-1.5 h-4 w-4 text-primary" />
            Upload Bill
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setReportModalOpen(true)}
            className="rounded-xl px-3.5 shadow-2xs font-medium"
          >
            <Download className="mr-1.5 h-4 w-4 text-emerald-600" />
            Download Report
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSettingsModalOpen(true)}
            title="Personal Expense Settings"
            className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground"
          >
            <Settings2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 2. Top Summary Cards (Dynamic) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <StatCard
          title="This Month"
          value={`₹${(stats?.thisMonthTotal || 0).toLocaleString("en-IN")}`}
          icon={Calendar}
          isLoading={statsLoading}
        />
        <StatCard
          title="This Year"
          value={`₹${(stats?.thisYearTotal || 0).toLocaleString("en-IN")}`}
          icon={TrendingUp}
          isLoading={statsLoading}
        />
        <StatCard
          title="Today"
          value={`₹${(stats?.todayTotal || 0).toLocaleString("en-IN")}`}
          icon={Clock}
          isLoading={statsLoading}
        />
        <StatCard
          title="Pending / Unpaid"
          value={`₹${(stats?.pendingUnpaidTotal || 0).toLocaleString("en-IN")}`}
          icon={AlertCircle}
          iconClassName="text-amber-600 bg-amber-500/10 ring-amber-500/20"
          isLoading={statsLoading}
        />
      </div>

      {/* 3. Monthly Summary with Month Navigation */}
      <Card className="rounded-2xl border shadow-xs overflow-hidden">
        <CardHeader className="p-4 sm:p-5 border-b bg-muted/15 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-background border rounded-xl p-1 shadow-2xs">
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePrevMonth}
                className="h-7 w-7 rounded-lg"
                title="Previous Month"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs sm:text-sm font-bold px-2 tabular-nums">
                {monthlySummary?.monthLabel || `${navMonth}/${navYear}`}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNextMonth}
                className="h-7 w-7 rounded-lg"
                title="Next Month"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <span className="text-xs text-muted-foreground hidden md:inline">
              Monthly overview & daily averages
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setReportModalOpen(true)
              }}
              className="h-8 text-xs rounded-xl"
            >
              <Download className="h-3.5 w-3.5 mr-1 text-primary" />
              Monthly PDF Report
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 divide-y md:divide-y-0 md:divide-x divide-border">
            <div className="pt-2 md:pt-0 pr-2 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Total Spent
              </p>
              <p className="text-xl sm:text-2xl font-extrabold text-foreground tabular-nums">
                {summaryLoading
                  ? "..."
                  : `₹${(monthlySummary?.totalSpent || 0).toLocaleString("en-IN")}`}
              </p>
            </div>

            <div className="pt-2 md:pt-0 md:pl-4 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Transactions
              </p>
              <p className="text-xl sm:text-2xl font-extrabold text-foreground tabular-nums">
                {summaryLoading ? "..." : monthlySummary?.transactionCount || 0}
              </p>
            </div>

            <div className="pt-2 md:pt-0 md:pl-4 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Avg Daily Spend
              </p>
              <p className="text-xl sm:text-2xl font-extrabold text-foreground tabular-nums">
                {summaryLoading
                  ? "..."
                  : `₹${Math.round(monthlySummary?.averageDailySpend || 0).toLocaleString("en-IN")}`}
              </p>
            </div>

            <div className="pt-2 md:pt-0 md:pl-4 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground truncate">
                Largest Expense
              </p>
              <p className="text-xl sm:text-2xl font-extrabold text-foreground tabular-nums truncate">
                {summaryLoading
                  ? "..."
                  : `₹${(monthlySummary?.largestExpense || 0).toLocaleString("en-IN")}`}
              </p>
              {monthlySummary?.largestExpenseDescription && (
                <p className="text-[11px] text-muted-foreground truncate" title={monthlySummary.largestExpenseDescription}>
                  {monthlySummary.largestExpenseDescription}
                </p>
              )}
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6 pt-6 border-t">
            {/* Spending Trend Chart */}
            <div className="lg:col-span-2 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Annual Spending Trend ({navYear})
                </p>
                <span className="text-[11px] text-muted-foreground">Actual DB data</span>
              </div>
              <div className="h-[180px] w-full pt-2">
                {yearlyTrendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={yearlyTrendData}
                      margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="expArea" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#4f46e5" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="monthName"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                        tickFormatter={(v) => `₹${v >= 1000 ? `${Math.round(v / 1000)}k` : v}`}
                      />
                      <RechartsTooltip
                        formatter={(val: any) => [`₹${Number(val).toLocaleString("en-IN")}`, "Spent"]}
                        contentStyle={{
                          borderRadius: "8px",
                          border: "1px solid var(--border)",
                          fontSize: "12px",
                          backgroundColor: "var(--background)",
                          color: "var(--foreground)",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="totalAmount"
                        stroke="#4f46e5"
                        strokeWidth={2}
                        fill="url(#expArea)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                    No expense data for this year
                  </div>
                )}
              </div>
            </div>

            {/* Category Breakdown list */}
            <div className="space-y-2 border-t lg:border-t-0 lg:border-l lg:pl-6 pt-4 lg:pt-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Top Categories this month
              </p>
              {monthlySummary?.categoryBreakdown && monthlySummary.categoryBreakdown.length > 0 ? (
                <div className="space-y-2.5 pt-1">
                  {monthlySummary.categoryBreakdown.slice(0, 5).map((cat) => (
                    <div key={cat.categoryName} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-foreground truncate max-w-[130px]">
                          {cat.categoryName}
                        </span>
                        <span className="font-semibold tabular-nums text-foreground">
                          ₹{cat.totalAmount.toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, Math.max(3, cat.percentage))}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic py-8 text-center">
                  No category expenses recorded this month
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. Filter & Search Toolbar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search description, merchant, category, notes, PE-number…"
              value={filters.search || ""}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, search: e.target.value }))
                setPage(1)
              }}
              className="pl-9 text-xs sm:text-sm rounded-xl"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {/* Category Quick Filter */}
            <Select
              value={filters.categoryId || "all"}
              onValueChange={(val) => {
                setFilters((prev) => ({
                  ...prev,
                  categoryId: !val || val === "all" ? undefined : val,
                }))
                setPage(1)
              }}
            >
              <SelectTrigger className="w-[140px] text-xs rounded-xl">
                <SelectValue placeholder="All Categories">
                  {(val) => {
                    if (!val || val === "all") return "All Categories"
                    const c = categories.find((x) => x.id === val)
                    return c ? c.name : "All Categories"
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Payment Status Quick Filter */}
            <Select
              value={filters.paymentStatus || "all"}
              onValueChange={(val) => {
                setFilters((prev) => ({
                  ...prev,
                  paymentStatus: !val || val === "all" ? undefined : (val as PersonalPaymentStatus),
                }))
                setPage(1)
              }}
            >
              <SelectTrigger className="w-[120px] text-xs rounded-xl">
                <SelectValue placeholder="All Status">
                  {(val) => (!val || val === "all" ? "All Status" : val)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Paid">Paid</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Partially Paid">Partially Paid</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort Dropdown */}
            <Select
              value={filters.sortBy || "newest"}
              onValueChange={(val) => {
                if (val) {
                  setFilters((prev) => ({
                    ...prev,
                    sortBy: val as PersonalExpenseFilters["sortBy"],
                  }))
                }
              }}
            >
              <SelectTrigger className="w-[130px] text-xs rounded-xl">
                <ArrowUpDown className="h-3.5 w-3.5 mr-1" />
                <SelectValue placeholder="Sort by">
                  {(val) => {
                    if (val === "newest") return "Newest First"
                    if (val === "oldest") return "Oldest First"
                    if (val === "highest") return "Highest Amount"
                    if (val === "lowest") return "Lowest Amount"
                    return "Sort by"
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="highest">Highest Amount</SelectItem>
                <SelectItem value="lowest">Lowest Amount</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`rounded-xl h-9 text-xs px-2.5 ${showAdvancedFilters ? "bg-muted" : ""}`}
              title="Toggle more filters"
            >
              <Filter className="h-3.5 w-3.5" />
            </Button>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-xs text-muted-foreground hover:text-foreground h-9 px-2.5 rounded-xl"
                title="Clear all filters"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1" />
                Reset
              </Button>
            )}

            {/* Export buttons */}
            <div className="flex items-center gap-1 border-l pl-2 ml-1">
              <Button
                variant="outline"
                size="sm"
                onClick={handleQuickExportCsv}
                className="h-9 text-xs rounded-xl px-2.5"
                title="Export current page to CSV"
              >
                CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleQuickExportExcel}
                className="h-9 text-xs rounded-xl px-2.5"
                title="Export current page to Excel"
              >
                Excel
              </Button>
            </div>
          </div>
        </div>

        {/* Advanced Filters Expandable Row */}
        {showAdvancedFilters && (
          <div className="p-3.5 rounded-xl border bg-muted/20 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold">Date From</Label>
              <Input
                type="date"
                value={filters.dateFrom || ""}
                onChange={(e) => {
                  setFilters((prev) => ({ ...prev, dateFrom: e.target.value }))
                  setPage(1)
                }}
                className="text-xs h-8"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] font-semibold">Date To</Label>
              <Input
                type="date"
                value={filters.dateTo || ""}
                onChange={(e) => {
                  setFilters((prev) => ({ ...prev, dateTo: e.target.value }))
                  setPage(1)
                }}
                className="text-xs h-8"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] font-semibold">Payment Method</Label>
              <Select
                value={filters.paymentMethod || "all"}
                onValueChange={(val) => {
                  setFilters((prev) => ({
                    ...prev,
                    paymentMethod: !val || val === "all" ? undefined : val,
                  }))
                  setPage(1)
                }}
              >
                <SelectTrigger className="text-xs h-8">
                  <SelectValue placeholder="All Methods">
                    {(val) => (!val || val === "all" ? "All Methods" : val)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  {(settings?.custom_payment_methods || ["Cash", "UPI", "Credit Card", "Debit Card"]).map((pm) => (
                    <SelectItem key={pm} value={pm}>
                      {pm}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] font-semibold">Merchant / Paid To</Label>
              <Input
                placeholder="e.g. Swiggy, Amazon"
                value={filters.paidTo || ""}
                onChange={(e) => {
                  setFilters((prev) => ({ ...prev, paidTo: e.target.value }))
                  setPage(1)
                }}
                className="text-xs h-8"
              />
            </div>
          </div>
        )}
      </div>

      {/* 5. Personal Expenses List & Table */}
      <Card className="rounded-2xl border shadow-xs overflow-hidden">
        <div className="p-4 sm:px-6 border-b flex items-center justify-between bg-muted/15">
          <div className="flex items-center gap-2">
            <h2 className="text-sm sm:text-base font-bold text-foreground">
              Expense Records
            </h2>
            <Badge variant="secondary" className="text-xs font-semibold tabular-nums">
              {totalExpenses} total
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:inline">Rows:</span>
            <Select
              value={String(pageSize)}
              onValueChange={(val) => {
                setPageSize(Number(val))
                setPage(1)
              }}
            >
              <SelectTrigger className="w-[72px] h-8 text-xs rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {listLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2.5 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-xs sm:text-sm">Loading personal expenses…</p>
          </div>
        ) : expenses.length === 0 ? (
          <div className="p-8 sm:p-12 text-center">
            <EmptyState
              icon={WalletCards}
              title={hasActiveFilters ? "No matching expenses found" : "No personal expenses yet"}
              description={
                hasActiveFilters
                  ? "Try clearing your search query or adjusting your filters."
                  : "Start tracking your personal spending and keep all your bills organized in one place."
              }
              action={
                hasActiveFilters ? (
                  <Button variant="outline" size="sm" onClick={clearFilters} className="rounded-xl">
                    Clear Filters
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => setAddExpenseModalOpen(true)}
                    className="rounded-xl px-4 font-semibold"
                  >
                    <Plus className="mr-1.5 h-4 w-4" />
                    Add Your First Expense
                  </Button>
                )
              }
            />
          </div>
        ) : (
          <>
            {/* Desktop Table View (Hidden on mobile) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b bg-muted/30 text-muted-foreground font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Expense No</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4">Paid To</th>
                    <th className="py-3 px-4">Method</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Receipts</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {expenses.map((exp) => {
                    const isPaid = exp.payment_status === "Paid"
                    const docs = exp.documents || []

                    return (
                      <tr
                        key={exp.id}
                        className="hover:bg-muted/30 transition-colors cursor-pointer group"
                        onClick={() => {
                          setViewExpense(exp)
                          setViewDialogOpen(true)
                        }}
                      >
                        <td className="py-3 px-4 text-foreground whitespace-nowrap font-medium">
                          {exp.expense_date}
                        </td>

                        <td className="py-3 px-4 font-mono font-bold text-primary whitespace-nowrap">
                          {exp.expense_number}
                        </td>

                        <td className="py-3 px-4 max-w-[150px]">
                          <div className="flex flex-col">
                            <span className="font-semibold text-foreground truncate">
                              {exp.category_name}
                            </span>
                            {exp.subcategory_name && (
                              <span className="text-[10px] text-muted-foreground truncate">
                                ↳ {exp.subcategory_name}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-4 max-w-[200px]">
                          <p className="font-medium text-foreground truncate" title={exp.description}>
                            {exp.description}
                          </p>
                          {exp.notes && (
                            <p className="text-[10px] text-muted-foreground truncate" title={exp.notes}>
                              {exp.notes}
                            </p>
                          )}
                        </td>

                        <td className="py-3 px-4 text-foreground whitespace-nowrap">
                          {exp.paid_to || <span className="text-muted-foreground/60">—</span>}
                        </td>

                        <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                          {exp.payment_method}
                        </td>

                        <td className="py-3 px-4 text-right whitespace-nowrap font-bold text-foreground tabular-nums text-sm">
                          ₹{exp.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>

                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <Badge
                            variant={isPaid ? "default" : "outline"}
                            className={
                              isPaid
                                ? "bg-emerald-600/90 text-white text-[10px] py-0 px-2 font-semibold"
                                : "text-amber-600 border-amber-300 text-[10px] py-0 px-2 font-semibold"
                            }
                          >
                            {exp.payment_status}
                          </Badge>
                        </td>

                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          {docs.length > 0 ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setPreviewDoc(docs[0])
                                setPreviewModalOpen(true)
                              }}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                            >
                              <Paperclip className="h-3 w-3" />
                              {docs.length}
                            </button>
                          ) : (
                            <span className="text-muted-foreground/40 text-[11px]">—</span>
                          )}
                        </td>

                        <td
                          className="py-3 px-4 text-right whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
                                />
                              }
                            >
                              <MoreVertical className="h-3.5 w-3.5" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40 text-xs">
                              <DropdownMenuItem
                                onClick={() => {
                                  setViewExpense(exp)
                                  setViewDialogOpen(true)
                                }}
                              >
                                <Eye className="h-3.5 w-3.5 mr-2" />
                                View Details
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={() => {
                                  setEditExpense(exp)
                                  setAddExpenseModalOpen(true)
                                }}
                              >
                                <Edit className="h-3.5 w-3.5 mr-2" />
                                Edit
                              </DropdownMenuItem>

                              <DropdownMenuItem onClick={() => handleDuplicate(exp)}>
                                <Copy className="h-3.5 w-3.5 mr-2" />
                                Duplicate
                              </DropdownMenuItem>

                              <DropdownMenuItem onClick={() => handleDownloadSingleVoucherPdf(exp)}>
                                <Download className="h-3.5 w-3.5 mr-2" />
                                Voucher PDF
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />

                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => {
                                  setDeleteExpenseItem(exp)
                                  setDeleteModalOpen(true)
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View (Section 15 & 40) */}
            <div className="md:hidden divide-y divide-border">
              {expenses.map((exp) => {
                const isPaid = exp.payment_status === "Paid"
                const docs = exp.documents || []

                return (
                  <div
                    key={exp.id}
                    onClick={() => {
                      setViewExpense(exp)
                      setViewDialogOpen(true)
                    }}
                    className="p-4 space-y-2 hover:bg-muted/30 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-primary">
                          {exp.expense_number}
                        </span>
                        <Badge
                          variant={isPaid ? "default" : "outline"}
                          className={
                            isPaid
                              ? "bg-emerald-600/90 text-white text-[10px] py-0 px-1.5"
                              : "text-amber-600 border-amber-300 text-[10px] py-0 px-1.5"
                          }
                        >
                          {exp.payment_status}
                        </Badge>
                      </div>

                      <span className="text-base font-extrabold text-foreground tabular-nums">
                        ₹{exp.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-foreground line-clamp-1">
                        {exp.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {exp.category_name}
                        {exp.paid_to && ` · ${exp.paid_to}`}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-dashed">
                      <span>{exp.expense_date} · {exp.payment_method}</span>

                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        {docs.length > 0 && (
                          <span className="flex items-center gap-1 font-semibold text-primary">
                            <Paperclip className="h-3 w-3" />
                            {docs.length}
                          </span>
                        )}

                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-muted-foreground"
                          onClick={() => {
                            setEditExpense(exp)
                            setAddExpenseModalOpen(true)
                          }}
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>

                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-destructive"
                          onClick={() => {
                            setDeleteExpenseItem(exp)
                            setDeleteModalOpen(true)
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Pagination Controls */}
            {totalExpenses > 0 && (
              <div className="p-3 sm:px-6 border-t flex flex-col sm:flex-row items-center justify-between gap-3 bg-muted/10 text-xs">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <span>
                    Showing {Math.min((page - 1) * pageSize + 1, totalExpenses)} –{" "}
                    {Math.min(page * pageSize, totalExpenses)} of {totalExpenses} expenses
                  </span>

                  <div className="flex items-center gap-1.5 ml-2">
                    <span className="text-[11px]">Rows:</span>
                    <Select
                      value={String(pageSize)}
                      onValueChange={(val) => {
                        if (val) {
                          setPageSize(Number(val))
                          setPage(1)
                        }
                      }}
                    >
                      <SelectTrigger className="h-7 w-[68px] text-xs rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-[11px]">
                    Page {page} of {Math.max(1, totalPages)}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="h-7 text-xs rounded-lg"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      className="h-7 text-xs rounded-lg"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Modals & Dialogs */}
      {/* 1. Add / Edit Expense Modal */}
      <PersonalExpenseModal
        open={addExpenseModalOpen}
        onOpenChange={(val) => {
          setAddExpenseModalOpen(val)
          if (!val) setEditExpense(null)
        }}
        userId={userId}
        expenseToEdit={editExpense}
        categories={categories}
        paymentMethods={settings?.custom_payment_methods || ["Cash", "UPI", "Credit Card", "Debit Card", "Bank Transfer", "Cheque", "Other"]}
        existingMerchants={merchants}
        onSuccess={handleExpenseSaved}
      />

      {/* 2. Quick Upload Bill Modal */}
      <PersonalExpenseQuickUploadModal
        open={quickUploadModalOpen}
        onOpenChange={setQuickUploadModalOpen}
        userId={userId}
        categories={categories}
        paymentMethods={settings?.custom_payment_methods || ["Cash", "UPI", "Credit Card", "Debit Card", "Bank Transfer", "Cheque", "Other"]}
        existingMerchants={merchants}
        onSuccess={handleExpenseSaved}
      />

      {/* 3. View Expense Dialog */}
      <PersonalExpenseViewDialog
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        userId={userId}
        userName={userName}
        expense={viewExpense}
        onEdit={(exp) => {
          setViewDialogOpen(false)
          setEditExpense(exp)
          setAddExpenseModalOpen(true)
        }}
        onDuplicate={handleDuplicate}
        onDelete={(exp) => {
          setViewDialogOpen(false)
          setDeleteExpenseItem(exp)
          setDeleteModalOpen(true)
        }}
        onPreviewDocument={(doc) => {
          setPreviewDoc(doc)
          setPreviewModalOpen(true)
        }}
        onExpenseUpdated={handleExpenseSaved}
      />

      {/* 4. Document Preview Modal */}
      <PersonalDocumentPreviewModal
        open={previewModalOpen}
        onOpenChange={setPreviewModalOpen}
        document={previewDoc}
      />

      {/* 5. Report Generator Modal */}
      <PersonalExpenseReportModal
        open={reportModalOpen}
        onOpenChange={setReportModalOpen}
        userId={userId}
        userName={userName}
        categories={categories}
        currentFilters={filters}
      />

      {/* 6. Settings Modal */}
      <PersonalExpenseSettingsModal
        open={settingsModalOpen}
        onOpenChange={setSettingsModalOpen}
        userId={userId}
        onSettingsUpdated={() => {
          loadMasters()
        }}
      />

      {/* 7. Delete Confirmation Dialog (Section 47) */}
      <ConfirmationDialog
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        title="Delete this expense?"
        description={
          deleteExpenseItem?.documents && deleteExpenseItem.documents.length > 0
            ? `This expense has ${deleteExpenseItem.documents.length} attached document(s). Deleting the expense will also permanently remove its associated documents.`
            : `Are you sure you want to delete expense ${deleteExpenseItem?.expense_number}? This action cannot be undone.`
        }
        confirmText="Delete Expense"
        cancelText="Cancel"
        variant="destructive"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}
