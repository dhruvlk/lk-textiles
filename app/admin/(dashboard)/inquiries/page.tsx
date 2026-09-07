import InquiriesClient from "@/components/inquiries/InquiriesClient"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Inquiries | Textile Challan Management",
  description: "View and manage incoming inquiries and contact form submissions from website visitors",
}

export default function InquiriesPage() {
  return <InquiriesClient />
}
