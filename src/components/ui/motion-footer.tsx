import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const FOOTER_LINKS = [
  {
    heading: "Product",
    links: [
      { label: "Why Us",       href: "#problem"      },
      { label: "How it works", href: "#how-it-works"  },
      { label: "Pricing",      href: "#pricing"       },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About",            href: "https://thebotcompany.in", external: true },
      { label: "Terms & Conditions", href: "/terms"                               },
      { label: "Contact",          href: "mailto:official@thebotcompany.in"       },
    ],
  },
  {
    heading: "AI Tools",
    links: [
      { label: "MarkBot", href: "https://markbot.in", external: true },
    ],
  },
];

const FV = { hidden: { opacity: 0, y: 22 }, show: { opacity: 1, y: 0 } };

export function CinematicFooter() {
  return (
    <footer style={{
      background: "#1E293B",
      color: "rgba(255,255,255,0.75)",
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      borderTop: "2.5px solid #1E293B",
      overflow: "hidden",
    }}>

      {/* ── CTA Banner ──────────────────────────────────────── */}
      <div style={{
        position: "relative",
        padding: "96px 40px 80px",
        textAlign: "center",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}>
        {/* ambient glow */}
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%,-50%)",
          width: 640, height: 320, borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(139,92,246,0.22) 0%, transparent 72%)",
          pointerEvents: "none",
        }} />
        {/* pink glow */}
        <div style={{
          position: "absolute", top: "40%", left: "35%",
          width: 300, height: 300, borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(244,114,182,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <motion.div
          initial="hidden" whileInView="show" viewport={{ once: true }}
          transition={{ staggerChildren: 0.12 }}
          style={{ position: "relative" }}
        >
          <motion.p
            variants={FV}
            transition={{ duration: 0.45 }}
            style={{
              display: "inline-block",
              fontSize: 11, fontWeight: 700,
              letterSpacing: ".18em", textTransform: "uppercase",
              color: "#8B5CF6",
              padding: "5px 18px",
              background: "rgba(139,92,246,0.12)",
              border: "1px solid rgba(139,92,246,0.3)",
              borderRadius: 9999,
              marginBottom: 24,
            }}
          >
            Start today — it's free
          </motion.p>

          <motion.h2
            variants={FV}
            transition={{ duration: 0.55 }}
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 900,
              fontSize: "clamp(32px, 5vw, 60px)",
              letterSpacing: "-2px",
              color: "#fff",
              lineHeight: 1.05,
              marginBottom: 36,
            }}
          >
            Ready to elevate<br />your fashion brand?
          </motion.h2>

          <motion.div
            variants={FV}
            transition={{ duration: 0.5 }}
            style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}
          >
            <a
              href="/login"
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "15px 34px", borderRadius: 9999,
                background: "linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)",
                color: "#fff", fontWeight: 800, fontSize: 15,
                textDecoration: "none",
                border: "2px solid rgba(255,255,255,0.18)",
                boxShadow: "4px 4px 0 rgba(0,0,0,0.3), 0 0 28px rgba(139,92,246,0.45)",
                transition: "transform .2s cubic-bezier(.34,1.56,.64,1), box-shadow .2s ease",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = "translate(-2px,-2px)";
                e.currentTarget.style.boxShadow = "6px 6px 0 rgba(0,0,0,0.3), 0 0 36px rgba(139,92,246,0.55)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = "translate(0,0)";
                e.currentTarget.style.boxShadow = "4px 4px 0 rgba(0,0,0,0.3), 0 0 28px rgba(139,92,246,0.45)";
              }}
            >
              Start Generating Free
              <ArrowRight size={15} strokeWidth={2.5} />
            </a>

            <a
              href="#pricing"
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "15px 34px", borderRadius: 9999,
                background: "rgba(255,255,255,0.07)",
                color: "rgba(255,255,255,0.85)", fontWeight: 700, fontSize: 15,
                textDecoration: "none",
                border: "2px solid rgba(255,255,255,0.15)",
                boxShadow: "4px 4px 0 rgba(0,0,0,0.25)",
                transition: "background .18s, border-color .18s, transform .2s cubic-bezier(.34,1.56,.64,1)",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = "rgba(255,255,255,0.13)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.28)";
                e.currentTarget.style.transform = "translate(-2px,-2px)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = "rgba(255,255,255,0.07)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
                e.currentTarget.style.transform = "translate(0,0)";
              }}
            >
              View Pricing
            </a>
          </motion.div>
        </motion.div>
      </div>

      {/* ── Links Grid ──────────────────────────────────────── */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "64px 40px 0" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr 1fr 1fr",
          gap: 48,
          marginBottom: 0,
        }} className="lp-footer-top">

          {/* Brand col */}
          <div>
            <div className="lp-footer-brand-name">
              <div className="lp-nav-bz">BZ</div>
              Botzudio
            </div>
            <p className="lp-footer-tagline">
              AI-powered product photography for fashion brands. Professional quality, zero studio cost.
            </p>
            <div className="lp-footer-social">
              <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram">📸</a>
              <a href="https://twitter.com"   target="_blank" rel="noreferrer" aria-label="Twitter">𝕏</a>
              <a href="https://linkedin.com"  target="_blank" rel="noreferrer" aria-label="LinkedIn">in</a>
            </div>
          </div>

          {/* Nav cols */}
          {FOOTER_LINKS.map(({ heading, links }) => (
            <div key={heading} className="lp-footer-col">
              <h4>{heading}</h4>
              <ul>
                {links.map(({ label, href, external }) => (
                  <li key={label}>
                    <a
                      href={href}
                      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* ── Wordmark ────────────────────────────────────────── */}
      <div style={{ maxWidth: "100%", overflow: "hidden" }}>
        <div
          aria-hidden="true"
          style={{
            width: "100%",
            marginTop: 40,
            lineHeight: 1,
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 900,
            fontSize: "clamp(110px, 20vw, 340px)",
            letterSpacing: "-0.03em",
            color: "rgba(255,255,255,0.05)",
            whiteSpace: "nowrap",
            textAlign: "center",
            userSelect: "none",
            pointerEvents: "none",
          }}
        >
          Botzudio
        </div>
      </div>

      {/* ── Bottom Bar ──────────────────────────────────────── */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 40px" }}>
        <div style={{
          borderTop: "1px solid rgba(255,255,255,0.1)",
          padding: "22px 0 28px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 10,
          fontSize: 13,
          color: "rgba(255,255,255,0.45)",
        }}>
          <span>© {new Date().getFullYear()} The Bot Company. All rights reserved.</span>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <a href="/terms" style={{ color: "#8B5CF6", textDecoration: "none", marginRight: 10 }}>
              Terms &amp; Conditions
            </a>
            Built with ❤️ by{" "}
            <a
              href="https://thebotcompany.in"
              target="_blank" rel="noreferrer"
              style={{ color: "#8B5CF6", textDecoration: "none" }}
            >
              thebotcompany
            </a>
          </span>
        </div>
      </div>

    </footer>
  );
}
