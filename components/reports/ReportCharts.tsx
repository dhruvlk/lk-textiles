"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts"
import type { ChartPoint } from "@/types/reports"

const COLORS = ["#4d6ef5", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"]

const tooltipStyle = {
  borderRadius: "8px",
  border: "1px solid var(--border)",
  boxShadow: "var(--shadow-sm)",
  fontSize: "12px",
  backgroundColor: "var(--background)",
  color: "var(--foreground)",
}

function ChartCard({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-[280px]">{children}</CardContent>
    </Card>
  )
}

export function ReportCharts({
  monthly,
  yearly,
  customers,
  qualities,
  payments,
}: {
  monthly: ChartPoint[]
  yearly: ChartPoint[]
  customers: ChartPoint[]
  qualities: ChartPoint[]
  payments: ChartPoint[]
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ChartCard title="Monthly Sales">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={monthly} margin={{ top: 12, right: 12, bottom: 8, left: -8 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(0.93 0.01 264)" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
            <RechartsTooltip contentStyle={tooltipStyle} />
            <Line
              type="monotone"
              dataKey="value"
              name="Sales"
              stroke="#4d6ef5"
              strokeWidth={2.5}
              dot={{ r: 3, fill: "#4d6ef5" }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Yearly Sales">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={yearly} margin={{ top: 12, right: 12, bottom: 8, left: -8 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(0.93 0.01 264)" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
            <RechartsTooltip contentStyle={tooltipStyle} />
            <Bar dataKey="value" name="Sales" fill="#4d6ef5" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Top Customers">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={customers}
            layout="vertical"
            margin={{ top: 12, right: 12, bottom: 8, left: 24 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="oklch(0.93 0.01 264)" />
            <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
            <YAxis
              type="category"
              dataKey="name"
              width={90}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11 }}
            />
            <RechartsTooltip contentStyle={tooltipStyle} />
            <Bar dataKey="value" name="Sales" fill="#10b981" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Quality-wise Deliveries">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={qualities} margin={{ top: 12, right: 12, bottom: 8, left: -8 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(0.93 0.01 264)" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
            <RechartsTooltip contentStyle={tooltipStyle} />
            <Bar dataKey="value" name="Pieces" fill="#f59e0b" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Payment Status">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={payments}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
            >
              {payments.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <RechartsTooltip contentStyle={tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  )
}
