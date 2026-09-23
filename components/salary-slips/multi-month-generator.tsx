"use client"
/* eslint-disable */

import { useState, useEffect, useMemo } from "react"
import { Company, SalarySlip, MultiMonthSummaryData, MultiMonthHistoryRow } from "@/types"
import { Employee } from "@/types/permissions"
import { getSalarySlipsByEmployee } from "@/services/salary-slips.service"
import { formatCurrency } from "@/lib/payment-status"
import { numberToWords } from "@/lib/number-to-words"
import { downloadPdfBlob, previewPdfBlob } from "@/lib/pdf-actions"
import { buildPdfFilename } from "@/lib/pdf-utils"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "sonner"
import {
  Calendar,
  Download,
  Eye,
  FileText,
  Files,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Layers,
  ArrowRight,
} from "lucide-react"

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

interface MultiMonthGeneratorProps {
  company: Company
  employees: Employee[]
  onBackToSingle?: () => void
}

interface MonthItem {
  month: string
  year: number
  key: string
  label: string
  shortLabel: string
  slip?: SalarySlip
  available: boolean
}

export function MultiMonthSalarySlipGenerator({
  company,
  employees,
  onBackToSingle,
}: MultiMonthGeneratorProps) {
  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const currentMonthIdx = currentDate.getMonth()

  // Calculate 5 months ago for default 6-month range
  const startMonthIdx = (currentMonthIdx - 5 + 12) % 12
  const startYear = currentMonthIdx < 5 ? currentYear - 1 : currentYear

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("")
  const [employeeSlips, setEmployeeSlips] = useState<SalarySlip[]>([])
  const [isLoadingSlips, setIsLoadingSlips] = useState(false)

  // Range inputs
  const [rangeStartMonth, setRangeStartMonth] = useState<string>(MONTHS[startMonthIdx])
  const [rangeStartYear, setRangeStartYear] = useState<number>(startYear)
  const [rangeEndMonth, setRangeEndMonth] = useState<string>(MONTHS[currentMonthIdx])
  const [rangeEndYear, setRangeEndYear] = useState<number>(currentYear)

  // Selected Month Keys
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set())

  // Output mode: 'summary' (1 page statement) vs 'detailed' (multi-page)
  const [outputMode, setOutputMode] = useState<"summary" | "detailed">("summary")
  const [notes, setNotes] = useState<string>("")
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)

  const selectedEmployee = useMemo(
    () => employees.find((e) => e.user_id === selectedEmployeeId) || null,
    [employees, selectedEmployeeId]
  )

  // Load employee recorded slips when employee changes
  useEffect(() => {
    async function loadSlips() {
      if (!selectedEmployeeId || !company.id) {
        setEmployeeSlips([])
        return
      }
      setIsLoadingSlips(true)
      try {
        const slips = await getSalarySlipsByEmployee(company.id, selectedEmployeeId, 50)
        setEmployeeSlips(slips)

        // Auto-select months that are available in current range
        const availableInDefaultRange = generateRangeMonths(
          rangeStartMonth,
          rangeStartYear,
          rangeEndMonth,
          rangeEndYear,
          slips
        )
        const keys = new Set(
          availableInDefaultRange.filter((m) => m.available).map((m) => m.key)
        )
        setSelectedKeys(keys)
      } catch {
        toast.error("Failed to load employee salary records")
      } finally {
        setIsLoadingSlips(false)
      }
    }
    loadSlips()
  }, [selectedEmployeeId, company.id])

  // Helper to generate chronological months between start and end
  function generateRangeMonths(
    sMonth: string,
    sYear: number,
    eMonth: string,
    eYear: number,
    slips: SalarySlip[]
  ): MonthItem[] {
    const sMonthIdx = MONTHS.indexOf(sMonth)
    const eMonthIdx = MONTHS.indexOf(eMonth)
    if (sMonthIdx === -1 || eMonthIdx === -1) return []

    const startTotalMonths = sYear * 12 + sMonthIdx
    const endTotalMonths = eYear * 12 + eMonthIdx

    if (startTotalMonths > endTotalMonths) {
      return []
    }

    const result: MonthItem[] = []
    for (let total = startTotalMonths; total <= endTotalMonths; total++) {
      const year = Math.floor(total / 12)
      const monthIdx = total % 12
      const month = MONTHS[monthIdx]
      const key = `${month}-${year}`

      const slip = slips.find(
        (s) =>
          s.salary_month.toLowerCase() === month.toLowerCase() &&
          Number(s.salary_year) === year
      )

      result.push({
        month,
        year,
        key,
        label: `${month} ${year}`,
        shortLabel: `${month.slice(0, 3)} ${year}`,
        slip,
        available: Boolean(slip),
      })
    }
    return result
  }

  // Current months in range
  const rangeMonths = useMemo(() => {
    return generateRangeMonths(
      rangeStartMonth,
      Number(rangeStartYear),
      rangeEndMonth,
      Number(rangeEndYear),
      employeeSlips
    )
  }, [rangeStartMonth, rangeStartYear, rangeEndMonth, rangeEndYear, employeeSlips])

  // Handle Preset selection
  const applyPreset = (preset: "last3" | "last6" | "fy" | "all") => {
    if (preset === "all" && employeeSlips.length > 0) {
      // Find oldest and newest slip
      const sorted = [...employeeSlips].sort((a, b) => {
        const valA = a.salary_year * 12 + MONTHS.indexOf(a.salary_month)
        const valB = b.salary_year * 12 + MONTHS.indexOf(b.salary_month)
        return valA - valB
      })
      const oldest = sorted[0]
      const newest = sorted[sorted.length - 1]
      setRangeStartMonth(oldest.salary_month)
      setRangeStartYear(oldest.salary_year)
      setRangeEndMonth(newest.salary_month)
      setRangeEndYear(newest.salary_year)
      setSelectedKeys(new Set(sorted.map((s) => `${s.salary_month}-${s.salary_year}`)))
      return
    }

    let startM = currentMonthIdx
    let startY = currentYear

    if (preset === "last3") {
      startM = (currentMonthIdx - 2 + 12) % 12
      startY = currentMonthIdx < 2 ? currentYear - 1 : currentYear
    } else if (preset === "last6") {
      startM = (currentMonthIdx - 5 + 12) % 12
      startY = currentMonthIdx < 5 ? currentYear - 1 : currentYear
    } else if (preset === "fy") {
      // Indian Financial Year: April to March
      const isPostApril = currentMonthIdx >= 3
      startY = isPostApril ? currentYear : currentYear - 1
      startM = 3 // April
    }

    setRangeStartMonth(MONTHS[startM])
    setRangeStartYear(startY)
    setRangeEndMonth(MONTHS[currentMonthIdx])
    setRangeEndYear(currentYear)

    const newRange = generateRangeMonths(
      MONTHS[startM],
      startY,
      MONTHS[currentMonthIdx],
      currentYear,
      employeeSlips
    )
    setSelectedKeys(new Set(newRange.filter((m) => m.available).map((m) => m.key)))
  }

  // Toggle single month checkbox
  const toggleMonth = (key: string) => {
    const next = new Set(selectedKeys)
    if (next.has(key)) {
      next.delete(key)
    } else {
      next.add(key)
    }
    setSelectedKeys(next)
  }

  // Select all available in range
  const selectAllAvailable = () => {
    const availableKeys = rangeMonths.filter((m) => m.available).map((m) => m.key)
    setSelectedKeys(new Set(availableKeys))
  }

  // Deselect all
  const deselectAll = () => {
    setSelectedKeys(new Set())
  }

  // Selected months list
  const selectedMonthsList = useMemo(() => {
    return rangeMonths.filter((m) => selectedKeys.has(m.key))
  }, [rangeMonths, selectedKeys])

  // Missing months in selection
  const missingSelectedMonths = useMemo(() => {
    return selectedMonthsList.filter((m) => !m.available)
  }, [selectedMonthsList])

  // Available selected slips
  const availableSelectedSlips = useMemo(() => {
    return selectedMonthsList
      .filter((m) => m.available && m.slip)
      .map((m) => m.slip!)
  }, [selectedMonthsList])

  // Totals calculations
  const totalBasicSalary = useMemo(
    () => availableSelectedSlips.reduce((acc, s) => acc + Number(s.basic_salary || 0), 0),
    [availableSelectedSlips]
  )
  const totalGrossEarnings = useMemo(
    () => availableSelectedSlips.reduce((acc, s) => acc + Number(s.gross_earnings || 0), 0),
    [availableSelectedSlips]
  )
  const totalDeductions = useMemo(
    () => availableSelectedSlips.reduce((acc, s) => acc + Number(s.total_deductions || 0), 0),
    [availableSelectedSlips]
  )
  const totalNetSalary = useMemo(
    () => availableSelectedSlips.reduce((acc, s) => acc + Number(s.net_salary || 0), 0),
    [availableSelectedSlips]
  )
  const netInWords = useMemo(
    () => numberToWords(Math.round(totalNetSalary)),
    [totalNetSalary]
  )

  // Period label
  const periodDisplay = useMemo(() => {
    if (availableSelectedSlips.length === 0) return "—"
    if (availableSelectedSlips.length === 1) {
      return `${availableSelectedSlips[0].salary_month} ${availableSelectedSlips[0].salary_year}`
    }
    const first = availableSelectedSlips[0]
    const last = availableSelectedSlips[availableSelectedSlips.length - 1]
    return `${first.salary_month} ${first.salary_year} – ${last.salary_month} ${last.salary_year}`
  }, [availableSelectedSlips])

  // Handle PDF Generation (Preview or Download)
  const handleGeneratePdf = async (action: "preview" | "download") => {
    if (!selectedEmployee) {
      toast.error("Please select an employee first")
      return
    }
    if (availableSelectedSlips.length === 0) {
      toast.error("No recorded salary slips available for the selected months")
      return
    }

    setIsGeneratingPdf(true)
    const toastId = toast.loading(
      action === "preview"
        ? "Generating Salary Statement preview..."
        : "Generating Salary Statement PDF..."
    )

    try {
      const summaryRows: MultiMonthHistoryRow[] = availableSelectedSlips.map((s) => ({
        month: s.salary_month,
        year: s.salary_year,
        monthDisplay: `${s.salary_month.slice(0, 3)} ${s.salary_year}`,
        basicSalary: s.basic_salary,
        grossEarnings: s.gross_earnings,
        totalDeductions: s.total_deductions,
        netSalary: s.net_salary,
        slipId: s.id,
        slipNumber: s.salary_slip_number,
        available: true,
      }))

      const summaryData: MultiMonthSummaryData = {
        employeeId: selectedEmployee.user_id,
        employeeName: selectedEmployee.full_name,
        joiningDate: selectedEmployee.joining_date,
        panNumber: selectedEmployee.pan_number,
        periodDisplay,
        monthsCount: availableSelectedSlips.length,
        rows: summaryRows,
        totalBasicSalary,
        totalGrossEarnings,
        totalDeductions,
        totalNetSalary,
        amountInWords: netInWords,
        notes: notes.trim() || null,
      }

      const { pdf } = await import("@react-pdf/renderer")
      const { MultiMonthSalarySlipPDF } = await import(
        "@/components/pdf/MultiMonthSalarySlipPDF"
      )

      const blob = await pdf(
        <MultiMonthSalarySlipPDF
          summary={summaryData}
          company={company}
          mode={outputMode}
          detailedSlips={availableSelectedSlips}
        />
      ).toBlob()

      const baseName =
        outputMode === "summary"
          ? `Salary_Statement_${selectedEmployee.full_name.replace(/\s+/g, "_")}_${periodDisplay.replace(/\s+/g, "_")}.pdf`
          : `Salary_Slips_${selectedEmployee.full_name.replace(/\s+/g, "_")}_${periodDisplay.replace(/\s+/g, "_")}.pdf`

      if (action === "preview") {
        await previewPdfBlob(blob)
        toast.success("Salary Statement preview opened.", { id: toastId })
      } else {
        await downloadPdfBlob(blob, baseName)
        toast.success("Salary Statement downloaded successfully.", { id: toastId })
      }
    } catch (error) {
      console.error("PDF generation failed:", error)
      toast.error(
        error instanceof Error ? error.message : "Failed to generate PDF document",
        { id: toastId }
      )
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. EMPLOYEE & PRESETS SELECTION */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* EMPLOYEE SELECTOR */}
        <Card className="shadow-sm md:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">1. Select Employee</CardTitle>
            <CardDescription>
              Choose an employee to load recorded salary slips
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Employee *</Label>
              <Select
                value={selectedEmployeeId}
                onValueChange={(val) => val && setSelectedEmployeeId(val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose employee...">
                    {(val: string | null) =>
                      employees.find((e) => e.user_id === val)?.full_name ||
                      "Choose employee..."
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.user_id} value={emp.user_id}>
                      {emp.full_name} {emp.employee_code ? `(${emp.employee_code})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedEmployee && (
              <div className="rounded-lg border bg-muted/30 p-3 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Joining Date:</span>
                  <span className="font-medium text-foreground">
                    {selectedEmployee.joining_date || "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">PAN Number:</span>
                  <span className="font-medium text-foreground">
                    {selectedEmployee.pan_number || "—"}
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t">
                  <span className="text-muted-foreground">Recorded Slips:</span>
                  <Badge variant="outline" className="font-mono text-[11px]">
                    {isLoadingSlips ? "Loading..." : `${employeeSlips.length} found`}
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* MONTH RANGE & PRESETS */}
        <Card className="shadow-sm md:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base font-semibold">2. Month Range & Presets</CardTitle>
                <CardDescription>
                  Define the period range or use quick presets
                </CardDescription>
              </div>
              {/* Presets */}
              <div className="flex flex-wrap gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => applyPreset("last3")}
                  className="h-7 text-xs"
                >
                  Last 3 Months
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => applyPreset("last6")}
                  className="h-7 text-xs"
                >
                  Last 6 Months
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => applyPreset("fy")}
                  className="h-7 text-xs"
                >
                  Current FY
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => applyPreset("all")}
                  disabled={employeeSlips.length === 0}
                  className="h-7 text-xs"
                >
                  All Recorded
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Start Range */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">From (Start Month & Year)</Label>
                <div className="flex gap-2">
                  <Select
                    value={rangeStartMonth}
                    onValueChange={(val) => val && setRangeStartMonth(val)}
                  >
                    <SelectTrigger className="w-[60%]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    value={rangeStartYear}
                    onChange={(e) => setRangeStartYear(Number(e.target.value))}
                    className="w-[40%]"
                  />
                </div>
              </div>

              {/* End Range */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">To (End Month & Year)</Label>
                <div className="flex gap-2">
                  <Select
                    value={rangeEndMonth}
                    onValueChange={(val) => val && setRangeEndMonth(val)}
                  >
                    <SelectTrigger className="w-[60%]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    value={rangeEndYear}
                    onChange={(e) => setRangeEndYear(Number(e.target.value))}
                    className="w-[40%]"
                  />
                </div>
              </div>
            </div>

            {/* Quick Multi-select chips */}
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">
                  Months in Range ({rangeMonths.length}):
                </span>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={selectAllAvailable}
                    className="h-6 px-2 text-xs"
                  >
                    Select All Recorded
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={deselectAll}
                    className="h-6 px-2 text-xs text-muted-foreground"
                  >
                    Clear All
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {rangeMonths.map((m) => {
                  const isChecked = selectedKeys.has(m.key)
                  return (
                    <button
                      key={m.key}
                      type="button"
                      onClick={() => toggleMonth(m.key)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                        isChecked
                          ? m.available
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-amber-600 text-white border-amber-600"
                          : m.available
                          ? "bg-background text-foreground border-border hover:bg-muted"
                          : "bg-muted/40 text-muted-foreground border-dashed border-border"
                      }`}
                    >
                      <span>{m.shortLabel}</span>
                      {m.available ? (
                        <span className="text-[10px] opacity-80">✓</span>
                      ) : (
                        <span className="text-[10px] opacity-80 font-mono">!</span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 2. MISSING MONTH VALIDATION ALERT */}
      {missingSelectedMonths.length > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <h4 className="text-sm font-semibold">
              Salary Record Not Available for Selected Period
            </h4>
            <p className="text-xs text-amber-800 dark:text-amber-300">
              Salary slips have not been recorded in the system for:{" "}
              <span className="font-semibold">
                {missingSelectedMonths.map((m) => m.label).join(", ")}
              </span>
              . Only months with recorded salary slips will be included in the statement and detailed export.
            </p>
          </div>
        </div>
      )}

      {/* 3. LIVE SALARY HISTORY TABLE */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base font-semibold">
                3. Selected Salary Breakdown
              </CardTitle>
              <CardDescription>
                Live preview of actual recorded salaries for the selected period
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-medium">
                {availableSelectedSlips.length} Months Selected
              </Badge>
              <span className="text-xs font-semibold text-primary">
                Period: {periodDisplay}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="w-[180px]">Month & Year</TableHead>
                <TableHead>Slip Number</TableHead>
                <TableHead className="text-right">Basic Salary</TableHead>
                <TableHead className="text-right">Gross Earnings</TableHead>
                <TableHead className="text-right">Deductions</TableHead>
                <TableHead className="text-right">Net Take-Home</TableHead>
                <TableHead className="w-[110px] text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {selectedMonthsList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No months selected. Use the month selectors or presets above.
                  </TableCell>
                </TableRow>
              ) : (
                selectedMonthsList.map((m) => (
                  <TableRow
                    key={m.key}
                    className={!m.available ? "bg-amber-50/50 dark:bg-amber-950/10" : undefined}
                  >
                    <TableCell className="font-medium text-foreground">
                      {m.label}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {m.slip?.salary_slip_number || "—"}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {m.slip ? formatCurrency(m.slip.basic_salary) : "—"}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {m.slip ? formatCurrency(m.slip.gross_earnings) : "—"}
                    </TableCell>
                    <TableCell className="text-right font-medium text-destructive">
                      {m.slip ? formatCurrency(m.slip.total_deductions) : "—"}
                    </TableCell>
                    <TableCell className="text-right font-bold text-primary">
                      {m.slip ? formatCurrency(m.slip.net_salary) : "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      {m.available ? (
                        <Badge
                          variant="secondary"
                          className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]"
                        >
                          Recorded
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-amber-700 border-amber-300 bg-amber-50 text-[10px]"
                        >
                          Not Found
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}

              {/* Totals Row */}
              {availableSelectedSlips.length > 0 && (
                <TableRow className="bg-muted/60 font-bold border-t-2 border-primary/20">
                  <TableCell colSpan={2} className="font-bold text-foreground">
                    TOTAL ({availableSelectedSlips.length} Months)
                  </TableCell>
                  <TableCell className="text-right text-foreground font-bold">
                    {formatCurrency(totalBasicSalary)}
                  </TableCell>
                  <TableCell className="text-right text-foreground font-bold">
                    {formatCurrency(totalGrossEarnings)}
                  </TableCell>
                  <TableCell className="text-right text-destructive font-bold">
                    {formatCurrency(totalDeductions)}
                  </TableCell>
                  <TableCell className="text-right text-primary font-extrabold text-base">
                    {formatCurrency(totalNetSalary)}
                  </TableCell>
                  <TableCell />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 4. TOTAL SUMMARY CARDS */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <span className="text-xs font-medium text-muted-foreground">Total Basic Salary</span>
            <p className="mt-1 text-xl font-bold text-foreground">
              {formatCurrency(totalBasicSalary)}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <span className="text-xs font-medium text-muted-foreground">Total Gross Earnings</span>
            <p className="mt-1 text-xl font-bold text-foreground">
              {formatCurrency(totalGrossEarnings)}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <span className="text-xs font-medium text-muted-foreground">Total Deductions</span>
            <p className="mt-1 text-xl font-bold text-destructive">
              {formatCurrency(totalDeductions)}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-primary/30 bg-primary/5">
          <CardContent className="p-4">
            <span className="text-xs font-bold text-primary uppercase">Total Net Take-Home</span>
            <p className="mt-1 text-2xl font-extrabold text-primary">
              {formatCurrency(totalNetSalary)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 5. EXPORT CONFIGURATION & ACTIONS */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">4. Document Format & Export</CardTitle>
          <CardDescription>
            Choose your preferred PDF layout and download or preview
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Format Radio Selection */}
          <div className="grid gap-4 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setOutputMode("summary")}
              className={`flex items-start gap-3 rounded-lg border p-4 text-left transition-all ${
                outputMode === "summary"
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-border hover:bg-muted/50"
              }`}
            >
              <div className="mt-0.5 rounded-full p-2 bg-primary/10 text-primary">
                <FileText className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">Summary Statement</span>
                  <Badge variant="secondary" className="text-[10px]">
                    1 Page A4
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Consolidated multi-month summary statement with company header, breakdown table, total net salary, and signature. Perfect for bank loans and official submissions.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setOutputMode("detailed")}
              className={`flex items-start gap-3 rounded-lg border p-4 text-left transition-all ${
                outputMode === "detailed"
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-border hover:bg-muted/50"
              }`}
            >
              <div className="mt-0.5 rounded-full p-2 bg-primary/10 text-primary">
                <Layers className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">Detailed Monthly Slips</span>
                  <Badge variant="outline" className="text-[10px]">
                    Multi-Page A4
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Generates full individual A4 salary slips for every selected month in a single merged PDF document. Complete itemized earnings & deductions.
                </p>
              </div>
            </button>
          </div>

          {/* Optional Notes */}
          <div className="space-y-2">
            <Label htmlFor="multi_notes">Statement Note (Optional)</Label>
            <Input
              id="multi_notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Generated for Bank Loan Verification / Annual Review"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t">
            <div className="text-xs text-muted-foreground">
              {availableSelectedSlips.length > 0 ? (
                <span>
                  Ready to generate {outputMode === "summary" ? "1-page statement" : `${availableSelectedSlips.length}-page document`} for{" "}
                  <strong>{selectedEmployee?.full_name}</strong>
                </span>
              ) : (
                <span>Please select an employee and at least one recorded month</span>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {onBackToSingle && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onBackToSingle}
                  disabled={isGeneratingPdf}
                >
                  Back to Single Month
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => handleGeneratePdf("preview")}
                disabled={isGeneratingPdf || availableSelectedSlips.length === 0}
              >
                {isGeneratingPdf ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Eye className="mr-2 h-4 w-4" />
                )}
                Preview PDF
              </Button>
              <Button
                type="button"
                onClick={() => handleGeneratePdf("download")}
                disabled={isGeneratingPdf || availableSelectedSlips.length === 0}
              >
                {isGeneratingPdf ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Download {outputMode === "summary" ? "Summary PDF" : "All Slips PDF"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
