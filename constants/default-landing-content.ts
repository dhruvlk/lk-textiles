import { LandingPageContent } from "@/types/landing-content"

export const defaultLandingContent: LandingPageContent = {
  brand: {
    name: "LK Textiles",
    tagline: "Grey Fabric & Art Silk Cloth Manufacturers",
    logoUrl: "/logo-1.png",
  },
  seo: {
    title: "LK Textiles | Grey Fabric & Art Silk Cloth Manufacturers",
    description:
      "LK Textiles is a trusted manufacturer and supplier of quality Grey Fabric and Art Silk Fabric. Explore our textile products, fabrics and manufacturing solutions.",
    ogImage: "/og-image.png",
    keywords: [
      "Grey Fabric Manufacturer",
      "Art Silk Fabric Supplier",
      "Textile Manufacturer in Surat",
      "Grey Cloth Supplier",
      "LK Textiles Surat",
      "Textile Fabric Manufacturer",
    ],
  },
  hero: {
    badge: "Setting Global Standards Since 1995",
    titlePrefix: "Surat's Premier",
    titleGradient: "Grey Fabric & Art Silk Fabric Manufacturer.",
    description:
      "LK Textiles is a trusted textile manufacturer and supplier of quality grey cloth and art silk fabrics, marrying age-old craftsmanship with state-of-the-art innovation for global brands.",
    primaryCtaText: "Explore Capabilities",
    primaryCtaLink: "#categories",
    trustedCount: "500+ Brands",
    imageUrl:
      "https://zizfqhfcqheqtourwikd.supabase.co/storage/v1/object/public/landing-assets/images/1790055618070-k8jkgi.webp",
    exportBadgeTitle: "Global Export",
    exportBadgeValue: "30+ Countries",
  },
  heritage: {
    badge: "Our Heritage",
    title: "Decades of Mastery as a Surat Textile Manufacturer.",
    description:
      "Since our inception, LK Textiles has championed the fusion of traditional textile craftsmanship with cutting-edge manufacturing. As a leading Textile Manufacturer in Surat, we don't just produce fabrics; we supply high-quality Grey Fabric and Art Silk Cloth to the world's most prestigious brands.",
    image1Url:
      "https://zizfqhfcqheqtourwikd.supabase.co/storage/v1/object/public/landing-assets/images/1790055042186-yw4k1b.jpg",
    image2Url:
      "https://zizfqhfcqheqtourwikd.supabase.co/storage/v1/object/public/landing-assets/images/1790055164779-k86y8f.webp",
    stat1Value: "30+",
    stat1Label: "Years of Excellence",
    stat2Value: "10M+",
    stat2Label: "Meters Annually",
    ctaText: "Discover Our Mill Infrastructure & Products",
    ctaLink: "/#capabilities",
  },
  capabilities: {
    title: "Our Textile Fabrics & Products",
    subtitle: "Discover our versatile textile products tailored for diverse industry needs.",
    products: [
      {
        id: "grey-fabric",
        title: "Grey Fabric Manufacturer & Supplier",
        description:
          "High-density grey cloth engineering for suiting, shirting, and premium textile applications.",
        imageUrl:
          "https://zizfqhfcqheqtourwikd.supabase.co/storage/v1/object/public/landing-assets/images/1790055194431-hczl68.avif",
        linkText: "Explore Grey Fabric",
        linkUrl: "#contact",
      },
      {
        id: "art-silk",
        title: "Art Silk Fabric",
        description:
          "Premium quality art silk cloth for luxury garments and commercial manufacturing.",
        imageUrl:
          "https://zizfqhfcqheqtourwikd.supabase.co/storage/v1/object/public/landing-assets/images/1790055228930-ztlw2b.jpg",
        linkText: "View Art Silk Products",
        linkUrl: "#contact",
        isDark: true,
      },
      {
        id: "sustainable",
        title: "Sustainable Solutions",
        description:
          "Sustainable textile products including zero-discharge dyeing processes.",
        imageUrl: "",
        linkText: "Learn More",
        linkUrl: "#contact",
        isSpecial: true,
      },
      {
        id: "yarns",
        title: "Textile Fabric Supplier",
        description:
          "Durable, color-fast textile products and specialty yarns for commercial manufacturing.",
        imageUrl:
          "https://zizfqhfcqheqtourwikd.supabase.co/storage/v1/object/public/landing-assets/images/1790055235079-1la51h.jpg",
        linkText: "Explore Textile Products",
        linkUrl: "#contact",
      },
    ],
  },
  advantages: {
    title: "Why Choose LK Textiles",
    subtitle: "Why industry leaders trust us as their quality fabric manufacturer and textile supplier.",
    items: [
      {
        id: "quality",
        title: "Uncompromising Quality",
        desc: "Multi-stage QA protocols ensure zero defects.",
        iconName: "ShieldCheck",
      },
      {
        id: "scale",
        title: "Scalable Production",
        desc: "Agile infrastructure capable of massive volume.",
        iconName: "Activity",
      },
      {
        id: "bespoke",
        title: "Bespoke Engineering",
        desc: "Custom weaves, weights, and finishes on demand.",
        iconName: "Scissors",
      },
      {
        id: "logistics",
        title: "Global Logistics",
        desc: "Optimized supply chains for predictable delivery.",
        iconName: "Truck",
      },
    ],
  },
  contact: {
    title: "Get in Touch with Our Textile Specialists",
    subtitle:
      "Discuss your grey fabric, art silk, or custom manufacturing requirements with our team in Surat.",
    address: "Survey No.8, Plot No.29/1, Mahaprabhu Nagar, Limbayat, Surat, 395012",
    phone1: "+91 98251 21931",
    phone2: "+91 70698 66165",
    email: "lktextiles6165@gmail.com",
    hours: "Mon - Sat: 9:00 AM - 8:00 PM IST",
  },
  footer: {
    description:
      "Redefining the standards of global textile manufacturing with uncompromising quality and sustainable innovation. As a trusted Surat Textile Manufacturer, we deliver excellence in every fabric.",
    copyright: "LK Textiles. All rights reserved.",
    socialLinks: {
      whatsapp: "https://wa.me/919825121931",
    },
  },
}
