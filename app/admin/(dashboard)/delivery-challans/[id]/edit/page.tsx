import DeliveryChallanEditClient from "@/components/delivery-challans/DeliveryChallanEditClient"

export default async function EditDeliveryChallanPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <DeliveryChallanEditClient id={id} />
}
