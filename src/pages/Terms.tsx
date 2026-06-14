import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Terms() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0a0a0a]/95 backdrop-blur border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-neutral-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={18} />
            <span className="text-sm font-medium">Back</span>
          </Link>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          {/* Title */}
          <div>
            <h1 className="text-4xl font-black text-white mb-2">
              Terms of <span className="text-[#e8a020]">Service</span>
            </h1>
            <p className="text-neutral-500 text-sm">Last Updated: June 2026</p>
          </div>

          {/* Introduction */}
          <div className="bg-[#141414] border border-white/8 rounded-2xl p-6 sm:p-8">
            <p className="text-neutral-300 leading-relaxed">
              Welcome to XLShorts, operated by Xandland Enterprises, LLC. These Terms of Service ("Terms") govern your access to and use of the XLShorts platform, website, and services. By accessing or using XLShorts, you agree to be bound by these Terms. If you do not agree to all the terms and conditions, please do not use this service.
            </p>
          </div>

          {/* Sections */}
          <div className="space-y-6">
            {/* 1. Acceptance of Terms */}
            <section className="space-y-3">
              <h2 className="text-2xl font-bold text-white flex items-start gap-3">
                <span className="text-[#e8a020] font-black">1.</span>
                <span>Acceptance of Terms</span>
              </h2>
              <p className="text-neutral-300 leading-relaxed ml-9">
                By creating an account or accessing XLShorts, you acknowledge that you have read, understood, and agree to be bound by these Terms, our Privacy Policy, and any other policies referenced herein. We reserve the right to modify these Terms at any time. Continued use of the platform following changes constitutes your acceptance of the updated Terms.
              </p>
            </section>

            {/* 2. Account Registration & Eligibility */}
            <section className="space-y-3">
              <h2 className="text-2xl font-bold text-white flex items-start gap-3">
                <span className="text-[#e8a020] font-black">2.</span>
                <span>Account Registration & Eligibility</span>
              </h2>
              <p className="text-neutral-300 leading-relaxed ml-9">
                To use XLShorts, you must be at least 13 years of age. If you are under 18, you represent that you have obtained parental or guardian consent to use this service. By registering, you provide accurate, complete, and current information. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized access or use of your account.
              </p>
            </section>

            {/* 3. Permitted Use */}
            <section className="space-y-3">
              <h2 className="text-2xl font-bold text-white flex items-start gap-3">
                <span className="text-[#e8a020] font-black">3.</span>
                <span>Permitted Use</span>
              </h2>
              <p className="text-neutral-300 leading-relaxed ml-9">
                XLShorts is provided for your personal, non-commercial viewing and enjoyment. You may not reproduce, distribute, transmit, display, perform, or transfer any content from XLShorts without express written permission. You may not use the platform for any commercial purpose, including but not limited to streaming content for profit or incorporating it into another service.
              </p>
            </section>

            {/* 4. Content & Conduct */}
            <section className="space-y-3">
              <h2 className="text-2xl font-bold text-white flex items-start gap-3">
                <span className="text-[#e8a020] font-black">4.</span>
                <span>Content & Conduct</span>
              </h2>
              <p className="text-neutral-300 leading-relaxed ml-9">
                You agree not to use XLShorts in any manner that:
              </p>
              <ul className="ml-9 space-y-2 text-neutral-300">
                <li className="flex gap-3">
                  <span className="text-[#e8a020]">•</span>
                  <span>Harasses, threatens, defames, or abuses others</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[#e8a020]">•</span>
                  <span>Violates any applicable laws, regulations, or third-party rights</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[#e8a020]">•</span>
                  <span>Infringes on intellectual property rights</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[#e8a020]">•</span>
                  <span>Attempts to gain unauthorized access to our systems</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[#e8a020]">•</span>
                  <span>Introduces malware, viruses, or harmful code</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[#e8a020]">•</span>
                  <span>Engages in spam or unsolicited communications</span>
                </li>
              </ul>
            </section>

            {/* 5. Intellectual Property */}
            <section className="space-y-3">
              <h2 className="text-2xl font-bold text-white flex items-start gap-3">
                <span className="text-[#e8a020] font-black">5.</span>
                <span>Intellectual Property</span>
              </h2>
              <p className="text-neutral-300 leading-relaxed ml-9">
                Xandland Enterprises, LLC owns all intellectual property rights in the XLShorts brand, platform, interface, design, and technology. Creators retain full ownership of their submitted content. By uploading content to XLShorts, creators grant Xandland Enterprises, LLC a license to host, display, stream, and promote that content on the platform (see Creator section below for full details).
              </p>
            </section>

            {/* 6. Limitation of Liability */}
            <section className="space-y-3">
              <h2 className="text-2xl font-bold text-white flex items-start gap-3">
                <span className="text-[#e8a020] font-black">6.</span>
                <span>Limitation of Liability</span>
              </h2>
              <div className="ml-9 space-y-3">
                <p className="text-neutral-300 leading-relaxed">
                  <strong className="text-white">XLShorts and Xandland Enterprises, LLC are not responsible for the content of films uploaded by creators.</strong> We rely on creators to accurately represent their content through metadata and content flags. While we make reasonable efforts to review content, we cannot guarantee that all content meets stated content descriptors or that the platform is free of offensive, inappropriate, or illegal material.
                </p>
                <p className="text-neutral-300 leading-relaxed">
                  The platform is provided on an "as-is" basis. To the fullest extent permitted by law, we disclaim all warranties, express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, and non-infringement. We shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of or inability to use XLShorts.
                </p>
              </div>
            </section>

            {/* 7. No Rating System Disclaimer */}
            <section className="space-y-3">
              <h2 className="text-2xl font-bold text-white flex items-start gap-3">
                <span className="text-[#e8a020] font-black">7.</span>
                <span>No Official Rating System</span>
              </h2>
              <p className="text-neutral-300 leading-relaxed ml-9">
                Short films on XLShorts do not have an official MPAA-style rating. Content flags and descriptors are self-reported by creators and provided as guidance only. XLShorts does not independently verify or endorse these descriptors. Parents, guardians, and viewers are responsible for reviewing available information before watching content.
              </p>
            </section>

            {/* 8. Parental Responsibility */}
            <section className="space-y-3">
              <h2 className="text-2xl font-bold text-white flex items-start gap-3">
                <span className="text-[#e8a020] font-black">8.</span>
                <span>Parental Responsibility</span>
              </h2>
              <p className="text-neutral-300 leading-relaxed ml-9">
                Parents and guardians are responsible for supervising minor viewing on XLShorts. We encourage parental controls and age-appropriate content selection. XLShorts is not responsible for ensuring that minors are exposed only to age-appropriate content if parents or guardians fail to exercise supervision.
              </p>
            </section>

            {/* 9. Termination */}
            <section className="space-y-3">
              <h2 className="text-2xl font-bold text-white flex items-start gap-3">
                <span className="text-[#e8a020] font-black">9.</span>
                <span>Termination</span>
              </h2>
              <p className="text-neutral-300 leading-relaxed ml-9">
                Xandland Enterprises, LLC reserves the right to terminate or suspend your account at any time, with or without cause. Violations of these Terms, illegal activity, or conduct that harms the platform or other users may result in immediate termination. Upon termination, your right to use the platform ceases immediately.
              </p>
            </section>

            {/* 10. Governing Law */}
            <section className="space-y-3">
              <h2 className="text-2xl font-bold text-white flex items-start gap-3">
                <span className="text-[#e8a020] font-black">10.</span>
                <span>Governing Law</span>
              </h2>
              <p className="text-neutral-300 leading-relaxed ml-9">
                These Terms are governed by and construed in accordance with the laws of the United States, without regard to its conflicts of law provisions. Any legal action or proceeding relating to these Terms shall be brought exclusively in the courts located in the United States.
              </p>
            </section>

            {/* CREATOR SECTION */}
            <div className="border-t border-white/10 pt-8">
              <h2 className="text-3xl font-bold text-white mb-6 flex items-start gap-3">
                <span className="text-[#e8a020]">FOR CREATORS</span>
              </h2>

              {/* 11. Creator Eligibility */}
              <section className="space-y-3">
                <h2 className="text-2xl font-bold text-white flex items-start gap-3">
                  <span className="text-[#e8a020] font-black">11.</span>
                  <span>Creator Eligibility</span>
                </h2>
                <p className="text-neutral-300 leading-relaxed ml-9">
                  To upload and distribute content on XLShorts, you must apply for a creator account and be approved by Xandland Enterprises, LLC. We review all creator applications and reserve the right to accept or reject any application at our sole discretion. Approved creators agree to comply with all terms in this Creator section and all general platform terms.
                </p>
              </section>

              {/* 12. Content License */}
              <section className="space-y-3">
                <h2 className="text-2xl font-bold text-white flex items-start gap-3">
                  <span className="text-[#e8a020] font-black">12.</span>
                  <span>Content License</span>
                </h2>
                <p className="text-neutral-300 leading-relaxed ml-9">
                  By uploading content to XLShorts, you grant Xandland Enterprises, LLC a <strong className="text-white">non-exclusive, royalty-free, worldwide license</strong> to host, display, stream, and promote your content on the XLShorts platform. You retain full ownership of your content. This license does not transfer ownership or grant exclusive rights to Xandland Enterprises, LLC.
                </p>
              </section>

              {/* 13. Cross-Platform Rights */}
              <section className="space-y-3">
                <h2 className="text-2xl font-bold text-white flex items-start gap-3">
                  <span className="text-[#e8a020] font-black">13.</span>
                  <span>Cross-Platform Rights</span>
                </h2>
                <p className="text-neutral-300 leading-relaxed ml-9">
                  Creators are <strong className="text-white">free to distribute their content on other platforms simultaneously.</strong> XLShorts makes no exclusivity claim on creator content. You may share your films on YouTube, Vimeo, your own website, or any other platform while also distributing on XLShorts.
                </p>
              </section>

              {/* 14. No Upfront Payment */}
              <section className="space-y-3">
                <h2 className="text-2xl font-bold text-white flex items-start gap-3">
                  <span className="text-[#e8a020] font-black">14.</span>
                  <span>No Upfront Payment</span>
                </h2>
                <p className="text-neutral-300 leading-relaxed ml-9">
                  Creators will <strong className="text-white">not be paid directly</strong> for Xandland Enterprises, LLC to use their content on the platform. Compensation is provided exclusively through the ad revenue sharing program (see next section).
                </p>
              </section>

              {/* 15. Ad Revenue Share */}
              <section className="space-y-3">
                <h2 className="text-2xl font-bold text-white flex items-start gap-3">
                  <span className="text-[#e8a020] font-black">15.</span>
                  <span>Ad Revenue Share Program</span>
                </h2>
                <div className="ml-9 space-y-3">
                  <p className="text-neutral-300 leading-relaxed">
                    Creators earn revenue through XLShorts' ad revenue sharing program. The current split is <strong className="text-white">70% to the creator, 30% to Xandland Enterprises, LLC,</strong> calculated based on ad impressions generated on the creator's content.
                  </p>
                  <p className="text-neutral-300 leading-relaxed">
                    This revenue split may be adjusted by Xandland Enterprises, LLC with 30 days prior written notice. Revenue is calculated monthly and paid to creators via the payment method provided in their creator account. Minimum payout thresholds may apply.
                  </p>
                </div>
              </section>

              {/* 16. Creator Responsibilities */}
              <section className="space-y-3">
                <h2 className="text-2xl font-bold text-white flex items-start gap-3">
                  <span className="text-[#e8a020] font-black">16.</span>
                  <span>Creator Responsibilities</span>
                </h2>
                <p className="text-neutral-300 leading-relaxed ml-9">
                  Creators must accurately complete all content metadata and content flag fields. <strong className="text-white">Providing false content descriptors—such as marking adult content as child-safe—is grounds for immediate account termination.</strong> Creators are responsible for ensuring their content complies with applicable laws and does not infringe on third-party rights. Any misrepresentation of content is a material breach of these Terms.
                </p>
              </section>

              {/* 17. Content Removal */}
              <section className="space-y-3">
                <h2 className="text-2xl font-bold text-white flex items-start gap-3">
                  <span className="text-[#e8a020] font-black">17.</span>
                  <span>Content Removal</span>
                </h2>
                <p className="text-neutral-300 leading-relaxed ml-9">
                  Xandland Enterprises, LLC reserves the right to remove content that violates these Terms, is reported by users, or is determined to be harmful, at its sole discretion. We are not obligated to provide notice or explanation prior to removal, though we will make reasonable efforts to inform creators of termination and the reasons for removal.
                </p>
              </section>
            </div>

            {/* Footer */}
            <div className="border-t border-white/10 pt-8 mt-8">
              <p className="text-neutral-500 text-sm mb-4">
                Questions about our Terms of Service? Contact us at <span className="text-white">support@xandland.com</span>
              </p>
              <p className="text-neutral-500 text-sm">
                For privacy inquiries, see our <Link to="/privacy" className="text-[#e8a020] hover:underline">Privacy Policy</Link>.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
