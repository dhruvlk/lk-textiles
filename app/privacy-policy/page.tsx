import type { Metadata } from "next"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

export const metadata: Metadata = {
  title: "Privacy Policy | LK Textiles",
  description: "Privacy policy and data handling information for LK Textiles. We are committed to protecting your privacy and personal information.",
  alternates: {
    canonical: "https://lk-textiles.vercel.app/privacy-policy",
  },
  openGraph: {
    title: "Privacy Policy | LK Textiles",
    description: "Privacy policy and data handling information for LK Textiles. We are committed to protecting your privacy and personal information.",
    url: "https://lk-textiles.vercel.app/privacy-policy",
  },
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#FDFCF8] text-slate-900 selection:bg-primary/20">
      <div className="container mx-auto px-6 py-16 md:py-24 max-w-4xl">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors mb-8">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Home
        </Link>
        
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">Privacy Policy</h1>
        <p className="text-slate-500 mb-12">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

        <div className="text-lg text-slate-700 space-y-6 max-w-3xl">
          <p>
            At LK Textiles, accessible from our website, one of our main priorities is the privacy of our visitors. This Privacy Policy document contains types of information that is collected and recorded by LK Textiles and how we use it.
          </p>
          <p>
            If you have additional questions or require more information about our Privacy Policy, do not hesitate to contact us.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-4">Information We Collect</h2>
          <p>
            The personal information that you are asked to provide, and the reasons why you are asked to provide it, will be made clear to you at the point we ask you to provide your personal information.
          </p>
          <p>
            If you contact us directly, we may receive additional information about you such as your name, email address, phone number, the contents of the message and/or attachments you may send us, and any other information you may choose to provide.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-4">How We Use Your Information</h2>
          <p>We use the information we collect in various ways, including to:</p>
          <ul className="list-disc pl-6 space-y-2 text-slate-600">
            <li>Provide, operate, and maintain our website and services.</li>
            <li>Improve, personalize, and expand our website offerings.</li>
            <li>Understand and analyze how you use our website.</li>
            <li>Develop new products, services, features, and functionality.</li>
            <li>Communicate with you, either directly or through one of our partners, including for customer service, to provide you with updates and other information relating to the website, and for marketing and promotional purposes.</li>
            <li>Send you emails regarding bulk inquiries and quotes.</li>
            <li>Find and prevent fraud.</li>
          </ul>

          <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-4">Log Files</h2>
          <p>
            LK Textiles follows a standard procedure of using log files. These files log visitors when they visit websites. All hosting companies do this and a part of hosting services&apos; analytics. The information collected by log files include internet protocol (IP) addresses, browser type, Internet Service Provider (ISP), date and time stamp, referring/exit pages, and possibly the number of clicks. These are not linked to any information that is personally identifiable. The purpose of the information is for analyzing trends, administering the site, tracking users&apos; movement on the website, and gathering demographic information.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-4">Cookies and Web Beacons</h2>
          <p>
            Like any other website, LK Textiles uses &quot;cookies&quot;. These cookies are used to store information including visitors&apos; preferences, and the pages on the website that the visitor accessed or visited. The information is used to optimize the users&apos; experience by customizing our web page content based on visitors&apos; browser type and/or other information.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-4">Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us at:
            <br /><br />
            <strong className="text-slate-900">Email:</strong> lktextiles6165@gmail.com
            <br />
            <strong className="text-slate-900">Address:</strong> Survey No.8, Plot No.29/1, Mahaprabhu Nagar, Limbayat, Surat, 395012
          </p>
        </div>
      </div>
    </div>
  )
}
