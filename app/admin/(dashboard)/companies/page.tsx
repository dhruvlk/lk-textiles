import CompaniesClient from "@/components/companies/CompaniesClient"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Companies | Textile Challan Management",
  description: "Manage your companies",
}

export default function CompaniesPage() {
  return <CompaniesClient />
}
