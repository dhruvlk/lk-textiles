import DashboardClient from "@/components/dashboard/DashboardClient"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Dashboard | Textile Challan Management",
  description: "Dashboard overview",
}

export default function DashboardPage() {
  return <DashboardClient />
}
