"use client"
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useMemo, useState, useTransition } from "react"
import {
  Banknote,
  Boxes,
  Download,
  FileSpreadsheet,
  FileText,
  IndianRupee,
  PackageOpen,
  PieChart as PieChartIcon,
  Receipt,
  TriangleAlert,
  Truck,
  Users,
  Wallet,
  Warehouse,
} from "lucide-react"
import { toast } from "sonner"
import { useCompany } from "@/components/company-provider"
import { usePermissions } from "@/context/PermissionContext"
import { PageHeader } from "@/components/common/PageHeader"
import { EmptyState } from "@/components/common/EmptyState"
import { StatCard } from "@/components/common/StatCard"
import { MotionStagger, MotionStaggerItem } from "@/components/common/motion"
import { ReportFiltersBar } from "@/components/reports/ReportFiltersBar"
import { ReportCharts } from "@/components/reports/ReportCharts"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { DataTable } from "@/components/tables/DataTable"
import { formatCurrency } from "@/lib/payment-status"
import { PERIOD_PRESET_LABELS } from "@/lib/reports/date-ranges"
import { downloadBlobFile, downloadCsv, downloadExcel } from "@/lib/reports/export"
import { getReportsBundle } from "@/services/reports.service"
import type {
  CustomerReportRow,
  QualityReportRow,
  ReportFilters,
  ReportsBundle,
} from "@/types/reports"
import { ReportsPDF } from "@/components/pdf/ReportsPDF"

const DEFAULT_FILTERS: ReportFilters = {
  period: "this_month",
  search: "",
}

function formatCompact(value: number) {
  return formatCurrency(value)
}

