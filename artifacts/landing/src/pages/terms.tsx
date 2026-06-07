const BASE = import.meta.env.BASE_URL;

export default function TermsPage() {
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-400 mb-10">Last Updated: March 30, 2026</p>

        <div className="prose prose-gray max-w-none">
          <p className="text-gray-600 leading-relaxed mb-6">
            Welcome to CaloriZen™. These Terms of Service ("Terms") govern your access to and use of the CaloriZen™ mobile application ("App"), operated by CaloriZen™ ("Company," "we," "us," or "our"). By downloading, installing, or using the App, you agree to be bound by these Terms. If you do not agree, do not use the App.
          </p>

          <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">1. Acceptance of Terms</h2>
          <p className="text-gray-600 leading-relaxed mb-6">
            By creating an account or using CaloriZen™, you confirm that you are at least 13 years of age and have the legal capacity to enter into these Terms. If you are under 18, you must have permission from a parent or legal guardian. Your continued use of the App constitutes acceptance of these Terms and any future modifications.
          </p>

          <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">2. Description of Service</h2>
          <p className="text-gray-600 leading-relaxed mb-4">CaloriZen™ is an AI-powered calorie and nutrition tracking application that allows users to:</p>
          <ul className="list-disc pl-6 text-gray-600 mb-6 space-y-1">
            <li>Photograph meals for automatic nutritional analysis</li>
            <li>Scan food barcodes for product information</li>
            <li>Track daily calorie and macronutrient intake</li>
            <li>Set personalized nutrition goals</li>
            <li>View food log history by date</li>
          </ul>
          <p className="text-gray-600 leading-relaxed mb-6">
            The App uses artificial intelligence, including OpenAI's GPT Vision technology, to estimate nutritional content from photographs. These estimates are approximations and should not be relied upon as medical or dietary advice.
          </p>

          <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">3. Account Registration</h2>
          <p className="text-gray-600 leading-relaxed mb-4">To use CaloriZen™, you must create an account using one of our supported authentication providers (Google or Apple Sign-In). You agree to:</p>
          <ul className="list-disc pl-6 text-gray-600 mb-6 space-y-1">
            <li>Provide accurate and complete information during registration</li>
            <li>Maintain the security of your account credentials</li>
            <li>Notify us immediately of any unauthorized use of your account</li>
            <li>Accept responsibility for all activities under your account</li>
          </ul>
          <p className="text-gray-600 leading-relaxed mb-6">
            We reserve the right to suspend or terminate accounts that violate these Terms or engage in fraudulent activity.
          </p>

          <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">4. Intellectual Property</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            CaloriZen™ and all associated trademarks, logos, designs, text, graphics, and software are the exclusive property of the Company and are protected by intellectual property laws. The CaloriZen™ name and logo are trademarks pending registration. You may not:
          </p>
          <ul className="list-disc pl-6 text-gray-600 mb-6 space-y-1">
            <li>Copy, modify, or distribute any part of the App</li>
            <li>Reverse engineer or decompile the App's software</li>
            <li>Use the CaloriZen™ name or branding without written permission</li>
            <li>Create derivative works based on the App</li>
          </ul>

          <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">5. User Content</h2>
          <p className="text-gray-600 leading-relaxed mb-6">
            You retain ownership of photographs and data you submit through the App ("User Content"). By submitting User Content, you grant CaloriZen™ a non-exclusive, worldwide, royalty-free license to use, process, and analyze your content solely for the purpose of providing and improving our services. We will not sell, share, or publicly display your food photographs or personal nutrition data without your explicit consent.
          </p>

          <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">6. AI-Powered Analysis Disclaimer</h2>
          <p className="text-gray-600 leading-relaxed mb-6">
            The nutritional estimates provided by CaloriZen™ are generated by artificial intelligence and are approximations only. Results may vary based on image quality, food preparation methods, portion sizes, and other factors. CaloriZen™ does not guarantee the accuracy of any nutritional analysis. The App is not a substitute for professional medical, dietary, or nutritional advice. Always consult a qualified healthcare professional before making dietary changes, especially if you have allergies, medical conditions, or specific dietary requirements.
          </p>

          <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">7. Prohibited Uses</h2>
          <p className="text-gray-600 leading-relaxed mb-4">You agree not to:</p>
          <ul className="list-disc pl-6 text-gray-600 mb-6 space-y-1">
            <li>Use the App for any unlawful purpose</li>
            <li>Attempt to gain unauthorized access to our systems or servers</li>
            <li>Upload malicious content, viruses, or harmful code</li>
            <li>Interfere with the App's functionality or other users' experience</li>
            <li>Use automated tools to scrape or extract data from the App</li>
            <li>Impersonate another person or entity</li>
            <li>Resell or commercially exploit the App without authorization</li>
          </ul>

          <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">8. Subscription & Payments</h2>
          <p className="text-gray-600 leading-relaxed mb-4">CaloriZen™ may offer free and premium subscription tiers. If you purchase a subscription:</p>
          <ul className="list-disc pl-6 text-gray-600 mb-6 space-y-1">
            <li>Payment will be charged to your Apple ID or Google Play account</li>
            <li>Subscriptions automatically renew unless canceled at least 24 hours before the end of the current period</li>
            <li>You can manage or cancel subscriptions through your device's app store settings</li>
            <li>Refunds are subject to the policies of Apple App Store or Google Play Store</li>
          </ul>

          <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">9. Limitation of Liability</h2>
          <p className="text-gray-600 leading-relaxed mb-4">To the maximum extent permitted by applicable law, CaloriZen™ and its officers, directors, employees, and agents shall not be liable for:</p>
          <ul className="list-disc pl-6 text-gray-600 mb-6 space-y-1">
            <li>Any indirect, incidental, special, consequential, or punitive damages</li>
            <li>Loss of data, revenue, or profits</li>
            <li>Health issues arising from reliance on AI-generated nutritional estimates</li>
            <li>Service interruptions, errors, or inaccuracies</li>
          </ul>
          <p className="text-gray-600 leading-relaxed mb-6">
            Our total liability shall not exceed the amount you have paid to CaloriZen™ in the twelve (12) months preceding the claim.
          </p>

          <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">10. Indemnification</h2>
          <p className="text-gray-600 leading-relaxed mb-6">
            You agree to indemnify and hold harmless CaloriZen™, its affiliates, and their respective officers, directors, employees, and agents from any claims, damages, losses, liabilities, costs, and expenses (including attorney's fees) arising from your use of the App, violation of these Terms, or infringement of any third-party rights.
          </p>

          <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">11. Third-Party Services</h2>
          <p className="text-gray-600 leading-relaxed mb-6">
            CaloriZen™ integrates with third-party services including but not limited to Google Sign-In, Apple Sign-In, and OpenAI. Your use of these services is subject to their respective terms and privacy policies. We are not responsible for the practices or availability of third-party services.
          </p>

          <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">12. Modifications to Terms</h2>
          <p className="text-gray-600 leading-relaxed mb-6">
            We reserve the right to modify these Terms at any time. Changes will be effective upon posting within the App. Your continued use after changes are posted constitutes acceptance of the revised Terms. We will make reasonable efforts to notify users of material changes through in-app notifications.
          </p>

          <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">13. Termination</h2>
          <p className="text-gray-600 leading-relaxed mb-6">
            We may suspend or terminate your access to the App at any time, with or without cause, and with or without notice. Upon termination, your right to use the App ceases immediately. Sections regarding intellectual property, limitation of liability, and indemnification survive termination.
          </p>

          <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">14. Governing Law</h2>
          <p className="text-gray-600 leading-relaxed mb-6">
            These Terms shall be governed by and construed in accordance with the laws of the United States, without regard to conflict of law provisions. Any disputes arising from these Terms or your use of the App shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association.
          </p>

          <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">15. Contact Information</h2>
          <p className="text-gray-600 leading-relaxed mb-2">If you have questions or concerns about these Terms, please contact us at:</p>
          <p className="text-gray-600 leading-relaxed mb-6">
            CaloriZen™<br />
            Email: <a href="mailto:legal@calorizen.ai" className="text-[#FF6B35] hover:underline">legal@calorizen.ai</a><br />
            Website: <a href="https://calorizen.ai" className="text-[#FF6B35] hover:underline">calorizen.ai</a>
          </p>

          <p className="text-gray-600 leading-relaxed font-semibold mt-10 mb-16">
            By using CaloriZen™, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
          </p>
        </div>
      </main>

      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-3xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-400">
          <p>&copy; 2026 CaloriZen™. All rights reserved.</p>
          <div className="flex gap-6">
            <a href={`${BASE}terms`} className="text-gray-900 font-medium">Terms of Service</a>
            <a href={`${BASE}privacy`} className="hover:text-gray-600 transition-colors">Privacy Policy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
