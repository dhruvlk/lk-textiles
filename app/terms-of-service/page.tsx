import Link from "next/link"
import { ChevronLeft } from "lucide-react"

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-[#FDFCF8] text-slate-900 selection:bg-primary/20">
      <div className="container mx-auto px-6 py-16 md:py-24 max-w-4xl">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors mb-8">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Home
        </Link>
        
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">Terms of Service</h1>
        <p className="text-slate-500 mb-12">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

        <div className="text-lg text-slate-700 space-y-6 max-w-3xl">
          <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-4">1. Terms</h2>
          <p>
            By accessing the website at LK Textiles, you are agreeing to be bound by these terms of service, all applicable laws and regulations, and agree that you are responsible for compliance with any applicable local laws. If you do not agree with any of these terms, you are prohibited from using or accessing this site. The materials contained in this website are protected by applicable copyright and trademark law.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-4">2. Use License</h2>
          <p>
            Permission is granted to temporarily download one copy of the materials (information or software) on LK Textiles' website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-slate-600">
            <li>modify or copy the materials;</li>
            <li>use the materials for any commercial purpose, or for any public display (commercial or non-commercial);</li>
            <li>attempt to decompile or reverse engineer any software contained on LK Textiles' website;</li>
            <li>remove any copyright or other proprietary notations from the materials; or</li>
            <li>transfer the materials to another person or "mirror" the materials on any other server.</li>
          </ul>
          <p>
            This license shall automatically terminate if you violate any of these restrictions and may be terminated by LK Textiles at any time. Upon terminating your viewing of these materials or upon the termination of this license, you must destroy any downloaded materials in your possession whether in electronic or printed format.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-4">3. Disclaimer</h2>
          <p>
            The materials on LK Textiles' website are provided on an 'as is' basis. LK Textiles makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
          </p>
          <p>
            Further, LK Textiles does not warrant or make any representations concerning the accuracy, likely results, or reliability of the use of the materials on its website or otherwise relating to such materials or on any sites linked to this site.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-4">4. Limitations</h2>
          <p>
            In no event shall LK Textiles or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on LK Textiles' website, even if LK Textiles or a LK Textiles authorized representative has been notified orally or in writing of the possibility of such damage. Because some jurisdictions do not allow limitations on implied warranties, or limitations of liability for consequential or incidental damages, these limitations may not apply to you.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-4">5. Accuracy of materials</h2>
          <p>
            The materials appearing on LK Textiles' website could include technical, typographical, or photographic errors. LK Textiles does not warrant that any of the materials on its website are accurate, complete or current. LK Textiles may make changes to the materials contained on its website at any time without notice. However LK Textiles does not make any commitment to update the materials.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-4">6. Links</h2>
          <p>
            LK Textiles has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by LK Textiles of the site. Use of any such linked website is at the user's own risk.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-4">7. Modifications</h2>
          <p>
            LK Textiles may revise these terms of service for its website at any time without notice. By using this website you are agreeing to be bound by the then current version of these terms of service.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-4">8. Governing Law</h2>
          <p>
            These terms and conditions are governed by and construed in accordance with the laws of India and you irrevocably submit to the exclusive jurisdiction of the courts in that State or location.
          </p>
        </div>
      </div>
    </div>
  )
}
