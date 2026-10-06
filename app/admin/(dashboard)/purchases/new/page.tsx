import { Metadata } from "next"
import { PurchaseForm } from "@/components/purchases/PurchaseForm"

export const metadata: Metadata = {
  title: "New Purchase Bill | Textile CMS",
  description: "Record a new purchase invoice, update stock, and store original bills",
}

export default function NewPurchasePage() {
  return <PurchaseForm />
}
