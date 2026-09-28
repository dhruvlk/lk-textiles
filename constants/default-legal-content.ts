import { LegalContent } from "@/types/landing-legal"

export const defaultPrivacyPolicyContent: LegalContent = {
  id: "privacy_policy",
  type: "privacy_policy",
  title: "Privacy Policy",
  description:
    "Privacy policy and data handling information for LK Textiles. We are committed to protecting your privacy and personal information.",
  content: `
<p>At LK Textiles, accessible from our website, one of our main priorities is the privacy of our visitors. This Privacy Policy document contains types of information that is collected and recorded by LK Textiles and how we use it.</p>
<p>If you have additional questions or require more information about our Privacy Policy, do not hesitate to contact us.</p>
<h2>Information We Collect</h2>
<p>The personal information that you are asked to provide, and the reasons why you are asked to provide it, will be made clear to you at the point we ask you to provide your personal information.</p>
<p>If you contact us directly, we may receive additional information about you such as your name, email address, phone number, the contents of the message and/or attachments you may send us, and any other information you may choose to provide.</p>
<h2>How We Use Your Information</h2>
<p>We use the information we collect in various ways, including to:</p>
<ul>
  <li>Provide, operate, and maintain our website and services.</li>
  <li>Improve, personalize, and expand our website offerings.</li>
  <li>Understand and analyze how you use our website.</li>
  <li>Develop new products, services, features, and functionality.</li>
  <li>Communicate with you, either directly or through one of our partners, including for customer service, to provide you with updates and other information relating to the website, and for marketing and promotional purposes.</li>
  <li>Send you emails regarding bulk inquiries and quotes.</li>
  <li>Find and prevent fraud.</li>
</ul>
<h2>Log Files</h2>
<p>LK Textiles follows a standard procedure of using log files. These files log visitors when they visit websites. All hosting companies do this and a part of hosting services' analytics. The information collected by log files include internet protocol (IP) addresses, browser type, Internet Service Provider (ISP), date and time stamp, referring/exit pages, and possibly the number of clicks. These are not linked to any information that is personally identifiable. The purpose of the information is for analyzing trends, administering the site, tracking users' movement on the website, and gathering demographic information.</p>
<h2>Cookies and Web Beacons</h2>
<p>Like any other website, LK Textiles uses "cookies". These cookies are used to store information including visitors' preferences, and the pages on the website that the visitor accessed or visited. The information is used to optimize the users' experience by customizing our web page content based on visitors' browser type and/or other information.</p>
<h2>Contact Us</h2>
<p>If you have any questions about this Privacy Policy, please contact us at:</p>
<p><strong>Email:</strong> lktextiles6165@gmail.com<br/><strong>Address:</strong> Survey No.8, Plot No.29/1, Mahaprabhu Nagar, Limbayat, Surat, 395012</p>
`.trim(),
  is_published: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

export const defaultTermsConditionsContent: LegalContent = {
  id: "terms_conditions",
  type: "terms_conditions",
  title: "Terms & Conditions",
  description:
    "Terms and conditions of service for LK Textiles. Please read these terms carefully before using our website or services.",
  content: `
<h2>1. Terms</h2>
<p>By accessing the website at LK Textiles, you are agreeing to be bound by these terms of service, all applicable laws and regulations, and agree that you are responsible for compliance with any applicable local laws. If you do not agree with any of these terms, you are prohibited from using or accessing this site. The materials contained in this website are protected by applicable copyright and trademark law.</p>
<h2>2. Use License</h2>
<p>Permission is granted to temporarily download one copy of the materials (information or software) on LK Textiles' website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:</p>
<ul>
  <li>modify or copy the materials;</li>
  <li>use the materials for any commercial purpose, or for any public display (commercial or non-commercial);</li>
  <li>attempt to decompile or reverse engineer any software contained on LK Textiles' website;</li>
  <li>remove any copyright or other proprietary notations from the materials; or</li>
  <li>transfer the materials to another person or "mirror" the materials on any other server.</li>
</ul>
<p>This license shall automatically terminate if you violate any of these restrictions and may be terminated by LK Textiles at any time. Upon terminating your viewing of these materials or upon the termination of this license, you must destroy any downloaded materials in your possession whether in electronic or printed format.</p>
<h2>3. Disclaimer</h2>
<p>The materials on LK Textiles' website are provided on an 'as is' basis. LK Textiles makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</p>
<p>Further, LK Textiles does not warrant or make any representations concerning the accuracy, likely results, or reliability of the use of the materials on its website or otherwise relating to such materials or on any sites linked to this site.</p>
<h2>4. Limitations</h2>
<p>In no event shall LK Textiles or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on LK Textiles' website, even if LK Textiles or a LK Textiles authorized representative has been notified orally or in writing of the possibility of such damage. Because some jurisdictions do not allow limitations on implied warranties, or limitations of liability for consequential or incidental damages, these limitations may not apply to you.</p>
<h2>5. Accuracy of materials</h2>
<p>The materials appearing on LK Textiles' website could include technical, typographical, or photographic errors. LK Textiles does not warrant that any of the materials on its website are accurate, complete or current. LK Textiles may make changes to the materials contained on its website at any time without notice. However LK Textiles does not make any commitment to update the materials.</p>
<h2>6. Links</h2>
<p>LK Textiles has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by LK Textiles of the site. Use of any such linked website is at the user's own risk.</p>
<h2>7. Modifications</h2>
<p>LK Textiles may revise these terms of service for its website at any time without notice. By using this website you are agreeing to be bound by the then current version of these terms of service.</p>
<h2>8. Governing Law</h2>
<p>These terms and conditions are governed by and construed in accordance with the laws of India and you irrevocably submit to the exclusive jurisdiction of the courts in that State or location.</p>
`.trim(),
  is_published: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

export const defaultLegalContentMap: Record<string, LegalContent> = {
  privacy_policy: defaultPrivacyPolicyContent,
  terms_conditions: defaultTermsConditionsContent,
}
