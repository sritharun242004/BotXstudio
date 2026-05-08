import { motion, type Variants } from "framer-motion";
import { ReactLenis } from "@studio-freight/react-lenis";
import { Link } from "react-router-dom";

const APP = "/login";
const BASE = import.meta.env.BASE_URL;

// ── Variants ──────────────────────────────────────────────────────────────────

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", damping: 22, stiffness: 280 },
  },
};

const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.82 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring", damping: 18, stiffness: 340 },
  },
};

const slideRight: Variants = {
  hidden: { opacity: 0, x: 48 },
  show: {
    opacity: 1,
    x: 0,
    transition: { type: "spring", damping: 22, stiffness: 200 },
  },
};

const stagger = (delay = 0.08): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: delay, delayChildren: 0.05 } },
});

const vp = { once: true, margin: "-70px" };

// ── Component ─────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <ReactLenis root options={{ lerp: 0.08, duration: 1.4, smoothWheel: true }}>
      {/* ── Nav ── */}
      <motion.nav
        className="lp-nav"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
      >
        <a href="https://thebotcompany.in" target="_blank" rel="noreferrer" className="lp-nav-brand">
          <div className="lp-nav-logo"><img src={`${BASE}logo.png`} alt="Botzudio" /></div>
          <span className="lp-nav-name">The Bot Company</span>
        </a>
        <div className="lp-nav-links">
          <a href="#features" className="lp-nav-link">Features</a>
          <a href="#how-it-works" className="lp-nav-link">How it works</a>
          <a href="#product" className="lp-nav-link">Product</a>
          <Link to="/login" className="lp-nav-link">Sign In</Link>
          <Link to={APP} className="lp-nav-cta">Get Started →</Link>
        </div>
      </motion.nav>

      {/* ── Hero ── */}
      <section className="lp-hero">
        {/* Left copy */}
        <motion.div variants={stagger(0.1)} initial="hidden" animate="show">
          <motion.div className="lp-hero-badge" variants={popIn}>
            <span>✨</span> AI-Powered Fashion Imaging
          </motion.div>

          <motion.h1 variants={fadeUp}>
            Generate Studio-Quality<br />
            <em>Product Scenes</em><br />
            with AI
          </motion.h1>

          <motion.p className="lp-hero-sub" variants={fadeUp}>
            Botzudio turns your garment photos into
            photorealistic e-commerce scenes — complete with models, backgrounds, and
            multi-angle views. No studio. No photographer. Just results.
          </motion.p>

          <motion.div className="lp-hero-actions" variants={stagger(0.12)}>
            <motion.div variants={fadeUp}>
              <Link to={APP} className="lp-btn-primary">Get Started →</Link>
            </motion.div>
            <motion.div variants={fadeUp}>
              <a href="#how-it-works" className="lp-btn-secondary">See how it works</a>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Right visual */}
        <motion.div
          className="lp-hero-visual"
          variants={slideRight}
          initial="hidden"
          animate="show"
          transition={{ delay: 0.18 }}
        >
          <motion.div
            className="lp-floating-badge top-right"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.55, type: "spring", damping: 16, stiffness: 320 }}
          >
            🤖 Powered by Gemini AI
          </motion.div>

          <div className="lp-hero-card">
            <div className="lp-hero-card-title">
              <span style={{ background: "#EF4444" }} />
              <span style={{ background: "#FBBF24" }} />
              <span style={{ background: "#34D399" }} />
              Botzudio — Scene Generator
            </div>

            <div className="lp-process-flow">
              <div className="lp-process-input-wrap">
                <div className="lp-process-chip lp-chip-in">📥 Input</div>
                <div className="lp-process-img-single">
                  <img src={`${BASE}garment-templates/S1.png`} alt="Garment flat-lay" />
                </div>
                <div className="lp-process-sublabel">Garment photo</div>
              </div>

              <div className="lp-process-divider">
                <div className="lp-process-ai-pill">✨ AI</div>
                <div className="lp-process-arrow-line" />
              </div>

              <div className="lp-process-output-wrap">
                <div className="lp-process-chip lp-chip-out">✅ Generated</div>
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
              <motion.div
                className="lp-progress-fill lp-progress-done"
                initial={{ scaleX: 0, originX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.9, duration: 0.7, ease: "easeOut" }}
              />
            </div>
            <div className="lp-progress-label">✅ 3 scenes ready in 24s</div>
          </div>

          <motion.div
            className="lp-floating-badge bottom-left"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7, type: "spring", damping: 16, stiffness: 320 }}
          >
            ⚡ 3 angles in &lt; 30s
          </motion.div>
        </motion.div>
      </section>

      {/* ── Trust bar ── */}
      <motion.div
        className="lp-trust"
        initial="hidden"
        whileInView="show"
        viewport={vp}
        variants={stagger(0.06)}
      >
        <motion.div className="lp-trust-label" variants={fadeUp}>Built on enterprise-grade AI</motion.div>
        <motion.div className="lp-trust-pills" variants={stagger(0.06)}>
          {["Google Gemini", "Photorealistic Output", "Multi-Angle Generation", "Print Application", "Storyboard Library", "IndexedDB Storage"].map((t) => (
            <motion.div key={t} className="lp-trust-pill" variants={popIn}>{t}</motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* ── Features ── */}
      <section className="lp-section" id="features">
        <motion.div
          className="lp-section-label"
          initial="hidden"
          whileInView="show"
          viewport={vp}
          variants={fadeUp}
        >
          ✦ Features
        </motion.div>
        <motion.h2
          className="lp-section-title"
          initial="hidden"
          whileInView="show"
          viewport={vp}
          variants={fadeUp}
        >
          Everything you need for<br />professional product photography
        </motion.h2>
        <motion.p
          className="lp-section-sub"
          initial="hidden"
          whileInView="show"
          viewport={vp}
          variants={fadeUp}
        >
          From garment upload to finished scene — our AI handles the entire creative process
          so your team can focus on what matters.
        </motion.p>

        <motion.div
          className="lp-features-grid"
          initial="hidden"
          whileInView="show"
          viewport={vp}
          variants={stagger(0.1)}
        >
          {[
            {
              icon: "🖼️",
              color: "#EDE9FE",
              title: "AI Scene Generation",
              desc: "Upload a garment photo and instantly receive photorealistic product scenes with professional lighting and composition.",
            },
            {
              icon: "🧍",
              color: "#FDF2F8",
              title: "Model References",
              desc: "Provide a reference image to control model appearance, pose style, and body type for consistent brand visuals.",
            },
            {
              icon: "🏞️",
              color: "#FFF7ED",
              title: "Background Control",
              desc: "Supply your own background or let the AI choose — from studio whites to editorial outdoor settings.",
            },
            {
              icon: "🔄",
              color: "#F0FDF4",
              title: "Multi-Angle Shots",
              desc: "Automatically generate front, side, and back views in a single run. Full 360° product coverage, no extra shoots.",
              comingSoon: true,
            },
            {
              icon: "🎨",
              color: "#FEF3C7",
              title: "Print Application",
              desc: "Apply graphic designs and print patterns directly onto garments and see how they look on a finished product.",
            },
            {
              icon: "📚",
              color: "#ECFDF5",
              title: "Storyboard Library",
              desc: "Organise every shoot into named storyboards. Save, reload, and compare configurations across your entire catalogue.",
            },
          ].map((f) => (
            <motion.div
              className={`lp-feature-card${f.comingSoon ? " lp-feature-card-soon" : ""}`}
              key={f.title}
              variants={fadeUp}
              whileHover={{ rotate: -1.2, scale: 1.025, transition: { type: "spring", damping: 14, stiffness: 300 } }}
            >
              {f.comingSoon && <div className="lp-coming-soon-badge">Coming Soon</div>}
              <div className="lp-feature-icon" style={{ background: f.color }}>{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── How it works ── */}
      <section className="lp-section" id="how-it-works" style={{ paddingTop: 0 }}>
        <motion.div
          className="lp-section-label"
          initial="hidden"
          whileInView="show"
          viewport={vp}
          variants={fadeUp}
        >
          ✦ Process
        </motion.div>
        <motion.h2
          className="lp-section-title"
          initial="hidden"
          whileInView="show"
          viewport={vp}
          variants={fadeUp}
        >
          From garment to gallery in five steps
        </motion.h2>
        <motion.p
          className="lp-section-sub"
          initial="hidden"
          whileInView="show"
          viewport={vp}
          variants={fadeUp}
        >
          No creative briefs, no scheduling, no post-production. Just upload and generate.
        </motion.p>

        <motion.div
          className="lp-steps lp-steps-5"
          initial="hidden"
          whileInView="show"
          viewport={vp}
          variants={stagger(0.12)}
        >
          {[
            { num: "1", icon: "📸", color: "#EDE9FE", title: "Upload Garment", desc: "Drop in a flat-lay or product photo as your base canvas." },
            { num: "2", icon: "🧍", color: "#FDF2F8", title: "Add References", desc: "Attach model and background references for full creative control." },
            { num: "3", icon: "⚙️", color: "#FFF7ED", title: "Configure Scene", desc: "Pick occasion, style, pose, footwear — or let AI choose smart defaults." },
            { num: "4", icon: "🤖", color: "#F0FDF4", title: "AI Generates", desc: "Gemini AI renders photorealistic front, side, and back views in under 30s." },
            { num: "5", icon: "⬇️", color: "#FEF3C7", title: "Export & Save", desc: "Download production-ready images or save them to your storyboard library." },
          ].map((s) => (
            <motion.div
              className="lp-step"
              key={s.num}
              variants={fadeUp}
              whileHover={{ y: -6, transition: { type: "spring", damping: 14, stiffness: 340 } }}
            >
              <div className="lp-step-num" style={{ background: s.color }}>
                <span className="lp-step-icon">{s.icon}</span>
                <span className="lp-step-badge">{s.num}</span>
              </div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── Product showcase ── */}
      <section className="lp-showcase" id="product">
        <div className="lp-showcase-inner">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={vp}
            variants={stagger(0.1)}
          >
            <motion.div className="lp-section-label" variants={fadeUp}>✦ Product</motion.div>
            <motion.h2 className="lp-section-title" variants={fadeUp}>
              A full AI studio<br />in your browser
            </motion.h2>
            <motion.p className="lp-section-sub" style={{ marginBottom: 0 }} variants={fadeUp}>
              Botzudio is built for e-commerce teams who need high-volume,
              high-quality imagery without the overhead of a traditional studio.
            </motion.p>

            <motion.div className="lp-showcase-features" variants={stagger(0.1)}>
              {[
                { icon: "⚡", color: "#FEF3C7", title: "Instant generation", desc: "Front + side + back views in under 30 seconds" },
                { icon: "🔒", color: "#EDE9FE", title: "Private by design", desc: "Images stored locally in your browser — never on our servers" },
                { icon: "♾️", color: "#F0FDF4", title: "Unlimited storyboards", desc: "Organise every product into named campaigns and collections" },
                { icon: "🖨️", color: "#FDF2F8", title: "Print-ready output", desc: "Apply designs to garments and export production-ready images" },
              ].map((item) => (
                <motion.div className="lp-showcase-item" key={item.title} variants={fadeUp}>
                  <div className="lp-showcase-item-icon" style={{ background: item.color }}>{item.icon}</div>
                  <div className="lp-showcase-item-text">
                    <strong>{item.title}</strong>
                    <span>{item.desc}</span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          <motion.div
            className="lp-showcase-visual"
            initial="hidden"
            whileInView="show"
            viewport={vp}
            variants={slideRight}
          >
            <div className="lp-dashboard-mock">
              <div className="lp-dashboard-bar">
                <div className="lp-dashboard-bar-dot" />
                <div className="lp-dashboard-bar-dot" />
                <div className="lp-dashboard-bar-dot active" />
                <span style={{ color: "#fff", fontSize: 13, fontWeight: 700, marginLeft: 8 }}>
                  Storyboard Library
                </span>
              </div>
              <div className="lp-dashboard-body">
                {[
                  { bg: "#EDE9FE", emoji: "👗" },
                  { bg: "#FDF2F8", emoji: "🧥" },
                  { bg: "#FFF7ED", emoji: "👔" },
                  { bg: "#F0FDF4", emoji: "👠" },
                ].map((t, i) => (
                  <motion.div
                    key={i}
                    className="lp-dashboard-thumb"
                    style={{ background: t.bg }}
                    initial={{ opacity: 0, scale: 0.7 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={vp}
                    transition={{ delay: 0.12 * i, type: "spring", damping: 16, stiffness: 280 }}
                  >
                    {t.emoji}
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <motion.section
        className="lp-cta"
        initial="hidden"
        whileInView="show"
        viewport={vp}
        variants={stagger(0.12)}
      >
        <motion.div className="lp-cta-inner" variants={popIn}>
          <motion.h2 variants={fadeUp}>Ready to transform your product imagery?</motion.h2>
          <motion.p variants={fadeUp}>
            Start generating photorealistic e-commerce scenes today —
            no credit card, no setup, no studio required.
          </motion.p>
          <motion.div
            variants={fadeUp}
            whileHover={{ scale: 1.05, y: -3, transition: { type: "spring", damping: 14, stiffness: 340 } }}
            whileTap={{ scale: 0.97 }}
          >
            <Link to={APP} className="lp-btn-white">Get Started for Free →</Link>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* ── Footer ── */}
      <motion.footer
        className="lp-footer"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="lp-footer-inner">
          <div className="lp-footer-top">
            <div>
              <div className="lp-footer-brand-name">
                <div className="lp-footer-logo"><img src={`${BASE}logo.png`} alt="Botzudio" /></div>
                The Bot Company
              </div>
              <p className="lp-footer-tagline">
                Enterprise AI solutions &amp; bot development.<br />
                Building the future of intelligent automation.
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
                <li><a href="#features">Features</a></li>
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
                <li><Link to={APP}>Get Started</Link></li>
                <li><Link to={APP}>Get Started</Link></li>
                <li><Link to={APP}>Get Started</Link></li>
              </ul>
            </div>
          </div>

          <div className="lp-footer-bottom">
            <span>© 2025 The Bot Company. All rights reserved.</span>
            <span>
              Built with ❤️ by{" "}
              <a href="https://thebotcompany.in" target="_blank" rel="noreferrer">
                thebotcompany.in
              </a>
            </span>
          </div>
        </div>
      </motion.footer>
    </ReactLenis>
  );
}
