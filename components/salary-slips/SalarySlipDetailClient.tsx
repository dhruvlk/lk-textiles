"use client"
/* eslint-disable */

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { motion } from "framer-motion"
import {
  ArrowLeft,
  Building2,
  Edit,
  FileText,
  Printer,
  Receipt,
  User,
} from "lucide-react"
import { useCompany } from "@/components/company-provider"
import { PageHeader } from "@/components/common/PageHeader"
import { PageTransition } from "@/components/common/motion"
import { EmptyState } from "@/components/common/EmptyState"
import { DownloadSalarySlipButton } from "@/components/salary-slips/download-button"
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
import { formatCurrency } from "@/lib/payment-status"
import { getSalarySlipById, getSalarySlipsByEmployee } from "@/services/salary-slips.service"
import type { SalarySlip } from "@/types"
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
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between py-1">
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

export default function SalarySlipDetailClient({ id }: { id: string }) {
  const router = useRouter()
  const { selectedCompany } = useCompany()
  const [salarySlip, setSalarySlip] = useState<SalarySlip | null>(null)
  const [historySlips, setHistorySlips] = useState<SalarySlip[]>([])
  const [loading, setLoading] = useState(true)

  const loadSalarySlip = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getSalarySlipById(id)
      setSalarySlip(data)

      if (data?.employee_id && selectedCompany?.id) {
        try {
          const hist = await getSalarySlipsByEmployee(selectedCompany.id, data.employee_id, 7)
          setHistorySlips(hist.filter((s) => s.id !== data.id).slice(0, 6))
        } catch {
          // history is optional
        }
      }
    } catch {
      toast.error("Failed to load salary slip details")
    } finally {
      setLoading(false)
    }
  }, [id, selectedCompany?.id])

  useEffect(() => {
    loadSalarySlip()
  }, [loadSalarySlip])

  if (!selectedCompany) {
    return (
      <EmptyState
        icon={Building2}
        title="Select a company"
        description="Choose a company from the header to view salary slip details."
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

  if (!salarySlip) {
    return (
      <EmptyState
        icon={FileText}
        title="Salary slip not found"
        description="This salary slip may have been deleted or you don't have access."
        action={
          <Button
            variant="outline"
            onClick={() => router.push("/admin/salary-slips")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Salary Slips
          </Button>
        }
      />
    )
  }

  const earningsItems = [
    { label: "Basic Salary", amount: salarySlip.basic_salary },
    { label: "House Rent Allowance (HRA)", amount: salarySlip.hra },
    { label: "Conveyance Allowance", amount: salarySlip.conveyance },
    { label: "Medical Allowance", amount: salarySlip.medical_allowance },
    { label: "Special Allowance", amount: salarySlip.special_allowance },
    { label: "Bonus", amount: salarySlip.bonus },
    { label: "Overtime", amount: salarySlip.overtime },
    { label: "Other Earnings", amount: salarySlip.other_earnings },
  ].filter((item) => Number(item.amount) > 0 || item.label === "Basic Salary")

  const deductionsItems = [
    { label: "Provident Fund (PF)", amount: salarySlip.pf },
    { label: "Professional Tax (PT)", amount: salarySlip.professional_tax },
    { label: "Tax Deducted at Source (TDS)", amount: salarySlip.tds },
    { label: "ESIC", amount: salarySlip.esic },
    { label: "Loan Deduction", amount: salarySlip.loan_deduction },
    { label: "Advance Deduction", amount: salarySlip.advance_deduction },
    { label: "Other Deduction", amount: salarySlip.other_deduction },
  ].filter((item) => Number(item.amount) > 0)

  const hasDeductions =
    Number(salarySlip.total_deductions || 0) > 0 ||
    deductionsItems.length > 0

  return (
    <PageTransition className="space-y-6">
      <PageHeader
        eyebrow="Salary Slip"
        title={salarySlip.salary_slip_number}
        description={`${salarySlip.employee_name} · ${salarySlip.salary_month} ${salarySlip.salary_year}`}
        action={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => router.push("/admin/salary-slips")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push(`/admin/salary-slips/${id}/print`)}
            >
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
            <DownloadSalarySlipButton
              salarySlip={salarySlip}
              company={selectedCompany}
              historySlips={historySlips}
            />
            <Button
              variant="outline"
              onClick={() => router.push(`/admin/salary-slips/${id}/edit`)}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </div>
        }
      />

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="grid gap-6 lg:grid-cols-2"
      >
        {/* EMPLOYEE INFORMATION CARD */}
        <motion.div variants={staggerItem}>
          <Card className="h-full shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <User className="h-5 w-5 text-primary" />
                Employee Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <DetailRow label="Employee Name" value={salarySlip.employee_name} highlight />
              <DetailRow
                label="Joining Date"
                value={
                  salarySlip.joining_date
                    ? format(new Date(salarySlip.joining_date), "dd MMM yyyy")
                    : "—"
                }
              />
              <DetailRow label="PAN Number" value={salarySlip.pan_number || "—"} />
            </CardContent>
          </Card>
        </motion.div>

        {/* DOCUMENT & PAYMENT DETAILS */}
        <motion.div variants={staggerItem}>
          <Card className="h-full shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Receipt className="h-5 w-5 text-primary" />
                Salary Period & Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <DetailRow label="Salary Slip Number" value={salarySlip.salary_slip_number} highlight />
              <DetailRow
                label="Salary Period"
                value={`${salarySlip.salary_month} ${salarySlip.salary_year}`}
              />
              <DetailRow
                label="Pay Date"
                value={
                  salarySlip.pay_date
                    ? format(new Date(salarySlip.pay_date), "dd MMM yyyy")
                    : "—"
                }
              />
              <Separator />
              <DetailRow
                label="Gross Earnings"
                value={formatCurrency(salarySlip.gross_earnings)}
              />
              {hasDeductions && (
                <DetailRow
                  label="Total Deductions"
                  value={formatCurrency(salarySlip.total_deductions)}
                />
              )}
              <DetailRow
                label="Net Take-Home Salary"
                value={formatCurrency(salarySlip.net_salary)}
                highlight
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* TWO-COLUMN TABLES: EARNINGS & DEDUCTIONS */}
        <motion.div variants={staggerItem} className="lg:col-span-2">
          <div className={hasDeductions ? "grid gap-6 md:grid-cols-2" : "grid gap-6"}>
            {/* EARNINGS */}
            <Card className="shadow-sm">
              <CardHeader className="bg-primary/5 pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold text-primary">
                    Earnings
                  </CardTitle>
                  <span className="text-base font-bold text-primary">
                    {formatCurrency(salarySlip.gross_earnings)}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Component</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {earningsItems.map((item) => (
                      <TableRow key={item.label}>
                        <TableCell className="font-medium text-foreground">
                          {item.label}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(Number(item.amount))}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/40 font-bold">
                      <TableCell>Gross Earnings</TableCell>
                      <TableCell className="text-right text-primary">
                        {formatCurrency(salarySlip.gross_earnings)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* DEDUCTIONS */}
            {hasDeductions && (
              <Card className="shadow-sm">
                <CardHeader className="bg-destructive/5 pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold text-destructive">
                      Deductions
                    </CardTitle>
                    <span className="text-base font-bold text-destructive">
                      {formatCurrency(salarySlip.total_deductions)}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Component</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {deductionsItems.map((item) => (
                        <TableRow key={item.label}>
                          <TableCell className="font-medium text-foreground">
                            {item.label}
                          </TableCell>
                          <TableCell className="text-right font-medium text-destructive">
                            {formatCurrency(Number(item.amount))}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-muted/40 font-bold">
                        <TableCell>Total Deductions</TableCell>
                        <TableCell className="text-right text-destructive">
                          {formatCurrency(salarySlip.total_deductions)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>
        </motion.div>

        {/* PROMINENT NET SALARY BANNER */}
        <motion.div variants={staggerItem} className="lg:col-span-2">
          <Card className="border-primary/30 bg-primary/5 shadow-sm">
            <CardContent className="p-6">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                    Net Take-Home Salary
                  </span>
                  <p className="text-3xl font-extrabold text-primary">
                    {formatCurrency(salarySlip.net_salary)}
                  </p>
                  <p className="mt-1 text-sm font-medium text-muted-foreground">
                    <span className="font-semibold text-foreground">In Words:</span>{" "}
                    {salarySlip.amount_in_words || "—"}
                  </p>
                </div>
                {salarySlip.notes && (
                  <div className="max-w-md rounded-lg border bg-background p-3 text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">Notes: </span>
                    {salarySlip.notes}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* SALARY HISTORY (LAST 6 MONTHS) */}
        {historySlips.length > 0 && (
          <motion.div variants={staggerItem} className="lg:col-span-2">
            <Card className="shadow-sm">
              <CardHeader className="bg-muted/40 pb-3">
                <CardTitle className="text-base font-semibold text-primary">
                  Salary History ({historySlips.length <= 6 ? `Last ${historySlips.length} Months` : "Last 6 Months"})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Salary Month</TableHead>
                      <TableHead className="text-right">Basic Salary</TableHead>
                      <TableHead className="text-right">Deductions</TableHead>
                      <TableHead className="text-right">Net Salary</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historySlips.map((h) => (
                      <TableRow
                        key={h.id}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => router.push(`/admin/salary-slips/${h.id}`)}
                      >
                        <TableCell className="font-medium text-foreground">
                          {h.salary_month} {h.salary_year}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(h.basic_salary)}
                        </TableCell>
                        <TableCell className="text-right font-medium text-destructive">
                          {formatCurrency(h.total_deductions)}
                        </TableCell>
                        <TableCell className="text-right font-bold text-primary">
                          {formatCurrency(h.net_salary)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </motion.div>
    </PageTransition>
  )
}
