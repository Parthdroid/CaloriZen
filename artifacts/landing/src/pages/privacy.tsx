const BASE = import.meta.env.BASE_URL;

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur-md z-50">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-3">
          <a href={BASE} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M13 4L7 10L13 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span className="text-sm">Back</span>
          </a>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <img src={`${BASE}logo.png`} alt="CaloriZen" className="w-6 h-6" />
            <span className="font-semibold text-sm">CaloriZen<span className="text-[10px] align-super">™</span></span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-400 mb-10">Last Updated: March 30, 2026</p>

        <div className="prose prose-gray max-w-none">
          <p className="text-gray-600 leading-relaxed mb-6">
            CaloriZen™ ("Company," "we," "us," or "our") is committed to protecting your privacy. This Privacy Policy describes how we collect, use, store, and share your personal information when you use the CaloriZen™ mobile application ("App"). By using the App, you consent to the practices described in this policy.
          </p>

          <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">1. Information We Collect</h2>

          <h3 className="text-base font-semibold text-gray-800 mt-6 mb-2">a) Information You Provide</h3>
          <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-1">
            <li><strong>Account Information:</strong> When you sign in using Google or Apple, we receive your name, email address, and profile identifier from the authentication provider.</li>
            <li><strong>Profile Data:</strong> Information you provide during onboarding, including weight, height, and nutrition goals.</li>
            <li><strong>Food Log Data:</strong> Meal names, calorie counts, macronutrient breakdowns, and timestamps you record.</li>
            <li><strong>Photographs:</strong> Food images you capture for AI nutritional analysis.</li>
          </ul>

          <h3 className="text-base font-semibold text-gray-800 mt-6 mb-2">b) Information Collected Automatically</h3>
          <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-1">
            <li><strong>Device Information:</strong> Device type, operating system version, and unique device identifiers.</li>
            <li><strong>Usage Data:</strong> App interaction patterns, feature usage, screen views, and session duration.</li>
            <li><strong>Log Data:</strong> Error reports, crash logs, and diagnostic information.</li>
          </ul>

          <h3 className="text-base font-semibold text-gray-800 mt-6 mb-2">c) Information from Third Parties</h3>
          <ul className="list-disc pl-6 text-gray-600 mb-6 space-y-1">
            <li><strong>Google Sign-In:</strong> Name, email, and Google account identifier.</li>
            <li><strong>Apple Sign-In:</strong> Name (if provided), email (or Apple's private relay email), and Apple user identifier.</li>
            <li><strong>Barcode Data:</strong> Product information retrieved from food databases when you scan barcodes.</li>
          </ul>

          <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">2. How We Use Your Information</h2>
          <ul className="list-disc pl-6 text-gray-600 mb-6 space-y-1">
            <li><strong>Providing Services:</strong> To create and manage your account, track your nutrition, and deliver AI-powered meal analysis.</li>
            <li><strong>AI Analysis:</strong> Food photographs are sent to OpenAI's GPT Vision API for nutritional estimation. Images are processed in real-time and are not stored by OpenAI beyond the processing request.</li>
            <li><strong>Personalization:</strong> To customize your nutrition goals and daily recommendations based on your profile.</li>
            <li><strong>Improvement:</strong> To analyze usage patterns and improve App features, performance, and user experience.</li>
            <li><strong>Communication:</strong> To send important account notifications, updates, and security alerts.</li>
            <li><strong>Legal Compliance:</strong> To comply with applicable laws, regulations, and legal processes.</li>
          </ul>

          <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">3. Data Storage & Security</h2>
          <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-1">
            <li>Your data is stored in secure PostgreSQL databases hosted on encrypted, access-controlled servers.</li>
            <li>All data transmission between the App and our servers uses TLS/SSL encryption.</li>
            <li>Authentication tokens are stored securely on your device using platform-provided secure storage mechanisms.</li>
            <li>We implement industry-standard security practices including access controls, monitoring, and regular security assessments.</li>
            <li>Multi-user data isolation ensures that your data is only accessible to your authenticated account.</li>
          </ul>
          <p className="text-gray-600 leading-relaxed mb-6">
            While we take reasonable measures to protect your information, no method of electronic storage or transmission is 100% secure. We cannot guarantee absolute security.
          </p>

          <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">4. Data Sharing & Disclosure</h2>
          <p className="text-gray-600 leading-relaxed mb-4">We do not sell your personal information. We may share your data in the following limited circumstances:</p>
          <ul className="list-disc pl-6 text-gray-600 mb-6 space-y-1">
            <li><strong>Service Providers:</strong> With trusted third-party providers who assist in operating the App (e.g., OpenAI for AI analysis, cloud hosting providers). These providers are contractually obligated to protect your data.</li>
            <li><strong>Authentication Providers:</strong> Google and Apple process authentication data according to their own privacy policies.</li>
            <li><strong>Legal Requirements:</strong> When required by law, regulation, subpoena, or court order.</li>
            <li><strong>Safety:</strong> To protect the rights, property, or safety of CaloriZen™, our users, or the public.</li>
            <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets, with appropriate notice to users.</li>
          </ul>

          <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">5. Your Rights & Choices</h2>
          <p className="text-gray-600 leading-relaxed mb-4">Depending on your jurisdiction, you may have the following rights:</p>
          <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-1">
            <li><strong>Access:</strong> Request a copy of the personal data we hold about you.</li>
            <li><strong>Correction:</strong> Request correction of inaccurate or incomplete data.</li>
            <li><strong>Deletion:</strong> Request deletion of your account and associated data through the App's settings or by contacting us.</li>
            <li><strong>Data Portability:</strong> Request your data in a portable, machine-readable format.</li>
            <li><strong>Opt-Out:</strong> Opt out of non-essential data collection and marketing communications.</li>
            <li><strong>Withdraw Consent:</strong> Withdraw consent for data processing where consent is the legal basis.</li>
          </ul>
          <p className="text-gray-600 leading-relaxed mb-6">
            To exercise these rights, contact us at <a href="mailto:privacy@calorizen.ai" className="text-[#FF6B35] hover:underline">privacy@calorizen.ai</a>. We will respond within 30 days.
          </p>

          <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">6. Apple Sign-In & Hide My Email</h2>
          <p className="text-gray-600 leading-relaxed mb-6">
            If you choose to use Apple's "Hide My Email" feature, Apple generates a unique, random email address that forwards to your personal email. We respect this choice and will use the relay email provided. We do not attempt to discover or collect your actual email address when you use this feature.
          </p>

          <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">7. Children's Privacy</h2>
          <p className="text-gray-600 leading-relaxed mb-6">
            CaloriZen™ is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If we discover that a child under 13 has provided personal information, we will promptly delete it. If you believe a child under 13 has provided us with personal data, please contact us at <a href="mailto:privacy@calorizen.ai" className="text-[#FF6B35] hover:underline">privacy@calorizen.ai</a>.
          </p>

          <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">8. Data Retention</h2>
          <p className="text-gray-600 leading-relaxed mb-4">We retain your personal data for as long as your account is active or as needed to provide services. After account deletion:</p>
          <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-1">
            <li>Account data is permanently deleted within 30 days.</li>
            <li>Food photographs are deleted immediately upon account deletion.</li>
            <li>Anonymized, aggregated data may be retained for analytical purposes.</li>
            <li>Backup copies are purged within 90 days of deletion.</li>
          </ul>
          <p className="text-gray-600 leading-relaxed mb-6">
            We may retain certain information longer if required by law or for legitimate business purposes such as fraud prevention.
          </p>

          <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">9. International Data Transfers</h2>
          <p className="text-gray-600 leading-relaxed mb-6">
            Your information may be transferred to and processed in countries other than your country of residence. We ensure appropriate safeguards are in place for international transfers, including standard contractual clauses and compliance with applicable data protection frameworks.
          </p>

          <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">10. Cookies & Tracking</h2>
          <p className="text-gray-600 leading-relaxed mb-6">
            The CaloriZen™ mobile app does not use browser cookies. We may use mobile analytics SDKs to collect anonymized usage data for improving the App experience. You can opt out of analytics tracking in the App's settings.
          </p>

          <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">11. California Privacy Rights (CCPA)</h2>
          <p className="text-gray-600 leading-relaxed mb-4">If you are a California resident, you have the right to:</p>
          <ul className="list-disc pl-6 text-gray-600 mb-6 space-y-1">
            <li>Know what personal information is collected and how it is used</li>
            <li>Request deletion of your personal information</li>
            <li>Opt out of the sale of personal information (we do not sell personal data)</li>
            <li>Non-discrimination for exercising your privacy rights</li>
          </ul>

          <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">12. European Privacy Rights (GDPR)</h2>
          <p className="text-gray-600 leading-relaxed mb-6">
            If you are located in the European Economic Area (EEA), United Kingdom, or Switzerland, you have additional rights under the General Data Protection Regulation (GDPR), including the right to lodge a complaint with your local data protection authority. Our legal basis for processing your data includes consent, contractual necessity, and legitimate interests.
          </p>

          <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">13. Changes to This Policy</h2>
          <p className="text-gray-600 leading-relaxed mb-6">
            We may update this Privacy Policy from time to time. Changes will be effective upon posting within the App. We will notify you of material changes through in-app notifications or email. Your continued use of the App after changes are posted constitutes acceptance of the revised policy.
          </p>

          <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">14. Contact Us</h2>
          <p className="text-gray-600 leading-relaxed mb-2">If you have questions, concerns, or requests regarding this Privacy Policy or your personal data, please contact us at:</p>
          <p className="text-gray-600 leading-relaxed mb-6">
            CaloriZen™<br />
            Privacy Team<br />
            Email: <a href="mailto:privacy@calorizen.ai" className="text-[#FF6B35] hover:underline">privacy@calorizen.ai</a><br />
            Website: <a href="https://calorizen.ai" className="text-[#FF6B35] hover:underline">calorizen.ai</a>
          </p>
          <p className="text-gray-600 leading-relaxed mb-6">
            For data protection inquiries in the EU, you may also contact our designated Data Protection Officer at <a href="mailto:dpo@calorizen.ai" className="text-[#FF6B35] hover:underline">dpo@calorizen.ai</a>.
          </p>

          <p className="text-gray-600 leading-relaxed font-semibold mt-10 mb-16">
            By using CaloriZen™, you acknowledge that you have read and understood this Privacy Policy and agree to the collection, use, and sharing of your information as described herein.
          </p>
        </div>
      </main>

      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-3xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-400">
          <p>&copy; 2026 CaloriZen™. All rights reserved.</p>
          <div className="flex gap-6">
            <a href={`${BASE}terms`} className="hover:text-gray-600 transition-colors">Terms of Service</a>
            <a href={`${BASE}privacy`} className="text-gray-900 font-medium">Privacy Policy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
