"use client"

import { Scale } from "lucide-react"
import { LegalContentCard } from "../LegalContentCard"

export function TermsConditionsTab() {
  return (
    <LegalContentCard
      type="terms_conditions"
      title="Terms & Conditions"
      subtitle="Configure terms of service, acceptable use, liability limitations, and governing law."
      publicUrl="/terms-and-conditions"
      icon={<Scale className="w-5 h-5 text-indigo-700" />}
    />
  )
}
