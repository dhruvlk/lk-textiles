"use client"

import { useEffect, useState } from "react"
import { SalarySlipForm } from "@/components/salary-slips/salary-slip-form"
import { getSalarySlipById } from "@/services/salary-slips.service"
import { PageLoader } from "@/components/common/LoadingSpinner"
import type { SalarySlip } from "@/types"

export default function SalarySlipEditClient({ id }: { id: string }) {
  const [salarySlip, setSalarySlip] = useState<SalarySlip | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadSlip() {
      const found = await getSalarySlipById(id)
      if (found) {
        setSalarySlip(found)
      }
      setLoading(false)
    }
    loadSlip()
  }, [id])

  if (loading) return <PageLoader text="Loading salary slip..." />

  if (!salarySlip) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        Salary slip not found.
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 max-w-5xl">
      <SalarySlipForm initialData={salarySlip} />
    </div>
  )
}
