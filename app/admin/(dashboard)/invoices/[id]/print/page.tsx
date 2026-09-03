import ChallanPrintClient from "@/components/challans/ChallanPrintClient"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Print Invoice | Textile Challan Management",
  description: "Print delivery challan",
}

export default async function PrintChallanPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  return <ChallanPrintClient id={resolvedParams.id} />
}
