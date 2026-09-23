"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { getSalarySlipById } from "@/services/salary-slips.service"
import { getCompanies } from "@/services/companies.service"
import { Company, SalarySlip } from "@/types"
import { SalarySlipPDF } from "@/components/pdf/SalarySlipPDF"
import dynamic from "next/dynamic"

const PDFViewer = dynamic(
  () => import("@react-pdf/renderer").then((mod) => mod.PDFViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-gray-100">
        <p className="text-muted-foreground animate-pulse">Loading PDF Viewer...</p>
      </div>
    ),
  }
)

export default function SalarySlipPrintClient({ id }: { id: string }) {
  const router = useRouter()
  const [salarySlip, setSalarySlip] = useState<SalarySlip | null>(null)
  const [company, setCompany] = useState<Company | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      if (id) {
        const found = await getSalarySlipById(id)
        if (found) {
          setSalarySlip(found)
          const companies = await getCompanies()
          setCompany(companies.find((c) => c.id === found.company_id) ?? null)
        }
        setIsLoading(false)
      }
    }
    loadData()
  }, [id])

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>
  }

  if (!salarySlip || !company) {
    return <div className="flex h-screen items-center justify-center">Salary Slip not found</div>
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100 p-4">
      <div className="mb-4 flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="print:hidden"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="text-sm text-muted-foreground print:hidden">
          Note: Use the built-in PDF viewer controls to print or download.
        </div>
      </div>

      <div className="flex-1 rounded-lg overflow-hidden border shadow-sm bg-white">
        <PDFViewer width="100%" height="100%" className="border-none">
          <SalarySlipPDF salarySlip={salarySlip} company={company} />
        </PDFViewer>
      </div>
    </div>
  )
}
