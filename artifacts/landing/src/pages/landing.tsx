const BASE = import.meta.env.BASE_URL;

function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={`${BASE}logo.png`} alt="CaloriZen" className="w-9 h-9" />
          <span className="text-xl font-bold text-gray-900">CaloriZen<span className="text-xs align-super">™</span></span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
          <a href="#features" className="hover:text-gray-900 transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-gray-900 transition-colors">How It Works</a>
          <a href="#download" className="hover:text-gray-900 transition-colors">Download</a>
        </nav>
        <div className="flex items-center gap-2">
          <a href="#download" className="hidden sm:flex items-center gap-2 bg-black text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
            App Store
          </a>
          <span className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-gray-400 border border-gray-200 px-3 py-2 rounded-lg">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.61 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/></svg>
            Coming Soon
          </span>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative bg-white">
      <div className="max-w-6xl mx-auto px-6 py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-green-100 border-2 border-white flex items-center justify-center text-xs">A</div>
                <div className="w-8 h-8 rounded-full bg-emerald-100 border-2 border-white flex items-center justify-center text-xs">K</div>
                <div className="w-8 h-8 rounded-full bg-teal-100 border-2 border-white flex items-center justify-center text-xs">M</div>
              </div>
              <span className="text-sm text-gray-600">Loved by thousands with</span>
              <span className="text-sm font-semibold text-gray-900 flex items-center gap-1">
                <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                4.9 rating
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-bold leading-tight text-gray-900 tracking-tight">
              Meet CaloriZen<span className="text-xs align-super font-normal">™</span><br />
              Track your calories<br />
              with just a picture
            </h1>
            <p className="mt-6 text-lg text-gray-500 leading-relaxed max-w-md">
              Meet CaloriZen, the AI-powered app for easy calorie tracking. Snap a photo, scan a barcode, or describe your meal and get instant calorie and nutrient info.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a href="#download" className="inline-flex items-center gap-2.5 bg-black text-white font-medium px-5 py-3 rounded-xl hover:bg-gray-800 transition-all hover:scale-[1.02] active:scale-[0.98]">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                Download on App Store
              </a>
              <span className="inline-flex items-center gap-2 text-sm font-medium text-gray-400 border border-gray-200 px-5 py-3 rounded-xl">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.61 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/></svg>
                Google Play — Coming Soon
              </span>
            </div>
          </div>
          <div className="relative flex justify-center items-center mt-8 md:mt-0 min-h-[480px] md:min-h-[580px]">
            <div className="relative">
              <div className="w-[240px] h-[480px] md:w-[270px] md:h-[540px] bg-gray-900 rounded-[2.5rem] md:rounded-[3rem] p-2 md:p-2.5 shadow-2xl rotate-[-3deg]">
                <div className="w-full h-full bg-[#F8F8FA] rounded-[2rem] md:rounded-[2.25rem] overflow-hidden flex flex-col">
                  <div className="px-4 pt-10 pb-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-gray-400 text-[10px]">Hello,</p>
                        <p className="font-bold text-base text-gray-900 tracking-tight">Sarah</p>
                      </div>
                      <div className="flex items-center gap-1.5 bg-white rounded-full px-2.5 py-1 shadow-sm border border-gray-100">
                        <svg className="w-2.5 h-2.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                        <span className="text-[9px] font-medium text-gray-500">Mon, Mar 30</span>
                      </div>
                    </div>
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3 mb-3">
                      <div className="relative w-[68px] h-[68px] flex-shrink-0">
                        <svg viewBox="0 0 72 72" className="w-full h-full -rotate-90">
                          <circle cx="36" cy="36" r="30" fill="none" stroke="#F0F0F0" strokeWidth="7"/>
                          <circle cx="36" cy="36" r="30" fill="none" stroke="#FF6B35" strokeWidth="7" strokeDasharray="188.5" strokeDashoffset="117.7" strokeLinecap="round"/>
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-sm font-bold text-gray-900 leading-none">1,248</span>
                          <span className="text-[7px] text-gray-400">left</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] font-semibold text-gray-900 mb-1.5">Today's Calories</p>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#FF6B35]"></div>
                            <span className="text-[8px] text-gray-400">Eaten 752</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-gray-200"></div>
                            <span className="text-[8px] text-gray-400">Goal 2,000</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs">💪</span>
                        <div className="flex-1">
                          <div className="flex justify-between mb-0.5"><span className="text-[8px] font-medium text-gray-600">Protein</span><span className="text-[8px] text-gray-400">38/150g</span></div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-[#007AFF] rounded-full" style={{width: "25%"}}></div></div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs">🌾</span>
                        <div className="flex-1">
                          <div className="flex justify-between mb-0.5"><span className="text-[8px] font-medium text-gray-600">Carbs</span><span className="text-[8px] text-gray-400">88/250g</span></div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-[#FF9500] rounded-full" style={{width: "35%"}}></div></div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs">🥑</span>
                        <div className="flex-1">
                          <div className="flex justify-between mb-0.5"><span className="text-[8px] font-medium text-gray-600">Fat</span><span className="text-[8px] text-gray-400">22/65g</span></div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-[#FF3B30] rounded-full" style={{width: "34%"}}></div></div>
                        </div>
                      </div>
                    </div>
                    <p className="font-semibold text-xs text-gray-900 mb-2">Today's meals</p>
                    <div className="space-y-1.5">
                      <div className="bg-white rounded-xl p-2.5 shadow-sm border border-gray-100 flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center text-xs">🥗</div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-[10px] text-gray-900">Greek Salad</p>
                          <p className="text-[8px] text-gray-400">Lunch · 12:30 PM</p>
                        </div>
                        <span className="text-[9px] font-semibold text-[#FF6B35] bg-orange-50 px-1.5 py-0.5 rounded">320</span>
                      </div>
                      <div className="bg-white rounded-xl p-2.5 shadow-sm border border-gray-100 flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center text-xs">🥣</div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-[10px] text-gray-900">Oatmeal with Berries</p>
                          <p className="text-[8px] text-gray-400">Breakfast · 8:15 AM</p>
                        </div>
                        <span className="text-[9px] font-semibold text-[#FF6B35] bg-orange-50 px-1.5 py-0.5 rounded">432</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="hidden md:block absolute top-6 -right-[100px] w-[220px] h-[440px] bg-gray-900 rounded-[2.5rem] p-2 shadow-xl rotate-[5deg]">
                <div className="w-full h-full rounded-[2rem] overflow-hidden bg-[#F8F8FA] flex flex-col">
                  <div className="px-4 pt-8">
                    <p className="font-bold text-sm text-gray-900 text-center">Scan Food</p>
                    <p className="text-[9px] text-gray-400 text-center mb-3">Snap a photo to track calories</p>
                    <div className="relative bg-gray-100 rounded-2xl aspect-square flex items-center justify-center mb-3 border-2 border-dashed border-gray-200">
                      <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center">
                        <svg className="w-6 h-6 text-[#FF6B35]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.04l-.821 1.315z"/><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"/></svg>
                      </div>
                      <p className="absolute bottom-2.5 text-[9px] font-medium text-gray-400">Take a Photo</p>
                    </div>
                    <div className="space-y-1.5">
                      <div className="bg-white rounded-xl py-2 px-3 flex items-center gap-2 shadow-sm border border-gray-100">
                        <div className="w-5 h-5 rounded-md bg-blue-50 flex items-center justify-center">
                          <svg className="w-3 h-3 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91M3.75 21h16.5a1.5 1.5 0 001.5-1.5V5.25a1.5 1.5 0 00-1.5-1.5H3.75a1.5 1.5 0 00-1.5 1.5v14.25c0 .828.672 1.5 1.5 1.5z"/></svg>
                        </div>
                        <span className="text-[10px] font-medium text-gray-700">Choose from Gallery</span>
                      </div>
                      <div className="bg-white rounded-xl py-2 px-3 flex items-center gap-2 shadow-sm border border-gray-100">
                        <div className="w-5 h-5 rounded-md bg-purple-50 flex items-center justify-center">
                          <svg className="w-3 h-3 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5z"/></svg>
                        </div>
                        <span className="text-[10px] font-medium text-gray-700">Scan Barcode</span>
                      </div>
                      <div className="bg-white rounded-xl py-2 px-3 flex items-center gap-2 shadow-sm border border-gray-100">
                        <div className="w-5 h-5 rounded-md bg-green-50 flex items-center justify-center">
                          <svg className="w-3 h-3 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487z"/></svg>
                        </div>
                        <span className="text-[10px] font-medium text-gray-700">Describe Manually</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Features() {
  const features = [
    {
      icon: "📸",
      title: "Snap & Track",
      desc: "Take a photo of any meal and our AI instantly identifies foods and calculates calories, protein, carbs, and fats.",
    },
    {
      icon: "📊",
      title: "Smart Macro Tracking",
      desc: "Beautiful daily summaries with calorie rings and macro breakdowns. See your progress at a glance with intuitive charts.",
    },
    {
      icon: "🎯",
      title: "Personalized Goals",
      desc: "Set custom calorie and macro targets based on your body metrics and fitness goals. We adapt as you progress.",
    },
    {
      icon: "📱",
      title: "Barcode Scanner",
      desc: "Scan any packaged food barcode for instant, accurate nutritional data from our comprehensive database.",
    },
    {
      icon: "📅",
      title: "Daily Food Log",
      desc: "Browse your complete meal history by date. Review past meals, spot patterns, and stay on track with your goals.",
    },
    {
      icon: "🔐",
      title: "Private & Secure",
      desc: "Sign in with Apple or Google. Your data is encrypted, isolated, and never shared. We respect your privacy.",
    },
  ];

  return (
    <section id="features" className="py-20 md:py-28 bg-gray-50">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-green-700 uppercase tracking-wider mb-3">Features</p>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">Everything you need to eat smarter</h2>
          <p className="mt-4 text-gray-500 text-lg max-w-2xl mx-auto">Powered by advanced AI that understands food better than any other app.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="bg-white rounded-2xl p-7 hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-gray-200 group">
              <div className="text-3xl mb-4 group-hover:scale-110 transition-transform">{f.icon}</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { num: "1", title: "Snap a photo", desc: "Take a picture of your meal, scan a barcode, or type a description." },
    { num: "2", title: "AI analyzes instantly", desc: "Our AI identifies every food item and calculates precise nutritional values." },
    { num: "3", title: "Track your day", desc: "See your daily totals update in real-time with beautiful macro breakdowns." },
  ];

  return (
    <section id="how-it-works" className="py-20 md:py-28 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-green-700 uppercase tracking-wider mb-3">How It Works</p>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">Three simple steps</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-10">
          {steps.map((s) => (
            <div key={s.num} className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-green-50 text-green-700 font-bold text-xl flex items-center justify-center mx-auto mb-5 border border-green-100">{s.num}</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">{s.title}</h3>
              <p className="text-gray-500 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Download() {
  return (
    <section id="download" className="py-20 md:py-28 bg-gray-900 text-white">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <img src={`${BASE}logo.png`} alt="CaloriZen" className="w-20 h-20 mx-auto mb-6" />
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Ready to transform your nutrition?</h2>
        <p className="text-gray-400 text-lg mb-10 max-w-lg mx-auto">Download CaloriZen today and start tracking smarter, not harder. Free to get started.</p>
        <div className="flex flex-wrap gap-4 justify-center items-center">
          <a href="#" className="inline-flex items-center gap-3 bg-white text-gray-900 font-medium px-6 py-3.5 rounded-xl hover:bg-gray-100 transition-all hover:scale-[1.02] active:scale-[0.98]">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
            <div className="text-left">
              <p className="text-[10px] text-gray-500 leading-none">Download on the</p>
              <p className="text-base font-semibold leading-tight">App Store</p>
            </div>
          </a>
          <span className="inline-flex items-center gap-3 border border-gray-600 text-gray-400 font-medium px-6 py-3.5 rounded-xl">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.61 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/></svg>
            <div className="text-left">
              <p className="text-[10px] text-gray-500 leading-none">Coming Soon on</p>
              <p className="text-base font-semibold leading-tight">Google Play</p>
            </div>
          </span>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-400 py-12">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-10 mb-10">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <img src={`${BASE}logo.png`} alt="CaloriZen" className="w-7 h-7" />
              <span className="text-white font-bold">CaloriZen<span className="text-xs align-super font-normal">™</span></span>
            </div>
            <p className="text-sm leading-relaxed">AI-powered nutrition tracking from a single photo.</p>
          </div>
          <div>
            <h4 className="text-white text-sm font-semibold mb-4">Product</h4>
            <ul className="space-y-2.5 text-sm">
              <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
              <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
              <li><a href="#download" className="hover:text-white transition-colors">Download</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white text-sm font-semibold mb-4">Legal</h4>
            <ul className="space-y-2.5 text-sm">
              <li><a href={`${BASE}terms`} className="hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href={`${BASE}privacy`} className="hover:text-white transition-colors">Privacy Policy</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white text-sm font-semibold mb-4">Connect</h4>
            <ul className="space-y-2.5 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Twitter</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Instagram</a></li>
              <li><a href="mailto:support@calorizen.ai" className="hover:text-white transition-colors">support@calorizen.ai</a></li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs">&copy; 2026 CaloriZen™. All rights reserved.</p>
          <p className="text-xs">calorizen.ai</p>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <Hero />
      <Features />
      <HowItWorks />
      <Download />
      <Footer />
    </div>
  );
}
