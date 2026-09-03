"use client"
/* eslint-disable */

import { useCompany } from "@/components/company-provider"
import { useAuth } from "@/hooks/useAuth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, FileText, CalendarDays, IndianRupee, Building2, ArrowRight } from "lucide-react"
import { getDashboardStats } from "@/services/dashboard.service"
import { useEffect, useMemo, useState } from "react"
import { DashboardStats } from "@/types"
import { format } from "date-fns"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { StatCard } from "@/components/common/StatCard"
import { EmptyState } from "@/components/common/EmptyState"
import { MotionStagger, MotionStaggerItem } from "@/components/common/motion"
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts"
import Link from "next/link"
import { motion } from "framer-motion"
const listIconColors = [
  "bg-violet-500/10 text-violet-600",
  "bg-sky-500/10 text-sky-600",
  "bg-emerald-500/10 text-emerald-600",
  "bg-amber-500/10 text-amber-600",
  "bg-rose-500/10 text-rose-600",
]

export default function DashboardClient() {
  const router = useRouter()
  const { user } = useAuth()
  const { selectedCompany } = useCompany()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const companyId = selectedCompany?.id

  const firstName = user?.name?.split(" ")[0] || "Admin"
  const hour = new Date().getHours()
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening"
  const currentDate = format(new Date(), "EEEE, d MMMM  yyyy")

  useEffect(() => {
    let cancelled = false

    async function loadData() {
      if (!companyId) {
        setStats(null)
        setIsLoading(false)
        return
      }

      // Soft load: keep previous dashboard visible while refreshing
      const isFirstLoad = stats === null
      if (isFirstLoad) setIsLoading(true)

      try {
        const data = await getDashboardStats(companyId)
        if (!cancelled) setStats(data)
      } catch {
        if (!cancelled && isFirstLoad) setStats(null)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void loadData()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId])

  const chartData = useMemo(() => {
    if (!stats?.recentChallans.length) return []
    return [...stats.recentChallans]
      .reverse()
      .map((c) => ({
        label: format(new Date(c.date), "dd MMM"),
        amount: c.grand_total ?? 0,
      }))
  }, [stats?.recentChallans])

  if (!selectedCompany) {
    return (
      <EmptyState
        icon={Building2}
        title="Workspace not ready"
        description="Your company workspace is still being provisioned. Try refreshing, or contact support if this persists."
        action={
          <Button onClick={() => window.location.reload()}>Refresh</Button>
        }
      />
    )
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between mb-2"
      >
        <div className="space-y-1.5">
          <p className="text-sm font-medium text-primary">Dashboard</p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl lg:text-4xl">
            {greeting}, {firstName} <span className="inline-block origin-[80%_85%] animate-wave cursor-default">👋</span>
          </h1>
          <p className="text-base text-muted-foreground md:text-lg">
            Here&apos;s what&apos;s happening with{" "}
            <span className="font-semibold text-primary">{selectedCompany.name}</span>{" "}
            today.
          </p>
          <p className="text-lg font-semibold text-muted-foreground/60">
            {currentDate}
          </p>
        </div>
        <Button size="lg" className="w-full sm:w-auto shadow-sm" onClick={() => router.push("/admin/invoices/new")}>
          <FileText className="mr-2 h-4 w-4" />
          New invoice
        </Button>
      </motion.div>

      <MotionStagger className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MotionStaggerItem>
          <StatCard
            title="Total customers"
            value={stats?.totalCustomers ?? 0}
            icon={Users}
            isLoading={isLoading}
          />
        </MotionStaggerItem>
        <MotionStaggerItem>
          <StatCard
            title="Total invoices"
            value={stats?.totalChallans ?? 0}
            icon={FileText}
            iconClassName="bg-sky-500/10 ring-sky-500/15 [&_svg]:text-sky-600"
            isLoading={isLoading}
          />
        </MotionStaggerItem>
        <MotionStaggerItem>
          <StatCard
            title="Today's invoices"
            value={stats?.todayChallans ?? 0}
            icon={CalendarDays}
            iconClassName="bg-amber-500/10 ring-amber-500/15 [&_svg]:text-amber-600"
            isLoading={isLoading}
          />
        </MotionStaggerItem>
        <MotionStaggerItem>
          <StatCard
            title="Monthly sales"
            value={isLoading ? "..." : `₹${(stats?.monthlySales ?? 0).toLocaleString("en-IN")}`}
            icon={IndianRupee}
            iconClassName="bg-emerald-500/10 ring-emerald-500/15 [&_svg]:text-emerald-600"
            isLoading={isLoading}
          />
        </MotionStaggerItem>
      </MotionStagger>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent invoices</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">Latest activity</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => router.push("/admin/invoices")}>
              View all
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-1 pb-5">
            {isLoading ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Loading...</p>
            ) : stats?.recentChallans.length ? (
              stats.recentChallans.map((challan, index) => (
                <div
                  key={challan.id}
                  className="flex items-center justify-between gap-4 rounded-lg px-2 py-3 transition-colors hover:bg-muted/50"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${listIconColors[index % listIconColors.length]}`}
                    >
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{challan.challan_number}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {challan.customer?.name || challan.party?.name} ·{" "}
                        {format(new Date(challan.date), "dd MMM yyyy")}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-medium tabular-nums">
                      ₹{(challan.grand_total ?? 0).toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">{challan.status}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No invoices yet. Create your first invoice to see activity here.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sales trend</CardTitle>
            <p className="text-sm text-muted-foreground">From recent invoices</p>
          </CardHeader>
          <CardContent>
            <div className="mb-2 text-2xl font-semibold tabular-nums">
              {isLoading ? "..." : `₹${(stats?.monthlySales ?? 0).toLocaleString("en-IN")}`}
            </div>
            <p className="mb-4 text-xs text-muted-foreground">This month</p>
            <div className="h-[200px] w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <defs>
                      <linearGradient id="salesArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="oklch(0.52 0.19 264)" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="oklch(0.52 0.19 264)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: "oklch(0.5 0.02 264)" }}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid var(--border)",
                        boxShadow: "var(--shadow-sm)",
                        fontSize: "12px",
                        backgroundColor: "var(--background)",
                        color: "var(--foreground)",
                      }}
                      formatter={(v) => [`₹${Number(v).toLocaleString("en-IN")}`, "Amount"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="amount"
                      stroke="oklch(0.52 0.19 264)"
                      strokeWidth={2}
                      fill="url(#salesArea)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  No chart data yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
