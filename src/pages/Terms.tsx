import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-bold text-white">{title}</h2>
      <div className="text-neutral-400 leading-relaxed space-y-3">{children}</div>
    </section>
  );
}

export default function Terms() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="sticky top-0 z-10 bg-[#0a0a0a]/95 backdrop-blur border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="inline-flex items-center gap-2 text-neutral-400 hover:text-white transition-colors">
            <ArrowLeft size={18} />
            <span className="text-sm font-medium">Back</span>
          </Link>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-10">

          <div>
            <h1 className="text-4xl font-black text-white mb-2">
              Terms of <span className="text-[#e8a020]">Service</span>
            </h1>
            <p className="text-neutral-500 text-sm">Last Updated: June 2026</p>
            <p className="text-neutral-500 text-sm mt-1">
              XLShorts is a service of <span className="text-neutral-300">Xandland Enterprises, LLC</span>, a Texas limited liability company.
            </p>
          </div>

          <Section title="1. Agreement to Terms">
            <p>By accessing or using XLShorts ("the Platform"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the Platform.</p>
            <p>XLShorts is operated by Xandland Enterprises, LLC ("Xandland," "we," "us," or "our"). These Terms constitute a legally binding agreement between you and Xandland Enterprises, LLC.</p>
          </Section>

          <Section title="2. Eligibility">
            <p>You must be at least 13 years of age to create an account on XLShorts. Users under 18 should use the Platform only with the involvement and consent of a parent or guardian. By creating an account, you represent that you meet these eligibility requirements.</p>
            <p>Child profiles created within an account are the responsibility of the account holder. Xandland Enterprises, LLC is not liable for content accessed by minors through improperly configured profiles.</p>
          </Section>

          <Section title="3. Accounts and Profiles">
            <p>You are responsible for maintaining the security of your account credentials. XLShorts supports multiple viewer profiles under a single account to accommodate families and households. You are responsible for all activity that occurs under your account, including activity on any profiles created within it.</p>
            <p>You may not transfer your account to another party without our written consent.</p>
          </Section>

          <Section title="4. Creator Terms — Content Submission">
            <p>By submitting a film or other content to XLShorts ("Content"), you represent and warrant that:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>You own the Content or have the necessary rights, licenses, and permissions to submit and distribute it on the Platform.</li>
              <li>Your Content does not infringe the intellectual property rights, privacy rights, or any other rights of any third party.</li>
              <li>You have obtained all necessary clearances for music, footage, likenesses, and any other third-party elements included in your Content.</li>
              <li>Your Content does not violate any applicable law or regulation.</li>
            </ul>
          </Section>

          <Section title="5. Non-Exclusive License">
            <p>By submitting Content to XLShorts, you grant Xandland Enterprises, LLC a <span className="text-white font-semibold">non-exclusive</span>, worldwide, royalty-free license to host, stream, display, and promote your Content on the Platform and in connection with marketing XLShorts.</p>
            <p>This license is <span className="text-white font-semibold">non-exclusive</span>. You retain full ownership of your Content and may distribute it on other platforms, festivals, or through any other channel of your choosing. Submitting to XLShorts does not restrict your rights to distribute your work elsewhere.</p>
            <p>You may request removal of your Content from the Platform at any time. We will process removal requests within a reasonable timeframe, subject to any outstanding moderation or dispute processes.</p>
          </Section>

          <Section title="6. Content Accuracy and Moderation">
            <p>Creators are required to accurately describe the content of their films using the Platform's content labeling system, including age tier designation (Family, Teen, or Adult) and all applicable content flags (language, violence, nudity, drug use, mature themes, etc.).</p>
            <p className="text-white/90 font-medium border-l-2 border-[#e8a020] pl-4">
              Misrepresenting the content of your film — including labeling adult or mature material as family-safe — is a violation of these Terms and may result in the immediate removal of your Content and the permanent suspension of your account.
            </p>
            <p>XLShorts reserves the right to review any Content submitted to the Platform. We may adjust content labels, restrict visibility, or remove Content at our sole discretion if we determine that it violates these Terms or our Community Guidelines.</p>
            <p>While we make reasonable efforts to review flagged Content, <span className="text-white font-semibold">Xandland Enterprises, LLC is not responsible for the accuracy of creator-submitted content labels</span>. We rely on creators to label their Content honestly and cannot guarantee that all Content has been perfectly categorized. Users and parents are encouraged to preview Content and use the Platform's parental control features accordingly.</p>
          </Section>

          <Section title="7. Prohibited Content">
            <p>The following Content is strictly prohibited on XLShorts and will result in immediate removal and account termination:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Content that sexualizes, exploits, or endangers minors in any way.</li>
              <li>Content that promotes, incites, or glorifies violence, terrorism, or hate crimes.</li>
              <li>Content that constitutes defamation, harassment, or targeted abuse of identifiable individuals.</li>
              <li>Content that infringes the intellectual property rights of third parties.</li>
              <li>Content that is deceptive, fraudulent, or designed to mislead viewers.</li>
              <li>Any other content that violates applicable federal, state, or local law.</li>
            </ul>
          </Section>

          <Section title="8. Advertising and Revenue">
            <p>XLShorts may display advertising on the Platform, including ads served through third-party advertising networks such as Google AdSense. Revenue generated through third-party advertising networks may be shared with creators in accordance with the Platform's monetization terms, as communicated separately.</p>
            <p>XLShorts and Xandland Enterprises, LLC may also display house advertisements promoting Xandland's own products, services, and affiliated platforms (including but not limited to XLCoverage, XLResumes, and Xandland.com). <span className="text-white font-semibold">House advertisements for Xandland Enterprises or its affiliated brands do not generate creator revenue.</span> This is standard practice across streaming and content platforms and is not a basis for compensation claims.</p>
          </Section>

          <Section title="9. Viewer Conduct">
            <p>As a viewer, you agree not to:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Circumvent or attempt to circumvent any content restrictions, including parental controls or age verification measures.</li>
              <li>Download, reproduce, or redistribute Content from the Platform without the creator's express permission.</li>
              <li>Use automated tools, bots, or scrapers to access or collect data from the Platform.</li>
              <li>Attempt to gain unauthorized access to any portion of the Platform or its underlying infrastructure.</li>
            </ul>
          </Section>

          <Section title="10. Intellectual Property">
            <p>The XLShorts platform, including its design, branding, software, and non-creator content, is owned by Xandland Enterprises, LLC and is protected by applicable intellectual property laws. The Xandland name, logo, and XLShorts name and logo are trademarks of Xandland Enterprises, LLC.</p>
            <p>Creator Content remains the intellectual property of the respective creator. Xandland Enterprises, LLC makes no claim of ownership over Content submitted by creators beyond the non-exclusive license described in Section 5.</p>
          </Section>

          <Section title="11. Disclaimers and Limitation of Liability">
            <p>THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. XANDLAND ENTERPRISES, LLC DOES NOT WARRANT THAT THE PLATFORM WILL BE UNINTERRUPTED, ERROR-FREE, OR FREE OF HARMFUL COMPONENTS.</p>
            <p>TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, XANDLAND ENTERPRISES, LLC SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE PLATFORM OR ANY CONTENT ACCESSED THROUGH IT.</p>
            <p>Xandland Enterprises, LLC is not responsible for the content, accuracy, or opinions expressed in creator-submitted films. Views expressed in Content do not represent the views of Xandland Enterprises, LLC.</p>
          </Section>

          <Section title="12. Termination">
            <p>We reserve the right to suspend or terminate your account at any time, with or without notice, for conduct that we determine violates these Terms or is otherwise harmful to the Platform, its users, or third parties.</p>
            <p>You may terminate your account at any time by contacting us. Upon termination, your right to access the Platform ceases immediately.</p>
          </Section>

          <Section title="13. Governing Law">
            <p>These Terms are governed by the laws of the State of Texas, without regard to its conflict of law provisions. Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the courts located in Texas.</p>
          </Section>

          <Section title="14. Changes to These Terms">
            <p>We may update these Terms from time to time. We will notify registered users of material changes by posting a notice on the Platform or by email. Your continued use of the Platform after changes are posted constitutes your acceptance of the updated Terms.</p>
          </Section>

          <Section title="15. Contact">
            <p>If you have questions about these Terms, please contact Xandland Enterprises, LLC at:</p>
            <p className="text-neutral-300">legal@xandland.com</p>
          </Section>

        </div>
      </main>
    </div>
  );
}
