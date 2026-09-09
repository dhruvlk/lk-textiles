import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

const inter = Inter({ subsets: ["latin"] });

const baseUrl =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "https://lk-textiles.vercel.app");

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: "LK Textiles | Grey Fabric & Art Silk Cloth Manufacturers",
  description:
    "LK Textiles is a trusted manufacturer and supplier of quality Grey Fabric and Art Silk Fabric. Explore our textile products, fabrics and manufacturing solutions.",
  openGraph: {
    siteName: "LK Textiles",
    title: "LK Textiles | Grey Fabric & Art Silk Cloth Manufacturers",
    description:
      "LK Textiles is a trusted manufacturer and supplier of quality Grey Fabric and Art Silk Fabric. Explore our textile products, fabrics and manufacturing solutions.",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/og-image.png",
        secureUrl: "https://lk-textiles.vercel.app/og-image.png",
        width: 1200,
        height: 630,
        type: "image/png",
        alt: "LK Textiles - Enterprise Textile Manufacturing & Management",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LK Textiles | Grey Fabric & Art Silk Cloth Manufacturers",
    description:
      "LK Textiles is a trusted manufacturer and supplier of quality Grey Fabric and Art Silk Fabric. Explore our textile products, fabrics and manufacturing solutions.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body className={inter.className} suppressHydrationWarning>
        <AuthProvider>
          <TooltipProvider>
            {children}
          </TooltipProvider>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
