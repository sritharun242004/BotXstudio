import { Link } from "react-router-dom";
import { useState } from "react";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer } from "./animations";

const APP = "/login";
const FAQS = [
  { q: "Do I need good photography skills?", a: "No. A phone photo of your garment on a hanger or flat on a table is enough. We handle everything else." },
  { q: "What if the image doesn't look right?", a: "Type a correction — 'make the background lighter' or 'adjust the sleeve drape' — and regenerate in seconds." },
  { q: "Does it work for ethnic and traditional wear?", a: "Yes. We have a dedicated workflow for sarees, lehengas, kurtas, and similar styles." },
  { q: "Do I own the images I generate?", a: "Yes. Every image you generate is yours to use commercially, without restriction." },
  { q: "What formats and sizes do I get?", a: "Outputs are high-resolution (1080×1440px), ready for Myntra, Meesho, Flipkart, and your own website." },
];

const CONFETTI = [
  { w: 14, h: 14, top: "14%", left: "5%",  bg: "#FBBF24", br: "3px", tr: "rotate(45deg)"  },
  { w: 10, h: 10, top: "68%", left: "8%",  bg: "#F472B6", br: "50%", tr: "rotate(0deg)"   },
  { w: 18, h: 18, top: "22%", left: "88%", bg: "#34D399", br: "4px", tr: "rotate(30deg)"  },
  { w: 12, h: 12, top: "72%", left: "91%", bg: "#8B5CF6", br: "50%", tr: "rotate(15deg)"  },
  { w: 16, h: 16, top: "44%", left: "3%",  bg: "#FBBF24", br: "3px", tr: "rotate(60deg)"  },
  { w: 8,  h: 8,  top: "55%", left: "93%", bg: "#F472B6", br: "50%", tr: "rotate(0deg)"   },
];

