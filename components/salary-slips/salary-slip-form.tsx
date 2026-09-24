"use client"
/* eslint-disable */

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useCompany } from "@/components/company-provider"
import { useAuth } from "@/hooks/useAuth"
import { numberToWords } from "@/lib/number-to-words"
import { formatCurrency } from "@/lib/payment-status"
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
import { toast } from "sonner"
import { Loader2, Calculator, ArrowLeft, CheckCircle2, AlertTriangle, Layers, FileText } from "lucide-react"
import { PageHeader } from "@/components/common/PageHeader"
import { getEmployeesPaginated } from "@/services/employees.service"
import {
  createSalarySlip,
  updateSalarySlip,
  generateSalarySlipNumber,
  checkSalarySlipExists,
} from "@/services/salary-slips.service"
import { MultiMonthSalarySlipGenerator } from "@/components/salary-slips/multi-month-generator"
import type { SalarySlip } from "@/types"
import type { Employee } from "@/types/permissions"

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
]

const salarySlipSchema = z.object({
  employee_id: z.string().optional(),
  employee_name: z.string().min(1, "Employee name is required"),
  joining_date: z.string().optional(),
  pan_number: z.string().optional(),
  salary_slip_number: z.string().min(1, "Salary slip number is required"),
  salary_month: z.string().min(1, "Salary month is required"),
  salary_year: z.coerce.number().min(2000, "Enter a valid year"),
  pay_date: z.string().min(1, "Pay date is required"),
  // Earnings
  basic_salary: z.coerce.number().min(0, "Basic salary cannot be negative"),
  hra: z.coerce.number().min(0, "Cannot be negative").default(0),
  conveyance: z.coerce.number().min(0, "Cannot be negative").default(0),
  medical_allowance: z.coerce.number().min(0, "Cannot be negative").default(0),
  special_allowance: z.coerce.number().min(0, "Cannot be negative").default(0),
  bonus: z.coerce.number().min(0, "Cannot be negative").default(0),
  overtime: z.coerce.number().min(0, "Cannot be negative").default(0),
  other_earnings: z.coerce.number().min(0, "Cannot be negative").default(0),
  // Deductions
  pf: z.coerce.number().min(0, "Cannot be negative").default(0),
  professional_tax: z.coerce.number().min(0, "Cannot be negative").default(0),
  tds: z.coerce.number().min(0, "Cannot be negative").default(0),
  esic: z.coerce.number().min(0, "Cannot be negative").default(0),
  loan_deduction: z.coerce.number().min(0, "Cannot be negative").default(0),
  advance_deduction: z.coerce.number().min(0, "Cannot be negative").default(0),
  other_deduction: z.coerce.number().min(0, "Cannot be negative").default(0),
})

type FormData = z.infer<typeof salarySlipSchema>

interface SalarySlipFormProps {
  initialData?: SalarySlip
}