export default function ReportsClient() {
  const { selectedCompany } = useCompany()
  const { can } = usePermissions()
  const companyId = selectedCompany?.id
  const [filters, setFilters] = useState<ReportFilters>(DEFAULT_FILTERS)
  const [bundle, setBundle] = useState<ReportsBundle | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  const load = useCallback(async () => {
    if (!companyId) return
    const isFirst = bundle === null
    if (isFirst) setIsLoading(true)
    try {
      const data = await getReportsBundle(companyId, filters)
      startTransition(() => setBundle(data))
    } catch {
      toast.error("Failed to load reports")
    } finally {
      setIsLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, companyId])

  useEffect(() => {
    if (!companyId) return
    let cancelled = false
    setIsLoading((prev) => (bundle === null ? true : prev))

    void getReportsBundle(companyId, filters)
      .then((data) => {
        if (!cancelled) startTransition(() => setBundle(data))
      })
      .catch(() => {
        if (!cancelled) toast.error("Failed to load reports")
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, filters])

  const handleExport = async (type: "csv" | "excel" | "pdf") => {
    if (!bundle || !selectedCompany) return

    const stamp = new Date().toISOString().slice(0, 10)
    const periodLabel = PERIOD_PRESET_LABELS[filters.period]
    const title = `${selectedCompany.name} Reports`

    if (type === "pdf") {
      try {
        toast.info("Generating PDF...", { id: "reports-pdf" })
        const { pdf } = await import("@react-pdf/renderer")
        const blob = await pdf(
          <ReportsPDF
            title={title}
            companyName={selectedCompany.name}
            periodLabel={periodLabel}
            lines={[
              { label: "Today's Sales", value: formatCompact(bundle.kpis.todaySales) },
              { label: "This Week's Sales", value: formatCompact(bundle.kpis.weekSales) },
              { label: "This Month's Sales", value: formatCompact(bundle.kpis.monthSales) },
              { label: "This Year's Sales", value: formatCompact(bundle.kpis.yearSales) },
              { label: "Total Sales", value: formatCompact(bundle.kpis.totalSales) },
              { label: "Pending Payments", value: formatCompact(bundle.kpis.pendingPayments) },
              { label: "Received Payments", value: formatCompact(bundle.kpis.receivedPayments) },
              { label: "Total Invoices", value: String(bundle.kpis.totalInvoices) },
              {
                label: "Delivery Challans",
                value: String(bundle.kpis.totalDeliveryChallans),
              },
              { label: "Total Customers", value: String(bundle.kpis.totalCustomers) },
              {
                label: "Available Stock",
                value: String(bundle.kpis.totalAvailableStock),
              },
              {
                label: "Period Sales",
                value: formatCompact(bundle.periodSummary.salesAmount),
              },
              {
                label: "Pieces / MTS / Weight",
                value: `${bundle.periodSummary.piecesSold} / ${bundle.periodSummary.metersSold.toFixed(2)} / ${bundle.periodSummary.weightSold.toFixed(2)}`,
              },
              {
                label: "Collection %",
                value: `${bundle.payments.collectionPercent.toFixed(1)}%`,
              },
            ]}
          />
        ).toBlob()

        downloadBlobFile(`reports-${stamp}.pdf`, blob)
        toast.success("PDF downloaded successfully.", { id: "reports-pdf" })
      } catch (error) {
        console.error("Reports PDF export failed:", error)
        toast.error("Failed to generate PDF. Please try again.", { id: "reports-pdf" })
      }
      return
    }

    const headers = [
      "Section",
      "Name",
      "Metric1",
      "Metric2",
      "Metric3",
      "Metric4",
      "Metric5",
    ]
    const rows: Array<Array<unknown>> = [
      ["KPI", "Today Sales", bundle.kpis.todaySales, "", "", "", ""],
      ["KPI", "Week Sales", bundle.kpis.weekSales, "", "", "", ""],
      ["KPI", "Month Sales", bundle.kpis.monthSales, "", "", "", ""],
      ["KPI", "Year Sales", bundle.kpis.yearSales, "", "", "", ""],
      ["KPI", "Total Sales", bundle.kpis.totalSales, "", "", "", ""],
      ...bundle.monthlySales.map((row) => [
        "Monthly",
        row.label,
        row.sales,
        row.deliveries,
        "",
        "",
        "",
      ]),
      ...bundle.yearlySales.map((row) => [
        "Yearly",
        row.year,
        row.sales,
        row.deliveries,
        "",
        "",
        "",
      ]),
      ...bundle.customers.map((row) => [
        "Customer",
        row.customerName,
        row.totalOrders,
        row.totalSales,
        row.pendingAmount,
        row.lastPurchaseDate,
        "",
      ]),
      ...bundle.qualities.map((row) => [
        "Quality",
        row.qualityName,
        row.totalDelivered,
        row.totalMeters,
        row.totalWeight,
        row.totalSales,
        "",
      ]),
    ]

    if (type === "excel") {
      downloadExcel(`reports-${stamp}`, headers, rows)
    } else {
      downloadCsv(`reports-${stamp}.csv`, headers, rows)
    }
    toast.success("Report exported")
  }

  const customerColumns = useMemo(
    () => [
      {
        header: "Customer",
        accessorKey: "customerName" as keyof CustomerReportRow,
        className: "font-medium",
      },
      {
        header: "Orders",
        cell: (row: CustomerReportRow) => (
          <span className="tabular-nums">{row.totalOrders}</span>
        ),
      },
      {
        header: "Total Sales",
        cell: (row: CustomerReportRow) => (
          <span className="tabular-nums">{formatCompact(row.totalSales)}</span>
        ),
      },
      {
        header: "Pending",
        cell: (row: CustomerReportRow) => (
          <span className="tabular-nums">{formatCompact(row.pendingAmount)}</span>
        ),
      },
      {
        header: "Last Purchase",
        cell: (row: CustomerReportRow) => row.lastPurchaseDate || "—",
      },
    ],
    []
  )

  const qualityColumns = useMemo(
    () => [
      {
        header: "Quality",
        accessorKey: "qualityName" as keyof QualityReportRow,
        className: "font-medium",
      },
      {
        header: "Delivered",
        cell: (row: QualityReportRow) => (
          <span className="tabular-nums">{row.totalDelivered}</span>
        ),
      },
      {
        header: "Total MTS",
        cell: (row: QualityReportRow) => (
          <span className="tabular-nums">{row.totalMeters.toFixed(2)}</span>
        ),
      },
      {
        header: "Total Weight",
        cell: (row: QualityReportRow) => (
          <span className="tabular-nums">{row.totalWeight.toFixed(2)}</span>
        ),
      },
      {
        header: "Sales (est.)",
        cell: (row: QualityReportRow) => (
          <span className="tabular-nums">{formatCompact(row.totalSales)}</span>
        ),
      },
    ],
    []
  )

  if (!selectedCompany) {
    return (
      <EmptyState
        icon={PieChartIcon}
        title="Select a company"
        description="Choose a company from the header to view reports and analytics."
      />
    )
  }

  const kpis = bundle?.kpis
  const summary = bundle?.periodSummary
  const payments = bundle?.payments
  const stock = bundle?.stock
  const showLoading = isLoading && !bundle

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Analytics"
        title="Reports"
        description={`Business insights for ${selectedCompany.name}`}
        action={
          can("reports", "export") ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="outline" disabled={!bundle} className="gap-2" />
                }
              >
                <Download className="h-4 w-4" />
                Export
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExport("pdf")}>
                  <FileText className="mr-2 h-4 w-4" />
                  PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("excel")}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("csv")}>
                  <Download className="mr-2 h-4 w-4" />
                  CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : undefined
        }
      />

      <ReportFiltersBar
        filters={filters}
        onChange={setFilters}
        customers={bundle?.filterOptions.customers ?? []}
        qualities={bundle?.filterOptions.qualities ?? []}
        brokers={bundle?.filterOptions.brokers ?? []}
      />

      <MotionStagger className="grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[
          { title: "Today's Sales", value: kpis?.todaySales, icon: IndianRupee },
          { title: "This Week's Sales", value: kpis?.weekSales, icon: IndianRupee },
          { title: "This Month's Sales", value: kpis?.monthSales, icon: IndianRupee },
          { title: "This Year's Sales", value: kpis?.yearSales, icon: IndianRupee },
          { title: "Total Sales", value: kpis?.totalSales, icon: Banknote },
          { title: "Pending Payments", value: kpis?.pendingPayments, icon: Wallet },
          { title: "Received Payments", value: kpis?.receivedPayments, icon: Receipt },
          { title: "Total Customers", value: kpis?.totalCustomers, icon: Users, plain: true },
          {
            title: "Delivery Challans",
            value: kpis?.totalDeliveryChallans,
            icon: Truck,
            plain: true,
          },
          { title: "Total Invoices", value: kpis?.totalInvoices, icon: FileText, plain: true },
          {
            title: "Available Stock",
            value: kpis?.totalAvailableStock,
            icon: PackageOpen,
            plain: true,
          },
        ].map((card) => (
          <MotionStaggerItem key={card.title} className="h-full">
            <StatCard
              title={card.title}
              value={
                showLoading
                  ? "—"
                  : card.plain
                    ? (card.value ?? 0)
                    : formatCompact(Number(card.value ?? 0))
              }
              icon={card.icon}
              isLoading={showLoading || isPending}
              trendLabel="Live"
              trendDirection="neutral"
            />
          </MotionStaggerItem>
        ))}
      </MotionStagger>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Sales — {PERIOD_PRESET_LABELS[filters.period]}</CardTitle>
            <CardDescription>
              Filtered sales and delivery volume for the selected period.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {showLoading ? (
              <div className="grid gap-3 sm:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-3">
                <SummaryMetric label="Total Sales" value={formatCompact(summary?.salesAmount ?? 0)} />
                <SummaryMetric label="Delivery Challans" value={summary?.deliveryChallans ?? 0} />
                <SummaryMetric label="Invoices" value={summary?.invoices ?? 0} />
                <SummaryMetric label="Pieces Sold" value={summary?.piecesSold ?? 0} />
                <SummaryMetric
                  label="MTS Sold"
                  value={(summary?.metersSold ?? 0).toFixed(2)}
                />
                <SummaryMetric
                  label="Weight Sold"
                  value={(summary?.weightSold ?? 0).toFixed(2)}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payments</CardTitle>
            <CardDescription>Collection health for filtered invoices.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <SummaryMetric label="Received" value={formatCompact(payments?.totalReceived ?? 0)} />
            <SummaryMetric label="Pending" value={formatCompact(payments?.totalPending ?? 0)} />
            <SummaryMetric
              label="Collection %"
              value={`${(payments?.collectionPercent ?? 0).toFixed(1)}%`}
            />
            <div className="grid grid-cols-2 gap-2 pt-2 text-sm">
              <StatusChip label="Paid" value={payments?.paidCount ?? 0} />
              <StatusChip label="Pending" value={payments?.pendingCount ?? 0} />
              <StatusChip label="Partial" value={payments?.partiallyPaidCount ?? 0} />
              <StatusChip label="Overdue" value={payments?.overdueCount ?? 0} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Sales</CardTitle>
            <CardDescription>All 12 months for the selected year context.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {(bundle?.monthlySales ?? []).map((row) => (
              <div
                key={row.month}
                className="flex items-center justify-between border-b border-border/40 py-2 text-sm last:border-0"
              >
                <span>{row.label}</span>
                <span className="font-medium tabular-nums">{formatCompact(row.sales)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between pt-2 text-sm font-semibold">
              <span>Grand Total</span>
              <span className="tabular-nums">
                {formatCompact(
                  (bundle?.monthlySales ?? []).reduce((sum, row) => sum + row.sales, 0)
                )}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Yearly Sales</CardTitle>
            <CardDescription>Compare sales across years.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {(bundle?.yearlySales ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No yearly data yet.</p>
            ) : (
              (bundle?.yearlySales ?? []).map((row) => (
                <div
                  key={row.year}
                  className="flex items-center justify-between border-b border-border/40 py-2 text-sm last:border-0"
                >
                  <span>{row.year}</span>
                  <span className="font-medium tabular-nums">{formatCompact(row.sales)}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Available Stock"
          value={stock?.totalAvailable ?? 0}
          icon={Warehouse}
          isLoading={showLoading}
        />
        <StatCard
          title="Low Stock"
          value={stock?.lowStockCount ?? 0}
          icon={TriangleAlert}
          iconClassName="bg-amber-50 ring-amber-200"
          isLoading={showLoading}
        />
        <StatCard
          title="Out of Stock"
          value={stock?.outOfStockCount ?? 0}
          icon={Boxes}
          iconClassName="bg-rose-50 ring-rose-200"
          isLoading={showLoading}
        />
        <StatCard
          title="Stock Value"
          value="—"
          icon={Banknote}
          isLoading={showLoading}
          trendLabel="Coming soon"
        />
      </div>

      {bundle ? (
        <ReportCharts
          monthly={bundle.charts.monthly}
          yearly={bundle.charts.yearly}
          customers={bundle.charts.customers}
          qualities={bundle.charts.qualities}
          payments={bundle.charts.payments}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[320px] w-full rounded-xl" />
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Customer Reports</CardTitle>
          <CardDescription>Top customers by invoice sales for the selected filters.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={bundle?.customers ?? []}
            columns={customerColumns}
            isLoading={showLoading}
            hideSearch
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quality Reports</CardTitle>
          <CardDescription>Delivery volume by quality, sorted by highest delivered.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={bundle?.qualities ?? []}
            columns={qualityColumns}
            isLoading={showLoading}
            hideSearch
          />
        </CardContent>
      </Card>
    </div>
  )
}

function SummaryMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border bg-muted/40 px-3 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
    </div>
  )
}

function StatusChip({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border px-2.5 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium tabular-nums">{value}</p>
    </div>
  )
}
