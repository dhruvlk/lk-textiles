import type { Metadata } from "next"
import { Scale } from "lucide-react"
import { getPublishedLegalContent } from "@/lib/landing/legal-content"
import { getPublishedLandingContent } from "@/lib/landing/content"
import { LegalPageView } from "@/components/landing/LegalPageView"

export async function generateMetadata(): Promise<Metadata> {
  const [legal, landing] = await Promise.all([
    getPublishedLegalContent("terms_conditions"),
    getPublishedLandingContent(),
  ])

  const brandName = landing.brand?.name || "LK Textiles"
  const title = legal?.title ? `${legal.title} | ${brandName}` : `Terms & Conditions | ${brandName}`
  const description =
    legal?.description ||
    landing.seo?.description ||
    "Terms and conditions of service for LK Textiles. Please read these terms carefully before using our website or services."
  const ogImage = landing.seo?.ogImage || "/og-image.png"

  return {
    title,
    description,
    alternates: {
      canonical: "https://lk-textiles.vercel.app/terms-and-conditions",
    },
    openGraph: {
      siteName: brandName,
      title,
      description,
      url: "https://lk-textiles.vercel.app/terms-and-conditions",
      type: "website",
      locale: "en_US",
      images: [
        {
          url: ogImage,
          secureUrl: ogImage.startsWith("http") ? ogImage : `https://lk-textiles.vercel.app${ogImage}`,
          width: 1200,
          height: 630,
          alt: `${title} - ${brandName}`,
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

export default async function TermsAndConditionsPage() {
  const [legal, landing] = await Promise.all([
    getPublishedLegalContent("terms_conditions"),
    getPublishedLandingContent(),
  ])

  const brandName = landing.brand?.name || "LK Textiles"

  return (
    <LegalPageView
      legal={legal}
      brandName={brandName}
      defaultTitle="Terms & Conditions"
      emptyTitle="Terms & Conditions Not Available"
      emptyDescription={`The Terms & Conditions for ${brandName} are currently being updated or have not been published yet. Please check back later or contact our team directly.`}
      emptyIcon={<Scale className="w-8 h-8 text-slate-500" />}
    />
  )
}
