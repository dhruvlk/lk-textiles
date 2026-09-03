import PartiesClient from "@/components/parties/PartiesClient"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Parties | Textile Challan Management",
  description: "Manage your clients and parties",
}

export default function PartiesPage() {
  return <PartiesClient />
}
