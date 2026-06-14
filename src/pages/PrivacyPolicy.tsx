import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
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
              Privacy <span className="text-[#e8a020]">Policy</span>
            </h1>
            <p className="text-neutral-500 text-sm">Last Updated: June 2026</p>
          </div>

          {/* Introduction */}
          <div className="bg-[#141414] border border-white/8 rounded-2xl p-6 sm:p-8">
            <p className="text-neutral-300 leading-relaxed">
              Xandland Enterprises, LLC ("we," "us," or "our") operates the XLShorts platform. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services. Please read this Privacy Policy carefully. If you do not agree with our policies and practices, please do not use our service.
            </p>
          </div>

          {/* Sections */}
          <div className="space-y-6">
            {/* 1. What Data We Collect */}
            <section className="space-y-3">
              <h2 className="text-2xl font-bold text-white flex items-start gap-3">
                <span className="text-[#e8a020] font-black">1.</span>
                <span>What Data We Collect</span>
              </h2>
              <div className="ml-9 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Information You Provide</h3>
                  <ul className="space-y-2 text-neutral-300">
                    <li className="flex gap-3">
                      <span className="text-[#e8a020]">•</span>
                      <span><strong className="text-white">Account Information:</strong> Email address, full name, password (hashed)</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-[#e8a020]">•</span>
                      <span><strong className="text-white">Creator Information:</strong> For creators, payment/payout details for revenue distribution</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-[#e8a020]">•</span>
                      <span><strong className="text-white">Communication:</strong> Messages sent to support or feedback submitted via the platform</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Information Automatically Collected</h3>
                  <ul className="space-y-2 text-neutral-300">
                    <li className="flex gap-3">
                      <span className="text-[#e8a020]">•</span>
                      <span><strong className="text-white">Device & Browser Information:</strong> IP address, browser type, operating system, device identifiers</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-[#e8a020]">•</span>
                      <span><strong className="text-white">Watch History:</strong> Films viewed, playback duration, timestamps</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-[#e8a020]">•</span>
                      <span><strong className="text-white">Interaction Data:</strong> Searches, content preferences, clicks, engagement metrics</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-[#e8a020]">•</span>
                      <span><strong className="text-white">Cookies & Tracking:</strong> Session cookies, analytics pixels, ad tracking identifiers</span>
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 2. How We Use Your Data */}
            <section className="space-y-3">
              <h2 className="text-2xl font-bold text-white flex items-start gap-3">
                <span className="text-[#e8a020] font-black">2.</span>
                <span>How We Use Your Data</span>
              </h2>
              <p className="text-neutral-300 leading-relaxed ml-9 mb-3">We use the information we collect for the following purposes:</p>
              <ul className="ml-9 space-y-2 text-neutral-300">
                <li className="flex gap-3">
                  <span className="text-[#e8a020]">•</span>
                  <span><strong className="text-white">Account Management:</strong> Creating and maintaining your account, authentication, password recovery</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[#e8a020]">•</span>
                  <span><strong className="text-white">Content Recommendations:</strong> Personalizing your experience with recommended films based on watch history</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[#e8a020]">•</span>
                  <span><strong className="text-white">Ad Targeting:</strong> Delivering personalized advertisements based on device, browsing behavior, and interests</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[#e8a020]">•</span>
                  <span><strong className="text-white">Platform Analytics:</strong> Understanding how users interact with XLShorts to improve our service</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[#e8a020]">•</span>
                  <span><strong className="text-white">Revenue Distribution:</strong> For creators, processing and paying out ad revenue shares</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[#e8a020]">•</span>
                  <span><strong className="text-white">Customer Support:</strong> Responding to inquiries and resolving issues</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[#e8a020]">•</span>
                  <span><strong className="text-white">Legal Compliance:</strong> Fulfilling legal obligations and enforcing our Terms of Service</span>
                </li>
              </ul>
            </section>

            {/* 3. Data Sharing */}
            <section className="space-y-3">
              <h2 className="text-2xl font-bold text-white flex items-start gap-3">
                <span className="text-[#e8a020] font-black">3.</span>
                <span>Data Sharing & Third Parties</span>
              </h2>
              <div className="ml-9 space-y-3">
                <p className="text-neutral-300 leading-relaxed">
                  <strong className="text-white">We do not sell personal data to third parties.</strong> However, we share information in the following limited circumstances:
                </p>
                <ul className="space-y-2 text-neutral-300">
                  <li className="flex gap-3">
                    <span className="text-[#e8a020]">•</span>
                    <span><strong className="text-white">Ad Service Providers:</strong> We share device ID, IP address, and browsing behavior with ad partners to deliver targeted advertising. This sharing is limited to what is necessary for ad delivery.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-[#e8a020]">•</span>
                    <span><strong className="text-white">Payment Processors:</strong> For creators, we share payment information with third-party payment processors to facilitate revenue payouts. These processors are bound by confidentiality agreements.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-[#e8a020]">•</span>
                    <span><strong className="text-white">Service Providers:</strong> We may share data with hosting providers, analytics providers, and customer support platforms that assist in operating XLShorts.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-[#e8a020]">•</span>
                    <span><strong className="text-white">Legal Requirements:</strong> We may disclose data if required by law, court order, or government request.</span>
                  </li>
                </ul>
              </div>
            </section>

            {/* 4. Cookies & Tracking */}
            <section className="space-y-3">
              <h2 className="text-2xl font-bold text-white flex items-start gap-3">
                <span className="text-[#e8a020] font-black">4.</span>
                <span>Cookies & Tracking Technologies</span>
              </h2>
              <div className="ml-9 space-y-3">
                <p className="text-neutral-300 leading-relaxed">
                  XLShorts uses cookies and similar tracking technologies to enhance your experience:
                </p>
                <ul className="space-y-2 text-neutral-300">
                  <li className="flex gap-3">
                    <span className="text-[#e8a020]">•</span>
                    <span><strong className="text-white">Session Cookies:</strong> Enable login persistence and maintain your session during browsing</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-[#e8a020]">•</span>
                    <span><strong className="text-white">Analytics Cookies:</strong> Track user behavior and platform usage patterns to improve our service</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-[#e8a020]">•</span>
                    <span><strong className="text-white">Advertising Cookies:</strong> Used by ad partners to deliver personalized advertisements</span>
                  </li>
                </ul>
                <p className="text-neutral-300 leading-relaxed mt-3">
                  You can control cookies through your browser settings. However, disabling cookies may affect your ability to use certain features of XLShorts.
                </p>
              </div>
            </section>

            {/* 5. Children's Privacy (COPPA) */}
            <section className="space-y-3">
              <h2 className="text-2xl font-bold text-white flex items-start gap-3">
                <span className="text-[#e8a020] font-black">5.</span>
                <span>Children's Privacy (COPPA Compliance)</span>
              </h2>
              <div className="ml-9 space-y-3">
                <p className="text-neutral-300 leading-relaxed">
                  XLShorts complies with the Children's Online Privacy Protection Act (COPPA). <strong className="text-white">We do not knowingly collect personal information from children under 13 years of age.</strong> If we become aware that we have collected data from a child under 13, we will delete that information immediately.
                </p>
                <p className="text-neutral-300 leading-relaxed">
                  Parents or guardians who believe their child has provided information to XLShorts should contact us immediately at <span className="text-white">privacy@xandland.com</span>.
                </p>
              </div>
            </section>

            {/* 6. Creator Data */}
            <section className="space-y-3">
              <h2 className="text-2xl font-bold text-white flex items-start gap-3">
                <span className="text-[#e8a020] font-black">6.</span>
                <span>Creator Data Collection</span>
              </h2>
              <p className="text-neutral-300 leading-relaxed ml-9">
                For creators, we collect additional information necessary for revenue distribution, including:
              </p>
              <ul className="ml-9 space-y-2 text-neutral-300 mt-3">
                <li className="flex gap-3">
                  <span className="text-[#e8a020]">•</span>
                  <span>Payment method information (bank account, PayPal, etc.)</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[#e8a020]">•</span>
                  <span>Tax information required for proper 1099 reporting (if applicable)</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[#e8a020]">•</span>
                  <span>Content upload logs and metadata</span>
                </li>
              </ul>
              <p className="text-neutral-300 leading-relaxed ml-9 mt-3">
                This information is used exclusively for calculating and distributing ad revenue and fulfilling tax obligations.
              </p>
            </section>

            {/* 7. Data Retention */}
            <section className="space-y-3">
              <h2 className="text-2xl font-bold text-white flex items-start gap-3">
                <span className="text-[#e8a020] font-black">7.</span>
                <span>Data Retention</span>
              </h2>
              <p className="text-neutral-300 leading-relaxed ml-9">
                We retain personal data for as long as necessary to provide our services and fulfill the purposes outlined in this policy. When you delete your account, we delete most personal information within 30 days. However, we may retain data as required by law or for legitimate business purposes, such as fraud prevention or resolving disputes. Aggregated, anonymized data may be retained indefinitely.
              </p>
            </section>

            {/* 8. User Rights */}
            <section className="space-y-3">
              <h2 className="text-2xl font-bold text-white flex items-start gap-3">
                <span className="text-[#e8a020] font-black">8.</span>
                <span>Your Rights & Data Access</span>
              </h2>
              <div className="ml-9 space-y-3">
                <p className="text-neutral-300 leading-relaxed">
                  You have the right to:
                </p>
                <ul className="space-y-2 text-neutral-300">
                  <li className="flex gap-3">
                    <span className="text-[#e8a020]">•</span>
                    <span><strong className="text-white">Access:</strong> Request a copy of the personal data we hold about you</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-[#e8a020]">•</span>
                    <span><strong className="text-white">Deletion:</strong> Request deletion of your account and associated personal data (subject to legal requirements)</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-[#e8a020]">•</span>
                    <span><strong className="text-white">Correction:</strong> Update or correct inaccurate information in your account</span>
                  </li>
                </ul>
                <p className="text-neutral-300 leading-relaxed mt-3">
                  To exercise any of these rights, email <span className="text-white">privacy@xandland.com</span> with your request. We will respond within 30 days of receiving your request.
                </p>
              </div>
            </section>

            {/* 9. Security */}
            <section className="space-y-3">
              <h2 className="text-2xl font-bold text-white flex items-start gap-3">
                <span className="text-[#e8a020] font-black">9.</span>
                <span>Data Security</span>
              </h2>
              <p className="text-neutral-300 leading-relaxed ml-9">
                We implement reasonable technical, administrative, and physical security measures to protect your personal data from unauthorized access, disclosure, and loss. However, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security. If you suspect unauthorized access to your account, please contact us immediately.
              </p>
            </section>

            {/* 10. Contact Us */}
            <section className="space-y-3">
              <h2 className="text-2xl font-bold text-white flex items-start gap-3">
                <span className="text-[#e8a020] font-black">10.</span>
                <span>Contact & Questions</span>
              </h2>
              <div className="ml-9 space-y-3">
                <p className="text-neutral-300 leading-relaxed">
                  If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us at:
                </p>
                <div className="bg-[#141414] border border-white/8 rounded-lg p-4 mt-3">
                  <p className="text-white font-semibold">Xandland Enterprises, LLC</p>
                  <p className="text-neutral-400 text-sm mt-2">Privacy: <span className="text-[#e8a020]">privacy@xandland.com</span></p>
                  <p className="text-neutral-400 text-sm">Support: <span className="text-[#e8a020]">support@xandland.com</span></p>
                </div>
              </div>
            </section>

            {/* Footer */}
            <div className="border-t border-white/10 pt-8 mt-8">
              <p className="text-neutral-500 text-sm mb-4">
                This Privacy Policy is effective as of June 2026 and may be updated periodically. We will notify you of material changes via email or through the platform.
              </p>
              <p className="text-neutral-500 text-sm">
                For legal inquiries, see our <Link to="/terms" className="text-[#e8a020] hover:underline">Terms of Service</Link>.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
