import ReportsClient from "@/components/reports/ReportsClient"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Reports | Textile Challan Management",
  description: "View analytics and reports",
}

export default function ReportsPage() {
  return <ReportsClient />
}
