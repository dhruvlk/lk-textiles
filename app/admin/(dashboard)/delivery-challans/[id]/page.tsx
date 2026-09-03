import DeliveryChallanDetailClient from "@/components/delivery-challans/DeliveryChallanDetailClient"

export default async function DeliveryChallanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <DeliveryChallanDetailClient id={id} />
}
