import ChallansClient from "@/components/challans/ChallansClient"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Invoice | Textile Challan Management",
  description: "Manage your challans",
}

export default function ChallansPage() {
  return <ChallansClient />
}
