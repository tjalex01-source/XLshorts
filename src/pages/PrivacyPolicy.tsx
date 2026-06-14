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

export default function PrivacyPolicy() {
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
              Privacy <span className="text-[#e8a020]">Policy</span>
            </h1>
            <p className="text-neutral-500 text-sm">Last Updated: June 2026</p>
            <p className="text-neutral-500 text-sm mt-1">
              XLShorts is a service of <span className="text-neutral-300">Xandland Enterprises, LLC</span>, a Texas limited liability company.
            </p>
          </div>

          <Section title="1. Overview">
            <p>Xandland Enterprises, LLC ("Xandland," "we," "us," or "our") operates XLShorts and is committed to protecting your privacy. This Privacy Policy explains what information we collect, how we use it, and the choices you have regarding your information when you use XLShorts ("the Platform").</p>
            <p>By using the Platform, you consent to the practices described in this Privacy Policy.</p>
          </Section>

          <Section title="2. Information We Collect">
            <p><span className="text-white font-semibold">Account Information:</span> When you create an account, we collect your email address and display name. If you choose to complete your profile, we may also collect a bio, profile photo, social media links, and genre preferences.</p>
            <p><span className="text-white font-semibold">Viewer Profiles:</span> XLShorts supports multiple viewer profiles under a single account. We store profile names, avatar selections, content preferences, age tier settings, content restriction flags, and optional PIN hashes for profile switching.</p>
            <p><span className="text-white font-semibold">Watch Activity:</span> We collect information about your viewing activity, including which films you watch, your progress within films, whether you complete films, and films you add to your watchlist. This information is used to power features like Continue Watching, Watch Again, and personalized recommendations.</p>
            <p><span className="text-white font-semibold">Creator Content:</span> If you submit Content as a creator, we store your film's metadata, video files, thumbnail images, content labels, and any credits you associate with your Content.</p>
            <p><span className="text-white font-semibold">Usage Data:</span> We may collect standard usage data such as browser type, device type, IP address, pages visited, and time spent on the Platform. This data is used to improve the Platform and diagnose technical issues.</p>
            <p><span className="text-white font-semibold">Advertising Data:</span> If you interact with ads served through third-party networks such as Google AdSense, those providers may collect data in accordance with their own privacy policies. We do not control the data practices of third-party advertising networks.</p>
          </Section>

          <Section title="3. How We Use Your Information">
            <p>We use the information we collect to:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Provide, operate, and improve the Platform and its features.</li>
              <li>Authenticate your identity and maintain your account and viewer profiles.</li>
              <li>Personalize your experience, including content recommendations based on your watch history and genre preferences.</li>
              <li>Power parental control features, including content filtering by age tier and specific content flags.</li>
              <li>Process and display creator-submitted Content and associated credits.</li>
              <li>Serve advertising through third-party networks and display house advertisements for Xandland Enterprises and its affiliated services.</li>
              <li>Communicate with you about your account, content submissions, or changes to Platform policies.</li>
              <li>Detect, investigate, and prevent fraudulent activity, policy violations, and technical issues.</li>
            </ul>
          </Section>

          <Section title="4. Data Storage and Processors">
            <p>XLShorts uses <span className="text-white font-semibold">Supabase</span> as its primary database and authentication provider. Your account data, profile information, watch history, and content metadata are stored on Supabase infrastructure. Supabase acts as a data processor on behalf of Xandland Enterprises, LLC and processes data in accordance with its own privacy and security policies.</p>
            <p>Video and image files may be stored through cloud storage services. We take reasonable measures to ensure these providers maintain appropriate security standards.</p>
            <p>Xandland Enterprises, LLC does not sell your personal information to third parties.</p>
          </Section>

          <Section title="5. Sharing Your Information">
            <p>We do not sell, rent, or trade your personal information. We may share your information only in the following circumstances:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><span className="text-white font-semibold">Service Providers:</span> We share data with third-party service providers (such as Supabase, cloud storage, and email delivery services) that help us operate the Platform. These providers are contractually bound to protect your data and may only use it to provide services to us.</li>
              <li><span className="text-white font-semibold">Advertising Networks:</span> Third-party advertising networks such as Google AdSense may receive usage data and device identifiers to serve relevant ads. See Section 7 for more information.</li>
              <li><span className="text-white font-semibold">Legal Requirements:</span> We may disclose your information if required to do so by law, court order, or governmental authority, or if we believe disclosure is necessary to protect the rights, safety, or property of Xandland Enterprises, LLC, our users, or the public.</li>
              <li><span className="text-white font-semibold">Business Transfers:</span> In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction. We will notify you of any such change.</li>
            </ul>
          </Section>

          <Section title="6. Public Profile Information">
            <p>XLShorts viewer profiles may include a public-facing people page accessible at <span className="text-neutral-300">xlshorts.com/people/[your-slug]</span>. The information visible on this page is controlled entirely by you through your profile's visibility settings. You may choose to make your bio, genre preferences, and social media links public or private on a per-field basis.</p>
            <p>Your name and filmography (films you are credited on) are visible on your public profile page if you have been tagged in film credits. If you wish to be removed from a film's credits, please contact us.</p>
          </Section>

          <Section title="7. Advertising and Third-Party Services">
            <p>XLShorts displays advertising through third-party networks, which may include Google AdSense. These networks use cookies and similar tracking technologies to serve ads based on your browsing activity. You can opt out of personalized advertising by visiting the <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-[#e8a020] hover:underline">Google Ads Settings</a> or the <a href="https://optout.networkadvertising.org/" target="_blank" rel="noopener noreferrer" className="text-[#e8a020] hover:underline">Network Advertising Initiative opt-out page</a>.</p>
            <p>XLShorts and Xandland Enterprises, LLC may also display house advertisements for Xandland's own services and affiliated platforms. These house ads do not involve the sharing of your personal data with third parties.</p>
          </Section>

          <Section title="8. Children's Privacy">
            <p>XLShorts is not directed at children under the age of 13. We do not knowingly collect personal information from children under 13. If you believe a child under 13 has created an account, please contact us immediately and we will take steps to remove their information.</p>
            <p>For users between the ages of 13 and 17, we encourage parents and guardians to create supervised child profiles using the Platform's parental control features, which allow restriction of Content by age tier and specific content flags.</p>
          </Section>

          <Section title="9. Data Retention">
            <p>We retain your account information and associated data for as long as your account is active. If you delete your account, we will delete or anonymize your personal information within a reasonable timeframe, except where retention is required by law or legitimate business necessity (such as fraud prevention records).</p>
            <p>Watch history and profile data associated with deleted profiles are removed from our active systems. Some anonymized usage data may be retained for analytics purposes.</p>
          </Section>

          <Section title="10. Your Rights and Choices">
            <p>You have the following rights regarding your personal information:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><span className="text-white font-semibold">Access and Correction:</span> You may view and update your account information and profile details at any time through your account settings.</li>
              <li><span className="text-white font-semibold">Deletion:</span> You may request deletion of your account and associated personal data by contacting us at the address below.</li>
              <li><span className="text-white font-semibold">Data Portability:</span> You may request a copy of the personal data we hold about you.</li>
              <li><span className="text-white font-semibold">Opt-Out of Marketing:</span> You may unsubscribe from marketing communications at any time by following the unsubscribe link in any email we send.</li>
            </ul>
            <p>To exercise any of these rights, contact us at <span className="text-neutral-300">privacy@xandland.com</span>.</p>
          </Section>

          <Section title="11. Security">
            <p>We implement reasonable technical and organizational measures to protect your personal information from unauthorized access, disclosure, alteration, or destruction. These measures include encrypted data transmission, secure authentication through Supabase, and hashed storage of profile PINs.</p>
            <p>No method of transmission over the internet or electronic storage is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.</p>
          </Section>

          <Section title="12. Xandland Ecosystem">
            <p>XLShorts is one of several platforms operated under the Xandland Enterprises, LLC umbrella, which includes Xandland.com, XLCoverage, XLResumes, and other services. If you use multiple Xandland services, your core account information (email, display name, and authentication) is shared across the Xandland ecosystem through a unified login system. Each service maintains its own separate data relevant to that service.</p>
          </Section>

          <Section title="13. Changes to This Policy">
            <p>We may update this Privacy Policy from time to time. We will notify registered users of material changes by posting a notice on the Platform or by email. Your continued use of the Platform after changes are posted constitutes your acceptance of the updated policy.</p>
          </Section>

          <Section title="14. Contact Us">
            <p>If you have questions, concerns, or requests regarding this Privacy Policy, please contact:</p>
            <div className="text-neutral-300 space-y-1">
              <p className="font-semibold text-white">Xandland Enterprises, LLC</p>
              <p>privacy@xandland.com</p>
              <p>Texas, United States</p>
            </div>
          </Section>

        </div>
      </main>
    </div>
  );
}