export function Guarantee() {
  return (
    <div className="lp-section-muted-wrap">
      <section className="lp-section">
        <motion.div 
          className="lp-guarantee-block"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <div className="lp-guarantee-icon-wrap">🛡️</div>
          <div className="lp-guarantee-content">
            <h2 className="lp-guarantee-title">Try it free. No commitment.</h2>
            <p className="lp-guarantee-sub">
              No credit card. No setup fee. If your first image isn't good enough to publish, tell us — we'll fix it.
            </p>
            <div className="lp-guarantee-stats">
              {[
                { val: "10,000+", label: "Images generated" },
                { val: "200+",    label: "Brands onboarded" },
                { val: "< 60s",   label: "Average generation" },
              ].map((s, i) => (
                <motion.div 
                  key={s.label} 
                  className="lp-gstat"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + (i * 0.1) }}
                >
                  <span className="lp-gstat-val">{s.val}</span>
                  <span className="lp-gstat-label">{s.label}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}

const MODEL_ROWS = [
  { name: "Flash Model",  note: "5 cr / img",    free: true  },
  { name: "ProMax Model", note: "20 cr / img",   free: true  },
  { name: "Plus Model",   note: "15 cr / set",   free: false },
  { name: "Pro Model",    note: "6–25 cr / img", free: false },
];

export function Pricing() {
  const packs = [
    {
      tag: "Free",
      name: "Starter",
      price: "₹0",
      sub: "on signup — no card needed",
      credits: 30,
      note: "~6 Flash images",
      models: ["Flash Model", "ProMax Model"],
      lockedModels: ["Plus Model", "Pro Model"],
      cta: "Get Started Free",
      popular: false,
      highlight: false,
    },
    {
      tag: "Pack 1",
      name: "Basic",
      price: "₹499",
      sub: "one-time · never expires",
      credits: 60,
      note: "~12 Flash images",
      models: ["Flash Model", "ProMax Model", "Plus Model", "Pro Model"],
      lockedModels: [],
      cta: "Buy 60 Credits →",
      popular: false,
      highlight: false,
    },
    {
      tag: "Most Popular",
      name: "Growth",
      price: "₹1,299",
      sub: "one-time · never expires",
      credits: 250,
      note: "~50 Flash images",
      models: ["Flash Model", "ProMax Model", "Plus Model", "Pro Model"],
      lockedModels: [],
      cta: "Buy 250 Credits →",
      popular: true,
      highlight: true,
    },
    {
      tag: "Best Value",
      name: "Studio",
      price: "₹2,499",
      sub: "one-time · never expires",
      credits: 700,
      note: "~140 Flash images",
      models: ["Flash Model", "ProMax Model", "Plus Model", "Pro Model"],
      lockedModels: [],
      cta: "Buy 700 Credits →",
      popular: false,
      highlight: false,
    },
  ];

  return (
    <section className="lp-section" id="pricing">
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}>
        <motion.div className="lp-section-label" variants={fadeInUp}>✦ Pricing</motion.div>
        <motion.h2 className="lp-section-title" variants={fadeInUp}>
          Pay per image. No subscription.
        </motion.h2>
        <motion.p className="lp-section-sub" variants={fadeInUp}>
          Buy credits once, use them anytime. Credits never expire. Start free with 30 credits — no card needed.
        </motion.p>
      </motion.div>

      {/* Model availability legend */}
      <motion.div
        className="lp-model-legend"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.1 }}
      >
        {MODEL_ROWS.map(m => (
          <div key={m.name} className="lp-model-legend-item">
            <span className={`lp-model-dot ${m.free ? "lp-model-dot-free" : "lp-model-dot-paid"}`} />
            <span className="lp-model-legend-name">{m.name}</span>
            <span className="lp-model-legend-note">{m.note}</span>
            <span className={`lp-model-legend-badge ${m.free ? "lp-badge-free" : "lp-badge-paid"}`}>
              {m.free ? "Free included" : "Credits required"}
            </span>
          </div>
        ))}
      </motion.div>

      <div className="lp-pricing-grid lp-pricing-grid-4">
        {packs.map((pack, i) => (
          <motion.div
            key={pack.name}
            className={`lp-pricing-card lp-credit-card ${pack.highlight ? "lp-pricing-popular" : ""}`}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: i * 0.1, duration: 0.45 }}
            whileHover={{ y: pack.highlight ? -10 : -5, transition: { duration: 0.18 } }}
          >
            {pack.popular && <div className="lp-popular-badge">{pack.tag}</div>}

            <div className="lp-credit-tag">{pack.popular ? "" : pack.tag}</div>
            <h3 className="lp-pricing-name">{pack.name}</h3>

            <div className="lp-credit-price-row">
              <span className="lp-price-num">{pack.price}</span>
              <div className="lp-credit-badge-wrap">
                <span className="lp-credit-count">{pack.credits}</span>
                <span className="lp-credit-word">credits</span>
              </div>
            </div>
            <div className="lp-credit-sub">{pack.sub}</div>
            <div className="lp-credit-note">{pack.note}</div>

            <div className="lp-credit-divider" />

            <div className="lp-credit-models-label">Models unlocked</div>
            <ul className="lp-credit-models">
              {MODEL_ROWS.map(m => {
                const unlocked = pack.models.includes(m.name);
                return (
                  <li key={m.name} className={unlocked ? "lp-model-on" : "lp-model-off"}>
                    <span>{unlocked ? "✓" : "🔒"}</span>
                    <span>{m.name}</span>
                    <span className="lp-model-cost">{m.note}</span>
                  </li>
                );
              })}
            </ul>

            <Link
              to={APP}
              className={pack.highlight ? "lp-btn-primary" : "lp-btn-secondary"}
              style={{ width: "100%", justifyContent: "center", marginTop: "auto" }}
            >
              {pack.cta}
            </Link>
          </motion.div>
        ))}
      </div>

      <motion.p
        className="lp-pricing-footnote"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.5 }}
      >
        Credits are shared across all features — image generation, prints, and try-on.
        No subscription. No monthly renewal. Buy once, use anytime.
      </motion.p>
    </section>
  );
}

