import SalarySlipsClient from "@/components/salary-slips/SalarySlipsClient"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Salary Slips | Textile Management",
  description: "Manage and generate employee salary slips",
}

export default function SalarySlipsPage() {
  return <SalarySlipsClient />
}
