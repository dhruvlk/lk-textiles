"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Download, Eye, Loader2, Share2 } from "lucide-react"
import { toast } from "sonner"
import { Company, SalarySlip } from "@/types"
import { SalarySlipPDF } from "@/components/pdf/SalarySlipPDF"
import { buildPdfFilename } from "@/lib/pdf-utils"
import { downloadPdfBlob, previewPdfBlob, sharePdfBlob } from "@/lib/pdf-actions"
import { getSalarySlipById } from "@/services/salary-slips.service"
import { getCompanyById } from "@/services/companies.service"

interface DownloadButtonProps {
  salarySlip: SalarySlip
  company: Company
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  showText?: boolean
}

export function DownloadSalarySlipButton({
  salarySlip,
  company,
  variant = "ghost",
  size = "icon",
  showText = false,
}: DownloadButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const generatePDF = async (slipId: string, companyId: string) => {
    const [fullSlip, fullCompany] = await Promise.all([
      getSalarySlipById(slipId),
      getCompanyById(companyId),
    ])

    if (!fullSlip) throw new Error("Salary slip not found")
    if (!fullCompany) throw new Error("Company not found")

    const { pdf } = await import("@react-pdf/renderer")
    const blob = await pdf(
      <SalarySlipPDF salarySlip={fullSlip} company={fullCompany} />
    ).toBlob()

    return { blob, fullSlip }
  }

  const run = async (action: "download" | "preview" | "share", e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (isGenerating) return
    try {
      setIsGenerating(true)
      toast.info("Generating Salary Slip PDF...", { id: "salary-pdf-gen" })

      const { blob, fullSlip } = await generatePDF(salarySlip.id, company.id)

      const filename = buildPdfFilename(
        "Salary-Slip",
        fullSlip.salary_slip_number,
        fullSlip.employee_name
      )

      if (action === "preview") {
        await previewPdfBlob(blob)
        toast.success("Salary Slip PDF opened.", { id: "salary-pdf-gen" })
      } else if (action === "share") {
        const shared = await sharePdfBlob(
          blob,
          filename,
          `Salary Slip ${fullSlip.salary_slip_number} - ${fullSlip.employee_name}`
        )
        toast.success(shared ? "PDF shared." : "PDF downloaded.", { id: "salary-pdf-gen" })
      } else {
        await downloadPdfBlob(blob, filename)
        toast.success("Salary Slip PDF downloaded successfully.", { id: "salary-pdf-gen" })
      }
    } catch (error) {
      console.error("Error generating Salary Slip PDF:", error)
      toast.error("Unable to generate Salary Slip PDF. Please try again.", {
        id: "salary-pdf-gen",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="inline-flex items-center justify-center">
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant={variant}
              size={size}
              disabled={isGenerating}
              title="PDF actions"
              className={size === "icon" ? "size-8" : undefined}
              onClick={(e) => e.stopPropagation()}
            />
          }
        >
          {isGenerating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          {showText && <span className="ml-2">PDF</span>}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
          <DropdownMenuItem onClick={() => run("preview")}>
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => run("download")}>
            <Download className="mr-2 h-4 w-4" />
            Download
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => run("share")}>
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
