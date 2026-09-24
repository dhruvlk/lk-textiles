import SalarySlipEditClient from "@/components/salary-slips/SalarySlipEditClient"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Edit Salary Slip | Textile Management",
  description: "Edit employee salary slip",
}

export default async function EditSalarySlipPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = await params
  return <SalarySlipEditClient id={resolvedParams.id} />
}
