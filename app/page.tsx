import type { Metadata } from "next"
import { LandingPageClient } from "@/components/landing/LandingPageClient"

export const metadata: Metadata = {
  title: "LK Textiles | Grey Fabric & Art Silk Cloth Manufacturers",
  description:
    "LK Textiles is a trusted manufacturer and supplier of quality Grey Fabric and Art Silk Fabric. Explore our products.",
  keywords: [
    "Textile Challan System",
    "Delivery Challan",
    "Textile Billing",
    "Grey Fabric Management",
    "LK Textiles Surat",
    "Taka Stock Management",
  ],
  openGraph: {
    siteName: "LK Textiles",
    title: "LK Textiles | Grey Fabric & Art Silk Cloth Manufacturers",
    description:
      "LK Textiles is a trusted manufacturer and supplier of quality Grey Fabric and Art Silk Fabric. Explore our products.",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/og-image.png",
        secureUrl: "https://lk-textiles.vercel.app/og-image.png",
        width: 1200,
        height: 630,
        type: "image/png",
        alt: "LK Textiles - Modern Textile Manufacturing & Management",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LK Textiles | Grey Fabric & Art Silk Cloth Manufacturers",
    description:
      "LK Textiles is a trusted manufacturer and supplier of quality Grey Fabric and Art Silk Fabric. Explore our products.",
    images: ["/og-image.png"],
  },
}

export default function HomeLandingPage() {
  return <LandingPageClient />
}
