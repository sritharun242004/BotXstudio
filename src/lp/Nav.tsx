import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

const APP = "/login";
const EASE = { duration: 0.55, ease: [0.4, 0, 0.2, 1] } as const;

export function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.nav
      className={`lp-nav${scrolled ? " lp-nav-scrolled" : ""}`}
      initial={{ opacity: 0, y: -16, translateX: "-50%" }}
      animate={{
        opacity: 1,
        y: 0,
        translateX: "-50%",
        top: scrolled ? 12 : 0,
        height: scrolled ? 60 : 72,
        paddingLeft: scrolled ? 28 : 48,
        paddingRight: scrolled ? 40 : 48,
        borderRadius: scrolled ? 9999 : 0,
        boxShadow: scrolled
          ? "0 6px 32px rgba(30,41,59,0.13), 0 0 0 1.5px rgba(30,41,59,0.13)"
          : "0 1px 16px rgba(30,41,59,0.06), 0 0 0 1px rgba(30,41,59,0.07)",
      }}
      transition={EASE}
    >
      <a href="https://thebotcompany.in" target="_blank" rel="noreferrer" className="lp-nav-brand">
        <div className="lp-nav-bz">BZ</div>
        <span className="lp-nav-name">Botzudio</span>
      </a>
      <div className="lp-nav-links">
        <a href="#problem" className="lp-nav-link">Why Us</a>
        <a href="#how-it-works" className="lp-nav-link">How it works</a>
        <a href="#pricing" className="lp-nav-link">Pricing</a>
        <Link to="/login" className="lp-nav-link">Sign In</Link>
        <Link to={APP} className="lp-nav-cta">Get Started Free →</Link>
      </div>
    </motion.nav>
  );
}
