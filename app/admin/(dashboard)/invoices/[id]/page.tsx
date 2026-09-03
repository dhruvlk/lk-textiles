import ChallanDetailClient from "@/components/challans/ChallanDetailClient"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Invoice Details | Textile Challan Management",
  description: "View challan details and payment information",
}

export default async function ChallanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = await params
  return <ChallanDetailClient id={resolvedParams.id} />
}
