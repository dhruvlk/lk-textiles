"use client"

import React from "react"
import { ShieldAlert } from "lucide-react"
import { LegalContentCard } from "../LegalContentCard"

export function PrivacyPolicyTab() {
  return (
    <LegalContentCard
      type="privacy_policy"
      title="Privacy Policy"
      subtitle="Configure data handling, privacy disclosures, cookies, and regulatory information."
      publicUrl="/privacy-policy"
      icon={<ShieldAlert className="w-5 h-5 text-indigo-700" />}
    />
  )
}
