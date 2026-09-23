import type { Metadata } from "next"
import { LandingPageClient } from "@/components/landing/LandingPageClient"
import { getPublishedLandingContent } from "@/lib/landing/content"

export async function generateMetadata(): Promise<Metadata> {
  const content = await getPublishedLandingContent()
  const title = content.seo?.title || "LK Textiles | Grey Fabric & Art Silk Cloth Manufacturers"
  const description =
    content.seo?.description ||
    "LK Textiles is a trusted manufacturer and supplier of quality Grey Fabric and Art Silk Fabric. Explore our textile products, fabrics and manufacturing solutions."
  const ogImage = content.seo?.ogImage || "/og-image.png"

  return {
    title,
    description,
    keywords: content.seo?.keywords || [
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
      siteName: content.brand?.name || "LK Textiles",
      title,
      description,
      url: "https://lk-textiles.vercel.app/",
      type: "website",
      locale: "en_US",
      images: [
        {
          url: ogImage,
          secureUrl: ogImage.startsWith("http") ? ogImage : `https://lk-textiles.vercel.app${ogImage}`,
          width: 1200,
          height: 630,
          type: "image/png",
          alt: `${content.brand?.name || "LK Textiles"} - Modern Textile Manufacturing & Management`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  }
}

export default async function HomeLandingPage() {
  const content = await getPublishedLandingContent()

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: content.brand?.name || "LK Textiles",
    description:
      content.seo?.description ||
      "LK Textiles is a trusted manufacturer and supplier of quality Grey Fabric and Art Silk Fabric. Explore our textile products, fabrics and manufacturing solutions.",
    url: "https://lk-textiles.vercel.app/",
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingPageClient initialContent={content} />
    </>
  )
}
