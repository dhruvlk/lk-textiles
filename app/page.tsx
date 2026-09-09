import type { Metadata } from "next"
import { LandingPageClient } from "@/components/landing/LandingPageClient"

export const metadata: Metadata = {
  title: "LK Textiles | Modern Textile Challan & Inventory Management",
  description:
    "Enterprise-grade multi-company textile challan, delivery notes, stock ledger, and billing system built for modern textile manufacturers and traders.",
  keywords: [
    "Textile Challan System",
    "Delivery Challan",
    "Textile Billing",
    "Grey Fabric Management",
    "LK Textiles Surat",
    "Taka Stock Management",
  ],
  openGraph: {
    title: "LK Textiles | Modern Textile Challan & Inventory Management",
    description:
      "Enterprise-grade multi-company textile challan, delivery notes, stock ledger, and billing system built for modern textile manufacturers and traders.",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "LK Textiles - Modern Textile Manufacturing & Management",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LK Textiles | Modern Textile Challan & Inventory Management",
    description:
      "Enterprise-grade multi-company textile challan, delivery notes, and stock ledger system.",
    images: ["/og-image.png"],
  },
}

export default function HomeLandingPage() {
  return <LandingPageClient />
}
