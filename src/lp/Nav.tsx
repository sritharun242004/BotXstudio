import { Link, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Menu, X, ChevronDown } from "lucide-react";

const NAV_HASH_LINKS = [
  { label: "Why Us",       hash: "#problem"      },
  { label: "How It Works", hash: "#how-it-works"  },
  { label: "Pricing",      hash: "#pricing"       },
];

const NAV_PAGE_LINKS = [
  { label: "Blog", to: "/blog" },
];

const COMPARE_LINKS = [
  { label: "vs Botika",        to: "/compare/vs-botika" },
  { label: "vs Midjourney",    to: "/compare/vs-midjourney" },
  { label: "vs DALL-E 3",      to: "/compare/vs-dalle" },
  { label: "vs Pebblely",      to: "/compare/vs-pebblely" },
  { label: "vs Pixelcut",      to: "/compare/vs-pixelcut" },
  { label: "vs Runway ML",     to: "/compare/vs-runway" },
  { label: "vs Claid.ai",      to: "/compare/vs-claid" },
  { label: "vs Adobe Firefly", to: "/compare/vs-adobe-firefly" },
  { label: "vs Zyler",         to: "/compare/vs-zyler" },
  { label: "vs Vue.ai",        to: "/compare/vs-vue-ai" },
];

const EASE = { duration: 0.5, ease: [0.4, 0, 0.2, 1] } as const;

