export default function App() {
  return (
    <div className="landing">
      {/* Header */}
      <header className="header">
        <div className="container">
          <div className="logo">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="18" fill="#2E7D32" opacity="0.1" />
              <text x="20" y="26" fontSize="24" fontWeight="bold" fill="#2E7D32" textAnchor="middle">
                🍽
              </text>
            </svg>
            <h1>NutriSnap™</h1>
          </div>
          <nav className="nav">
            <a href="#features">Features</a>
            <a href="#download">Download</a>
            <a href="#about">About</a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="hero">
        <div className="container hero-content">
          <div className="hero-text">
            <h2>AI-Powered Nutrition Tracking</h2>
            <p>Track your calories and nutrition from a single photo. Your personal AI nutritionist in your pocket.</p>
            <div className="cta-buttons">
              <button className="btn btn-primary">Download on App Store</button>
              <button className="btn btn-secondary">Get on Google Play</button>
            </div>
          </div>
          <div className="hero-image">
            <div className="phone-mockup">
              <div className="phone-screen">
                <div className="screen-content">
                  <div className="flame">🔥</div>
                  <div className="calorie-count">2,150 cal</div>
                  <div className="progress-bar"></div>
                  <div className="meal-item">
                    <span>🍕</span>
                    <span>Pizza</span>
                    <span>580 cal</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="features">
        <div className="container">
          <h2>Powerful Features</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">📸</div>
              <h3>Photo-Based Meal Scanning</h3>
              <p>Simply take a photo of your meal and our AI instantly analyzes its nutritional content.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Detailed Nutrition Tracking</h3>
              <p>Track calories, protein, carbs, fat, and other nutrients with precision.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h3>Personalized Goals</h3>
              <p>Set custom nutrition goals and get real-time progress updates.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <h3>Barcode Scanning</h3>
              <p>Scan product barcodes for accurate nutritional information instantly.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📅</div>
              <h3>Food Log History</h3>
              <p>Browse your meal history by date and analyze your nutrition trends.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔐</div>
              <h3>Secure & Private</h3>
              <p>Your data is encrypted and protected. Sign in securely with Apple or Google.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Download */}
      <section id="download" className="download">
        <div className="container">
          <h2>Ready to Transform Your Nutrition?</h2>
          <p>Download NutriSnap™ today and start tracking smarter, not harder.</p>
          <div className="download-buttons">
            <a href="#" className="btn btn-primary btn-large">Download on App Store</a>
            <a href="#" className="btn btn-secondary btn-large">Get on Google Play</a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <h4>NutriSnap™</h4>
              <p>AI-powered nutrition tracking</p>
            </div>
            <div className="footer-section">
              <h4>Legal</h4>
              <ul>
                <li><a href="#">Terms of Service</a></li>
                <li><a href="#">Privacy Policy</a></li>
              </ul>
            </div>
            <div className="footer-section">
              <h4>Connect</h4>
              <ul>
                <li><a href="#">Twitter</a></li>
                <li><a href="#">Instagram</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2026 NutriSnap™. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <style>{`
        .landing {
          min-height: 100vh;
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
        }

        .header {
          background: #fff;
          border-bottom: 1px solid #f0f0f0;
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .header .container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          height: 70px;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 12px;
          font-weight: 700;
          font-size: 24px;
          color: #2E7D32;
        }

        .nav {
          display: flex;
          gap: 32px;
          font-weight: 500;
        }

        .nav a {
          color: #666;
          transition: color 0.3s;
        }

        .nav a:hover {
          color: #2E7D32;
        }

        .hero {
          padding: 80px 0;
          background: linear-gradient(135deg, #f5f5f5 0%, #fff 100%);
        }

        .hero-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 60px;
          align-items: center;
        }

        .hero-text h2 {
          font-size: 48px;
          line-height: 1.2;
          margin-bottom: 24px;
          color: #1a1a1a;
        }

        .hero-text p {
          font-size: 18px;
          color: #666;
          margin-bottom: 32px;
          line-height: 1.6;
        }

        .cta-buttons {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }

        .btn {
          padding: 14px 28px;
          font-size: 16px;
          font-weight: 600;
          border-radius: 8px;
          transition: all 0.3s;
        }

        .btn-primary {
          background: #2E7D32;
          color: white;
        }

        .btn-primary:hover {
          background: #1e5a23;
          transform: translateY(-2px);
        }

        .btn-secondary {
          background: #fff;
          color: #2E7D32;
          border: 2px solid #2E7D32;
        }

        .btn-secondary:hover {
          background: #f9f9f9;
        }

        .btn-large {
          padding: 16px 40px;
          font-size: 18px;
        }

        .phone-mockup {
          perspective: 1000px;
        }

        .phone-screen {
          background: #0F0F0F;
          border-radius: 40px;
          padding: 12px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          aspect-ratio: 9/19;
          max-width: 300px;
          margin: 0 auto;
        }

        .screen-content {
          background: linear-gradient(135deg, #0F0F0F, #1A1A2E);
          height: 100%;
          border-radius: 32px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          color: white;
        }

        .flame {
          font-size: 32px;
          text-align: center;
        }

        .calorie-count {
          font-size: 28px;
          font-weight: bold;
          text-align: center;
        }

        .progress-bar {
          height: 8px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-bar::after {
          content: "";
          display: block;
          height: 100%;
          width: 60%;
          background: #34C759;
          border-radius: 4px;
        }

        .meal-item {
          display: grid;
          grid-template-columns: 30px 1fr 80px;
          gap: 12px;
          align-items: center;
          background: rgba(255, 255, 255, 0.1);
          padding: 12px;
          border-radius: 8px;
          font-size: 14px;
        }

        .features {
          padding: 80px 0;
          background: #fff;
        }

        .features h2 {
          font-size: 40px;
          margin-bottom: 60px;
          text-align: center;
          color: #1a1a1a;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 32px;
        }

        .feature-card {
          padding: 32px;
          background: #f9f9f9;
          border-radius: 12px;
          transition: transform 0.3s, box-shadow 0.3s;
        }

        .feature-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1);
        }

        .feature-icon {
          font-size: 40px;
          margin-bottom: 16px;
        }

        .feature-card h3 {
          font-size: 20px;
          margin-bottom: 12px;
          color: #1a1a1a;
        }

        .feature-card p {
          color: #666;
          line-height: 1.6;
        }

        .download {
          padding: 80px 0;
          background: #2E7D32;
          color: white;
          text-align: center;
        }

        .download h2 {
          font-size: 40px;
          margin-bottom: 16px;
        }

        .download p {
          font-size: 18px;
          margin-bottom: 40px;
          opacity: 0.9;
        }

        .download-buttons {
          display: flex;
          gap: 16px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .download .btn-primary {
          background: white;
          color: #2E7D32;
        }

        .download .btn-primary:hover {
          background: #f0f0f0;
        }

        .download .btn-secondary {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border-color: white;
        }

        .download .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .footer {
          background: #1a1a1a;
          color: white;
          padding: 60px 0 20px;
        }

        .footer-content {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 40px;
          margin-bottom: 40px;
        }

        .footer-section h4 {
          font-size: 18px;
          margin-bottom: 16px;
        }

        .footer-section p {
          color: #999;
          font-size: 14px;
        }

        .footer-section ul {
          list-style: none;
        }

        .footer-section ul li {
          margin-bottom: 8px;
        }

        .footer-section a {
          color: #999;
          font-size: 14px;
          transition: color 0.3s;
        }

        .footer-section a:hover {
          color: white;
        }

        .footer-bottom {
          text-align: center;
          padding-top: 20px;
          border-top: 1px solid #333;
          color: #666;
          font-size: 14px;
        }

        @media (max-width: 768px) {
          .hero-content {
            grid-template-columns: 1fr;
          }

          .hero-text h2 {
            font-size: 32px;
          }

          .nav {
            gap: 16px;
            font-size: 14px;
          }

          .phone-screen {
            max-width: 200px;
          }

          .features h2 {
            font-size: 32px;
          }
        }
      `}</style>
    </div>
  );
}
