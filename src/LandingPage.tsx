import { Link } from "react-router-dom";

const APP = "/login";
const BASE = import.meta.env.BASE_URL;

export default function LandingPage() {
  return (
    <>
      {/* ── Nav ── */}
      <nav className="lp-nav">
        <a href="https://thebotcompany.in" target="_blank" rel="noreferrer" className="lp-nav-brand">
          <div className="lp-nav-bz">BZ</div>
          <span className="lp-nav-name">Botzudio</span>
        </a>
        <div className="lp-nav-links">
          <a href="#pain" className="lp-nav-link">Why Botzudio</a>
          <a href="#how-it-works" className="lp-nav-link">How it works</a>
          <a href="#product" className="lp-nav-link">Features</a>
          <Link to="/login" className="lp-nav-link">Sign In</Link>
          <Link to={APP} className="lp-nav-cta">Try Free →</Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="lp-hero">
        <div>
          <div className="lp-hero-badge">
            <span>📸</span> For Fashion Brands & Sellers
          </div>
          <h1>
            Photoshoot cancelled.<br />
            <em>AI did it faster.</em>
          </h1>
          <p className="lp-hero-sub">
            Stop spending ₹20,000+ on studio shoots that take two weeks to book.
            Upload your garment photo and get professional model shots, multiple angles,
            and scene variations — in under 30 seconds.
          </p>
          <div className="lp-hero-actions">
            <Link to={APP} className="lp-btn-primary">
              Try Free — 6 images on us →
            </Link>
            <a href="#pain" className="lp-btn-secondary">
              See the problem we solve
            </a>
          </div>
        </div>

        <div className="lp-hero-visual">
          <div className="lp-floating-badge top-right">
            💸 Save ₹20,000+ per shoot
          </div>
          <div className="lp-hero-card">
            <div className="lp-hero-card-title">
              <span style={{ background: "#EF4444" }} />
              <span style={{ background: "#FBBF24" }} />
              <span style={{ background: "#34D399" }} />
              Botzudio — Generating your look
            </div>

            <div className="lp-process-flow">
              <div className="lp-process-input-wrap">
                <div className="lp-process-chip lp-chip-in">📦 Your garment</div>
                <div className="lp-process-img-single">
                  <img src={`${BASE}garment-templates/S1.png`} alt="Garment flat-lay" />
                </div>
                <div className="lp-process-sublabel">Flat-lay photo</div>
              </div>

              <div className="lp-process-divider">
                <div className="lp-process-ai-pill">✨ AI</div>
                <div className="lp-process-arrow-line" />
              </div>

              <div className="lp-process-output-wrap">
                <div className="lp-process-chip lp-chip-out">✅ Ready to publish</div>
                <div className="lp-scene-grid">
                  <div className="lp-scene-slot">
                    <img src={`${BASE}garment-templates/S1.png`} alt="Front view" />
                    <span className="lp-scene-angle">Front</span>
                  </div>
                  <div className="lp-scene-slot">
                    <img src={`${BASE}garment-templates/S2.png`} alt="Side view" />
                    <span className="lp-scene-angle">Side</span>
                  </div>
                  <div className="lp-scene-slot">
                    <img src={`${BASE}garment-templates/S3.png`} alt="Back view" />
                    <span className="lp-scene-angle">Back</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="lp-progress-bar">
              <div className="lp-progress-fill lp-progress-done" />
            </div>
            <div className="lp-progress-label">✅ 3 model shots ready in 24s</div>
          </div>
          <div className="lp-floating-badge bottom-left">
            ⚡ No studio. No photographer.
          </div>
        </div>
      </section>

      {/* ── Trust bar ── */}
      <div className="lp-trust">
        <div className="lp-trust-label">Trusted by fashion sellers across India</div>
        <div className="lp-trust-pills">
          {["₹0 Studio Cost", "30s Per Look", "Front + Side + Back", "Print Visualisation", "Any Background", "6 Free Images"].map((t) => (
            <div key={t} className="lp-trust-pill">{t}</div>
          ))}
        </div>
      </div>

      {/* ── Pain points ── */}
      <section className="lp-section" id="pain">
        <div className="lp-section-label">✦ The Real Problem</div>
        <h2 className="lp-section-title">
          Running a fashion brand is hard.<br />Product photography makes it harder.
        </h2>
        <p className="lp-section-sub">
          Every seller knows the frustration. You have great clothes — but getting them in front of
          customers the right way costs a fortune and takes forever.
        </p>
        <div className="lp-features-grid">
          {[
            {
              icon: "💸",
              color: "#FEF2F2",
              title: "Shoots cost ₹20,000–₹1 lakh",
              desc: "Booking a photographer, renting a studio, hiring models, and post-editing adds up fast — before you've sold a single piece.",
            },
            {
              icon: "🗓️",
              color: "#FFF7ED",
              title: "Weeks just to get a shoot date",
              desc: "Good photographers and studios are booked out. By the time your photos are ready, the trend has moved on.",
            },
            {
              icon: "📦",
              color: "#F0FDF4",
              title: "Customers can't see the full product",
              desc: "One or two front shots aren't enough. Buyers want to see the back, the side, the fit — and leave when they can't.",
            },
            {
              icon: "🎨",
              color: "#FEF3C7",
              title: "Print sampling wastes money",
              desc: "You print 50 samples just to see how a design looks on cloth. Half of them never sell. That's dead inventory.",
            },
            {
              icon: "📋",
              color: "#EDE9FE",
              title: "Every product looks different",
              desc: "Different shoots, different lighting, different models. Your catalogue looks inconsistent and unprofessional.",
            },
            {
              icon: "😤",
              color: "#FDF2F8",
              title: "New stock waits weeks to go live",
              desc: "You received the garments. They're sitting in a box. But you can't list them until the photoshoot happens.",
            },
          ].map((f) => (
            <div className="lp-feature-card" key={f.title}>
              <div className="lp-feature-icon" style={{ background: f.color }}>
                {f.icon}
              </div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="lp-section" id="how-it-works" style={{ paddingTop: 0 }}>
        <div className="lp-section-label">✦ The Solution</div>
        <h2 className="lp-section-title">From garment photo to model shot in 4 steps</h2>
        <p className="lp-section-sub">
          No studio booking. No model casting. No waiting. Just upload your garment and go live today.
        </p>
        <div className="lp-steps lp-steps-5">
          {[
            {
              num: "1",
              icon: "📸",
              color: "#EDE9FE",
              title: "Photograph your garment",
              desc: "A simple flat-lay on a table works perfectly. No professional camera needed.",
            },
            {
              num: "2",
              icon: "🧍",
              color: "#FDF2F8",
              title: "Choose your model & scene",
              desc: "Pick the skin tone, body type, background, and occasion that suits your brand.",
            },
            {
              num: "3",
              icon: "✨",
              color: "#FFF7ED",
              title: "AI generates the shoot",
              desc: "Botzudio places your garment on a real-looking model in a professional scene — in seconds.",
            },
            {
              num: "4",
              icon: "🔄",
              color: "#F0FDF4",
              title: "Get every angle automatically",
              desc: "Front, side, and back views generated in one click. Full product coverage instantly.",
            },
            {
              num: "5",
              icon: "🚀",
              color: "#FEF3C7",
              title: "Publish & sell faster",
              desc: "Download high-res images and go live on your store the same day — no waiting.",
            },
          ].map((s) => (
            <div className="lp-step" key={s.num}>
              <div className="lp-step-num" style={{ background: s.color }}>
                <span className="lp-step-icon">{s.icon}</span>
                <span className="lp-step-badge">{s.num}</span>
              </div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Product showcase ── */}
      <section className="lp-showcase" id="product">
        <div className="lp-showcase-inner">
          <div>
            <div className="lp-section-label">✦ What You Get</div>
            <h2 className="lp-section-title">
              Your entire photo studio,<br />for less than one shoot
            </h2>
            <p className="lp-section-sub" style={{ marginBottom: 0 }}>
              Botzudio replaces the photographer, the studio, and the post-editing team —
              so you can list new stock the same day it arrives.
            </p>
            <div className="lp-showcase-features">
              {[
                { icon: "⚡", color: "#FEF3C7", title: "Same-day listing", desc: "Stock arrives today, goes live today. No more waiting on a photographer." },
                { icon: "🎯", color: "#EDE9FE", title: "Consistent brand look", desc: "Same model, same lighting, same quality — across every single product." },
                { icon: "🔄", color: "#F0FDF4", title: "Every angle covered", desc: "Customers see front, side, and back. Fewer questions. More confidence to buy." },
                { icon: "🎨", color: "#FDF2F8", title: "See prints before sampling", desc: "Apply your design digitally and visualise it on the garment before printing a single piece." },
              ].map((item) => (
                <div className="lp-showcase-item" key={item.title}>
                  <div className="lp-showcase-item-icon" style={{ background: item.color }}>{item.icon}</div>
                  <div className="lp-showcase-item-text">
                    <strong>{item.title}</strong>
                    <span>{item.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lp-showcase-visual">
            <div className="lp-dashboard-mock">
              <div className="lp-dashboard-bar">
                <div className="lp-dashboard-bar-dot" />
                <div className="lp-dashboard-bar-dot" />
                <div className="lp-dashboard-bar-dot active" />
                <span style={{ color: "#fff", fontSize: 13, fontWeight: 700, marginLeft: 8 }}>
                  Your Catalogue
                </span>
              </div>
              <div className="lp-dashboard-body">
                {[
                  { bg: "#EDE9FE", emoji: "👗" },
                  { bg: "#FDF2F8", emoji: "🧥" },
                  { bg: "#FFF7ED", emoji: "👔" },
                  { bg: "#F0FDF4", emoji: "👠" },
                ].map((t, i) => (
                  <div key={i} className="lp-dashboard-thumb" style={{ background: t.bg }}>{t.emoji}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="lp-cta">
        <div className="lp-cta-inner">
          <h2>Your first 6 images are on us.</h2>
          <p>
            No studio booking. No credit card. No photographer.
            Just upload your garment and see what Botzudio can do.
          </p>
          <Link to={APP} className="lp-btn-white">
            Start for Free → 6 images included
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-top">
            <div>
              <div className="lp-footer-brand-name">
                <div className="lp-footer-logo"><img src={`${BASE}logo.png`} alt="Botzudio" /></div>
                Botzudio
              </div>
              <p className="lp-footer-tagline">
                AI-powered product photography for fashion brands.<br />
                List faster. Sell more. Spend less.
              </p>
              <div className="lp-footer-social">
                <a href="https://thebotcompany.in" target="_blank" rel="noreferrer" title="Website">🌐</a>
                <a href="https://linkedin.com" target="_blank" rel="noreferrer" title="LinkedIn">💼</a>
                <a href="https://twitter.com" target="_blank" rel="noreferrer" title="Twitter">🐦</a>
              </div>
            </div>

            <div className="lp-footer-col">
              <h4>Product</h4>
              <ul>
                <li><a href="#pain">Why Botzudio</a></li>
                <li><a href="#how-it-works">How it works</a></li>
                <li><Link to="/login">Sign In</Link></li>
              </ul>
            </div>

            <div className="lp-footer-col">
              <h4>Company</h4>
              <ul>
                <li><a href="https://thebotcompany.in" target="_blank" rel="noreferrer">About</a></li>
                <li><a href="https://thebotcompany.in" target="_blank" rel="noreferrer">Services</a></li>
                <li><a href="https://thebotcompany.in" target="_blank" rel="noreferrer">Contact</a></li>
              </ul>
            </div>

            <div className="lp-footer-col">
              <h4>AI Tools</h4>
              <ul>
                <li><Link to={APP}>Botzudio</Link></li>
                <li><a href="https://thebotcompany.in" target="_blank" rel="noreferrer">Bot Studio</a></li>
                <li><a href="https://thebotcompany.in" target="_blank" rel="noreferrer">Automations</a></li>
              </ul>
            </div>
          </div>

          <div className="lp-footer-bottom">
            <span>© 2025 The Bot Company. All rights reserved.</span>
            <span>
              Built with ❤️ by{" "}
              <a href="https://thebotcompany.in" target="_blank" rel="noreferrer">
                thebotcompany
              </a>
            </span>
          </div>
        </div>

        {/* ── Wordmark ── */}
        <div className="lp-footer-wordmark" aria-hidden="true">
          Botzudio
        </div>
      </footer>
    </>
  );
}
