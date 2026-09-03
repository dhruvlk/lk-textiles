import CompanyNewClient from "@/components/companies/CompanyNewClient"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "New Company | Textile Challan Management",
  description: "Create a new company",
}

export default function NewCompanyPage() {
  return <CompanyNewClient />
}
