import { Metadata } from "next"
import PersonalExpensesDashboardClient from "@/components/personal-expenses/PersonalExpensesDashboardClient"

export const metadata: Metadata = {
  title: "Personal Expenses | Textile CMS",
  description: "Track personal and household expenses, attach bills, organize receipts, and download expense reports.",
}

export default function PersonalExpensesPage() {
  return <PersonalExpensesDashboardClient />
}
