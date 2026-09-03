"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { LetterPadForm } from "./LetterPadForm"
import type { LetterPad } from "@/types"
import { useCompany } from "@/components/company-provider"

export function LetterPadEditClient() {
  const params = useParams()
  const router = useRouter()
  const { selectedCompany } = useCompany()
  const supabase = createClient()
  
  const [letterPad, setLetterPad] = useState<LetterPad | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchLetterPad = async (id: string) => {
      try {
        const { data, error } = await supabase
          .from("letter_pads")
          .select("*")
          .eq("id", id)
          .single()

        if (error) throw error
        if (!data) throw new Error("Letter Pad not found")
        
        // Ensure the letter belongs to the currently selected company
        if (data.company_id !== selectedCompany?.id) {
          toast.error("You do not have permission to view this letter pad.")
          router.push("/admin/letter-pads")
          return
        }

        setLetterPad(data)
      } catch (error) {
        console.error(error)
        toast.error((error as Error).message)
        router.push("/admin/letter-pads")
      } finally {
        setIsLoading(false)
      }
    }

    if (params.id && selectedCompany) {
      fetchLetterPad(params.id as string)
    }
  }, [params.id, selectedCompany, router, supabase])

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!letterPad) return null

  return <LetterPadForm initialData={letterPad} />
}
