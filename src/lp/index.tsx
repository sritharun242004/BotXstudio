import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { useState } from "react";
import { ArrowRight, CheckCircle, Image as ImageIcon, Upload, Download, Sparkles, DollarSign, Clock, LayoutGrid, Store, ShoppingBag, ShieldCheck, ChevronDown } from "lucide-react";
import { CandyButton, SecondaryButton, StickerCard } from "./ThemeComponents";
import { Floating, FloatingElement } from "./parallax-floating";
import { TextRotate } from "./text-rotate";

const STEPS = [
  { title: "Upload your garment", desc: "A photo on a hanger or flat lay works fine.", icon: Upload, color: "#FBBF24", textDark: true },
  { title: "Choose model & setting", desc: "Pick from presets or use your references.", icon: LayoutGrid, color: "#F472B6", textDark: false },
  { title: "Generate", desc: "AI creates a composite in under 60 seconds.", icon: Sparkles, color: "#8B5CF6", textDark: false },
  { title: "Download & publish", desc: "Front, side, back, and detail views included.", icon: Download, color: "#34D399", textDark: true },
];

const GALLERY = [
  { label: "Front View", bg: "#EDE9FE" },
  { label: "Side Angle", bg: "#FCE7F3" },
  { label: "Back View", bg: "#D1FAE5" },
  { label: "Close-up Detail", bg: "#FEF3C7" },
  { label: "Pattern Variant", bg: "#DBEAFE" },
  { label: "Ethnic Wear (Saree)", bg: "#FFE4E6" },
];

const PERSONAS = [
  { title: "D2C Fashion Brands", desc: "Generate a full catalog image set without a photography budget.", icon: Store },
  { title: "Marketplace Sellers", desc: "Meet platform image requirements at volume, fast.", icon: ShoppingBag },
  { title: "Boutiques & Designers", desc: "Present new designs professionally without a full production setup.", icon: Sparkles },
  { title: "Ethnic Wear Brands", desc: "Specialized support for sarees, lehengas, and traditional styles.", icon: ShieldCheck },
];

const FAQS = [
  { q: "Do I need good photography skills?", a: "No. A phone photo of the garment on a hanger or flat on a table is enough." },
  { q: "What if the image doesn't look right?", a: 'You can type a correction — "make the background lighter" or "adjust the sleeve drape" — and regenerate in seconds.' },
  { q: "Does it work for ethnic and traditional wear?", a: "Yes. The platform has a dedicated workflow for sarees, lehengas, and similar styles." },
  { q: "Do I own the images I generate?", a: "Yes. Every image you generate is yours to use commercially." },
  { q: "What image formats and sizes do I get?", a: "Outputs are high-resolution (1080×1440px), suitable for all major e-commerce platforms." },
];

