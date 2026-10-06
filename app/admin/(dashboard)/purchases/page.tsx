import { Metadata } from "next"
import PurchasesDashboardClient from "@/components/purchases/PurchasesDashboardClient"

export const metadata: Metadata = {
  title: "Purchases & Expenses | Textile CMS",
  description: "Track purchases, business expenses, GST input credit, and original bill documents",
}

export default function PurchasesPage() {
  return <PurchasesDashboardClient />
}
