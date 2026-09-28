"use client"
/* eslint-disable */

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import {
  Company,
  SalarySlip,
  MultiMonthSummaryData,
  MultiMonthHistoryRow,
  BulkSalaryMonthItem,
  SalaryComponents,
  SalaryRevisionPeriod,
  DuplicateSalaryAction,
} from "@/types"
import { Employee } from "@/types/permissions"
import {
  bulkGenerateSalarySlips,
  getSalarySlipsByEmployee,
} from "@/services/salary-slips.service"
import { formatCurrency } from "@/lib/payment-status"
import { numberToWords } from "@/lib/number-to-words"
import { downloadPdfBlob, previewPdfBlob } from "@/lib/pdf-actions"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import {
  Calendar,
  Download,
  Eye,
  FileText,
  Layers,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Copy,
  Plus,
  Trash2,
  Edit3,
  ExternalLink,
  Printer,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from "lucide-react"

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

interface MultiMonthGeneratorProps {
  company: Company
  employees: Employee[]
  initialEmployeeId?: string
  onBackToSingle?: () => void
}

const DEFAULT_COMPONENTS: SalaryComponents = {
  basic_salary: 50000,
  hra: 0,
  conveyance: 0,
  medical_allowance: 0,
  special_allowance: 0,
  bonus: 0,
  overtime: 0,
  other_earnings: 0,
  pf: 0,
  professional_tax: 200,
  tds: 0,
  esic: 0,
  loan_deduction: 0,
  advance_deduction: 0,
  other_deduction: 0,
}

function calculateMonthTotals(comp: SalaryComponents) {
  const gross =
    Number(comp.basic_salary || 0) +
    Number(comp.hra || 0) +
    Number(comp.conveyance || 0) +
    Number(comp.medical_allowance || 0) +
    Number(comp.special_allowance || 0) +
    Number(comp.bonus || 0) +
    Number(comp.overtime || 0) +
    Number(comp.other_earnings || 0)

  const deductions =
    Number(comp.pf || 0) +
    Number(comp.professional_tax || 0) +
    Number(comp.tds || 0) +
    Number(comp.esic || 0) +
    Number(comp.loan_deduction || 0) +
    Number(comp.advance_deduction || 0) +
    Number(comp.other_deduction || 0)

  const net = Math.max(0, gross - deductions)
  return { gross, deductions, net }
}

export function MultiMonthSalarySlipGenerator({
  company,
  employees,
  initialEmployeeId,
  onBackToSingle,
}: MultiMonthGeneratorProps) {
  const router = useRouter()
  const { user } = useAuth()

  // 4 Steps: 1: Employee & Period, 2: Salary Configuration, 3: Review Breakdown, 4: Complete & Export
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)

  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const currentMonthIdx = currentDate.getMonth()

  // Default range: current year, e.g. March to December (10 months) or full year
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(
    initialEmployeeId || (employees.length > 0 ? employees[0].user_id : "")
  )
  const [rangeStartMonth, setRangeStartMonth] = useState<string>("March")
  const [rangeStartYear, setRangeStartYear] = useState<number>(currentYear)
  const [rangeEndMonth, setRangeEndMonth] = useState<string>("December")
  const [rangeEndYear, setRangeEndYear] = useState<number>(currentYear)

  // Existing records from DB
  const [existingSlips, setExistingSlips] = useState<SalarySlip[]>([])
  const [isLoadingExisting, setIsLoadingExisting] = useState<boolean>(false)
  const [globalDuplicatePolicy, setGlobalDuplicatePolicy] = useState<DuplicateSalaryAction>("keep")

  // Salary configuration state
  const [baseSalary, setBaseSalary] = useState<SalaryComponents>({ ...DEFAULT_COMPONENTS })
  const [showAdditionalEarnings, setShowAdditionalEarnings] = useState(false)
  const [showAdditionalDeductions, setShowAdditionalDeductions] = useState(false)

  // Salary revisions (Periods)
  const [revisions, setRevisions] = useState<SalaryRevisionPeriod[]>([])

  // The generated list of months with individual configurations
  const [monthItems, setMonthItems] = useState<BulkSalaryMonthItem[]>([])

  // Single-month edit modal state
  const [editingMonthIndex, setEditingMonthIndex] = useState<number | null>(null)
  const [editingDraft, setEditingDraft] = useState<BulkSalaryMonthItem | null>(null)

  // Statement Notes
  const [statementNote, setStatementNote] = useState<string>("")

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState<{
    current: number
    total: number
    month: string
    year: number
  } | null>(null)
  const [generatedSlips, setGeneratedSlips] = useState<SalarySlip[]>([])
  const [generationStats, setGenerationStats] = useState<{
    createdCount: number
    updatedCount: number
    keptCount: number
    skippedCount: number
  }>({ createdCount: 0, updatedCount: 0, keptCount: 0, skippedCount: 0 })

  // PDF Export state
  const [isExportingPdf, setIsExportingPdf] = useState(false)
  const [outputMode, setOutputMode] = useState<"summary" | "detailed">("summary")

  const selectedEmployee = useMemo(
    () => employees.find((e) => e.user_id === selectedEmployeeId) || null,
    [employees, selectedEmployeeId]
  )

  // Load existing salary slips for selected employee to detect duplicates
  useEffect(() => {
    async function loadExisting() {
      if (!selectedEmployeeId || !company.id) {
        setExistingSlips([])
        return
      }
      setIsLoadingExisting(true)
      try {
        const slips = await getSalarySlipsByEmployee(company.id, selectedEmployeeId, 100)
        setExistingSlips(slips)
      } catch {
        // silent fallback
        setExistingSlips([])
      } finally {
        setIsLoadingExisting(false)
      }
    }
    loadExisting()
  }, [selectedEmployeeId, company.id])

  // Helper to calculate months in range
  const rangeInfo = useMemo(() => {
    const sMonthIdx = MONTHS.indexOf(rangeStartMonth)
    const eMonthIdx = MONTHS.indexOf(rangeEndMonth)
    if (sMonthIdx === -1 || eMonthIdx === -1) {
      return { totalMonths: 0, isValid: false, startTotal: 0, endTotal: 0 }
    }

    const startTotal = rangeStartYear * 12 + sMonthIdx
    const endTotal = rangeEndYear * 12 + eMonthIdx

    if (startTotal > endTotal) {
      return { totalMonths: 0, isValid: false, startTotal, endTotal }
    }

    return {
      totalMonths: endTotal - startTotal + 1,
      isValid: true,
      startTotal,
      endTotal,
    }
  }, [rangeStartMonth, rangeStartYear, rangeEndMonth, rangeEndYear])

  // Sync / initialize month items when range or existingSlips change
  useEffect(() => {
    if (!rangeInfo.isValid) return

    const sMonthIdx = MONTHS.indexOf(rangeStartMonth)
    const items: BulkSalaryMonthItem[] = []

    for (let total = rangeInfo.startTotal; total <= rangeInfo.endTotal; total++) {
      const year = Math.floor(total / 12)
      const monthIdx = total % 12
      const month = MONTHS[monthIdx]
      const key = `${month}-${year}`

      // Check if existing slip exists in DB
      const existing = existingSlips.find(
        (s) =>
          s.salary_month.toLowerCase() === month.toLowerCase() &&
          Number(s.salary_year) === year
      ) || null

      // Check if we already have an item configured in state to preserve edits
      const current = monthItems.find((m) => m.key === key)

      const comp: SalaryComponents = current
        ? {
            basic_salary: current.basic_salary,
            hra: current.hra,
            conveyance: current.conveyance,
            medical_allowance: current.medical_allowance,
            special_allowance: current.special_allowance,
            bonus: current.bonus,
            overtime: current.overtime,
            other_earnings: current.other_earnings,
            pf: current.pf,
            professional_tax: current.professional_tax,
            tds: current.tds,
            esic: current.esic,
            loan_deduction: current.loan_deduction,
            advance_deduction: current.advance_deduction,
            other_deduction: current.other_deduction,
          }
        : existing
        ? {
            basic_salary: existing.basic_salary,
            hra: existing.hra,
            conveyance: existing.conveyance,
            medical_allowance: existing.medical_allowance,
            special_allowance: existing.special_allowance,
            bonus: existing.bonus,
            overtime: existing.overtime,
            other_earnings: existing.other_earnings,
            pf: existing.pf,
            professional_tax: existing.professional_tax,
            tds: existing.tds,
            esic: existing.esic,
            loan_deduction: existing.loan_deduction,
            advance_deduction: existing.advance_deduction,
            other_deduction: existing.other_deduction,
          }
        : { ...baseSalary }

      const { gross, deductions, net } = calculateMonthTotals(comp)

      items.push({
        month,
        year,
        monthIndex: monthIdx,
        key,
        label: `${month} ${year}`,
        shortLabel: `${month.slice(0, 3)} ${year}`,
        ...comp,
        gross_earnings: gross,
        total_deductions: deductions,
        net_salary: net,
        pay_date: current?.pay_date || existing?.pay_date || `${year}-${String(monthIdx + 1).padStart(2, "0")}-28`,
        payment_status: current?.payment_status || existing?.payment_status || "Paid",
        notes: current?.notes || existing?.notes || null,
        existingSlip: existing,
        duplicateAction: current?.duplicateAction || globalDuplicatePolicy,
      })
    }

    setMonthItems(items)
  }, [
    rangeInfo.isValid,
    rangeInfo.startTotal,
    rangeInfo.endTotal,
    rangeStartMonth,
    rangeStartYear,
    rangeEndMonth,
    rangeEndYear,
    existingSlips,
  ])

  // Presets
  const applyPreset = (preset: "last3" | "last6" | "last10" | "last12" | "fy" | "calendar") => {
    let sM = currentMonthIdx
    let sY = currentYear
    let eM = currentMonthIdx
    let eY = currentYear

    if (preset === "last3") {
      sM = (currentMonthIdx - 2 + 12) % 12
      sY = currentMonthIdx < 2 ? currentYear - 1 : currentYear
    } else if (preset === "last6") {
      sM = (currentMonthIdx - 5 + 12) % 12
      sY = currentMonthIdx < 5 ? currentYear - 1 : currentYear
    } else if (preset === "last10") {
      sM = (currentMonthIdx - 9 + 12) % 12
      sY = currentMonthIdx < 9 ? currentYear - 1 : currentYear
    } else if (preset === "last12") {
      sM = (currentMonthIdx - 11 + 12) % 12
      sY = currentMonthIdx < 11 ? currentYear - 1 : currentYear
    } else if (preset === "fy") {
      // Indian Financial Year: April to March
      const isPostApril = currentMonthIdx >= 3
      sY = isPostApril ? currentYear : currentYear - 1
      sM = 3 // April
      eY = isPostApril ? currentYear + 1 : currentYear
      eM = 2 // March
    } else if (preset === "calendar") {
      sM = 0 // January
      eM = 11 // December
      sY = currentYear
      eY = currentYear
    }

    setRangeStartMonth(MONTHS[sM])
    setRangeStartYear(sY)
    setRangeEndMonth(MONTHS[eM])
    setRangeEndYear(eY)
    toast.info(`Period set: ${MONTHS[sM]} ${sY} → ${MONTHS[eM]} ${eY}`)
  }

  // Count existing conflicts in range
  const existingConflicts = useMemo(() => {
    return monthItems.filter((m) => m.existingSlip !== null)
  }, [monthItems])

  // Apply Base Salary across all selected months (Requirement #5 & #8)
  const handleApplyBaseToAll = () => {
    const updated = monthItems.map((item) => {
      const comp = { ...baseSalary }
      const { gross, deductions, net } = calculateMonthTotals(comp)
      return {
        ...item,
        ...comp,
        gross_earnings: gross,
        total_deductions: deductions,
        net_salary: net,
      }
    })
    setMonthItems(updated)
    toast.success(`Applied ₹${Number(baseSalary.basic_salary).toLocaleString("en-IN")} basic salary to all ${monthItems.length} months`)
  }

  // Add Salary Revision Period (Requirement #6 & #19)
  const handleAddRevision = () => {
    const newRev: SalaryRevisionPeriod = {
      id: `rev-${Date.now()}`,
      fromMonth: rangeStartMonth,
      fromYear: rangeStartYear,
      toMonth: rangeEndMonth,
      toYear: rangeEndYear,
      basic_salary: 65000,
      hra: 0,
      conveyance: 0,
      medical_allowance: 0,
      special_allowance: 0,
      bonus: 0,
      overtime: 0,
      other_earnings: 0,
      pf: 0,
      professional_tax: 200,
      tds: 0,
      esic: 0,
      loan_deduction: 0,
      advance_deduction: 0,
      other_deduction: 0,
      label: `Revision ${revisions.length + 1}`,
    }
    setRevisions([...revisions, newRev])
    toast.info("Added new salary revision period")
  }

  const handleRemoveRevision = (id: string) => {
    setRevisions(revisions.filter((r) => r.id !== id))
  }

  const handleUpdateRevision = (id: string, updates: Partial<SalaryRevisionPeriod>) => {
    setRevisions(
      revisions.map((r) => (r.id === id ? { ...r, ...updates } : r))
    )
  }

  // Apply Revisions to Months
  const handleApplyRevisions = () => {
    if (revisions.length === 0) {
      toast.info("No salary revisions added yet")
      return
    }

    const updated = monthItems.map((item) => {
      const monthTotal = item.year * 12 + item.monthIndex
      // Find matching revision (latest matching revision wins)
      const matchingRev = [...revisions].reverse().find((rev) => {
        const fromIdx = MONTHS.indexOf(rev.fromMonth)
        const toIdx = MONTHS.indexOf(rev.toMonth)
        const revStart = rev.fromYear * 12 + fromIdx
        const revEnd = rev.toYear * 12 + toIdx
        return monthTotal >= revStart && monthTotal <= revEnd
      })

      if (matchingRev) {
        const comp: SalaryComponents = {
          basic_salary: matchingRev.basic_salary,
          hra: matchingRev.hra,
          conveyance: matchingRev.conveyance,
          medical_allowance: matchingRev.medical_allowance,
          special_allowance: matchingRev.special_allowance,
          bonus: matchingRev.bonus,
          overtime: matchingRev.overtime,
          other_earnings: matchingRev.other_earnings,
          pf: matchingRev.pf,
          professional_tax: matchingRev.professional_tax,
          tds: matchingRev.tds,
          esic: matchingRev.esic,
          loan_deduction: matchingRev.loan_deduction,
          advance_deduction: matchingRev.advance_deduction,
          other_deduction: matchingRev.other_deduction,
        }
        const { gross, deductions, net } = calculateMonthTotals(comp)
        return {
          ...item,
          ...comp,
          gross_earnings: gross,
          total_deductions: deductions,
          net_salary: net,
        }
      }
      return item
    })

    setMonthItems(updated)
    toast.success("Applied salary revisions to matching months")
  }

  // Copy Previous Month (Requirement #9)
  const handleCopyPreviousMonth = (targetIndex: number) => {
    if (targetIndex <= 0 || targetIndex >= monthItems.length) return
    const prev = monthItems[targetIndex - 1]
    const target = monthItems[targetIndex]

    const comp: SalaryComponents = {
      basic_salary: prev.basic_salary,
      hra: prev.hra,
      conveyance: prev.conveyance,
      medical_allowance: prev.medical_allowance,
      special_allowance: prev.special_allowance,
      bonus: prev.bonus,
      overtime: prev.overtime,
      other_earnings: prev.other_earnings,
      pf: prev.pf,
      professional_tax: prev.professional_tax,
      tds: prev.tds,
      esic: prev.esic,
      loan_deduction: prev.loan_deduction,
      advance_deduction: prev.advance_deduction,
      other_deduction: prev.other_deduction,
    }
    const { gross, deductions, net } = calculateMonthTotals(comp)

    const updated = [...monthItems]
    updated[targetIndex] = {
      ...target,
      ...comp,
      gross_earnings: gross,
      total_deductions: deductions,
      net_salary: net,
    }
    setMonthItems(updated)
    toast.success(`Copied configuration from ${prev.shortLabel} to ${target.shortLabel}`)
  }

  // Open single month edit modal (Requirement #7 & #21)
  const handleOpenMonthEdit = (index: number) => {
    setEditingMonthIndex(index)
    setEditingDraft({ ...monthItems[index] })
  }

  const handleSaveMonthEdit = () => {
    if (editingMonthIndex === null || !editingDraft) return
    const { gross, deductions, net } = calculateMonthTotals(editingDraft)
    const updated = [...monthItems]
    updated[editingMonthIndex] = {
      ...editingDraft,
      gross_earnings: gross,
      total_deductions: deductions,
      net_salary: net,
    }
    setMonthItems(updated)
    toast.success(`Updated salary details for ${editingDraft.label}`)
    setEditingMonthIndex(null)
    setEditingDraft(null)
  }

  // Update duplicate action for a specific month
  const handleDuplicateActionChange = (index: number, action: DuplicateSalaryAction) => {
    const updated = [...monthItems]
    updated[index].duplicateAction = action
    setMonthItems(updated)
  }

  // Update global duplicate action
  const handleGlobalDuplicateChange = (action: DuplicateSalaryAction) => {
    setGlobalDuplicatePolicy(action)
    const updated = monthItems.map((m) =>
      m.existingSlip ? { ...m, duplicateAction: action } : m
    )
    setMonthItems(updated)
  }

  // Totals calculations
  const activeMonths = useMemo(() => {
    return monthItems.filter((m) => !m.existingSlip || m.duplicateAction !== "skip")
  }, [monthItems])

  const totalBasicSalary = useMemo(
    () => activeMonths.reduce((sum, m) => sum + Number(m.basic_salary || 0), 0),
    [activeMonths]
  )
  const totalGrossEarnings = useMemo(
    () => activeMonths.reduce((sum, m) => sum + Number(m.gross_earnings || 0), 0),
    [activeMonths]
  )
  const totalDeductions = useMemo(
    () => activeMonths.reduce((sum, m) => sum + Number(m.total_deductions || 0), 0),
    [activeMonths]
  )
  const totalNetSalary = useMemo(
    () => activeMonths.reduce((sum, m) => sum + Number(m.net_salary || 0), 0),
    [activeMonths]
  )
  const netInWords = useMemo(
    () => numberToWords(Math.round(totalNetSalary)),
    [totalNetSalary]
  )

  const periodDisplay = useMemo(() => {
    if (activeMonths.length === 0) return "—"
    if (activeMonths.length === 1) return activeMonths[0].label
    const first = activeMonths[0]
    const last = activeMonths[activeMonths.length - 1]
    return `${first.label} – ${last.label}`
  }, [activeMonths])

  // Count planned new vs kept vs updated
  const planSummary = useMemo(() => {
    let newCount = 0
    let keepCount = 0
    let updateCount = 0
    let skipCount = 0

    monthItems.forEach((m) => {
      if (!m.existingSlip) {
        newCount++
      } else if (m.duplicateAction === "keep") {
        keepCount++
      } else if (m.duplicateAction === "update") {
        updateCount++
      } else if (m.duplicateAction === "skip") {
        skipCount++
      }
    })

    return { newCount, keepCount, updateCount, skipCount, totalSelected: monthItems.length }
  }, [monthItems])

  // Step 4: Execute Bulk Generation (Requirement #10 & #13)
  const handleExecuteGeneration = async () => {
    if (!selectedEmployee) {
      toast.error("Please select an employee first")
      return
    }
    if (monthItems.length === 0) {
      toast.error("No months selected for generation")
      return
    }

    setIsGenerating(true)
    setStep(4)
    setGenerationProgress({
      current: 0,
      total: monthItems.length,
      month: monthItems[0].month,
      year: monthItems[0].year,
    })

    try {
      const result = await bulkGenerateSalarySlips({
        companyId: company.id,
        employee: selectedEmployee,
        items: monthItems,
        userId: user?.id,
        onProgress: (current, total, month, year) => {
          setGenerationProgress({ current, total, month, year })
        },
      })

      setGeneratedSlips(result.slips)
      setGenerationStats({
        createdCount: result.createdCount,
        updatedCount: result.updatedCount,
        keptCount: result.keptCount,
        skippedCount: result.skippedCount,
      })

      toast.success(
        `Bulk generation completed! ${result.createdCount} slips created, ${result.keptCount} existing kept.`
      )
    } catch (error) {
      console.error("Bulk generation error:", error)
      toast.error(
        error instanceof Error ? error.message : "Failed to generate salary slips"
      )
      // Stay on step 3 if failed
      setStep(3)
    } finally {
      setIsGenerating(false)
      setGenerationProgress(null)
    }
  }

  // Handle PDF Download / Preview (Requirement #15 & #16)
  const handleExportPdf = async (action: "preview" | "download", exportMode: "summary" | "detailed") => {
    if (!selectedEmployee) {
      toast.error("No employee selected")
      return
    }

    const slipsToExport = generatedSlips.length > 0
      ? generatedSlips
      : activeMonths.map((m, idx) => ({
          id: m.existingSlip?.id || `temp-${idx}`,
          company_id: company.id,
          employee_id: selectedEmployee.user_id,
          employee_name: selectedEmployee.full_name,
          employee_code: selectedEmployee.employee_code || null,
          designation: selectedEmployee.designation || null,
          department: selectedEmployee.department || null,
          joining_date: selectedEmployee.joining_date || null,
          bank_name: selectedEmployee.bank_name || null,
          bank_account_number: selectedEmployee.bank_account_number || null,
          bank_ifsc: selectedEmployee.bank_ifsc || null,
          pan_number: selectedEmployee.pan_number || null,
          uan_number: selectedEmployee.uan_number || null,
          pf_number: selectedEmployee.pf_number || null,
          salary_slip_number: m.existingSlip?.salary_slip_number || `SAL-${m.year}-${String(m.monthIndex + 1).padStart(2, "0")}-000${idx + 1}`,
          salary_month: m.month,
          salary_year: m.year,
          pay_date: m.pay_date,
          basic_salary: m.basic_salary,
          hra: m.hra,
          conveyance: m.conveyance,
          medical_allowance: m.medical_allowance,
          special_allowance: m.special_allowance,
          bonus: m.bonus,
          overtime: m.overtime,
          other_earnings: m.other_earnings,
          gross_earnings: m.gross_earnings,
          pf: m.pf,
          professional_tax: m.professional_tax,
          tds: m.tds,
          esic: m.esic,
          loan_deduction: m.loan_deduction,
          advance_deduction: m.advance_deduction,
          other_deduction: m.other_deduction,
          total_deductions: m.total_deductions,
          net_salary: m.net_salary,
          amount_in_words: numberToWords(Math.round(m.net_salary)),
          notes: m.notes || null,
          payment_status: m.payment_status,
          payment_mode: null,
          payment_date: null,
          created_by: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as SalarySlip))

    if (slipsToExport.length === 0) {
      toast.error("No salary slips available to export")
      return
    }

    setIsExportingPdf(true)
    const toastId = toast.loading(
      action === "preview"
        ? `Preparing ${exportMode === "summary" ? "Summary Statement" : "Multi-Page Slips"} preview...`
        : `Generating ${exportMode === "summary" ? "Summary Statement" : "Multi-Page Slips"} PDF...`
    )

    try {
      const summaryRows: MultiMonthHistoryRow[] = slipsToExport.map((s) => ({
        month: s.salary_month,
        year: s.salary_year,
        monthDisplay: `${s.salary_month.slice(0, 3)} ${s.salary_year}`,
        basicSalary: Number(s.basic_salary || 0),
        grossEarnings: Number(s.gross_earnings || 0),
        totalDeductions: Number(s.total_deductions || 0),
        netSalary: Number(s.net_salary || 0),
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
        monthsCount: slipsToExport.length,
        rows: summaryRows,
        totalBasicSalary,
        totalGrossEarnings,
        totalDeductions,
        totalNetSalary,
        amountInWords: netInWords,
        notes: statementNote.trim() || null,
      }

      const { pdf } = await import("@react-pdf/renderer")
      const { MultiMonthSalarySlipPDF } = await import("@/components/pdf/MultiMonthSalarySlipPDF")

      const blob = await pdf(
        <MultiMonthSalarySlipPDF
          summary={summaryData}
          company={company}
          mode={exportMode}
          detailedSlips={slipsToExport}
        />
      ).toBlob()

      const sanitizedEmp = selectedEmployee.full_name.replace(/\s+/g, "_")
      const sanitizedPeriod = periodDisplay.replace(/\s+/g, "_")
      const filename =
        exportMode === "summary"
          ? `Salary_Statement_${sanitizedEmp}_${sanitizedPeriod}.pdf`
          : `Salary_Slips_${sanitizedEmp}_${sanitizedPeriod}.pdf`

      if (action === "preview") {
        await previewPdfBlob(blob)
        toast.success("PDF opened in new tab", { id: toastId })
      } else {
        await downloadPdfBlob(blob, filename)
        toast.success("PDF downloaded successfully", { id: toastId })
      }
    } catch (error) {
      console.error("PDF export error:", error)
      toast.error(
        error instanceof Error ? error.message : "Failed to generate PDF",
        { id: toastId }
      )
    } finally {
      setIsExportingPdf(false)
    }
  }

  // Reset to start a new bulk run
  const handleReset = () => {
    setStep(1)
    setGeneratedSlips([])
    setGenerationStats({ createdCount: 0, updatedCount: 0, keptCount: 0, skippedCount: 0 })
  }

  return (
    <div className="space-y-6">
      {/* STEP PROGRESS BAR */}
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto">
          {[
            { num: 1, title: "1. Employee & Period" },
            { num: 2, title: "2. Salary Configuration" },
            { num: 3, title: "3. Review Breakdown" },
            { num: 4, title: "4. Generate & Export" },
          ].map((s) => (
            <button
              key={s.num}
              type="button"
              onClick={() => {
                if (s.num <= 3 && step !== 4 && !isGenerating) {
                  setStep(s.num as any)
                }
              }}
              disabled={isGenerating || (step === 4 && s.num < 4)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                step === s.num
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : step > s.num
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              <span>{s.num}</span>
              <span className="hidden sm:inline">{s.title.slice(3)}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {onBackToSingle && step < 4 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onBackToSingle}
              className="text-xs text-muted-foreground"
            >
              <ArrowLeft className="mr-1 h-3.5 w-3.5" />
              Single Slip
            </Button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* STEP 1: EMPLOYEE & PERIOD (Requirement #3, #4, #12)                       */}
      {/* ========================================================================= */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            {/* EMPLOYEE SELECTOR */}
            <Card className="shadow-sm md:col-span-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">1. Select Employee</CardTitle>
                <CardDescription>
                  Choose employee for direct bulk salary slip generation
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
                  <div className="rounded-lg border bg-muted/40 p-4 space-y-2.5 text-xs">
                    <div className="flex justify-between items-center pb-1 border-b">
                      <span className="font-semibold text-sm text-foreground">
                        {selectedEmployee.full_name}
                      </span>
                      {selectedEmployee.employee_code && (
                        <Badge variant="outline" className="font-mono text-[10px]">
                          {selectedEmployee.employee_code}
                        </Badge>
                      )}
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Joining Date:</span>
                      <span className="font-medium text-foreground">
                        {selectedEmployee.joining_date || "—"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">PAN Number:</span>
                      <span className="font-medium font-mono text-foreground">
                        {selectedEmployee.pan_number || "—"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Designation:</span>
                      <span className="font-medium text-foreground">
                        {selectedEmployee.designation || "—"}
                      </span>
                    </div>
                    <div className="flex justify-between pt-1 border-t">
                      <span className="text-muted-foreground">Existing Salary Slips:</span>
                      <Badge variant="outline" className="font-mono text-[11px]">
                        {isLoadingExisting ? "Scanning DB..." : `${existingSlips.length} found`}
                      </Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* MONTH RANGE & PRESETS (Requirement #2 & #4) */}
            <Card className="shadow-sm md:col-span-2">
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-base font-semibold">2. Select Period Range</CardTitle>
                    <CardDescription>
                      Support any custom month range (2, 3, 6, 10, 12 months)
                    </CardDescription>
                  </div>
                  {/* Quick Presets */}
                  <div className="flex flex-wrap gap-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => applyPreset("last3")}
                      className="h-7 text-xs"
                    >
                      Last 3 Mos
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => applyPreset("last6")}
                      className="h-7 text-xs"
                    >
                      Last 6 Mos
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => applyPreset("last10")}
                      className="h-7 text-xs"
                    >
                      Last 10 Mos
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => applyPreset("last12")}
                      className="h-7 text-xs font-medium"
                    >
                      12 Months (Full Year)
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => applyPreset("fy")}
                      className="h-7 text-xs"
                    >
                      Financial Year
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* From Month & Year */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">From Month & Year</Label>
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

                  {/* To Month & Year */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">To Month & Year</Label>
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

                {/* DYNAMIC MONTH COUNT DISPLAY (Requirement #2 & #4) */}
                <div className="pt-3 border-t space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-primary text-primary-foreground font-bold px-3 py-1 text-sm">
                        {rangeInfo.totalMonths} months selected
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        ({rangeStartMonth} {rangeStartYear} → {rangeEndMonth} {rangeEndYear})
                      </span>
                    </div>
                  </div>

                  {/* Month Chips preview */}
                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1">
                    {monthItems.map((m) => (
                      <span
                        key={m.key}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border ${
                          m.existingSlip
                            ? "bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950/40 dark:text-amber-200"
                            : "bg-emerald-50 text-emerald-900 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-200"
                        }`}
                      >
                        <span>{m.shortLabel}</span>
                        {m.existingSlip ? (
                          <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400">
                            (Exists)
                          </span>
                        ) : (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                            (New)
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* DUPLICATE PROTECTION NOTICE (Requirement #12) */}
          {existingConflicts.length > 0 && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-lg border border-amber-300 bg-amber-50/70 p-4 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold">
                    Duplicate Notice: {existingConflicts.length} of {monthItems.length} months already have salary slips
                  </h4>
                  <p className="text-xs text-amber-800 dark:text-amber-300">
                    Existing slips found for:{" "}
                    <strong>{existingConflicts.map((m) => m.label).join(", ")}</strong>.
                    Choose how the system should handle these records.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Label className="text-xs whitespace-nowrap">Default Action:</Label>
                <Select
                  value={globalDuplicatePolicy}
                  onValueChange={(val) => val && handleGlobalDuplicateChange(val as DuplicateSalaryAction)}
                >
                  <SelectTrigger className="w-[170px] bg-background text-foreground h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="keep">Keep Existing</SelectItem>
                    <SelectItem value="update">Update Existing</SelectItem>
                    <SelectItem value="skip">Skip Existing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Step 1 Actions */}
          <div className="flex justify-end pt-2">
            <Button
              type="button"
              onClick={() => setStep(2)}
              disabled={!selectedEmployee || !rangeInfo.isValid || monthItems.length === 0}
              className="gap-2"
            >
              Continue to Salary Configuration
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: SALARY CONFIGURATION & REVISIONS (Requirement #5, #6, #19, #20)   */}
      {/* ========================================================================= */}
      {step === 2 && (
        <div className="space-y-6">
          {/* BASE / DEFAULT SALARY CONFIGURATION */}
          <Card className="shadow-sm border-primary/20">
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base font-semibold">
                    Base Salary Configuration
                  </CardTitle>
                  <CardDescription>
                    Define default monthly salary values to apply across all {monthItems.length} selected months
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  onClick={handleApplyBaseToAll}
                  className="bg-primary text-primary-foreground text-xs h-8"
                >
                  <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                  Apply to All {monthItems.length} Selected Months
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Basic Salary (₹) *</Label>
                  <Input
                    type="number"
                    value={baseSalary.basic_salary}
                    onChange={(e) =>
                      setBaseSalary({ ...baseSalary, basic_salary: Number(e.target.value) })
                    }
                    placeholder="50000"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Professional Tax (PT ₹)</Label>
                  <Input
                    type="number"
                    value={baseSalary.professional_tax}
                    onChange={(e) =>
                      setBaseSalary({ ...baseSalary, professional_tax: Number(e.target.value) })
                    }
                    placeholder="200"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">House Rent Allowance (HRA ₹)</Label>
                  <Input
                    type="number"
                    value={baseSalary.hra}
                    onChange={(e) =>
                      setBaseSalary({ ...baseSalary, hra: Number(e.target.value) })
                    }
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Provident Fund (PF ₹)</Label>
                  <Input
                    type="number"
                    value={baseSalary.pf}
                    onChange={(e) =>
                      setBaseSalary({ ...baseSalary, pf: Number(e.target.value) })
                    }
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Collapsible Additional Earnings & Deductions */}
              <div className="space-y-3 pt-2">
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAdditionalEarnings(!showAdditionalEarnings)}
                    className="h-7 text-xs"
                  >
                    {showAdditionalEarnings ? <ChevronUp className="mr-1 h-3.5 w-3.5" /> : <ChevronDown className="mr-1 h-3.5 w-3.5" />}
                    {showAdditionalEarnings ? "Hide" : "Show"} More Earnings (Bonus, Overtime, Medical...)
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAdditionalDeductions(!showAdditionalDeductions)}
                    className="h-7 text-xs"
                  >
                    {showAdditionalDeductions ? <ChevronUp className="mr-1 h-3.5 w-3.5" /> : <ChevronDown className="mr-1 h-3.5 w-3.5" />}
                    {showAdditionalDeductions ? "Hide" : "Show"} More Deductions (TDS, ESIC, Loans...)
                  </Button>
                </div>

                {showAdditionalEarnings && (
                  <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-5 p-3 rounded-lg border bg-muted/20 text-xs">
                    <div className="space-y-1">
                      <Label className="text-[11px]">Conveyance</Label>
                      <Input
                        type="number"
                        value={baseSalary.conveyance}
                        onChange={(e) => setBaseSalary({ ...baseSalary, conveyance: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px]">Medical Allowance</Label>
                      <Input
                        type="number"
                        value={baseSalary.medical_allowance}
                        onChange={(e) => setBaseSalary({ ...baseSalary, medical_allowance: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px]">Special Allowance</Label>
                      <Input
                        type="number"
                        value={baseSalary.special_allowance}
                        onChange={(e) => setBaseSalary({ ...baseSalary, special_allowance: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px]">Bonus</Label>
                      <Input
                        type="number"
                        value={baseSalary.bonus}
                        onChange={(e) => setBaseSalary({ ...baseSalary, bonus: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px]">Overtime</Label>
                      <Input
                        type="number"
                        value={baseSalary.overtime}
                        onChange={(e) => setBaseSalary({ ...baseSalary, overtime: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                )}

                {showAdditionalDeductions && (
                  <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-5 p-3 rounded-lg border bg-muted/20 text-xs">
                    <div className="space-y-1">
                      <Label className="text-[11px]">TDS</Label>
                      <Input
                        type="number"
                        value={baseSalary.tds}
                        onChange={(e) => setBaseSalary({ ...baseSalary, tds: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px]">ESIC</Label>
                      <Input
                        type="number"
                        value={baseSalary.esic}
                        onChange={(e) => setBaseSalary({ ...baseSalary, esic: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px]">Loan Deduction</Label>
                      <Input
                        type="number"
                        value={baseSalary.loan_deduction}
                        onChange={(e) => setBaseSalary({ ...baseSalary, loan_deduction: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px]">Advance Deduction</Label>
                      <Input
                        type="number"
                        value={baseSalary.advance_deduction}
                        onChange={(e) => setBaseSalary({ ...baseSalary, advance_deduction: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px]">Other Deduction</Label>
                      <Input
                        type="number"
                        value={baseSalary.other_deduction}
                        onChange={(e) => setBaseSalary({ ...baseSalary, other_deduction: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Calculated Monthly Take-Home preview */}
              {(() => {
                const { gross, deductions, net } = calculateMonthTotals(baseSalary)
                return (
                  <div className="flex flex-wrap items-center justify-between gap-4 p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs">
                    <span className="text-muted-foreground">
                      Base Monthly Breakdown:
                    </span>
                    <div className="flex flex-wrap items-center gap-4">
                      <span>Gross: <strong>{formatCurrency(gross)}</strong></span>
                      <span className="text-destructive">Deductions: <strong>{formatCurrency(deductions)}</strong></span>
                      <span className="text-primary font-bold text-sm">
                        Net Take-Home: {formatCurrency(net)}
                      </span>
                    </div>
                  </div>
                )
              })()}
            </CardContent>
          </Card>

          {/* MID-PERIOD SALARY CHANGES / REVISIONS (Requirement #6 & #19) */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base font-semibold">
                    Mid-Period Salary Changes & Revisions
                  </CardTitle>
                  <CardDescription>
                    Add salary revisions if compensation changed during the period (e.g. ₹50,000 for Mar–May, revised to ₹65,000 for Jun–Dec)
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddRevision}
                    className="h-8 text-xs"
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    Add Salary Revision
                  </Button>
                  {revisions.length > 0 && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleApplyRevisions}
                      className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                      Apply Revisions to Months
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {revisions.length === 0 ? (
                <div className="text-center py-6 border border-dashed rounded-lg text-muted-foreground text-xs space-y-1">
                  <p className="font-medium text-foreground">No salary revisions configured</p>
                  <p>Salary is currently set the same across all months. If the employee had a salary increase or revision during this period, click "Add Salary Revision" above.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {revisions.map((rev, index) => (
                    <div
                      key={rev.id}
                      className="p-4 rounded-lg border bg-muted/30 space-y-3 relative"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="font-semibold text-xs">
                            Period #{index + 1}
                          </Badge>
                          <span className="text-xs font-medium text-muted-foreground">
                            {rev.fromMonth} {rev.fromYear} → {rev.toMonth} {rev.toYear}
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveRevision(rev.id)}
                          className="h-6 w-6 text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                        {/* From Month & Year */}
                        <div className="space-y-1">
                          <Label className="text-[11px] text-muted-foreground">From</Label>
                          <div className="flex gap-1.5">
                            <Select
                              value={rev.fromMonth}
                              onValueChange={(val) => val && handleUpdateRevision(rev.id, { fromMonth: val })}
                            >
                              <SelectTrigger className="w-[60%] h-8 text-xs">
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
                              value={rev.fromYear}
                              onChange={(e) => handleUpdateRevision(rev.id, { fromYear: Number(e.target.value) })}
                              className="w-[40%] h-8 text-xs"
                            />
                          </div>
                        </div>

                        {/* To Month & Year */}
                        <div className="space-y-1">
                          <Label className="text-[11px] text-muted-foreground">To</Label>
                          <div className="flex gap-1.5">
                            <Select
                              value={rev.toMonth}
                              onValueChange={(val) => val && handleUpdateRevision(rev.id, { toMonth: val })}
                            >
                              <SelectTrigger className="w-[60%] h-8 text-xs">
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
                              value={rev.toYear}
                              onChange={(e) => handleUpdateRevision(rev.id, { toYear: Number(e.target.value) })}
                              className="w-[40%] h-8 text-xs"
                            />
                          </div>
                        </div>

                        {/* Revised Basic Salary */}
                        <div className="space-y-1">
                          <Label className="text-[11px] text-muted-foreground">Revised Basic (₹)</Label>
                          <Input
                            type="number"
                            value={rev.basic_salary}
                            onChange={(e) => handleUpdateRevision(rev.id, { basic_salary: Number(e.target.value) })}
                            className="h-8 text-xs font-semibold"
                          />
                        </div>

                        {/* Revised PT */}
                        <div className="space-y-1">
                          <Label className="text-[11px] text-muted-foreground">Professional Tax (₹)</Label>
                          <Input
                            type="number"
                            value={rev.professional_tax}
                            onChange={(e) => handleUpdateRevision(rev.id, { professional_tax: Number(e.target.value) })}
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Step 2 Actions */}
          <div className="flex justify-between pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(1)}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Period
            </Button>
            <Button
              type="button"
              onClick={() => setStep(3)}
              className="gap-2"
            >
              Review Monthly Breakdown
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 3: REVIEW MONTHLY BREAKDOWN & OVERRIDES (Requirement #7, #8, #9, #13) */}
      {/* ========================================================================= */}
      {step === 3 && (
        <div className="space-y-6">
          {/* Header Controls */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-lg border bg-card">
            <div>
              <h3 className="text-base font-semibold text-foreground">
                3. Month-Wise Editable Preview
              </h3>
              <p className="text-xs text-muted-foreground">
                Review breakdown, modify individual months (e.g. bonuses or revisions), or copy preceding months
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleApplyBaseToAll}
                className="h-8 text-xs"
              >
                Reset All to Base
              </Button>
              {revisions.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleApplyRevisions}
                  className="h-8 text-xs"
                >
                  Re-apply Revisions
                </Button>
              )}
            </div>
          </div>

          {/* TABLE OF MONTHS */}
          <Card className="shadow-sm">
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 text-xs">
                    <TableHead className="w-[160px]">Month & Year</TableHead>
                    <TableHead className="text-right">Basic Salary</TableHead>
                    <TableHead className="text-right">Gross Earnings</TableHead>
                    <TableHead className="text-right">Deductions</TableHead>
                    <TableHead className="text-right font-bold">Net Salary</TableHead>
                    <TableHead className="w-[180px] text-center">Status / Duplicate Action</TableHead>
                    <TableHead className="w-[160px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthItems.map((m, idx) => (
                    <TableRow
                      key={m.key}
                      className={
                        m.existingSlip && m.duplicateAction === "skip"
                          ? "opacity-50 bg-muted/30"
                          : m.existingSlip
                          ? "bg-amber-50/40 dark:bg-amber-950/10"
                          : undefined
                      }
                    >
                      <TableCell className="font-medium text-xs">
                        <div className="flex items-center gap-1.5">
                          <span>{m.label}</span>
                          {m.bonus > 0 && (
                            <Badge variant="secondary" className="text-[10px] px-1 py-0 bg-emerald-100 text-emerald-800">
                              +Bonus
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium text-xs">
                        {formatCurrency(m.basic_salary)}
                      </TableCell>
                      <TableCell className="text-right font-medium text-xs">
                        {formatCurrency(m.gross_earnings)}
                      </TableCell>
                      <TableCell className="text-right font-medium text-xs text-destructive">
                        {formatCurrency(m.total_deductions)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-xs text-primary">
                        {formatCurrency(m.net_salary)}
                      </TableCell>

                      {/* Status / Duplicate Selector (Requirement #12) */}
                      <TableCell className="text-center">
                        {m.existingSlip ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <Select
                              value={m.duplicateAction}
                              onValueChange={(val) =>
                                val && handleDuplicateActionChange(idx, val as DuplicateSalaryAction)
                              }
                            >
                              <SelectTrigger className="h-7 text-[11px] w-[130px] border-amber-300 bg-amber-50 text-amber-900">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="keep">Keep Existing</SelectItem>
                                <SelectItem value="update">Update Existing</SelectItem>
                                <SelectItem value="skip">Skip Month</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]"
                          >
                            New Slip
                          </Badge>
                        )}
                      </TableCell>

                      {/* Row Actions: Edit Month & Copy Previous (Requirement #7 & #9) */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {idx > 0 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyPreviousMonth(idx)}
                              title={`Copy from ${monthItems[idx - 1].shortLabel}`}
                              className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                            >
                              <Copy className="h-3 w-3 mr-1" />
                              Copy Prev
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenMonthEdit(idx)}
                            className="h-7 px-2 text-[11px] text-primary"
                          >
                            <Edit3 className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}

                  {/* Totals Row */}
                  <TableRow className="bg-muted/70 font-bold border-t-2 border-primary/20">
                    <TableCell className="font-bold text-foreground text-xs">
                      TOTAL ({activeMonths.length} Months)
                    </TableCell>
                    <TableCell className="text-right text-foreground font-bold text-xs">
                      {formatCurrency(totalBasicSalary)}
                    </TableCell>
                    <TableCell className="text-right text-foreground font-bold text-xs">
                      {formatCurrency(totalGrossEarnings)}
                    </TableCell>
                    <TableCell className="text-right text-destructive font-bold text-xs">
                      {formatCurrency(totalDeductions)}
                    </TableCell>
                    <TableCell className="text-right text-primary font-extrabold text-sm">
                      {formatCurrency(totalNetSalary)}
                    </TableCell>
                    <TableCell colSpan={2} />
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* TOTAL SUMMARY CARDS */}
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

          {/* BULK GENERATION SUMMARY BOX (Requirement #13) */}
          <Card className="shadow-sm border-primary/20 bg-muted/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Bulk Generation Summary</CardTitle>
              <CardDescription>
                Verification of planned payroll records before saving to the database
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 text-xs">
                <div>
                  <span className="text-muted-foreground">Employee:</span>
                  <p className="font-semibold text-foreground text-sm">
                    {selectedEmployee?.full_name}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Period:</span>
                  <p className="font-semibold text-foreground text-sm">
                    {periodDisplay}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Months:</span>
                  <p className="font-semibold text-foreground text-sm">
                    {monthItems.length} ({planSummary.newCount} new, {planSummary.keepCount} keep, {planSummary.updateCount} update)
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Salary Configurations:</span>
                  <p className="font-semibold text-foreground text-sm">
                    {revisions.length > 0 ? `${revisions.length + 1} salary periods` : "1 uniform salary"}
                  </p>
                </div>
              </div>

              {/* Optional Statement Note */}
              <div className="space-y-1.5 pt-2 border-t">
                <Label htmlFor="statement_note" className="text-xs">
                  Statement Note for PDF (Optional)
                </Label>
                <Input
                  id="statement_note"
                  value={statementNote}
                  onChange={(e) => setStatementNote(e.target.value)}
                  placeholder="e.g. Generated for Bank Loan Verification / Official Salary Statement"
                  className="text-xs h-8"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(2)}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Salary Config
                </Button>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleExportPdf("preview", "summary")}
                    disabled={activeMonths.length === 0 || isExportingPdf}
                    className="text-xs"
                  >
                    <Eye className="mr-1.5 h-3.5 w-3.5" />
                    Preview Statement PDF
                  </Button>
                  <Button
                    type="button"
                    onClick={handleExecuteGeneration}
                    disabled={activeMonths.length === 0 || isGenerating}
                    className="bg-primary text-primary-foreground font-semibold px-6 gap-2"
                  >
                    <Sparkles className="h-4 w-4" />
                    Generate {activeMonths.length} Salary Slips
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 4: GENERATION COMPLETE & PDF HUB (Requirement #14, #15, #16)         */}
      {/* ========================================================================= */}
      {step === 4 && (
        <div className="space-y-6">
          {isGenerating ? (
            <Card className="shadow-sm py-12 text-center space-y-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
              <div className="space-y-1.5">
                <h3 className="text-lg font-bold">
                  Generating Monthly Salary Records...
                </h3>
                {generationProgress && (
                  <p className="text-sm text-muted-foreground">
                    Processing {generationProgress.month} {generationProgress.year} ({generationProgress.current} of {generationProgress.total})
                  </p>
                )}
              </div>
              <div className="max-w-md mx-auto w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="bg-primary h-full transition-all duration-300"
                  style={{
                    width: generationProgress
                      ? `${(generationProgress.current / generationProgress.total) * 100}%`
                      : "0%",
                  }}
                />
              </div>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* SUCCESS BANNER */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100">
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-emerald-600 text-white p-3 shadow-sm">
                    <CheckCircle2 className="h-7 w-7" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">
                      {generatedSlips.length} Salary Slips Generated Successfully!
                    </h3>
                    <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-1">
                      {generationStats.createdCount} new monthly records created, {generationStats.keptCount} existing kept, {generationStats.updatedCount} updated for <strong>{selectedEmployee?.full_name}</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleReset}
                    className="text-xs bg-background text-foreground"
                  >
                    Generate Another Period
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => router.push("/admin/salary-slips")}
                    className="text-xs bg-background text-foreground"
                  >
                    View All Slips
                  </Button>
                </div>
              </div>

              {/* QUICK DOWNLOAD HUB (Requirement #14, #15, #16) */}
              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold">
                    Download & Export Salary Documents
                  </CardTitle>
                  <CardDescription>
                    Export consolidated multi-month statements or individual monthly slips
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    {/* Option 1: 1-Page Summary Statement */}
                    <div className="p-4 rounded-lg border bg-card hover:border-primary transition-all space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="rounded-full p-2 bg-primary/10 text-primary mt-0.5">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-sm">Summary Statement</h4>
                            <Badge variant="secondary" className="text-[10px]">
                              1-Page A4
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Official consolidated statement with Vaishali Textile header, month-by-month table, total salary, and authorized signatory. Ideal for bank verification and loans.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pt-2 border-t">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleExportPdf("preview", "summary")}
                          disabled={isExportingPdf}
                          className="h-8 text-xs flex-1"
                        >
                          <Eye className="mr-1.5 h-3.5 w-3.5" />
                          Preview
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleExportPdf("download", "summary")}
                          disabled={isExportingPdf}
                          className="h-8 text-xs flex-1 bg-primary text-primary-foreground"
                        >
                          <Download className="mr-1.5 h-3.5 w-3.5" />
                          Download Summary PDF
                        </Button>
                      </div>
                    </div>

                    {/* Option 2: Multi-Page Detailed Slips */}
                    <div className="p-4 rounded-lg border bg-card hover:border-primary transition-all space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="rounded-full p-2 bg-primary/10 text-primary mt-0.5">
                          <Layers className="h-5 w-5" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-sm">Detailed Monthly Slips</h4>
                            <Badge variant="outline" className="text-[10px]">
                              {generatedSlips.length}-Page A4
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Generates one individual full-page salary slip for each of the {generatedSlips.length} months in a single merged PDF document.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pt-2 border-t">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleExportPdf("preview", "detailed")}
                          disabled={isExportingPdf}
                          className="h-8 text-xs flex-1"
                        >
                          <Eye className="mr-1.5 h-3.5 w-3.5" />
                          Preview
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleExportPdf("download", "detailed")}
                          disabled={isExportingPdf}
                          className="h-8 text-xs flex-1 bg-primary text-primary-foreground"
                        >
                          <Download className="mr-1.5 h-3.5 w-3.5" />
                          Download Detailed PDF
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* GENERATED SLIPS TABLE (Requirement #10, #11) */}
              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-semibold">
                        Generated Monthly Records ({generatedSlips.length})
                      </CardTitle>
                      <CardDescription>
                        Each month is saved as an independent historical record in the database
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="font-mono text-xs">
                      {periodDisplay}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40 text-xs">
                        <TableHead className="w-[140px]">Month & Year</TableHead>
                        <TableHead>Salary Slip Number</TableHead>
                        <TableHead className="text-right">Basic Salary</TableHead>
                        <TableHead className="text-right">Gross</TableHead>
                        <TableHead className="text-right">Deductions</TableHead>
                        <TableHead className="text-right font-bold">Net Salary</TableHead>
                        <TableHead className="text-right w-[140px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {generatedSlips.map((slip) => (
                        <TableRow key={slip.id}>
                          <TableCell className="font-semibold text-xs text-foreground">
                            {slip.salary_month} {slip.salary_year}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {slip.salary_slip_number}
                          </TableCell>
                          <TableCell className="text-right font-medium text-xs">
                            {formatCurrency(slip.basic_salary)}
                          </TableCell>
                          <TableCell className="text-right font-medium text-xs">
                            {formatCurrency(slip.gross_earnings)}
                          </TableCell>
                          <TableCell className="text-right font-medium text-xs text-destructive">
                            {formatCurrency(slip.total_deductions)}
                          </TableCell>
                          <TableCell className="text-right font-bold text-xs text-primary">
                            {formatCurrency(slip.net_salary)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push(`/admin/salary-slips/${slip.id}/print`)}
                                title="Print Slip"
                                className="h-7 w-7 p-0"
                              >
                                <Printer className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push(`/admin/salary-slips/${slip.id}`)}
                                title="View Details"
                                className="h-7 px-2 text-xs text-primary"
                              >
                                <ExternalLink className="h-3.5 w-3.5 mr-1" />
                                View
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SINGLE MONTH EDIT MODAL (Requirement #7 & #21)                            */}
      {/* ========================================================================= */}
      {editingDraft && (
        <Dialog
          open={editingMonthIndex !== null}
          onOpenChange={(open) => {
            if (!open) {
              setEditingMonthIndex(null)
              setEditingDraft(null)
            }
          }}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-lg">
                Edit Salary for {editingDraft.label}
              </DialogTitle>
              <DialogDescription>
                Customize salary components specifically for this month (e.g. bonus, overtime, unpaid leave) without affecting other months.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 max-h-[65vh] overflow-y-auto pr-1">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Basic Salary (₹)</Label>
                  <Input
                    type="number"
                    value={editingDraft.basic_salary}
                    onChange={(e) =>
                      setEditingDraft({ ...editingDraft, basic_salary: Number(e.target.value) })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Bonus (₹)</Label>
                  <Input
                    type="number"
                    value={editingDraft.bonus}
                    onChange={(e) =>
                      setEditingDraft({ ...editingDraft, bonus: Number(e.target.value) })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Professional Tax (PT ₹)</Label>
                  <Input
                    type="number"
                    value={editingDraft.professional_tax}
                    onChange={(e) =>
                      setEditingDraft({ ...editingDraft, professional_tax: Number(e.target.value) })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase">
                  Additional Earnings
                </h4>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="space-y-1">
                    <Label className="text-[11px]">HRA</Label>
                    <Input
                      type="number"
                      value={editingDraft.hra}
                      onChange={(e) => setEditingDraft({ ...editingDraft, hra: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Conveyance</Label>
                    <Input
                      type="number"
                      value={editingDraft.conveyance}
                      onChange={(e) => setEditingDraft({ ...editingDraft, conveyance: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Overtime</Label>
                    <Input
                      type="number"
                      value={editingDraft.overtime}
                      onChange={(e) => setEditingDraft({ ...editingDraft, overtime: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Medical</Label>
                    <Input
                      type="number"
                      value={editingDraft.medical_allowance}
                      onChange={(e) => setEditingDraft({ ...editingDraft, medical_allowance: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Special Allowance</Label>
                    <Input
                      type="number"
                      value={editingDraft.special_allowance}
                      onChange={(e) => setEditingDraft({ ...editingDraft, special_allowance: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Other Earnings</Label>
                    <Input
                      type="number"
                      value={editingDraft.other_earnings}
                      onChange={(e) => setEditingDraft({ ...editingDraft, other_earnings: Number(e.target.value) })}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase">
                  Additional Deductions
                </h4>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="space-y-1">
                    <Label className="text-[11px]">Provident Fund (PF)</Label>
                    <Input
                      type="number"
                      value={editingDraft.pf}
                      onChange={(e) => setEditingDraft({ ...editingDraft, pf: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">TDS</Label>
                    <Input
                      type="number"
                      value={editingDraft.tds}
                      onChange={(e) => setEditingDraft({ ...editingDraft, tds: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">ESIC</Label>
                    <Input
                      type="number"
                      value={editingDraft.esic}
                      onChange={(e) => setEditingDraft({ ...editingDraft, esic: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Loan Deduction</Label>
                    <Input
                      type="number"
                      value={editingDraft.loan_deduction}
                      onChange={(e) => setEditingDraft({ ...editingDraft, loan_deduction: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Advance Deduction</Label>
                    <Input
                      type="number"
                      value={editingDraft.advance_deduction}
                      onChange={(e) => setEditingDraft({ ...editingDraft, advance_deduction: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Other Deduction</Label>
                    <Input
                      type="number"
                      value={editingDraft.other_deduction}
                      onChange={(e) => setEditingDraft({ ...editingDraft, other_deduction: Number(e.target.value) })}
                    />
                  </div>
                </div>
              </div>

              {/* Month preview */}
              {(() => {
                const { gross, deductions, net } = calculateMonthTotals(editingDraft)
                return (
                  <div className="flex flex-wrap justify-between items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs">
                    <span>Gross: <strong>{formatCurrency(gross)}</strong></span>
                    <span className="text-destructive">Deductions: <strong>{formatCurrency(deductions)}</strong></span>
                    <span className="text-primary font-bold text-sm">Net Take-Home: {formatCurrency(net)}</span>
                  </div>
                )
              })()}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditingMonthIndex(null)
                  setEditingDraft(null)
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSaveMonthEdit}
                className="bg-primary text-primary-foreground"
              >
                Save Changes to {editingDraft.label}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
