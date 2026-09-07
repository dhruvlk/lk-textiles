"use client"

import { useEffect, useState } from "react"
import { ChallanForm } from "@/components/challans/challan-form"
import { getChallanById } from "@/services/challans.service"
import { PageLoader } from "@/components/common/LoadingSpinner"
import { Challan } from "@/types"

export default function ChallanEditClient({ id }: { id: string }) {
  const [challan, setChallan] = useState<Challan | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadChallan() {
      const found = await getChallanById(id)
      if (found) {
        setChallan(found)
      }
      setLoading(false)
    }
    loadChallan()
  }, [id])

  if (loading) return <PageLoader text="Loading challan details..." />

  if (!challan) {
    return <div className="py-12 text-center text-sm text-muted-foreground">Challan not found.</div>
  }

  return (
    <div className="container mx-auto py-10 max-w-5xl">
      <ChallanForm initialData={challan} />
    </div>
  )
}
