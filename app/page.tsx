import type { Metadata } from "next"
import { LandingPageClient } from "@/components/landing/LandingPageClient"

export const metadata: Metadata = {
  title: "LK Textiles | Grey Fabric & Art Silk Cloth Manufacturers",
  description:
    "LK Textiles is a trusted manufacturer and supplier of quality Grey Fabric and Art Silk Fabric. Explore our textile products, fabrics and manufacturing solutions.",
  keywords: [
    "Grey Fabric Manufacturer",
    "Art Silk Fabric Supplier",
    "Textile Manufacturer in Surat",
    "Grey Cloth Supplier",
    "LK Textiles Surat",
    "Textile Fabric Manufacturer",
  ],
  alternates: {
    canonical: "https://lk-textiles.vercel.app/",
  },
  openGraph: {
    siteName: "LK Textiles",
    title: "LK Textiles | Grey Fabric & Art Silk Cloth Manufacturers",
    description:
      "LK Textiles is a trusted manufacturer and supplier of quality Grey Fabric and Art Silk Fabric. Explore our textile products, fabrics and manufacturing solutions.",
    url: "https://lk-textiles.vercel.app/",
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
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "LK Textiles",
    description: "LK Textiles is a trusted manufacturer and supplier of quality Grey Fabric and Art Silk Fabric. Explore our textile products, fabrics and manufacturing solutions.",
    url: "https://lk-textiles.vercel.app/",
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingPageClient />
    </>
  )
}