export function SalarySlipForm({ initialData }: SalarySlipFormProps) {
  const router = useRouter()
  const { selectedCompany } = useCompany()
  const { user } = useAuth()
  const isEditMode = !!initialData

  const [employees, setEmployees] = useState<Employee[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [mode, setMode] = useState<"single" | "multiple">("single")
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null)

  const currentDate = new Date()
  const currentMonth = MONTHS[currentDate.getMonth()]
  const currentYear = currentDate.getFullYear()

  const form = useForm<FormData>({
    resolver: zodResolver(salarySlipSchema) as any,
    defaultValues: initialData
      ? {
          employee_id: initialData.employee_id || "",
          employee_name: initialData.employee_name,
          joining_date: initialData.joining_date || "",
          pan_number: initialData.pan_number || "",
          salary_slip_number: initialData.salary_slip_number,
          salary_month: initialData.salary_month,
          salary_year: initialData.salary_year,
          pay_date: initialData.pay_date,
          basic_salary: initialData.basic_salary,
          hra: initialData.hra,
          conveyance: initialData.conveyance,
          medical_allowance: initialData.medical_allowance,
          special_allowance: initialData.special_allowance,
          bonus: initialData.bonus,
          overtime: initialData.overtime,
          other_earnings: initialData.other_earnings,
          pf: initialData.pf,
          professional_tax: initialData.professional_tax,
          tds: initialData.tds,
          esic: initialData.esic,
          loan_deduction: initialData.loan_deduction,
          advance_deduction: initialData.advance_deduction,
          other_deduction: initialData.other_deduction,
        }
      : {
          employee_id: "",
          employee_name: "",
          joining_date: "",
          pan_number: "",
          salary_slip_number: "",
          salary_month: currentMonth,
          salary_year: currentYear,
          pay_date: currentDate.toISOString().split("T")[0],
          basic_salary: 0,
          hra: 0,
          conveyance: 0,
          medical_allowance: 0,
          special_allowance: 0,
          bonus: 0,
          overtime: 0,
          other_earnings: 0,
          pf: 0,
          professional_tax: 0,
          tds: 0,
          esic: 0,
          loan_deduction: 0,
          advance_deduction: 0,
          other_deduction: 0,
        },
  })

  // Load active employees
  useEffect(() => {
    async function loadEmployees() {
      if (selectedCompany) {
        try {
          const res = await getEmployeesPaginated(selectedCompany.id, "", {
            page: 1,
            pageSize: 200,
            status: "active",
          })
          setEmployees(res.data)
        } catch {
          // silent fallback
        }
      }
    }
    loadEmployees()
  }, [selectedCompany])

  // Generate salary slip number when month/year changes or on initial mount
  const watchedMonth = form.watch("salary_month")
  const watchedYear = form.watch("salary_year")

  useEffect(() => {
    async function loadSlipNumber() {
      if (!isEditMode && selectedCompany && !form.getValues("salary_slip_number")) {
        try {
          const num = await generateSalarySlipNumber(
            selectedCompany.id,
            watchedMonth,
            Number(watchedYear)
          )
          form.setValue("salary_slip_number", num)
        } catch {
          toast.error("Failed to generate salary slip number")
        }
      }
    }
    loadSlipNumber()
  }, [isEditMode, selectedCompany, watchedMonth, watchedYear, form])

  // Check for duplicate salary slip
  const watchedEmployeeId = form.watch("employee_id")
  useEffect(() => {
    async function checkDuplicate() {
      if (!isEditMode && selectedCompany && watchedEmployeeId && watchedMonth && watchedYear) {
        try {
          const exists = await checkSalarySlipExists(
            selectedCompany.id,
            watchedEmployeeId,
            watchedMonth,
            Number(watchedYear)
          )
          if (exists) {
            setDuplicateWarning(
              `A salary slip already exists for this employee for ${watchedMonth} ${watchedYear}. Saving will create a duplicate record.`
            )
          } else {
            setDuplicateWarning(null)
          }
        } catch {
          setDuplicateWarning(null)
        }
      } else {
        setDuplicateWarning(null)
      }
    }
    checkDuplicate()
  }, [isEditMode, selectedCompany, watchedEmployeeId, watchedMonth, watchedYear])

  // Watch fields for live calculation
  const basicSalary = Number(form.watch("basic_salary") || 0)
  const hra = Number(form.watch("hra") || 0)
  const conveyance = Number(form.watch("conveyance") || 0)
  const medicalAllowance = Number(form.watch("medical_allowance") || 0)
  const specialAllowance = Number(form.watch("special_allowance") || 0)
  const bonus = Number(form.watch("bonus") || 0)
  const overtime = Number(form.watch("overtime") || 0)
  const otherEarnings = Number(form.watch("other_earnings") || 0)

  const pf = Number(form.watch("pf") || 0)
  const professionalTax = Number(form.watch("professional_tax") || 0)
  const tds = Number(form.watch("tds") || 0)
  const esic = Number(form.watch("esic") || 0)
  const loanDeduction = Number(form.watch("loan_deduction") || 0)
  const advanceDeduction = Number(form.watch("advance_deduction") || 0)
  const otherDeduction = Number(form.watch("other_deduction") || 0)

  const grossEarnings =
    basicSalary +
    hra +
    conveyance +
    medicalAllowance +
    specialAllowance +
    bonus +
    overtime +
    otherEarnings

  const totalDeductions =
    pf +
    professionalTax +
    tds +
    esic +
    loanDeduction +
    advanceDeduction +
    otherDeduction

  const netSalary = Math.max(0, grossEarnings - totalDeductions)
  const netSalaryInWords = numberToWords(Math.round(netSalary))

  // Handle employee selection
  const handleEmployeeSelect = (employeeUserId: string | null) => {
    if (!employeeUserId) return
    const emp = employees.find((e) => e.user_id === employeeUserId)
    if (emp) {
      form.setValue("employee_id", emp.user_id)
      form.setValue("employee_name", emp.full_name, { shouldValidate: true })
      form.setValue("joining_date", emp.joining_date || "")
      form.setValue("pan_number", emp.pan_number || "")
      toast.info(`Populated details for ${emp.full_name}`)
    }
  }

  const onSubmit = async (values: FormData) => {
    if (!selectedCompany) return
    setIsSubmitting(true)

    try {
      const payload = {
        company_id: selectedCompany.id,
        employee_id: values.employee_id || null,
        employee_name: values.employee_name,
        employee_code: initialData?.employee_code || null,
        designation: initialData?.designation || null,
        department: initialData?.department || null,
        joining_date: values.joining_date || null,
        bank_name: initialData?.bank_name || null,
        bank_account_number: initialData?.bank_account_number || null,
        bank_ifsc: initialData?.bank_ifsc || null,
        pan_number: values.pan_number || null,
        uan_number: initialData?.uan_number || null,
        pf_number: initialData?.pf_number || null,
        salary_slip_number: values.salary_slip_number,
        salary_month: values.salary_month,
        salary_year: Number(values.salary_year),
        pay_date: values.pay_date,
        basic_salary: Number(values.basic_salary),
        hra: Number(values.hra),
        conveyance: Number(values.conveyance),
        medical_allowance: Number(values.medical_allowance),
        special_allowance: Number(values.special_allowance),
        bonus: Number(values.bonus),
        overtime: Number(values.overtime),
        other_earnings: Number(values.other_earnings),
        gross_earnings: grossEarnings,
        pf: Number(values.pf),
        professional_tax: Number(values.professional_tax),
        tds: Number(values.tds),
        esic: Number(values.esic),
        loan_deduction: Number(values.loan_deduction),
        advance_deduction: Number(values.advance_deduction),
        other_deduction: Number(values.other_deduction),
        total_deductions: totalDeductions,
        net_salary: netSalary,
        amount_in_words: netSalaryInWords,
        notes: initialData?.notes || null,
        payment_status: initialData?.payment_status || ("Paid" as const),
        payment_mode: initialData?.payment_mode || null,
        payment_date: initialData?.payment_date || null,
      }

      if (initialData) {
        await updateSalarySlip({ ...payload, id: initialData.id })
        toast.success("Salary slip updated successfully!")
      } else {
        await createSalarySlip(payload, user?.id)
        toast.success("Salary slip created successfully!")
      }

      router.push("/admin/salary-slips")
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save salary slip"
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!selectedCompany) return null

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Payroll"
        title={
          isEditMode
            ? "Edit Salary Slip"
            : mode === "multiple"
            ? "Multi-Month Salary Slips"
            : "Create Salary Slip"
        }
        description={
          isEditMode
            ? `Update salary slip ${initialData.salary_slip_number}`
            : mode === "multiple"
            ? `Generate consolidated salary statements or multi-page slips for ${selectedCompany.name}`
            : `Generate a new salary slip for ${selectedCompany.name}`
        }
        action={
          mode === "single" ? (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button
                type="button"
                disabled={isSubmitting}
                onClick={form.handleSubmit(onSubmit)}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditMode ? "Update Salary Slip" : "Save Salary Slip"}
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/salary-slips")}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Slips
              </Button>
            </div>
          )
        }
      />

      {/* Mode Switcher Tabs (Only when creating) */}
      {!isEditMode && (
        <div className="flex items-center gap-2 border-b border-border pb-2">
          <button
            type="button"
            onClick={() => setMode("single")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              mode === "single"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <FileText className="h-4 w-4" />
            Single Month Slip
          </button>
          <button
            type="button"
            onClick={() => setMode("multiple")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              mode === "multiple"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Layers className="h-4 w-4" />
            Multiple Months (Statement / Slips)
          </button>
        </div>
      )}

      {mode === "multiple" && !isEditMode ? (
        <MultiMonthSalarySlipGenerator
          company={selectedCompany}
          employees={employees}
          initialEmployeeId={form.watch("employee_id") || undefined}
          onBackToSingle={() => setMode("single")}
        />
      ) : (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

      {/* TOP ROW: EMPLOYEE DETAILS & SALARY PERIOD */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* EMPLOYEE DETAILS */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Employee Details</CardTitle>
            <CardDescription>
              Select an employee to auto-populate master information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Select Employee *</Label>
              <Select
                value={form.watch("employee_id") || undefined}
                onValueChange={handleEmployeeSelect}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose an employee">
                    {(value: string | null) =>
                      (employees.find((e) => e.user_id === value)?.full_name ??
                      form.watch("employee_name")) ||
                      "Choose an employee"
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employee_name">Employee Name *</Label>
                <Input
                  id="employee_name"
                  {...form.register("employee_name")}
                  placeholder="Employee Name"
                  readOnly={!!form.watch("employee_id")}
                  className={form.watch("employee_id") ? "bg-muted cursor-not-allowed" : ""}
                />
                {form.formState.errors.employee_name && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.employee_name.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="joining_date">Joining Date</Label>
                <Input
                  id="joining_date"
                  type="date"
                  {...form.register("joining_date")}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pan_number">PAN Number</Label>
                <Input
                  id="pan_number"
                  {...form.register("pan_number")}
                  placeholder="ABCDE1234F"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SALARY PERIOD */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Salary Period & Details</CardTitle>
            <CardDescription>
              Specify the salary period, pay date, and reference number
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Salary Month *</Label>
                <Select
                  value={form.watch("salary_month")}
                  onValueChange={(val) => {
                    if (val) form.setValue("salary_month", val)
                  }}
                >
                  <SelectTrigger>
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="salary_year">Salary Year *</Label>
                <Input
                  id="salary_year"
                  type="number"
                  {...form.register("salary_year")}
                />
                {form.formState.errors.salary_year && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.salary_year.message}
                  </p>
                )}
              </div>
            </div>

            {duplicateWarning && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-2.5 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                <span>{duplicateWarning}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pay_date">Pay Date *</Label>
                <Input
                  id="pay_date"
                  type="date"
                  {...form.register("pay_date")}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="salary_slip_number">Salary Slip Number</Label>
                  <span className="text-[11px] font-medium text-muted-foreground">Auto-generated</span>
                </div>
                <Input
                  id="salary_slip_number"
                  {...form.register("salary_slip_number")}
                  readOnly
                  className="bg-muted font-mono text-xs font-medium cursor-not-allowed"
                />
                {form.formState.errors.salary_slip_number && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.salary_slip_number.message}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SECOND ROW: EARNINGS & DEDUCTIONS */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* EARNINGS */}
        <Card className="shadow-sm">
          <CardHeader className="bg-primary/5 pb-3 pt-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-primary">
                  Earnings Breakdown
                </CardTitle>
                <CardDescription>
                  Enter regular pay, allowances, and bonuses
                </CardDescription>
              </div>
              <div className="text-right">
                <span className="text-xs text-muted-foreground">Gross Earnings</span>
                <p className="text-lg font-bold text-primary">
                  {formatCurrency(grossEarnings)}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            <div className="grid grid-cols-2 items-center gap-3">
              <Label htmlFor="basic_salary" className="font-medium">
                Basic Salary *
              </Label>
              <Input
                id="basic_salary"
                type="number"
                step="0.01"
                {...form.register("basic_salary")}
                className="text-right font-medium"
              />
            </div>

            <div className="grid grid-cols-2 items-center gap-3">
              <Label htmlFor="hra">House Rent Allowance (HRA)</Label>
              <Input
                id="hra"
                type="number"
                step="0.01"
                {...form.register("hra")}
                className="text-right"
              />
            </div>

            <div className="grid grid-cols-2 items-center gap-3">
              <Label htmlFor="conveyance">Conveyance Allowance</Label>
              <Input
                id="conveyance"
                type="number"
                step="0.01"
                {...form.register("conveyance")}
                className="text-right"
              />
            </div>

            <div className="grid grid-cols-2 items-center gap-3">
              <Label htmlFor="medical_allowance">Medical Allowance</Label>
              <Input
                id="medical_allowance"
                type="number"
                step="0.01"
                {...form.register("medical_allowance")}
                className="text-right"
              />
            </div>

            <div className="grid grid-cols-2 items-center gap-3">
              <Label htmlFor="special_allowance">Special Allowance</Label>
              <Input
                id="special_allowance"
                type="number"
                step="0.01"
                {...form.register("special_allowance")}
                className="text-right"
              />
            </div>

            <div className="grid grid-cols-2 items-center gap-3">
              <Label htmlFor="bonus">Bonus</Label>
              <Input
                id="bonus"
                type="number"
                step="0.01"
                {...form.register("bonus")}
                className="text-right"
              />
            </div>

            <div className="grid grid-cols-2 items-center gap-3">
              <Label htmlFor="overtime">Overtime</Label>
              <Input
                id="overtime"
                type="number"
                step="0.01"
                {...form.register("overtime")}
                className="text-right"
              />
            </div>

            <div className="grid grid-cols-2 items-center gap-3">
              <Label htmlFor="other_earnings">Other Earnings</Label>
              <Input
                id="other_earnings"
                type="number"
                step="0.01"
                {...form.register("other_earnings")}
                className="text-right"
              />
            </div>

            <div className="flex items-center justify-between rounded-lg bg-muted/60 p-3 pt-3">
              <span className="font-semibold text-foreground">Total Gross Earnings</span>
              <span className="font-bold text-foreground">
                {formatCurrency(grossEarnings)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* DEDUCTIONS */}
        <Card className="shadow-sm">
          <CardHeader className="bg-destructive/5 pb-3 pt-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-destructive">
                  Deductions Breakdown
                </CardTitle>
                <CardDescription>
                  Enter statutory taxes, advances, and deductions
                </CardDescription>
              </div>
              <div className="text-right">
                <span className="text-xs text-muted-foreground">Total Deductions</span>
                <p className="text-lg font-bold text-destructive">
                  {formatCurrency(totalDeductions)}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            <div className="grid grid-cols-2 items-center gap-3">
              <Label htmlFor="pf">Provident Fund (PF)</Label>
              <Input
                id="pf"
                type="number"
                step="0.01"
                {...form.register("pf")}
                className="text-right"
              />
            </div>

            <div className="grid grid-cols-2 items-center gap-3">
              <Label htmlFor="professional_tax">Professional Tax (PT)</Label>
              <Input
                id="professional_tax"
                type="number"
                step="0.01"
                {...form.register("professional_tax")}
                className="text-right"
              />
            </div>

            <div className="grid grid-cols-2 items-center gap-3">
              <Label htmlFor="tds">TDS / Income Tax</Label>
              <Input
                id="tds"
                type="number"
                step="0.01"
                {...form.register("tds")}
                className="text-right"
              />
            </div>

            <div className="grid grid-cols-2 items-center gap-3">
              <Label htmlFor="esic">ESIC</Label>
              <Input
                id="esic"
                type="number"
                step="0.01"
                {...form.register("esic")}
                className="text-right"
              />
            </div>

            <div className="grid grid-cols-2 items-center gap-3">
              <Label htmlFor="loan_deduction">Loan Deduction</Label>
              <Input
                id="loan_deduction"
                type="number"
                step="0.01"
                {...form.register("loan_deduction")}
                className="text-right"
              />
            </div>

            <div className="grid grid-cols-2 items-center gap-3">
              <Label htmlFor="advance_deduction">Advance Salary Deduction</Label>
              <Input
                id="advance_deduction"
                type="number"
                step="0.01"
                {...form.register("advance_deduction")}
                className="text-right"
              />
            </div>

            <div className="grid grid-cols-2 items-center gap-3">
              <Label htmlFor="other_deduction">Other Deduction</Label>
              <Input
                id="other_deduction"
                type="number"
                step="0.01"
                {...form.register("other_deduction")}
                className="text-right"
              />
            </div>

            <div className="flex items-center justify-between rounded-lg bg-muted/60 p-3 pt-3">
              <span className="font-semibold text-foreground">Total Deductions</span>
              <span className="font-bold text-destructive">
                {formatCurrency(totalDeductions)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* NET SALARY SUMMARY CARD */}
      <Card className="border-primary/20 bg-primary/5 shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-bold text-foreground">
                  Net Take-Home Salary: {formatCurrency(netSalary)}
                </h3>
              </div>
              <p className="mt-1 text-sm font-medium text-muted-foreground">
                <span className="font-semibold text-foreground">In Words:</span> {netSalaryInWords}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="rounded-lg border bg-background px-4 py-2 text-center">
                <span className="text-xs text-muted-foreground">Gross Earnings</span>
                <p className="font-semibold text-foreground">{formatCurrency(grossEarnings)}</p>
              </div>
              <span className="text-lg font-bold text-muted-foreground">-</span>
              <div className="rounded-lg border bg-background px-4 py-2 text-center">
                <span className="text-xs text-muted-foreground">Total Deductions</span>
                <p className="font-semibold text-destructive">{formatCurrency(totalDeductions)}</p>
              </div>
              <span className="text-lg font-bold text-muted-foreground">=</span>
              <div className="rounded-lg border-2 border-primary bg-background px-5 py-2 text-center shadow-sm">
                <span className="text-xs font-semibold text-primary">Net Salary</span>
                <p className="text-lg font-bold text-primary">{formatCurrency(netSalary)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FORM ACTION BUTTONS */}
      <div className="flex justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle2 className="mr-2 h-4 w-4" />
          )}
          {isEditMode ? "Update Salary Slip" : "Save Salary Slip"}
        </Button>
      </div>
    </form>
      )}
    </div>
  )
}
