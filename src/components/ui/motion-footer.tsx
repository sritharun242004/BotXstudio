
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


export function CinematicFooter() {
  return (
    <footer style={{
      background: "#1E293B",
      color: "rgba(255,255,255,0.75)",
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      borderTop: "2.5px solid #1E293B",
      overflow: "hidden",
    }}>


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
