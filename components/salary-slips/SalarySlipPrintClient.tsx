"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, FileText, Layers } from "lucide-react"
import { getSalarySlipById, getSalarySlipsByEmployee } from "@/services/salary-slips.service"
import { getCompanies } from "@/services/companies.service"
import { Company, SalarySlip } from "@/types"
import { SalarySlipPDF } from "@/components/pdf/SalarySlipPDF"
import dynamic from "next/dynamic"

const PDFViewer = dynamic(
  () => import("@react-pdf/renderer").then((mod) => mod.PDFViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-muted/40">
        <p className="text-muted-foreground animate-pulse text-sm">Loading A4 Document Preview...</p>
      </div>
    ),
  }
)

export default function SalarySlipPrintClient({ id }: { id: string }) {
  const router = useRouter()
  const [salarySlip, setSalarySlip] = useState<SalarySlip | null>(null)
  const [company, setCompany] = useState<Company | null>(null)
  const [historySlips, setHistorySlips] = useState<SalarySlip[]>([])
  const [viewVariant, setViewVariant] = useState<"single" | "multi">("single")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      if (id) {
        const found = await getSalarySlipById(id)
        if (found) {
          setSalarySlip(found)
          const companies = await getCompanies()
          const matchedCompany = companies.find((c) => c.id === found.company_id) ?? null
          setCompany(matchedCompany)

          // Check if employee has history
          if (found.employee_id && matchedCompany) {
            try {
              const hist = await getSalarySlipsByEmployee(matchedCompany.id, found.employee_id, 7)
              const previous = hist.filter((s) => s.id !== found.id).slice(0, 6)
              setHistorySlips(previous)
            } catch {
              // history is optional
            }
          }
        }
        setIsLoading(false)
      }
    }
    loadData()
  }, [id])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-100">
        <p className="text-sm text-muted-foreground animate-pulse">Loading Salary Slip...</p>
      </div>
    )
  }

  if (!salarySlip || !company) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-100">
        <p className="text-sm text-destructive">Salary Slip not found</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-slate-200/80">
      {/* Top Navigation & Toolbar */}
      <div className="h-14 border-b bg-background px-6 flex items-center justify-between shadow-sm print:hidden">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Back
          </Button>
          <div className="text-xs text-muted-foreground hidden sm:block">
            <span>{salarySlip.employee_name} · </span>
            <span className="font-semibold text-foreground">{salarySlip.salary_slip_number}</span>
          </div>
        </div>

        {/* View Mode Toggle (Reference 1 vs Reference 2) */}
        {historySlips.length > 0 && (
          <div className="flex items-center gap-1 rounded-lg border bg-muted/60 p-1">
            <button
              type="button"
              onClick={() => setViewVariant("single")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                viewVariant === "single"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              Single Month (Ref 1)
            </button>
            <button
              type="button"
              onClick={() => setViewVariant("multi")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                viewVariant === "multi"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              With History (Ref 2)
            </button>
          </div>
        )}

        <div className="text-xs text-muted-foreground hidden md:block">
          Use PDF toolbar to print or download A4 document
        </div>
      </div>

      {/* Main Centered Document Viewport */}
      <div className="flex-1 overflow-auto p-4 md:p-6 flex items-center justify-center">
        <div className="w-full max-w-4xl h-full rounded-xl overflow-hidden shadow-2xl border border-slate-300 bg-white">
          <PDFViewer width="100%" height="100%" className="border-none">
            <SalarySlipPDF
              salarySlip={salarySlip}
              company={company}
              historySlips={historySlips}
              showHistory={viewVariant === "multi"}
              variant={viewVariant}
            />
          </PDFViewer>
        </div>
      </div>
    </div>
  )
}
