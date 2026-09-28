import type { Metadata } from "next"
import Link from "next/link"
import { ChevronLeft, Scale, ArrowLeft, Mail } from "lucide-react"
import { getPublishedLegalContent } from "@/lib/landing/legal-content"
import { getPublishedLandingContent } from "@/lib/landing/content"
import { Button } from "@/components/ui/button"

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
  const isAvailable = Boolean(legal && legal.is_published && legal.content?.trim())

  return (
    <div className="min-h-screen bg-[#FDFCF8] text-slate-900 selection:bg-slate-900 selection:text-white font-sans">
      <div className="container mx-auto px-6 py-14 md:py-20 max-w-4xl">
        {/* Navigation link back to home */}
        <Link
          href="/"
          className="inline-flex items-center text-sm font-semibold text-slate-500 hover:text-slate-950 transition-colors mb-10 group"
        >
          <ChevronLeft className="h-4 w-4 mr-1 text-slate-400 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Home</span>
        </Link>

        {isAvailable && legal ? (
          <div>
            {/* Header */}
            <div className="border-b border-slate-200/80 pb-8 mb-10">
              <h1 className="text-3xl md:text-5xl font-black text-slate-950 tracking-tight mb-4">
                {legal.title || "Terms & Conditions"}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                <span>
                  Last updated:{" "}
                  {legal.updated_at
                    ? new Date(legal.updated_at).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "Recently"}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                <span>{brandName}</span>
              </div>
              {legal.description && (
                <p className="mt-4 text-base md:text-lg text-slate-600 leading-relaxed max-w-3xl">
                  {legal.description}
                </p>
              )}
            </div>

            {/* Rich Content Body */}
            <div
              className="text-base md:text-lg text-slate-700 space-y-6 max-w-3xl leading-relaxed
                [&_h2]:text-2xl [&_h2]:md:text-3xl [&_h2]:font-bold [&_h2]:text-slate-950 [&_h2]:tracking-tight [&_h2]:mt-10 [&_h2]:mb-4
                [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-slate-900 [&_h3]:mt-6 [&_h3]:mb-3
                [&_p]:leading-relaxed [&_p]:text-slate-700
                [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2.5 [&_ul]:text-slate-700
                [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-2.5 [&_ol]:text-slate-700
                [&_li]:leading-relaxed
                [&_strong]:text-slate-950 [&_strong]:font-bold
                [&_a]:text-indigo-900 [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:text-indigo-950"
              dangerouslySetInnerHTML={{ __html: legal.content }}
            />
          </div>
        ) : (
          /* Empty / Not-Found State */
          <div className="py-16 md:py-24 text-center max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-3xl bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-700 mx-auto mb-6 shadow-xs">
              <Scale className="w-8 h-8 text-slate-500" />
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight mb-3">
              Terms & Conditions Not Available
            </h1>
            <p className="text-sm md:text-base text-slate-500 leading-relaxed mb-8">
              The Terms & Conditions for {brandName} are currently being updated or have not been published yet. Please check back later or contact our team directly.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/">
                <Button variant="default" className="rounded-xl px-5 text-xs font-bold gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  <span>Return to Home</span>
                </Button>
              </Link>
              <Link href="/#contact">
                <Button variant="outline" className="rounded-xl px-5 text-xs font-bold gap-2">
                  <Mail className="w-4 h-4" />
                  <span>Contact Us</span>
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
