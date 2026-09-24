import SalarySlipPrintClient from "@/components/salary-slips/SalarySlipPrintClient"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Print Salary Slip | Textile Management",
  description: "Print employee salary slip",
}

export default async function PrintSalarySlipPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = await params
  return <SalarySlipPrintClient id={resolvedParams.id} />
}
