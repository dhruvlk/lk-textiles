"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { DeliveryChallanForm } from "@/components/delivery-challans/delivery-challan-form"
import { getDeliveryChallanById } from "@/services/delivery-challans.service"
import type { DeliveryChallan } from "@/types"

export default function DeliveryChallanEditClient({ id }: { id: string }) {
  const router = useRouter()
  const [challan, setChallan] = useState<DeliveryChallan | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const data = await getDeliveryChallanById(id)
        if (!data) {
          toast.error("Delivery challan not found")
          router.push("/admin/delivery-challans")
          return
        }
        setChallan(data)
      } catch {
        toast.error("Failed to load delivery challan")
        router.push("/admin/delivery-challans")
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [id, router])

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!challan) return null

  return <DeliveryChallanForm initialData={challan} />
}
