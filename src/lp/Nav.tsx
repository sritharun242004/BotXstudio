import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const NAV_LINKS = [
  { label: "Why Us",       href: "#problem"      },
  { label: "How It Works", href: "#how-it-works"  },
  { label: "Pricing",      href: "#pricing"       },
];

const EASE = { duration: 0.5, ease: [0.4, 0, 0.2, 1] } as const;

export function Nav() {
  const [visible, setVisible]   = useState(false);
  const [onDark, setOnDark]     = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.95);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const section = document.getElementById("how-it-works");
    if (!section) return;
    const obs = new IntersectionObserver(([e]) => setOnDark(e.isIntersecting), { threshold: 0.05 });
    obs.observe(section);
    return () => obs.disconnect();
  }, []);

  const show = visible && !onDark;

  return (
    <motion.nav
      className="lp-nav lp-nav-scrolled"
      style={{
        pointerEvents: show ? "auto" : "none",
        backdropFilter: "blur(28px)",
        WebkitBackdropFilter: "blur(28px)",
        gap: 0,
        padding: 0,
        alignItems: "stretch",
      }}
      initial={{ opacity: 0, y: -28, translateX: "-50%" }}
      animate={{
        opacity: show ? 1 : 0,
        y: visible ? 0 : -28,
        translateX: "-50%",
        top: 14,
        height: 56,
        borderRadius: 9999,
        backgroundColor: "rgba(255,253,245,0.94)",
        boxShadow: onDark
          ? "0 2px 24px rgba(30,41,59,0.06), 0 0 0 1px rgba(255,255,255,0.5)"
          : "0 8px 40px rgba(30,41,59,0.16), 0 0 0 1.5px rgba(30,41,59,0.09)",
      }}
      transition={EASE}
    >
      {/* ── Brand ─────────────────────────────── */}
      <a
        href="https://thebotcompany.in"
        target="_blank"
        rel="noreferrer"
        style={{
          display: "flex", alignItems: "center", gap: 9,
          padding: "0 16px 0 10px",
          textDecoration: "none", color: "#1E293B",
          borderRight: "1px solid rgba(30,41,59,0.09)",
          flexShrink: 0,
        }}
      >
        <div className="lp-nav-bz" style={{ width: 32, height: 32, fontSize: 11 }}>BZ</div>
        <span style={{
          fontFamily: "'Outfit', sans-serif",
          fontWeight: 800, fontSize: 15, letterSpacing: "-0.3px",
        }}>
          Botzudio
        </span>
      </a>

      {/* ── Nav links ─────────────────────────── */}
      <div style={{
        display: "flex", alignItems: "center",
        padding: "5px 6px",
        gap: 2,
        marginLeft: "auto",
      }}>
        {NAV_LINKS.map(({ label, href }) => (
          <a
            key={href}
            href={href}
            style={{
              padding: "6px 13px",
              borderRadius: 9999,
              fontSize: 13,
              fontWeight: 600,
              color: "#475569",
              textDecoration: "none",
              whiteSpace: "nowrap",
              transition: "background .15s, color .15s",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = "rgba(139,92,246,0.08)";
              e.currentTarget.style.color = "#7C3AED";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#475569";
            }}
          >
            {label}
          </a>
        ))}
      </div>

      {/* ── Auth ──────────────────────────────── */}
      <div style={{
        display: "flex", alignItems: "center",
        padding: "5px 6px 5px 0",
        gap: 2,
        borderLeft: "1px solid rgba(30,41,59,0.09)",
        paddingLeft: 8,
        flexShrink: 0,
      }}>
        <Link
          to="/login"
          style={{
            padding: "6px 13px", borderRadius: 9999,
            fontSize: 13, fontWeight: 600,
            color: "#64748B", textDecoration: "none",
            transition: "background .15s, color .15s",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = "rgba(30,41,59,0.07)";
            e.currentTarget.style.color = "#1E293B";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "#64748B";
          }}
        >
          Sign In
        </Link>

        <Link
          to="/login"
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 18px",
            borderRadius: 9999,
            background: "#8B5CF6",
            color: "#fff",
            fontSize: 13, fontWeight: 800,
            textDecoration: "none",
            border: "2px solid #1E293B",
            boxShadow: "3px 3px 0 #1E293B",
            transition: "transform .18s cubic-bezier(.34,1.56,.64,1), box-shadow .18s ease",
            marginRight: 4,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = "translate(-2px,-2px)";
            e.currentTarget.style.boxShadow = "5px 5px 0 #1E293B";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = "translate(0,0)";
            e.currentTarget.style.boxShadow = "3px 3px 0 #1E293B";
          }}
        >
          Get Started Free
          <ArrowRight size={13} strokeWidth={2.5} />
        </Link>
      </div>
    </motion.nav>
  );
}
