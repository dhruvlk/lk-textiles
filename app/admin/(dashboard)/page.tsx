import { AdminRootView } from "@/components/landing-admin/AdminRootView"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Admin Portal | LK Textiles",
  description: "Administrative access and management portal",
}

export default function DashboardPage() {
  return <AdminRootView />
}
