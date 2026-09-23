"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useCompany } from "@/components/company-provider"
import { toast } from "sonner"
import { Company } from "@/types"
import { getCompanyById } from "@/services/companies.service"
import { CompanyForm } from "@/components/companies/CompanyForm"
import { FormSkeleton } from "@/components/common/Skeletons"

export default function CompanyEditClient({ id }: { id: string }) {
  const router = useRouter()
  const { companies } = useCompany()
  const [company, setCompany] = useState<Company | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setIsLoading(true)
      try {
        const found = companies.find((c) => c.id === id) ?? (await getCompanyById(id))
        if (found) {
          setCompany(found)
        } else if (companies.length > 0) {
          toast.error("Company not found")
          router.push("/admin/companies")
        }
      } catch (err) {
        console.error("Failed to load company:", err)
        toast.error("Failed to load company details")
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [id, companies, router])

  if (isLoading || !company) {
    return (
      <div className="space-y-6">
        <FormSkeleton fields={8} />
      </div>
    )
  }

  return <CompanyForm mode="edit" initialCompany={company} />
}
