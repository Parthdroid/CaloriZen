const BASE = import.meta.env.BASE_URL;

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur-md z-50">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-3">
          <a
            href={BASE}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M13 4L7 10L13 16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-sm">Back</span>
          </a>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <img src={`${BASE}logo.png`} alt="CaloriZen" className="w-6 h-6" />
            <span className="font-semibold text-sm">
              CaloriZen<span className="text-[10px] align-super">™</span>
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          CaloriZen Support
        </h1>
        <p className="text-gray-600 leading-relaxed mb-10">
          Get help with your account, password recovery, meal tracking, or the
          CaloriZen app.
        </p>

        <section className="rounded-2xl border border-gray-100 bg-gray-50 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-3">Contact us</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            Email our support team and include a short description of the issue.
            Never send your password, reset link, Apple authorization code, or
            authentication token.
          </p>
          <a
            href="mailto:support@calorizen.in"
            className="inline-flex items-center justify-center rounded-xl bg-[#FF6B35] px-5 py-3 text-sm font-semibold text-white hover:bg-[#E95D2D] transition-colors"
          >
            Email support@calorizen.in
          </a>
        </section>

        <section className="border-b border-gray-100 py-7">
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            Password and sign-in help
          </h2>
          <p className="text-gray-600 leading-relaxed">
            Use <strong>Forgot password</strong> on the app sign-in screen to
            request a one-time reset link. The link expires after 30 minutes and
            can be used only once. This is also the recovery path for an
            existing account that previously used Google Sign-In.
          </p>
        </section>

        <section className="border-b border-gray-100 py-7">
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            Delete your account
          </h2>
          <p className="text-gray-600 leading-relaxed">
            In the app, open <strong>Goals</strong>, choose{" "}
            <strong>Delete Account</strong>, and follow the confirmation steps.
            If you cannot access the app, contact support from the email address
            associated with the account.
          </p>
        </section>

        <section className="py-7">
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            Privacy and legal information
          </h2>
          <div className="flex flex-wrap gap-5 text-sm">
            <a
              href={`${BASE}privacy`}
              className="text-[#FF6B35] font-semibold hover:underline"
            >
              Privacy Policy
            </a>
            <a
              href={`${BASE}terms`}
              className="text-[#FF6B35] font-semibold hover:underline"
            >
              Terms of Service
            </a>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-3xl mx-auto px-6 text-center text-xs text-gray-400">
          &copy; 2026 CaloriZen™. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
