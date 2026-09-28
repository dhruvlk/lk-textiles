"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DeliveryChallanPDF } from "@/components/pdf/DeliveryChallanPDF"
import { getDeliveryChallanById } from "@/services/delivery-challans.service"
import { getCompanies } from "@/services/companies.service"
import type { Company, DeliveryChallan } from "@/types"

const PDFViewer = dynamic(
  () => import("@react-pdf/renderer").then((mod) => mod.PDFViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-gray-100">
        <p className="animate-pulse text-muted-foreground">Loading PDF Viewer...</p>
      </div>
    ),
  }
)

export default function DeliveryChallanPrintClient({ id }: { id: string }) {
  const router = useRouter()
  const [challan, setChallan] = useState<DeliveryChallan | null>(null)
  const [company, setCompany] = useState<Company | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      const found = await getDeliveryChallanById(id)
      if (found) {
        setChallan(found)
        const companies = await getCompanies()
        setCompany(companies.find((c) => c.id === found.company_id) ?? null)
      }
      setIsLoading(false)
    }
    loadData()
  }, [id])

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>
  }

  if (!challan || !company) {
    return (
      <div className="flex h-screen items-center justify-center">
        Delivery challan not found
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100 p-2 sm:p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.back()}
            className=" print:hidden"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        <div className="text-xs sm:text-sm text-muted-foreground print:hidden">
          Note: Use the built-in PDF viewer controls to print or download.
        </div>
      </div>

      <div className="flex-1 overflow-hidden rounded-lg border bg-white shadow-sm">
        <PDFViewer width="100%" height="100%" className="border-none">
          <DeliveryChallanPDF
            challan={challan}
            company={company}
            party={challan.customer}
          />
        </PDFViewer>
      </div>
    </div>
  )
}
