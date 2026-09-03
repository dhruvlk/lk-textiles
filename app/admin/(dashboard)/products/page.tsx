import { redirect } from "next/navigation"
import ProductsClient from "@/components/products/ProductsClient"
import { FEATURES } from "@/lib/features"

export default function ProductsPage() {
  if (!FEATURES.productsModule) {
    redirect("/")
  }

  return <ProductsClient />
}
