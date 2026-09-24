import SalarySlipDetailClient from "@/components/salary-slips/SalarySlipDetailClient"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Salary Slip Details | Textile Management",
  description: "View salary slip details and payroll information",
}

export default async function SalarySlipDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = await params
  return <SalarySlipDetailClient id={resolvedParams.id} />
}
