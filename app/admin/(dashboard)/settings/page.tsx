import { redirect } from "next/navigation"
import SettingsClient from "@/components/settings/SettingsClient"
import { FEATURES } from "@/lib/features"

export default function SettingsPage() {
  if (!FEATURES.companySettingsModule) {
    redirect("/companies")
  }

  return <SettingsClient />
}
