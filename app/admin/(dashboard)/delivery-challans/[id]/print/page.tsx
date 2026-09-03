import DeliveryChallanPrintClient from "@/components/delivery-challans/DeliveryChallanPrintClient"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Print Delivery Challan | Textile Challan Management",
  description: "Print delivery challan",
}

export default async function PrintDeliveryChallanPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <DeliveryChallanPrintClient id={id} />
}
