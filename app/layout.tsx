import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ),
  title: "LK Textiles | Multi-Company Textile Challan System",
  description:
    "Enterprise-grade multi-company textile challan, delivery notes, stock ledger, and billing system.",
  openGraph: {
    title: "LK Textiles | Modern Textile Challan & Inventory Management",
    description:
      "Enterprise-grade multi-company textile challan, delivery notes, and stock ledger system.",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "LK Textiles - Enterprise Textile Manufacturing & Management",
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
