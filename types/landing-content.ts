export interface ProductItem {
  id: string
  title: string
  description: string
  imageUrl: string
  linkText: string
  linkUrl: string
  isSpecial?: boolean
  isDark?: boolean
}

export interface AdvantageItem {
  id: string
  title: string
  desc: string
  iconName: string
}

export interface LandingPageContent {
  brand: {
    name: string
    tagline: string
    logoUrl: string
  }
  seo: {
    title: string
    description: string
    ogImage: string
    keywords: string[]
  }
  hero: {
    badge: string
    titlePrefix: string
    titleGradient: string
    description: string
    primaryCtaText: string
    primaryCtaLink: string
    trustedCount: string
    imageUrl: string
    exportBadgeTitle: string
    exportBadgeValue: string
  }
  heritage: {
    badge: string
    title: string
    description: string
    image1Url: string
    image2Url: string
    stat1Value: string
    stat1Label: string
    stat2Value: string
    stat2Label: string
    ctaText: string
    ctaLink: string
  }
  capabilities: {
    title: string
    subtitle: string
    products: ProductItem[]
  }
  advantages: {
    title: string
    subtitle: string
    items: AdvantageItem[]
  }
  contact: {
    title: string
    subtitle: string
    address: string
    phone1: string
    phone2: string
    email: string
    hours: string
  }
  footer: {
    description: string
    copyright: string
    socialLinks: {
      whatsapp?: string
      instagram?: string
      linkedin?: string
    }
  }
}