export function Nav() {
  const { pathname } = useLocation();
  const isHome = pathname === "/";

  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const mobileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (mobileRef.current && !mobileRef.current.contains(e.target as Node)) {
        setMobileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const onScroll = () => setMobileOpen(false);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const show = true;

  return (
    <motion.nav
      className="lp-nav"
      style={{
        pointerEvents: show ? "auto" : "none",
        backdropFilter: "blur(28px)",
        WebkitBackdropFilter: "blur(28px)",
        gap: 0,
        padding: 0,
        alignItems: "stretch",
        overflow: "visible",
      }}
      initial={{ opacity: 0, y: -28, translateX: "-50%" }}
      animate={{
        opacity: show ? 1 : 0,
        y: 0,
        translateX: "-50%",
        top: 14,
        height: 56,
        borderRadius: 9999,
        backgroundColor: isScrolled
          ? "rgba(255,253,245,0.94)"
          : "rgba(255,253,245,0.7)",
        boxShadow: isScrolled
          ? "0 8px 40px rgba(30,41,59,0.16), 0 0 0 1.5px rgba(30,41,59,0.09)"
          : "0 2px 10px rgba(30,41,59,0.04), 0 0 0 1px rgba(30,41,59,0.05)",
      }}
      transition={EASE}
    >
      {/* ── Brand ─────────────────────────────── */}
      <Link
        to="/"
        style={{
          display: "flex", alignItems: "center", gap: 9,
          padding: "0 16px 0 10px",
          textDecoration: "none", color: "#1E293B",
          flexShrink: 0,
        }}
      >
        <div className="lp-nav-bz" style={{ width: 32, height: 32, fontSize: 11 }}>BZ</div>
        <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 15, letterSpacing: "-0.3px" }}>
          Botzudio
        </span>
      </Link>

      {/* ── Nav links (desktop — centered) ────── */}
      <div className="lp-nav-center-links">
        {NAV_HASH_LINKS.map(({ label, hash }) => (
          <a
            key={hash}
            href={isHome ? hash : `/${hash}`}
            style={{
              padding: "6px 12px",
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
        {NAV_PAGE_LINKS.map(({ label, to }) => (
          <Link
            key={to}
            to={to}
            style={{
              padding: "6px 12px",
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
          </Link>
        ))}

        {/* ── Comparisons dropdown ── */}
        <div
          style={{ position: "relative" }}
          onMouseEnter={() => setCompareOpen(true)}
          onMouseLeave={() => setCompareOpen(false)}
        >
          <button
            style={{
              display: "flex", alignItems: "center", gap: 4,
              padding: "6px 12px",
              borderRadius: 9999,
              fontSize: 13,
              fontWeight: 600,
              color: compareOpen ? "#7C3AED" : "#475569",
              background: compareOpen ? "rgba(139,92,246,0.08)" : "transparent",
              border: "none",
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "background .15s, color .15s",
            }}
          >
            Compare <ChevronDown size={11} strokeWidth={2.5} style={{ transition: "transform .2s", transform: compareOpen ? "rotate(180deg)" : "rotate(0deg)" }} />
          </button>

          <AnimatePresence>
            {compareOpen && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: "rgba(255,253,245,0.98)",
                  border: "1.5px solid rgba(30,41,59,0.1)",
                  borderRadius: 16,
                  boxShadow: "0 12px 40px rgba(30,41,59,0.14), 0 0 0 1px rgba(30,41,59,0.04)",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  minWidth: 320,
                  padding: "8px",
                  zIndex: 200,
                }}
              >
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                  {COMPARE_LINKS.map(({ label, to }) => (
                    <Link
                      key={to}
                      to={to}
                      onClick={() => setCompareOpen(false)}
                      style={{
                        display: "block",
                        padding: "8px 12px",
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#475569",
                        textDecoration: "none",
                        transition: "background .12s, color .12s",
                        whiteSpace: "nowrap",
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
                    </Link>
                  ))}
                </div>
                <div style={{ borderTop: "1px solid rgba(30,41,59,0.08)", margin: "6px 0" }} />
                <Link
                  to="/compare"
                  onClick={() => setCompareOpen(false)}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                    padding: "9px 12px",
                    borderRadius: 10,
                    fontSize: 12,
                    fontWeight: 800,
                    color: "#8B5CF6",
                    textDecoration: "none",
                    transition: "background .12s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(139,92,246,0.08)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                >
                  View all comparisons →
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Auth (desktop) ────────────────────── */}
      <div
        className="lp-nav-auth"
        style={{
          display: "flex", alignItems: "center",
          padding: "5px 6px 5px 8px",
          gap: 2,
          marginLeft: "auto",
          flexShrink: 0,
        }}
      >
        <Link
          to="/login"
          style={{
            padding: "6px 11px", borderRadius: 9999,
            fontSize: 12, fontWeight: 600,
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
            display: "flex", alignItems: "center", gap: 5,
            padding: "6px 13px",
            borderRadius: 9999,
            background: "#8B5CF6",
            color: "#fff",
            fontSize: 12, fontWeight: 800,
            textDecoration: "none",
            border: "2px solid #1E293B",
            boxShadow: "2px 2px 0 #1E293B",
            transition: "transform .18s cubic-bezier(.34,1.56,.64,1), box-shadow .18s ease",
            marginRight: 4,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = "translate(-1px,-1px)";
            e.currentTarget.style.boxShadow = "4px 4px 0 #1E293B";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = "translate(0,0)";
            e.currentTarget.style.boxShadow = "2px 2px 0 #1E293B";
          }}
        >
          Get Started
          <ArrowRight size={11} strokeWidth={2.5} />
        </Link>
      </div>

      {/* ── Hamburger (mobile only) ────────────── */}
      <div
        ref={mobileRef}
        className="lp-nav-hamburger-wrap"
        style={{ position: "relative" }}
      >
        <button
          onClick={() => setMobileOpen(v => !v)}
          className="lp-nav-hamburger-btn"
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            height: "100%",
            padding: "0 14px",
            background: "transparent",
            border: "none",
            borderLeft: "1px solid rgba(30,41,59,0.09)",
            color: "#475569",
            cursor: "pointer",
          }}
          aria-label="Menu"
        >
          {mobileOpen
            ? <X size={18} strokeWidth={2.5} />
            : <Menu size={18} strokeWidth={2.5} />
          }
        </button>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              style={{
                position: "absolute",
                top: "calc(100% + 10px)",
                right: 0,
                background: "rgba(255,253,245,0.98)",
                border: "1.5px solid rgba(30,41,59,0.1)",
                borderRadius: 16,
                boxShadow: "0 12px 40px rgba(30,41,59,0.14), 0 0 0 1px rgba(30,41,59,0.04)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                minWidth: 200,
                padding: "8px",
                zIndex: 200,
              }}
            >
              {NAV_HASH_LINKS.map(({ label, hash }) => (
                <a
                  key={hash}
                  href={isHome ? hash : `/${hash}`}
                  onClick={() => setMobileOpen(false)}
                  style={{
                    display: "block",
                    padding: "10px 16px",
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#475569",
                    textDecoration: "none",
                    transition: "background .12s, color .12s",
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
              {NAV_PAGE_LINKS.map(({ label, to }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMobileOpen(false)}
                  style={{
                    display: "block",
                    padding: "10px 16px",
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#475569",
                    textDecoration: "none",
                    transition: "background .12s, color .12s",
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
                </Link>
              ))}

              {/* Compare group */}
              <div style={{ padding: "6px 16px 2px", fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "#94A3B8" }}>
                Compare
              </div>
              {COMPARE_LINKS.map(({ label, to }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMobileOpen(false)}
                  style={{
                    display: "block",
                    padding: "8px 16px",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#475569",
                    textDecoration: "none",
                    transition: "background .12s, color .12s",
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
                </Link>
              ))}
              <Link
                to="/compare"
                onClick={() => setMobileOpen(false)}
                style={{
                  display: "block",
                  padding: "8px 16px",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 800,
                  color: "#8B5CF6",
                  textDecoration: "none",
                }}
              >
                View all comparisons →
              </Link>

              <div style={{ borderTop: "1px solid rgba(30,41,59,0.08)", margin: "6px 0" }} />

              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                style={{
                  display: "block", padding: "10px 16px", borderRadius: 10,
                  fontSize: 14, fontWeight: 600, color: "#64748B", textDecoration: "none",
                  transition: "background .12s, color .12s",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = "rgba(30,41,59,0.06)";
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
                onClick={() => setMobileOpen(false)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  padding: "10px 16px", borderRadius: 10,
                  fontSize: 14, fontWeight: 800,
                  background: "#8B5CF6", color: "#fff",
                  textDecoration: "none",
                  border: "2px solid #1E293B",
                  boxShadow: "2px 2px 0 #1E293B",
                  marginTop: 4,
                }}
              >
                Get Started
                <ArrowRight size={13} strokeWidth={2.5} />
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
}