export function LandingPageTheme() {
  const [openFaqs, setOpenFaqs] = useState<Set<number>>(() => new Set(FAQS.map((_, i) => i)));
  const toggleFaq = (i: number) => setOpenFaqs(prev => { const next = new Set(prev); next.has(i) ? next.delete(i) : next.add(i); return next; });

  return (
    <div style={{ background: "#FFFDF5", color: "#1E293B", fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <div style={{ position: "relative", minHeight: "100vh", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", background: "radial-gradient(ellipse 80% 70% at 0% 0%, rgba(139,92,246,0.20) 0%, transparent 55%), radial-gradient(ellipse 60% 60% at 100% 100%, rgba(244,114,182,0.16) 0%, transparent 55%), #FFFDF5" }}>

        {/* Floating parallax images — hidden on small screens */}
        <div className="lp-hero-floats">
          <Floating sensitivity={-0.5}>
            {/* Top-left small */}
            <FloatingElement depth={0.5} style={{ top: "16%", left: "2%" }}>
              <motion.img
                src="/landing page/4417001374546c18d8184e34a2628be3.jpg"
                alt="Fashion garment"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                style={{ width: 110, height: 150, objectFit: "cover", borderRadius: 14, border: "2px solid #1E293B", boxShadow: "6px 6px 0px #1E293B", transform: "rotate(-3deg)", cursor: "default" }}
              />
            </FloatingElement>

            {/* Top-left large */}
            <FloatingElement depth={1.2} style={{ top: "3%", left: "9%" }}>
              <motion.img
                src="/landing page/c3c201a57b31a5ff575ddd0b9e6348b3.jpg"
                alt="Fashion catalog shot"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
                style={{ width: 168, height: 220, objectFit: "cover", borderRadius: 14, border: "2px solid #1E293B", boxShadow: "8px 8px 0px #1E293B", transform: "rotate(-10deg)", cursor: "default" }}
              />
            </FloatingElement>

            {/* Bottom-left */}
            <FloatingElement depth={3} style={{ top: "62%", left: "3%" }}>
              <motion.img
                src="/landing page/9f299fb22eb98fc34353fd7eb1d60dea.jpg"
                alt="Fashion product photo"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
                style={{ width: 195, height: 195, objectFit: "cover", borderRadius: 14, border: "2px solid #1E293B", boxShadow: "8px 8px 0px #1E293B", transform: "rotate(-4deg)", cursor: "default" }}
              />
            </FloatingElement>

            {/* Top-right */}
            <FloatingElement depth={2} style={{ top: "3%", left: "79%" }}>
              <motion.img
                src="/landing page/8f7b356f2d90e34f4f414433044b8a35.jpg"
                alt="Studio fashion image"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }}
                style={{ width: 178, height: 230, objectFit: "cover", borderRadius: 14, border: "2px solid #1E293B", boxShadow: "8px 8px 0px #1E293B", transform: "rotate(7deg)", cursor: "default" }}
              />
            </FloatingElement>

            {/* Bottom-right */}
            <FloatingElement depth={1} style={{ top: "60%", left: "77%" }}>
              <motion.img
                src="/landing page/2f4ecda518463716238bf45fca1bcea3.jpg"
                alt="Fashion lookbook photo"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3 }}
                style={{ width: 215, height: 258, objectFit: "cover", borderRadius: 14, border: "2px solid #1E293B", boxShadow: "8px 8px 0px #1E293B", transform: "rotate(18deg)", cursor: "default" }}
              />
            </FloatingElement>
          </Floating>
        </div>

        {/* Center content */}
        <div style={{ position: "relative", zIndex: 10, textAlign: "center", maxWidth: 660, padding: "0 28px", pointerEvents: "auto" }}>

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            style={{ display: "inline-block", padding: "5px 16px", borderRadius: 9999, background: "#FBBF24", border: "2px solid #1E293B", fontWeight: 700, fontSize: 12, marginBottom: 22, boxShadow: "2px 2px 0 #1E293B", transform: "rotate(-1deg)" }}
          >
            ✦ AI-powered fashion photography
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.3, type: "spring", damping: 28 }}
            style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: "clamp(38px, 6.5vw, 72px)", lineHeight: 1.08, letterSpacing: "-2px", marginBottom: 20, color: "#1E293B" }}
          >
            <span style={{ display: "block" }}>Generate</span>
            <LayoutGroup>
              <motion.span layout style={{ display: "inline-flex", alignItems: "baseline", whiteSpace: "pre", color: "#8B5CF6" }}>
                <TextRotate
                  texts={["model photos,", "catalog shots,", "studio images,", "product photos,", "fashion looks,"]}
                  mainClassName="overflow-hidden pb-1"
                  staggerDuration={0.025}
                  staggerFrom="last"
                  rotationInterval={2800}
                  transition={{ type: "spring", damping: 28, stiffness: 380 }}
                />
              </motion.span>
            </LayoutGroup>
            <span style={{ display: "block" }}>for any garment.</span>
          </motion.h1>

          {/* Subtext */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            style={{ fontSize: 16, color: "#64748B", marginBottom: 32, lineHeight: 1.65, fontWeight: 500 }}
          >
            Upload a flat lay or hanger shot. AI creates studio-quality images in under 60 seconds — no photographer, no studio, no delays.
          </motion.p>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.65 }}
            style={{ display: "flex", gap: 12, justifyContent: "center", alignItems: "center", flexWrap: "wrap", marginBottom: 32 }}
          >
            <CandyButton onClick={() => window.location.href = "/login"} style={{ fontSize: 15, padding: "13px 28px" }}>
              Get Started Free
              <div style={{ background: "#fff", borderRadius: "50%", padding: 3, marginLeft: 8, display: "flex" }}>
                <ArrowRight style={{ width: 14, height: 14, color: "#8B5CF6" }} strokeWidth={3} />
              </div>
            </CandyButton>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#94A3B8" }}>No credit card needed</span>
          </motion.div>

          {/* Social proof */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            style={{ display: "flex", gap: 24, justifyContent: "center", flexWrap: "wrap" }}
          >
            {["500+ fashion brands", "₹0 per shoot", "Ready in 60 seconds"].map((item) => (
              <span key={item} style={{ fontSize: 13, color: "#64748B", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: "#34D399", fontWeight: 900 }}>✓</span> {item}
              </span>
            ))}
          </motion.div>
        </div>
      </div>

      {/* ── Problem ───────────────────────────────────────────── */}
      <section id="problem" style={{ borderTop: "2px solid #1E293B", borderBottom: "2px solid #1E293B", background: "#F0FDF4", padding: "80px 0" }}>
        <div className="lp-wrap" style={{ textAlign: "center" }}>
          <h2 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: "clamp(28px, 4vw, 44px)", letterSpacing: "-1px", marginBottom: 48, display: "inline-block", position: "relative" }}>
            Your photos are holding back your sales
            <svg style={{ position: "absolute", width: "100%", height: 14, bottom: -6, left: 0, color: "#F472B6" }} viewBox="0 0 100 10" preserveAspectRatio="none">
              <path d="M0 5 Q 25 10 50 5 T 100 5" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
            </svg>
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24, marginTop: 56, textAlign: "left" }} className="lp-problem-grid">
            {[
              "A full photoshoot costs ₹15,000–₹50,000 and takes a week to deliver.",
              "Reshoots for new colors, sizes, or seasonal updates double the cost.",
              "Your competitors are publishing daily — you are waiting on a photographer.",
            ].map((text, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                style={{ background: "#fff", padding: "24px 28px", borderRadius: 16, border: "2px solid #1E293B", boxShadow: "4px 4px 0 #1E293B" }}
              >
                <p style={{ fontWeight: 700, fontSize: 16, lineHeight: 1.6 }}>{text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Solution / How it Works ───────────────────────────── */}
      <section id="how-it-works" style={{ padding: "80px 0" }}>
        <div className="lp-wrap">
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <h2 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: "clamp(28px, 4vw, 44px)", letterSpacing: "-1px" }}>
              Three uploads. One click. Done.
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24 }} className="lp-steps-grid">
            {STEPS.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                style={{ textAlign: "center" }}
                className="lp-step-item"
              >
                <div style={{ width: 88, height: 88, borderRadius: "50%", border: "2px solid #1E293B", boxShadow: "4px 4px 0 #1E293B", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", background: step.color, transition: "transform 0.2s" }} className="lp-step-circle">
                  <step.icon style={{ width: 36, height: 36, color: step.textDark ? "#1E293B" : "#fff" }} strokeWidth={2.5} />
                </div>
                <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 16, marginBottom: 8 }}>{i + 1}. {step.title}</h3>
                <p style={{ fontSize: 14, color: "#64748B", lineHeight: 1.6 }}>{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Output Gallery ────────────────────────────────────── */}
      <section style={{ background: "#fff", borderTop: "2px solid #1E293B", borderBottom: "2px solid #1E293B", padding: "80px 0" }}>
        <div className="lp-wrap">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 48, gap: 24, flexWrap: "wrap" }}>
            <div>
              <h2 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: "clamp(24px, 3.5vw, 40px)", letterSpacing: "-1px", marginBottom: 12 }}>
                Every angle. Every variant. Every time.
              </h2>
              <p style={{ fontSize: 17, color: "#64748B", maxWidth: 520 }}>
                One garment upload produces a full set — front, side, back, and detail — ready for any platform.
              </p>
            </div>
            <div style={{ background: "#FBBF24", padding: "8px 18px", borderRadius: 10, border: "2px solid #1E293B", fontWeight: 700, boxShadow: "2px 2px 0 #1E293B", transform: "rotate(2deg)", whiteSpace: "nowrap" }}>
              All included ✨
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }} className="lp-gallery-g">
            {GALLERY.map((img, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.92 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                style={{ position: "relative", borderRadius: 16, border: "2px solid #1E293B", background: img.bg, aspectRatio: i < 3 ? "3/4" : "1/1", boxShadow: "4px 4px 0 #1E293B", overflow: "hidden", transition: "transform 0.2s, box-shadow 0.2s", cursor: "default" }}
                className="lp-gallery-item"
              >
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <ImageIcon style={{ width: 48, height: 48, color: "rgba(30,41,59,0.15)" }} />
                </div>
                <div style={{ position: "absolute", bottom: 14, left: 14, background: "#fff", padding: "4px 12px", borderRadius: 8, border: "2px solid #1E293B", fontSize: 13, fontWeight: 700, boxShadow: "2px 2px 0 #1E293B" }}>
                  {img.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Business Impact ───────────────────────────────────── */}
      <section style={{ padding: "80px 0" }}>
        <div className="lp-wrap">
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <h2 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: "clamp(24px, 3.5vw, 40px)", letterSpacing: "-1px" }}>
              What this means for your business
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 28, paddingTop: 28 }} className="lp-impact-grid">
            <StickerCard title="Save 90% on Photography Costs" icon={DollarSign} delay={0.1} shadowColor="#34D399">
              Traditional shoots average ₹2,000–₹5,000 per garment. Botzudio brings that to a fraction. Keep your budget for inventory, not cameras.
            </StickerCard>
            <StickerCard title="Publish New Products in Hours" icon={Clock} delay={0.2} shadowColor="#FBBF24">
              New collection drop? Upload in the morning, publish by afternoon. Stay ahead of seasonal trends without waiting on a studio calendar.
            </StickerCard>
            <StickerCard title="Test Colors Before Production" icon={CheckCircle} delay={0.3} shadowColor="#F472B6">
              See how a print or color variant looks on a real model before you order a single unit. Cut sampling costs and make smarter production decisions.
            </StickerCard>
          </div>
        </div>
      </section>

      {/* ── Who It's For ─────────────────────────────────────── */}
      <section style={{ background: "#8B5CF6", color: "#fff", borderTop: "2px solid #1E293B", borderBottom: "2px solid #1E293B", padding: "80px 0", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 40, left: 40, width: 32, height: 32, background: "#F472B6", borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", opacity: 0.5 }} />
        <div style={{ position: "absolute", bottom: 60, right: 60, width: 44, height: 44, background: "#FBBF24", borderRadius: "12px 12px 12px 0", border: "2px solid rgba(255,255,255,0.3)", transform: "rotate(45deg)", opacity: 0.5 }} />
        <div className="lp-wrap" style={{ position: "relative", zIndex: 1 }}>
          <h2 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: "clamp(24px, 3.5vw, 40px)", letterSpacing: "-1px", textAlign: "center", marginBottom: 48 }}>
            Built for fashion businesses like yours
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }} className="lp-persona-g">
            {PERSONAS.map((p, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)", padding: "24px 20px", borderRadius: 16, border: "2px solid rgba(255,255,255,0.2)", transition: "background 0.2s" }} className="lp-persona-item">
                <p.icon style={{ width: 32, height: 32, marginBottom: 16, color: "#FBBF24" }} />
                <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 17, marginBottom: 8 }}>{p.title}</h3>
                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", lineHeight: 1.65 }}>{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ───────────────────────────────────────────── */}
      <section id="pricing" style={{ padding: "80px 0", textAlign: "center" }}>
        <div className="lp-wrap">
          <h2 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: "clamp(24px, 3.5vw, 40px)", letterSpacing: "-1px", marginBottom: 16 }}>
            Start free. Scale when you're ready.
          </h2>
          <p style={{ fontSize: 18, color: "#64748B", marginBottom: 56, maxWidth: 520, margin: "0 auto 56px" }}>
            Pricing is simple and usage-based. Start free, pay only when you grow.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24, alignItems: "center" }} className="lp-pricing-g">
            {/* Free */}
            <div style={{ background: "#fff", border: "2px solid #1E293B", borderRadius: 20, padding: "32px 28px", boxShadow: "4px 4px 0 #1E293B", textAlign: "left" }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 8 }}>Starter</p>
              <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: 24, marginBottom: 8 }}>Free</h3>
              <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: 40, letterSpacing: "-1.5px", marginBottom: 24, paddingBottom: 24, borderBottom: "2px solid #E2E8F0" }}>
                ₹0 <span style={{ fontSize: 16, fontWeight: 600, color: "#64748B" }}>/month</span>
              </div>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 12, marginBottom: 28, fontSize: 14 }}>
                <li style={{ display: "flex", gap: 10, alignItems: "center" }}><CheckCircle style={{ width: 18, height: 18, color: "#34D399", flexShrink: 0 }} /> 10 images/month</li>
                <li style={{ display: "flex", gap: 10, alignItems: "center" }}><CheckCircle style={{ width: 18, height: 18, color: "#34D399", flexShrink: 0 }} /> All features unlocked</li>
              </ul>
              <SecondaryButton style={{ width: "100%" }} onClick={() => window.location.href = "/login"}>Get Started</SecondaryButton>
            </div>

            {/* Growth — highlighted */}
            <div style={{ background: "#F5F3FF", border: "2px solid #8B5CF6", borderRadius: 20, padding: "44px 28px 32px", boxShadow: "8px 8px 0 #8B5CF6", textAlign: "left", position: "relative" }}>
              <div style={{ position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)", background: "#FBBF24", color: "#1E293B", fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 12, padding: "4px 18px", borderRadius: 9999, border: "2px solid #1E293B", boxShadow: "2px 2px 0 #1E293B", whiteSpace: "nowrap" }}>
                MOST POPULAR
              </div>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#8B5CF6", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 8 }}>Growth</p>
              <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: 24, marginBottom: 8 }}>Active Sellers</h3>
              <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: 40, letterSpacing: "-1.5px", marginBottom: 24, paddingBottom: 24, borderBottom: "2px solid #DDD6FE" }}>
                ₹2,999 <span style={{ fontSize: 16, fontWeight: 600, color: "#64748B" }}>/month</span>
              </div>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 12, marginBottom: 28, fontSize: 14 }}>
                <li style={{ display: "flex", gap: 10, alignItems: "center" }}><CheckCircle style={{ width: 18, height: 18, color: "#8B5CF6", flexShrink: 0 }} /> 200 images/month</li>
                <li style={{ display: "flex", gap: 10, alignItems: "center" }}><CheckCircle style={{ width: 18, height: 18, color: "#8B5CF6", flexShrink: 0 }} /> Priority generation</li>
              </ul>
              <CandyButton style={{ width: "100%" }} onClick={() => window.location.href = "/login"}>Start Generating</CandyButton>
            </div>

            {/* Scale */}
            <div style={{ background: "#fff", border: "2px solid #1E293B", borderRadius: 20, padding: "32px 28px", boxShadow: "4px 4px 0 #1E293B", textAlign: "left" }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 8 }}>Enterprise</p>
              <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: 24, marginBottom: 8 }}>Scale</h3>
              <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: 40, letterSpacing: "-1.5px", marginBottom: 24, paddingBottom: 24, borderBottom: "2px solid #E2E8F0" }}>
                Custom
              </div>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 12, marginBottom: 28, fontSize: 14 }}>
                <li style={{ display: "flex", gap: 10, alignItems: "center" }}><CheckCircle style={{ width: 18, height: 18, color: "#34D399", flexShrink: 0 }} /> Unlimited images</li>
                <li style={{ display: "flex", gap: 10, alignItems: "center" }}><CheckCircle style={{ width: 18, height: 18, color: "#34D399", flexShrink: 0 }} /> Dedicated support</li>
              </ul>
              <SecondaryButton style={{ width: "100%" }}>Contact Sales</SecondaryButton>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────── */}
      <section style={{ background: "#F1F5F9", borderTop: "2px solid #1E293B", borderBottom: "2px solid #1E293B", padding: "80px 0" }}>
        <div className="lp-wrap-sm">
          <h2 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: "clamp(24px, 3vw, 36px)", letterSpacing: "-0.8px", textAlign: "center", marginBottom: 40 }}>
            Frequently Asked Questions
          </h2>
          <div style={{ display: "flex", flexDirection: "column", border: "2.5px solid #1E293B", borderRadius: 16, overflow: "hidden", boxShadow: "4px 4px 0 #1E293B" }}>
            {FAQS.map((faq, i) => {
              const isOpen = openFaqs.has(i);
              return (
                <div key={i} style={{ background: "#fff", borderBottom: i < FAQS.length - 1 ? "2px solid #1E293B" : "none" }}>
                  <button
                    onClick={() => toggleFaq(i)}
                    style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", background: "none", border: "none", cursor: "pointer", textAlign: "left", gap: 12 }}
                  >
                    <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 16, color: "#1E293B", margin: 0 }}>{faq.q}</h3>
                    <ChevronDown size={18} style={{ flexShrink: 0, color: "#64748B", transition: "transform 0.3s", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }} />
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key="answer"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
                        style={{ overflow: "hidden" }}
                      >
                        <p style={{ fontSize: 14, color: "#64748B", lineHeight: 1.7, padding: "0 24px 20px" }}>{faq.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────── */}
      <section style={{ padding: "96px 0", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "30%", left: "50%", transform: "translate(-50%, -50%)", width: 480, height: 480, borderRadius: "50%", background: "radial-gradient(circle, rgba(251,191,36,0.3) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div className="lp-wrap-md" style={{ position: "relative", zIndex: 1 }}>
          <h2 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: "clamp(32px, 5vw, 56px)", letterSpacing: "-1.5px", lineHeight: 1.1, marginBottom: 20 }}>
            Your next product launch<br />doesn't need a photoshoot.
          </h2>
          <p style={{ fontSize: 20, color: "#64748B", marginBottom: 40, fontWeight: 500 }}>
            Create your first image in under 5 minutes — free.
          </p>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <CandyButton style={{ fontSize: 18, padding: "18px 48px" }} onClick={() => window.location.href = "/login"}>
              Start Generating Free
            </CandyButton>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#94A3B8" }}>
              No credit card. No setup. Cancel anytime.
            </p>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="lp-footer" style={{ overflow: "visible" }}>
        <div className="lp-footer-inner">
          <div className="lp-footer-top">
            {/* Brand */}
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
                <a href="https://twitter.com" target="_blank" rel="noreferrer" aria-label="Twitter">𝕏</a>
                <a href="https://linkedin.com" target="_blank" rel="noreferrer" aria-label="LinkedIn">in</a>
              </div>
            </div>

            {/* Product */}
            <div className="lp-footer-col">
              <h4>Product</h4>
              <ul>
                <li><a href="#problem">Why Us</a></li>
                <li><a href="#how-it-works">How it works</a></li>
                <li><a href="#pricing">Pricing</a></li>
              </ul>
            </div>

            {/* Company */}
            <div className="lp-footer-col">
              <h4>Company</h4>
              <ul>
                <li><a href="https://thebotcompany.in" target="_blank" rel="noreferrer">About</a></li>
                <li><a href="/terms">Terms &amp; Conditions</a></li>
                <li><a href="mailto:official@thebotcompany.in">Contact</a></li>
              </ul>
            </div>

            {/* AI Tools */}
            <div className="lp-footer-col">
              <h4>AI Tools</h4>
              <ul>
                <li><a href="https://markbot.in" target="_blank" rel="noreferrer">MarkBot</a></li>
              </ul>
            </div>
          </div>

          <div className="lp-footer-wordmark" aria-hidden="true">Botzudio</div>

          <div className="lp-footer-bottom">
            <span>© {new Date().getFullYear()} The Bot Company. All rights reserved.</span>
            <span>
              <a href="/terms" style={{ marginRight: 16 }}>Terms &amp; Conditions</a>
              Built with ❤️ by{" "}
              <a href="https://thebotcompany.in" target="_blank" rel="noreferrer">thebotcompany</a>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
