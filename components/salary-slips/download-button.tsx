"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Download, Eye, FileText, Layers, Loader2, Share2 } from "lucide-react"
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
  historySlips?: SalarySlip[]
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  showText?: boolean
}

export function DownloadSalarySlipButton({
  salarySlip,
  company,
  historySlips: passedHistorySlips,
  variant = "ghost",
  size = "icon",
  showText = false,
}: DownloadButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const generatePDF = async (
    slipId: string,
    companyId: string,
    formatVariant: "single" | "multi" = "single"
  ) => {
    const [fullSlip, fullCompany] = await Promise.all([
      getSalarySlipById(slipId),
      getCompanyById(companyId),
    ])

    if (!fullSlip) throw new Error("Salary slip not found")
    if (!fullCompany) throw new Error("Company not found")

    let historySlips: SalarySlip[] = passedHistorySlips || []
    if (!passedHistorySlips && fullSlip.employee_id && formatVariant === "multi") {
      try {
        const { getSalarySlipsByEmployee } = await import("@/services/salary-slips.service")
        const allEmployeeSlips = await getSalarySlipsByEmployee(companyId, fullSlip.employee_id, 7)
        historySlips = allEmployeeSlips
          .filter((s) => s.id !== fullSlip.id)
          .slice(0, 6)
      } catch {
        // history is optional
      }
    }

    const { pdf } = await import("@react-pdf/renderer")
    const blob = await pdf(
      <SalarySlipPDF
        salarySlip={fullSlip}
        company={fullCompany}
        historySlips={historySlips}
        showHistory={formatVariant === "multi"}
        variant={formatVariant}
      />
    ).toBlob()

    return { blob, fullSlip }
  }

  const run = async (
    action: "download" | "preview" | "share",
    formatVariant: "single" | "multi" = "single",
    e?: React.MouseEvent
  ) => {
    e?.stopPropagation()
    if (isGenerating) return
    try {
      setIsGenerating(true)
      toast.info(
        formatVariant === "multi"
          ? "Generating Salary Slip with History..."
          : "Generating Single Month Salary Slip...",
        { id: "salary-pdf-gen" }
      )

      const { blob, fullSlip } = await generatePDF(salarySlip.id, company.id, formatVariant)

      const suffix = formatVariant === "multi" ? "With_History" : "Single"
      const filename = buildPdfFilename(
        `Salary-Slip-${suffix}`,
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

  const hasHistory = (passedHistorySlips && passedHistorySlips.length > 0) || Boolean(salarySlip.employee_id)

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
        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()} className="w-56">
          <DropdownMenuItem onClick={() => run("preview", "single")}>
            <Eye className="mr-2 h-4 w-4" />
            Preview Single Month
          </DropdownMenuItem>
          {hasHistory && (
            <DropdownMenuItem onClick={() => run("preview", "multi")}>
              <Layers className="mr-2 h-4 w-4" />
              Preview with History
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={() => run("download", "single")}>
            <Download className="mr-2 h-4 w-4" />
            Download Single Month
          </DropdownMenuItem>
          {hasHistory && (
            <DropdownMenuItem onClick={() => run("download", "multi")}>
              <FileText className="mr-2 h-4 w-4" />
              Download with History
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={() => run("share", "single")}>
            <Share2 className="mr-2 h-4 w-4" />
            Share PDF
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