export function Faq() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="lp-section-muted-wrap">
      <section className="lp-section" id="faq">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}>
          <motion.div className="lp-section-label" variants={fadeInUp}>✦ FAQ</motion.div>
          <motion.h2 className="lp-section-title" variants={fadeInUp}>
            Questions we get a lot
          </motion.h2>
        </motion.div>
        <motion.div 
          className="lp-faq-list"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={staggerContainer}
        >
          {FAQS.map((faq, i) => (
            <motion.div
              key={i}
              variants={fadeInUp}
              className={`lp-faq-item${openFaq === i ? " lp-faq-open" : ""}`}
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
            >
              <div className="lp-faq-q">
                <span>{faq.q}</span>
                <span className="lp-faq-icon">{openFaq === i ? "−" : "+"}</span>
              </div>
              {openFaq === i && (
                <motion.div 
                  className="lp-faq-a"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  {faq.a}
                </motion.div>
              )}
            </motion.div>
          ))}
        </motion.div>
      </section>
    </div>
  );
}

export function Cta() {
  return (
    <section className="lp-cta">
      {CONFETTI.map((c, i) => (
        <motion.div 
          key={i} 
          className="lp-confetti" 
          aria-hidden="true" 
          style={{
            width: c.w, height: c.h, top: c.top, left: c.left,
            background: c.bg, borderRadius: c.br, transform: c.tr,
          }}
          animate={{
            y: [0, -20, 0],
            rotate: [parseInt(c.tr.replace(/[^0-9]/g, '')) || 0, (parseInt(c.tr.replace(/[^0-9]/g, '')) || 0) + 90, parseInt(c.tr.replace(/[^0-9]/g, '')) || 0]
          }}
          transition={{
            repeat: Infinity,
            duration: 3 + i,
            ease: "easeInOut"
          }}
        />
      ))}
      <div className="lp-cta-glow" aria-hidden="true" />
      <motion.div 
        className="lp-cta-inner"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={staggerContainer}
      >
        <motion.h2 variants={fadeInUp}>
          Your next product launch<br />doesn't need a photoshoot.
        </motion.h2>
        <motion.p variants={fadeInUp}>
          Create your first image in under 5 minutes — free.
        </motion.p>
        <motion.div variants={fadeInUp}>
          <Link to={APP} className="lp-btn-white">
            Start Generating Free
          </Link>
        </motion.div>
        <motion.p className="lp-cta-micro" variants={fadeInUp}>
          No credit card. No setup. Cancel anytime.
        </motion.p>
      </motion.div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="lp-footer">
      <div className="lp-footer-inner">
        <div className="lp-footer-top">
          <div>
            <div className="lp-footer-brand-name">
              <div className="lp-nav-bz" style={{ width: 32, height: 32, fontSize: 11 }}>BZ</div>
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
              <li><a href="#problem">Why Botzudio</a></li>
              <li><a href="#how-it-works">How it works</a></li>
              <li><a href="#pricing">Pricing</a></li>
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
              <li><a href="https://markbot.in" target="_blank" rel="noreferrer">MarkBot</a></li>
            </ul>
          </div>
        </div>

        <div className="lp-footer-bottom">
          <span>© 2025 The Bot Company. All rights reserved.</span>
          <span style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Link to="/terms" style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, textDecoration: "none" }}>Terms &amp; Conditions</Link>
            <span style={{ color: "rgba(255,255,255,0.3)" }}>·</span>
            <span>
              Built with ❤️ by{" "}
              <a href="https://thebotcompany.in" target="_blank" rel="noreferrer">thebotcompany</a>
            </span>
          </span>
        </div>
      </div>
      <div className="lp-footer-wordmark" aria-hidden="true">Botzudio</div>
    </footer>
  );
}
