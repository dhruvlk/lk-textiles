import type { Metadata } from "next"
import { ShieldAlert } from "lucide-react"
import { getPublishedLegalContent } from "@/lib/landing/legal-content"
import { getPublishedLandingContent } from "@/lib/landing/content"
import { LegalPageView } from "@/components/landing/LegalPageView"

export async function generateMetadata(): Promise<Metadata> {
  const [legal, landing] = await Promise.all([
    getPublishedLegalContent("privacy_policy"),
    getPublishedLandingContent(),
  ])

  const brandName = landing.brand?.name || "LK Textiles"
  const title = legal?.title ? `${legal.title} | ${brandName}` : `Privacy Policy | ${brandName}`
  const description =
    legal?.description ||
    landing.seo?.description ||
    "Privacy policy and data handling information for LK Textiles. We are committed to protecting your privacy and personal information."
  const ogImage = landing.seo?.ogImage || "/og-image.png"

  return {
    title,
    description,
    alternates: {
      canonical: "https://lk-textiles.vercel.app/privacy-policy",
    },
    openGraph: {
      siteName: brandName,
      title,
      description,
      url: "https://lk-textiles.vercel.app/privacy-policy",
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

export default async function PrivacyPolicyPage() {
  const [legal, landing] = await Promise.all([
    getPublishedLegalContent("privacy_policy"),
    getPublishedLandingContent(),
  ])

  const brandName = landing.brand?.name || "LK Textiles"

  return (
    <LegalPageView
      legal={legal}
      brandName={brandName}
      defaultTitle="Privacy Policy"
      emptyTitle="Privacy Policy Not Available"
      emptyDescription={`The Privacy Policy for ${brandName} is currently being updated or has not been published yet. Please check back later or contact our team directly for inquiries.`}
      emptyIcon={<ShieldAlert className="w-8 h-8 text-slate-500" />}
    />
  )
}
