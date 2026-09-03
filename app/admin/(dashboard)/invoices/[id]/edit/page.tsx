import ChallanEditClient from "@/components/challans/ChallanEditClient"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Edit Invoice | Textile Challan Management",
  description: "Edit your challan",
}

export default async function EditChallanPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  return <ChallanEditClient id={resolvedParams.id} />
}
