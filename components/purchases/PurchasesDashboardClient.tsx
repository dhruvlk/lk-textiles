"use client"

import { useState, useEffect, useTransition, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Layers,
  Plus,
  UploadCloud,
  ShoppingBag,
  Wallet,
  BadgePercent,
  Clock,
  FolderOpen,
  Building2,
  FileCheck2,
  ArrowRight,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { StatCard } from "@/components/common/StatCard"
import { MotionStagger, MotionStaggerItem } from "@/components/common/motion"
import { EmptyState } from "@/components/common/EmptyState"
import { useCompany } from "@/components/company-provider"
import { useAuth } from "@/hooks/useAuth"
import { usePermissions } from "@/context/PermissionContext"
import { toast } from "sonner"

// Services & Types
import { getPurchasesPaginated } from "@/services/purchases.service"
import { getExpensesPaginated } from "@/services/expenses.service"
import { getSuppliers } from "@/services/suppliers.service"
import { getExpenseCategories } from "@/services/expense-categories.service"
import { getVaultDocuments } from "@/services/documents.service"
import {
  getFinancialYears,
  getPurchaseExpenseOverviewStats,
  getGstInputReport,
  getYearEndReviewData,
} from "@/services/financial-years.service"
import { formatFinancialYearCode, formatFinancialYearLabel } from "@/types"
import type {
  Expense,
  ExpenseCategory,
  ExpenseFilters,
  FinancialYear,
  GstInputReportRow,
  PaginatedResult,
  Purchase,
  PurchaseExpenseOverviewStats,
  PurchaseFilters,
  Supplier,
  VaultDocument,
  YearEndReviewData,
} from "@/types"

import { DEFAULT_TABLE_PAGE_SIZE, type TablePageSize } from "@/lib/table/pagination"

// Sub-components
import { PurchasesList } from "@/components/purchases/PurchasesList"
import { ExpensesList } from "@/components/purchases/ExpensesList"
import { DocumentVault } from "@/components/purchases/DocumentVault"
import { SuppliersManager } from "@/components/purchases/SuppliersManager"
import { GstInputView } from "@/components/purchases/GstInputView"
import { MarchClosingView } from "@/components/purchases/MarchClosingView"
import { QuickUploadModal } from "@/components/purchases/QuickUploadModal"
import { ExpenseModal } from "@/components/purchases/ExpenseModal"
import { PurchaseDetailDialog } from "@/components/purchases/PurchaseDetailDialog"
import { AddPaymentModal } from "@/components/purchases/AddPaymentModal"
import { DocumentPreviewModal } from "@/components/purchases/DocumentPreviewModal"

export default function PurchasesDashboardClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { selectedCompany } = useCompany()
  const { user } = useAuth()
  const { can } = usePermissions()
  const companyId = selectedCompany?.id

  // Active Tab from query param or state
  const initialTab = searchParams.get("tab") || "purchases"
  const [activeTab, setActiveTab] = useState<string>(initialTab)

  // Current Financial Year
  const currentFyDefault = useMemo(() => formatFinancialYearCode(new Date()), [])
  const [selectedFy, setSelectedFy] = useState<string>(currentFyDefault)

  // Overview KPIs
  const [kpis, setKpis] = useState<PurchaseExpenseOverviewStats | null>(null)
  const [isLoadingKpis, setIsLoadingKpis] = useState(true)

  // Purchases list state
  const [purchasesResult, setPurchasesResult] = useState<PaginatedResult<Purchase> | null>(null)
  const [purchaseFilters, setPurchaseFilters] = useState<PurchaseFilters>({ financialYear: selectedFy })
  const [purchasesPage, setPurchasesPage] = useState(1)
  const [purchasesPageSize, setPurchasesPageSize] = useState<TablePageSize>(DEFAULT_TABLE_PAGE_SIZE)
  const [isLoadingPurchases, setIsLoadingPurchases] = useState(true)

  // Expenses list state
  const [expensesResult, setExpensesResult] = useState<PaginatedResult<Expense> | null>(null)
  const [expenseFilters, setExpenseFilters] = useState<ExpenseFilters>({ financialYear: selectedFy })
  const [expensesPage, setExpensesPage] = useState(1)
  const [expensesPageSize, setExpensesPageSize] = useState<TablePageSize>(DEFAULT_TABLE_PAGE_SIZE)
  const [isLoadingExpenses, setIsLoadingExpenses] = useState(true)

  // Masters
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [categories, setCategories] = useState<ExpenseCategory[]>([])
  const [financialYears, setFinancialYears] = useState<FinancialYear[]>([])
  const [isLoadingMasters, setIsLoadingMasters] = useState(true)

  // Vault Documents
  const [vaultDocs, setVaultDocs] = useState<VaultDocument[]>([])
  const [isLoadingVault, setIsLoadingVault] = useState(false)

  // GST Input Report
  const [gstReportRows, setGstReportRows] = useState<GstInputReportRow[]>([])
  const [gstReportTotals, setGstReportTotals] = useState({ taxable: 0, cgst: 0, sgst: 0, igst: 0, totalGst: 0 })
  const [isLoadingGst, setIsLoadingGst] = useState(false)

  // Year End Review
  const [reviewData, setReviewData] = useState<YearEndReviewData | null>(null)
  const [isLoadingReview, setIsLoadingReview] = useState(false)

  // Modals state
  const [quickUploadOpen, setQuickUploadOpen] = useState(false)
  const [expenseModalOpen, setExpenseModalOpen] = useState(false)
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null)
  const [purchaseDetail, setPurchaseDetail] = useState<Purchase | null>(null)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [purchaseForPayment, setPurchaseForPayment] = useState<Purchase | null>(null)
  const [previewDoc, setPreviewDoc] = useState<VaultDocument | null>(null)

  // Sync FY changes
  const handleFyChange = (fy: string) => {
    setSelectedFy(fy)
    setPurchaseFilters((prev) => ({ ...prev, financialYear: fy }))
    setExpenseFilters((prev) => ({ ...prev, financialYear: fy }))
    setPurchasesPage(1)
    setExpensesPage(1)
  }

  // Load KPIs
  const loadKpis = async () => {
    if (!companyId) return
    try {
      const data = await getPurchaseExpenseOverviewStats(companyId, selectedFy)
      setKpis(data)
    } catch (err) {
      console.error("Error loading KPIs:", err)
    } finally {
      setIsLoadingKpis(false)
    }
  }

  // Load Purchases
  const loadPurchases = async () => {
    if (!companyId) return
    setIsLoadingPurchases(true)
    try {
      const res = await getPurchasesPaginated(companyId, { ...purchaseFilters, financialYear: selectedFy }, {
        page: purchasesPage,
        pageSize: purchasesPageSize,
      })
      setPurchasesResult(res)
    } catch (err) {
      console.error("Error loading purchases:", err)
    } finally {
      setIsLoadingPurchases(false)
    }
  }

  // Load Expenses
  const loadExpenses = async () => {
    if (!companyId) return
    setIsLoadingExpenses(true)
    try {
      const res = await getExpensesPaginated(companyId, { ...expenseFilters, financialYear: selectedFy }, {
        page: expensesPage,
        pageSize: expensesPageSize,
      })
      setExpensesResult(res)
    } catch (err) {
      console.error("Error loading expenses:", err)
    } finally {
      setIsLoadingExpenses(false)
    }
  }

  // Load Vault Documents
  const loadVaultDocs = async () => {
    if (!companyId) return
    setIsLoadingVault(true)
    try {
      const docs = await getVaultDocuments(companyId, { financialYear: selectedFy })
      setVaultDocs(docs)
    } catch (err) {
      console.error("Error loading vault docs:", err)
    } finally {
      setIsLoadingVault(false)
    }
  }

  // Load GST Input Report
  const loadGstReport = async () => {
    if (!companyId) return
    setIsLoadingGst(true)
    try {
      const res = await getGstInputReport(companyId, { financialYear: selectedFy })
      setGstReportRows(res.rows)
      setGstReportTotals(res.totals)
    } catch (err) {
      console.error("Error loading GST report:", err)
    } finally {
      setIsLoadingGst(false)
    }
  }

  // Load Year-End Review
  const loadYearEndReview = async () => {
    if (!companyId) return
    setIsLoadingReview(true)
    try {
      const data = await getYearEndReviewData(companyId, selectedFy)
      setReviewData(data)
    } catch (err) {
      console.error("Error loading review data:", err)
    } finally {
      setIsLoadingReview(false)
    }
  }

  // Load Masters (Suppliers, Categories, FY list)
  const loadMasters = async () => {
    if (!companyId) return
    try {
      const [sup, cat, fy] = await Promise.all([
        getSuppliers(companyId),
        getExpenseCategories(companyId),
        getFinancialYears(companyId),
      ])
      setSuppliers(sup)
      setCategories(cat)
      setFinancialYears(fy)
    } catch (err) {
      console.error("Error loading masters:", err)
    } finally {
      setIsLoadingMasters(false)
    }
  }

  // Initial and reactive effects
  useEffect(() => {
    if (!companyId) return
    void loadMasters()
    void loadKpis()
    void loadPurchases()
    void loadExpenses()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, selectedFy])

  useEffect(() => {
    void loadPurchases()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [purchasesPage, purchasesPageSize, purchaseFilters])

  useEffect(() => {
    void loadExpenses()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expensesPage, expensesPageSize, expenseFilters])

  // Lazy load tab data
  useEffect(() => {
    if (activeTab === "vault") {
      void loadVaultDocs()
    } else if (activeTab === "gst") {
      void loadGstReport()
    } else if (activeTab === "march") {
      void loadYearEndReview()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, selectedFy])

  const availableFinancialYears = useMemo(() => {
    const list = financialYears.map((f) => f.year_label)
    if (!list.includes(currentFyDefault)) list.unshift(currentFyDefault)
    return Array.from(new Set(list))
  }, [financialYears, currentFyDefault])

  if (!selectedCompany) {
    return (
      <EmptyState
        icon={Building2}
        title="Workspace not selected"
        description="Please select a company to manage purchases and expenses."
      />
    )
  }

  const activeCompanyId = selectedCompany.id

  return (
    <div className="space-y-6 pb-16">
      {/* Top Section / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              Accounting & Supply Chain
            </span>
            <span className="text-xs text-muted-foreground">· {formatFinancialYearLabel(selectedFy)}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Expenses & Purchases
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Track purchases, company expenses, GST input credit, and business documents.
          </p>
        </div>

        {/* 3 Main Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 sm:self-center">
          <Button
            onClick={() => router.push("/admin/purchases/new")}
            className="rounded-xl shadow-xs"
          >
            <Plus className="h-4 w-4 mr-1.5" /> Add Purchase
          </Button>

          <Button
            variant="outline"
            onClick={() => {
              setExpenseToEdit(null)
              setExpenseModalOpen(true)
            }}
            className="rounded-xl"
          >
            <Wallet className="h-4 w-4 mr-1.5" /> Add Expense
          </Button>

          <Button
            variant="outline"
            onClick={() => setQuickUploadOpen(true)}
            className="rounded-xl"
          >
            <UploadCloud className="h-4 w-4 mr-1.5" /> Upload Bill
          </Button>
        </div>
      </div>

      {/* 4 KPI Cards (Dynamic Values) */}
      <MotionStagger className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MotionStaggerItem>
          <StatCard
            title="Total Purchases"
            value={
              isLoadingKpis
                ? "..."
                : `₹${(kpis?.totalPurchases ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
            }
            icon={ShoppingBag}
            iconClassName="bg-sky-500/10 ring-sky-500/15 [&_svg]:text-sky-600"
            isLoading={isLoadingKpis}
          />
        </MotionStaggerItem>

        <MotionStaggerItem>
          <StatCard
            title="Total Expenses"
            value={
              isLoadingKpis
                ? "..."
                : `₹${(kpis?.totalExpenses ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
            }
            icon={Wallet}
            iconClassName="bg-amber-500/10 ring-amber-500/15 [&_svg]:text-amber-600"
            isLoading={isLoadingKpis}
          />
        </MotionStaggerItem>

        <MotionStaggerItem>
          <StatCard
            title="Input GST (ITC)"
            value={
              isLoadingKpis
                ? "..."
                : `₹${(kpis?.inputGst ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
            }
            icon={BadgePercent}
            iconClassName="bg-emerald-500/10 ring-emerald-500/15 [&_svg]:text-emerald-600"
            isLoading={isLoadingKpis}
          />
        </MotionStaggerItem>

        <MotionStaggerItem>
          <StatCard
            title="Pending Bills"
            value={isLoadingKpis ? "..." : kpis?.pendingBills ?? 0}
            icon={Clock}
            iconClassName="bg-rose-500/10 ring-rose-500/15 [&_svg]:text-rose-600"
            isLoading={isLoadingKpis}
          />
        </MotionStaggerItem>
      </MotionStagger>

      {/* Tabbed Navigation Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-border/80 pb-2 scrollbar-none">
        {[
          { id: "purchases", label: "Purchases", icon: ShoppingBag, count: purchasesResult?.total },
          { id: "expenses", label: "Expenses", icon: Wallet, count: expensesResult?.total },
          { id: "vault", label: "Document Vault", icon: FolderOpen },
          { id: "suppliers", label: "Suppliers", icon: Building2, count: suppliers.length },
          { id: "gst", label: "Input GST (ITC)", icon: BadgePercent },
          { id: "march", label: "March / Year Closing", icon: FileCheck2 },
        ].map((tab) => {
          const active = activeTab === tab.id
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                active
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    active ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Active Tab Views */}
      <div className="pt-1">
        {activeTab === "purchases" && (
          <PurchasesList
            companyId={activeCompanyId}
            purchasesResult={purchasesResult}
            isLoading={isLoadingPurchases}
            filters={purchaseFilters}
            onFiltersChange={(patch) => setPurchaseFilters((prev) => ({ ...prev, ...patch }))}
            page={purchasesPage}
            pageSize={purchasesPageSize}
            onPageChange={setPurchasesPage}
            onPageSizeChange={setPurchasesPageSize}
            onRefresh={() => {
              void loadPurchases()
              void loadKpis()
            }}
            onViewPurchase={(p) => setPurchaseDetail(p)}
            onAddPayment={(p) => {
              setPurchaseForPayment(p)
              setPaymentModalOpen(true)
            }}
            onPreviewDocument={(doc) => setPreviewDoc(doc)}
          />
        )}

        {activeTab === "expenses" && (
          <ExpensesList
            companyId={activeCompanyId}
            expensesResult={expensesResult}
            isLoading={isLoadingExpenses}
            categories={categories}
            filters={expenseFilters}
            onFiltersChange={(patch) => setExpenseFilters((prev) => ({ ...prev, ...patch }))}
            page={expensesPage}
            pageSize={expensesPageSize}
            onPageChange={setExpensesPage}
            onPageSizeChange={setExpensesPageSize}
            onRefresh={() => {
              void loadExpenses()
              void loadKpis()
            }}
            onAddExpense={() => {
              setExpenseToEdit(null)
              setExpenseModalOpen(true)
            }}
            onEditExpense={(exp) => {
              setExpenseToEdit(exp)
              setExpenseModalOpen(true)
            }}
            onPreviewDocument={(doc) => setPreviewDoc(doc)}
          />
        )}

        {activeTab === "vault" && (
          <DocumentVault
            companyId={activeCompanyId}
            documents={vaultDocs}
            isLoading={isLoadingVault}
            financialYear={selectedFy}
            availableFinancialYears={availableFinancialYears}
            onFinancialYearChange={handleFyChange}
            onRefresh={() => void loadVaultDocs()}
            onPreviewDocument={(doc) => setPreviewDoc(doc)}
            onOpenQuickUpload={() => setQuickUploadOpen(true)}
          />
        )}

        {activeTab === "suppliers" && (
          <SuppliersManager
            companyId={activeCompanyId}
            suppliers={suppliers}
            isLoading={isLoadingMasters}
            onRefresh={() => void loadMasters()}
          />
        )}

        {activeTab === "gst" && (
          <GstInputView
            companyName={selectedCompany.name}
            rows={gstReportRows}
            totals={gstReportTotals}
            isLoading={isLoadingGst}
            financialYear={selectedFy}
            availableFinancialYears={availableFinancialYears}
            onFinancialYearChange={handleFyChange}
          />
        )}

        {activeTab === "march" && (
          <MarchClosingView
            companyId={activeCompanyId}
            financialYears={financialYears}
            currentYearLabel={selectedFy}
            reviewData={reviewData}
            isLoading={isLoadingReview}
            userId={user?.id}
            onFinancialYearChange={handleFyChange}
            onRefresh={() => {
              void loadMasters()
              void loadYearEndReview()
              void loadKpis()
            }}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        )}
      </div>

      {/* Global Modals */}

      {/* 1. Quick Upload Modal */}
      <QuickUploadModal
        open={quickUploadOpen}
        onOpenChange={setQuickUploadOpen}
        companyId={activeCompanyId}
        suppliers={suppliers}
        userId={user?.id}
        onSuccess={() => {
          void loadVaultDocs()
          void loadPurchases()
          void loadExpenses()
          void loadKpis()
        }}
      />

      {/* 2. Expense Modal */}
      <ExpenseModal
        open={expenseModalOpen}
        onOpenChange={setExpenseModalOpen}
        companyId={activeCompanyId}
        categories={categories}
        suppliers={suppliers}
        expenseToEdit={expenseToEdit}
        userId={user?.id}
        onSuccess={() => {
          void loadExpenses()
          void loadKpis()
        }}
        onCategoryAdded={(newCat) => setCategories((prev) => [newCat, ...prev])}
      />

      {/* 3. Purchase Details Dialog */}
      <PurchaseDetailDialog
        open={Boolean(purchaseDetail)}
        onOpenChange={(open) => !open && setPurchaseDetail(null)}
        purchase={purchaseDetail}
        onPreviewDocument={(doc) => setPreviewDoc(doc)}
        onAddPayment={(p) => {
          setPurchaseForPayment(p)
          setPaymentModalOpen(true)
        }}
      />

      {/* 4. Add Payment Modal */}
      <AddPaymentModal
        open={paymentModalOpen}
        onOpenChange={setPaymentModalOpen}
        companyId={activeCompanyId}
        purchase={purchaseForPayment}
        userId={user?.id}
        onSuccess={() => {
          void loadPurchases()
          void loadKpis()
          if (purchaseDetail && purchaseForPayment && purchaseDetail.id === purchaseForPayment.id) {
            void getPurchasesPaginated(activeCompanyId, { financialYear: selectedFy }).then((res) => {
              const updated = res.data.find((p) => p.id === purchaseDetail.id)
              if (updated) setPurchaseDetail(updated)
            })
          }
        }}
      />

      {/* 5. Document Preview Modal */}
      <DocumentPreviewModal
        open={Boolean(previewDoc)}
        onOpenChange={(open) => !open && setPreviewDoc(null)}
        document={previewDoc}
      />
    </div>
  )
}
