import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { useState } from "react";
import { DottedSurface } from "../components/ui/dotted-surface";
import { ArrowRight, CheckCircle, Sparkles, DollarSign, Clock, Store, ShoppingBag, ShieldCheck, ChevronDown } from "lucide-react";
import { CandyButton, SecondaryButton, StickerCard } from "./ThemeComponents";
import { Floating, FloatingElement } from "./parallax-floating";
import { TextRotate } from "./text-rotate";
import { FullScreenScrollFX } from "../components/ui/full-screen-scroll-fx";
import { CinematicFooter } from "../components/ui/motion-footer";

const GALLERY = [
  { label: "Front View", bg: "#EDE9FE", src: "/landing page/front.jpg" },
  { label: "Back View", bg: "#D1FAE5", src: "/landing page/back.png" },
  { label: "Close-up Detail", bg: "#FEF3C7", src: "/landing page/detial.png" },
];


const FAQS = [
  { q: "Do I need good photography skills?", a: "No. A phone photo of the garment on a hanger or flat on a table is enough." },
  { q: "What if the image doesn't look right?", a: 'You can type a correction — "make the background lighter" or "adjust the sleeve drape" — and regenerate in seconds.' },
  { q: "Does it work for ethnic and traditional wear?", a: "Yes. The platform has a dedicated workflow for sarees, lehengas, and similar styles." },
  { q: "Do I own the images I generate?", a: "Yes. Every image you generate is yours to use commercially." },
  { q: "What image formats and sizes do I get?", a: "Outputs are high-resolution (1080×1440px), suitable for all major e-commerce platforms." },
];

const PROCESS = "/landing page/process/";

const RIGHT_NUM: React.CSSProperties = {
  fontWeight: 900, lineHeight: 1, letterSpacing: "-3px",
  fontFamily: "'Outfit', sans-serif",
  fontSize: "clamp(3rem, 7vw, 5.5rem)",
};

const RIGHT_DESC: React.CSSProperties = {
  fontSize: 12, maxWidth: 150, marginTop: 10, lineHeight: 1.65,
  fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 500,
  color: "#64748B", textTransform: "none" as const,
};

const HOW_IT_WORKS_SECTIONS = [
  {
    id: "upload-garment",
    background: `${PROCESS}garment1.png`,
    leftLabel: (
      <img src={`${PROCESS}garment1.png`} alt="Garment" style={{ width: 150, height: 200, objectFit: "cover" as const, borderRadius: 10 }} />
    ),
    title: "Upload Garment",
    rightLabel: (
      <div style={{ textAlign: "right" as const, textTransform: "none" as const }}>
        <div style={{ ...RIGHT_NUM, color: "#D97706" }}>01</div>
        <div style={RIGHT_DESC}>Flat lay or hanger shot — phone camera works perfectly</div>
      </div>
    ),
  },
  {
    id: "add-references",
    background: `${PROCESS}modelpose1.png`,
    leftLabel: (
      <img src={`${PROCESS}modelpose1.png`} alt="Model pose reference" style={{ width: 120, height: 160, objectFit: "cover" as const, borderRadius: 10 }} />
    ),
    title: "Add References",
    rightLabel: (
      <div style={{ textAlign: "right" as const, textTransform: "none" as const }}>
        <div style={{ ...RIGHT_NUM, color: "#EC4899" }}>02</div>
        <div style={RIGHT_DESC}>Pick pose &amp; model type from presets</div>
      </div>
    ),
  },
  {
    id: "ai-generates",
    background: `${PROCESS}out1.png`,
    leftLabel: (
      <img src={`${PROCESS}out1.png`} alt="AI output" style={{ width: 120, height: 160, objectFit: "cover" as const, borderRadius: 10 }} />
    ),
    title: "AI Creates",
    rightLabel: (
      <div style={{ textAlign: "right" as const, textTransform: "none" as const }}>
        <div style={{ ...RIGHT_NUM, color: "#8B5CF6" }}>03</div>
        <div style={RIGHT_DESC}>Studio-quality image rendered in under 60 seconds</div>
      </div>
    ),
  },
  {
    id: "download-all",
    background: `${PROCESS}out3.png`,
    leftLabel: (
      <div style={{ display: "flex", gap: 8 }}>
        {[
          { src: `${PROCESS}out2.png`, alt: "Back" },
          { src: `${PROCESS}out3.png`, alt: "Detail" },
        ].map(({ src, alt }) => (
          <img key={alt} src={src} alt={alt} style={{ width: 88, height: 118, objectFit: "cover" as const, borderRadius: 10 }} />
        ))}
      </div>
    ),
    title: "Download All",
    rightLabel: (
      <div style={{ textAlign: "right" as const, textTransform: "none" as const }}>
        <div style={{ ...RIGHT_NUM, color: "#10B981" }}>04</div>
        <div style={RIGHT_DESC}>Front, back &amp; detail — ready to publish anywhere</div>
      </div>
    ),
  },
];

export function LandingPageTheme() {
  const [openFaqs, setOpenFaqs] = useState<Set<number>>(() => new Set(FAQS.map((_, i) => i)));
  const toggleFaq = (i: number) => setOpenFaqs(prev => { const next = new Set(prev); next.has(i) ? next.delete(i) : next.add(i); return next; });

  return (
    <>
    <div style={{ background: "#FFFDF5", color: "#1E293B", fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <div style={{ position: "relative", minHeight: "100vh", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", background: "radial-gradient(ellipse 80% 70% at 0% 0%, rgba(139,92,246,0.20) 0%, transparent 55%), radial-gradient(ellipse 60% 60% at 100% 100%, rgba(244,114,182,0.16) 0%, transparent 55%), #FFFDF5" }}>

        {/* Animated dotted surface — sits behind everything */}
        <DottedSurface style={{ zIndex: 0 }} dotColor="#1E293B" opacity={0.18} />

        {/* Floating parallax images — hidden on small screens */}
        <div className="lp-hero-floats">
          <Floating sensitivity={-0.5}>
            {/* Left col — top (fills top-left white space) */}
            <FloatingElement depth={0.5} style={{ top: "2%", left: "4%" }}>
              <motion.img
                src="/landing page/4417001374546c18d8184e34a2628be3.jpg"
                alt="Fashion garment"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                style={{ width: 138, height: 188, objectFit: "cover", borderRadius: 14, border: "2px solid #1E293B", boxShadow: "6px 6px 0px #1E293B", transform: "rotate(-3deg)", cursor: "default" }}
              />
            </FloatingElement>

            {/* Left col — middle (fills mid-left white space) */}
            <FloatingElement depth={1.2} style={{ top: "27%", left: "6%" }}>
              <motion.img
                src="/landing page/c3c201a57b31a5ff575ddd0b9e6348b3.jpg"
                alt="Fashion catalog shot"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
                style={{ width: 210, height: 275, objectFit: "cover", borderRadius: 14, border: "2px solid #1E293B", boxShadow: "8px 8px 0px #1E293B", transform: "rotate(-5deg)", cursor: "default" }}
              />
            </FloatingElement>

            {/* Left col — bottom (fills bottom-left white space) */}
            <FloatingElement depth={3} style={{ top: "64%", left: "3%" }}>
              <motion.img
                src="/landing page/9f299fb22eb98fc34353fd7eb1d60dea.jpg"
                alt="Fashion product photo"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
                style={{ width: 220, height: 220, objectFit: "cover", borderRadius: 14, border: "2px solid #1E293B", boxShadow: "8px 8px 0px #1E293B", transform: "rotate(-3deg)", cursor: "default" }}
              />
            </FloatingElement>

            {/* Right col — top (fills top-right white space) */}
            <FloatingElement depth={2} style={{ top: "3%", left: "78%" }}>
              <motion.img
                src="/landing page/8f7b356f2d90e34f4f414433044b8a35.jpg"
                alt="Studio fashion image"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }}
                style={{ width: 222, height: 288, objectFit: "cover", borderRadius: 14, border: "2px solid #1E293B", boxShadow: "8px 8px 0px #1E293B", transform: "rotate(6deg)", cursor: "default" }}
              />
            </FloatingElement>

            {/* Right col — bottom (no overlap with top-right image) */}
            <FloatingElement depth={1} style={{ top: "53%", left: "73%" }}>
              <motion.img
                src="/landing page/2f4ecda518463716238bf45fca1bcea3.jpg"
                alt="Fashion lookbook photo"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3 }}
                style={{ width: 240, height: 290, objectFit: "cover", borderRadius: 14, border: "2px solid #1E293B", boxShadow: "8px 8px 0px #1E293B", transform: "rotate(8deg)", cursor: "default" }}
              />
            </FloatingElement>
          </Floating>
        </div>

        {/* Mobile top images — fills white space above text (desktop uses lp-hero-floats) */}
        <div className="lp-mobile-top-images">
          <img src="/landing page/c3c201a57b31a5ff575ddd0b9e6348b3.jpg" alt="Fashion" />
          <img src="/landing page/8f7b356f2d90e34f4f414433044b8a35.jpg" alt="Fashion" />
        </div>

        {/* Center content */}
        <div className="lp-hero-content" style={{ position: "relative", zIndex: 10, textAlign: "center", maxWidth: 660, padding: "0 28px", pointerEvents: "auto" }}>

          {/* Brand lockup */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 24 }}
          >
            <div className="lp-nav-bz" style={{ width: 44, height: 44, fontSize: 14, borderRadius: 12, flexShrink: 0 }}>BZ</div>
            <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: 26, letterSpacing: "-0.5px", color: "#1E293B" }}>Botzudio</span>
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
          </motion.div>

        </div>

        {/* Mobile bottom images — fills white space below text */}
        <div className="lp-mobile-bottom-images">
          <img src="/landing page/4417001374546c18d8184e34a2628be3.jpg" alt="Fashion" />
          <img src="/landing page/9f299fb22eb98fc34353fd7eb1d60dea.jpg" alt="Fashion" />
          <img src="/landing page/2f4ecda518463716238bf45fca1bcea3.jpg" alt="Fashion" />
        </div>
      </div>

      {/* ── Problem ───────────────────────────────────────────── */}
      <section id="problem" style={{ borderTop: "2px solid #1E293B", borderBottom: "2px solid #1E293B", background: "#F0FDF4", padding: "80px 0" }}>
        <div className="lp-wrap" style={{ textAlign: "center" }}>
          <motion.h2
            style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: "clamp(28px, 4vw, 44px)", letterSpacing: "-1px", marginBottom: 48, display: "inline-block", position: "relative" }}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Your photos are holding back your sales
            <svg style={{ position: "absolute", width: "100%", height: 14, bottom: -6, left: 0, color: "#F472B6" }} viewBox="0 0 100 10" preserveAspectRatio="none">
              <motion.path
                d="M0 5 Q 25 10 50 5 T 100 5"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                whileInView={{ pathLength: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1, ease: "easeInOut", delay: 0.4 }}
              />
            </svg>
          </motion.h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24, marginTop: 56, textAlign: "left" }} className="lp-problem-grid">
            {[
              { text: "A full photoshoot costs ₹15,000–₹50,000 and takes a week to deliver.", accent: "#F472B6" },
              { text: "Reshoots for new colors, sizes, or seasonal updates double the cost.", accent: "#FBBF24" },
              { text: "Your competitors are publishing daily — you are waiting on a photographer.", accent: "#8B5CF6" },
            ].map(({ text, accent }, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12, type: "spring", damping: 22, stiffness: 260 }}
                whileHover={{ y: -8, boxShadow: "8px 8px 0 #1E293B", transition: { type: "spring", damping: 18, stiffness: 320 } }}
                style={{ background: "#fff", padding: "24px 28px", borderRadius: 16, border: "2px solid #1E293B", boxShadow: "4px 4px 0 #1E293B", cursor: "default", position: "relative", overflow: "hidden" }}
              >
                <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: 4, background: accent, borderRadius: "16px 16px 0 0" }} />
                <p style={{ fontWeight: 700, fontSize: 16, lineHeight: 1.6, marginTop: 8 }}>{text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works — Full-Screen Scroll Experience ─────── */}
      <section id="how-it-works" style={{ background: "#FFFDF5", borderTop: "2px solid #1E293B", borderBottom: "2px solid #1E293B" }}>
        {/* Intro header above the scroll */}
        <div style={{ padding: "72px 28px 36px", textAlign: "center", background: "#FFFDF5" }}>
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            style={{
              display: "inline-block",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.18em",
              color: "#8B5CF6",
              textTransform: "uppercase",
              marginBottom: 20,
              padding: "5px 18px",
              background: "rgba(139,92,246,0.08)",
              borderRadius: 20,
              border: "1px solid rgba(139,92,246,0.22)",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            How It Works
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 900,
              fontSize: "clamp(28px, 4vw, 52px)",
              letterSpacing: "-1.5px",
              color: "#1E293B",
              lineHeight: 1.1,
              marginBottom: 14,
            }}
          >
            Three uploads. One click. Done.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.25 }}
            style={{
              color: "#94A3B8",
              fontSize: 14,
              fontWeight: 500,
              letterSpacing: "0.04em",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            Scroll to explore each step ↓
          </motion.p>
        </div>

        <FullScreenScrollFX
          sections={HOW_IT_WORKS_SECTIONS}
          showProgress
          bgTransition="fade"
          durations={{ change: 0.65, snap: 700 }}
          parallaxAmount={3}
          gridPaddingX={3}
          colors={{
            text: "#1E293B",
            overlay: "linear-gradient(to right, rgba(255,253,245,0.92) 0%, rgba(255,253,245,0.55) 22%, rgba(255,253,245,0.12) 42%, rgba(255,253,245,0.12) 58%, rgba(255,253,245,0.55) 78%, rgba(255,253,245,0.92) 100%), linear-gradient(to bottom, rgba(255,253,245,0.65) 0%, rgba(255,253,245,0.05) 20%, rgba(255,253,245,0.05) 80%, rgba(255,253,245,0.65) 100%)",
            pageBg: "#FFFDF5",
            stageBg: "transparent",
          }}
          ariaLabel="How Botzudio works — step by step"
        />
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
                <img
                  src={img.src}
                  alt={img.label}
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
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
      <section style={{ background: "#FFFDF5", borderTop: "2px solid #1E293B", borderBottom: "2px solid #1E293B", padding: "80px 0" }}>
        <div className="lp-wrap">
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#8B5CF6", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 12 }}>✦ Who it's for</p>
            <h2 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: "clamp(24px, 3.5vw, 40px)", letterSpacing: "-1px", color: "#1E293B", marginBottom: 14 }}>
              Built for every kind of fashion business
            </h2>
            <p style={{ fontSize: 16, color: "#64748B", maxWidth: 480, margin: "0 auto" }}>
              Whether you're selling on Myntra or running your own D2C brand — Botzudio fits your workflow.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gridAutoRows: "1fr", gap: 24 }} className="lp-persona-g">
            {[
              {
                icon: Store, bg: "#ECFDF5", border: "#34D399", shadow: "#34D399",
                tag: "D2C & Catalog",
                title: "D2C Fashion Brands",
                stat: "Save ₹20,000+", statLabel: "per shoot",
                desc: "Generate a full catalog image set without a photography budget. Upload flat lays, get studio-quality model photos.",
              },
              {
                icon: ShoppingBag, bg: "#F5F3FF", border: "#8B5CF6", shadow: "#8B5CF6",
                tag: "Myntra · Meesho · Flipkart",
                title: "Marketplace Sellers",
                stat: "1080×1440px", statLabel: "platform-ready",
                desc: "Meet platform image requirements at volume, fast. All outputs are marketplace-ready — right size, right format.",
              },
              {
                icon: Sparkles, bg: "#FFF0F9", border: "#F472B6", shadow: "#F472B6",
                tag: "Small Studios",
                title: "Boutiques & Designers",
                stat: "Under 60s", statLabel: "per image",
                desc: "Present new designs professionally without a full production setup. Launch new collections the same day you design them.",
              },
              {
                icon: ShieldCheck, bg: "#FFFBEB", border: "#FBBF24", shadow: "#FBBF24",
                tag: "Sarees · Lehengas · Kurtas",
                title: "Ethnic Wear Brands",
                stat: "Dedicated", statLabel: "ethnic workflow",
                desc: "Specialized support for sarees, lehengas, and traditional styles — drape, dupatta, and all details preserved.",
              },
            ].map((p, i) => (
              <div
                key={i}
                style={{
                  background: "#fff",
                  border: "2px solid #1E293B",
                  borderRadius: 20,
                  padding: "28px 28px 24px",
                  boxShadow: `5px 5px 0 ${p.shadow}`,
                  display: "flex",
                  gap: 20,
                  alignItems: "flex-start",
                  transition: "transform .18s, box-shadow .18s",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.transform = "translate(-2px,-2px)";
                  (e.currentTarget as HTMLElement).style.boxShadow = `7px 7px 0 ${p.shadow}`;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.transform = "translate(0,0)";
                  (e.currentTarget as HTMLElement).style.boxShadow = `5px 5px 0 ${p.shadow}`;
                }}
              >
                {/* Icon block */}
                <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                  <div style={{ background: p.bg, border: `2px solid ${p.border}`, borderRadius: 14, padding: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <p.icon style={{ width: 28, height: 28, color: p.border }} strokeWidth={2} />
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: 18, color: "#1E293B", lineHeight: 1 }}>{p.stat}</div>
                    <div style={{ fontSize: 10, color: "#64748B", fontWeight: 600, whiteSpace: "nowrap" }}>{p.statLabel}</div>
                  </div>
                </div>

                {/* Text block */}
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: p.border, textTransform: "uppercase", letterSpacing: "0.8px", background: p.bg, padding: "2px 8px", borderRadius: 4, display: "inline-block", marginBottom: 8 }}>
                    {p.tag}
                  </span>
                  <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: 19, color: "#1E293B", marginBottom: 8, letterSpacing: "-0.3px" }}>
                    {p.title}
                  </h3>
                  <p style={{ fontSize: 14, color: "#64748B", lineHeight: 1.65 }}>{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ───────────────────────────────────────────── */}
      <section id="pricing" style={{ padding: "80px 0", textAlign: "center" }}>
        <div className="lp-wrap">
          <h2 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: "clamp(24px, 3.5vw, 40px)", letterSpacing: "-1px", marginBottom: 16 }}>
            Pay per image. No subscription.
          </h2>
          <p style={{ fontSize: 17, color: "#64748B", maxWidth: 520, margin: "0 auto 0" }}>
            Buy credits once, use them anytime. Credits never expire.<br />Sign up free — 30 credits, no card needed.
          </p>

          {/* Model cost table */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, maxWidth: 720, margin: "32px auto 40px", background: "#fff", border: "2px solid #E2E8F0", borderRadius: 16, overflow: "hidden" }}>
            {[
              { name: "Flash",  note: "5 cr/img"    },
              { name: "ProMax", note: "20 cr/img"   },
              { name: "Plus",   note: "15 cr/set"   },
              { name: "Pro",    note: "6–25 cr/img" },
            ].map((m, i) => (
              <div key={m.name} style={{ padding: "14px 12px", borderRight: i < 3 ? "1.5px solid #E2E8F0" : "none", textAlign: "center" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, marginBottom: 6 }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#8B5CF6", flexShrink: 0 }} />
                  <span style={{ fontWeight: 700, color: "#1E293B", fontSize: 13 }}>{m.name}</span>
                </div>
                <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 15, color: "#7C3AED" }}>{m.note}</div>
              </div>
            ))}
          </div>

          {/* Credit packs grid — 3 cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24, alignItems: "stretch" }} className="lp-pricing-g">

            {/* Basic */}
            <div style={{ background: "#fff", border: "2px solid #1E293B", borderRadius: 20, padding: "32px 26px", boxShadow: "4px 4px 0 #1E293B", textAlign: "left", display: "flex", flexDirection: "column" }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 6 }}>Pack 1</p>
              <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: 24, marginBottom: 6 }}>Basic</h3>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: 40, letterSpacing: "-1.5px", lineHeight: 1 }}>₹299</span>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: 15, color: "#94A3B8", textDecoration: "line-through", lineHeight: 1 }}>₹499</span>
                  <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 11, color: "#059669", background: "#ECFDF5", border: "1px solid #6EE7B7", borderRadius: 4, padding: "1px 6px", lineHeight: 1.4 }}>Save 40%</span>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", background: "#F1F5F9", borderRadius: 8, padding: "5px 14px" }}>
                  <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: 22, lineHeight: 1, color: "#1E293B" }}>300</span>
                  <span style={{ fontSize: 10, color: "#64748B", fontWeight: 600 }}>credits</span>
                </div>
                <span style={{ fontSize: 12, color: "#64748B", lineHeight: 1.5 }}>one-time<br/>never expires</span>
              </div>
              <div style={{ borderTop: "1.5px solid #E2E8F0", paddingTop: 16, marginBottom: 16 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 12 }}>What you can generate</p>
                {[
                  { model: "Flash",   count: "~60 images",   cost: "5 cr each"    },
                  { model: "ProMax",  count: "~15 images",   cost: "20 cr each"   },
                  { model: "Plus",    count: "~20 sets",     cost: "15 cr/set"    },
                  { model: "Pro",     count: "12–50 images", cost: "6–25 cr each" },
                ].map(r => (
                  <div key={r.model} style={{ display: "flex", alignItems: "center", fontSize: 13, marginBottom: 9 }}>
                    <span style={{ fontWeight: 700, color: "#1E293B", minWidth: 60 }}>{r.model}</span>
                    <span style={{ color: "#8B5CF6", fontWeight: 700, flex: 1 }}>{r.count}</span>
                    <span style={{ fontSize: 11, color: "#94A3B8" }}>{r.cost}</span>
                  </div>
                ))}
              </div>
              <SecondaryButton style={{ width: "100%", marginTop: "auto" }} onClick={() => window.location.href = "/login"}>Buy 300 Credits →</SecondaryButton>
            </div>

            {/* Growth — highlighted */}
            <div style={{ background: "#F5F3FF", border: "2px solid #8B5CF6", borderRadius: 20, padding: "46px 26px 32px", boxShadow: "8px 8px 0 #8B5CF6", textAlign: "left", position: "relative", display: "flex", flexDirection: "column" }}>
              <div style={{ position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)", background: "#FBBF24", color: "#1E293B", fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 11, padding: "4px 16px", borderRadius: 9999, border: "2px solid #1E293B", boxShadow: "2px 2px 0 #1E293B", whiteSpace: "nowrap" }}>
                MOST POPULAR
              </div>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#8B5CF6", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 6 }}>Most Popular</p>
              <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: 24, marginBottom: 6 }}>Growth</h3>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: 40, letterSpacing: "-1.5px", lineHeight: 1 }}>₹999</span>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: 15, color: "#C4B5FD", textDecoration: "line-through", lineHeight: 1 }}>₹1,499</span>
                  <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 11, color: "#7C3AED", background: "#EDE9FE", border: "1px solid #C4B5FD", borderRadius: 4, padding: "1px 6px", lineHeight: 1.4 }}>Save 33%</span>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", background: "#EDE9FE", borderRadius: 8, padding: "5px 14px" }}>
                  <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: 22, lineHeight: 1, color: "#7C3AED" }}>1000</span>
                  <span style={{ fontSize: 10, color: "#7C3AED", fontWeight: 600 }}>credits</span>
                </div>
                <span style={{ fontSize: 12, color: "#64748B", lineHeight: 1.5 }}>one-time<br/>never expires</span>
              </div>
              <div style={{ borderTop: "1.5px solid #DDD6FE", paddingTop: 16, marginBottom: 16 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#7C3AED", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 12 }}>What you can generate</p>
                {[
                  { model: "Flash",  count: "~200 images",  cost: "5 cr each"    },
                  { model: "ProMax", count: "~50 images",   cost: "20 cr each"   },
                  { model: "Plus",   count: "~66 sets",     cost: "15 cr/set"    },
                  { model: "Pro",    count: "40–166 images",cost: "6–25 cr each" },
                ].map(r => (
                  <div key={r.model} style={{ display: "flex", alignItems: "center", fontSize: 13, marginBottom: 9 }}>
                    <span style={{ fontWeight: 700, color: "#1E293B", minWidth: 60 }}>{r.model}</span>
                    <span style={{ color: "#7C3AED", fontWeight: 700, flex: 1 }}>{r.count}</span>
                    <span style={{ fontSize: 11, color: "#7C3AED", opacity: 0.7 }}>{r.cost}</span>
                  </div>
                ))}
              </div>
              <CandyButton style={{ width: "100%", marginTop: "auto" }} onClick={() => window.location.href = "/login"}>Buy 1000 Credits →</CandyButton>
            </div>

            {/* Enterprise — amber/warm theme */}
            <div style={{ background: "linear-gradient(145deg, #FFFBEB 0%, #FEF3C7 100%)", border: "2px solid #D97706", borderRadius: 20, padding: "32px 26px", boxShadow: "4px 4px 0 #D97706", textAlign: "left", display: "flex", flexDirection: "column" }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#B45309", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 6 }}>Enterprise</p>
              <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: 24, marginBottom: 4, color: "#1E293B" }}>Custom Credits</h3>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: 36, letterSpacing: "-1px", lineHeight: 1, color: "#1E293B" }}>Volume</span>
                <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: 36, letterSpacing: "-1px", lineHeight: 1, color: "#D97706" }}>pricing</span>
              </div>
              <p style={{ fontSize: 13, color: "#78350F", marginBottom: 20, fontWeight: 500 }}>Buy in bulk · 1 credit = ₹1 or less</p>
              <div style={{ borderTop: "1.5px solid #FDE68A", paddingTop: 16, marginBottom: 16 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#92400E", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 12 }}>What's included</p>
                {[
                  "All 4 models unlocked",
                  "Bulk credit discount",
                  "Dedicated account manager",
                  "Priority generation queue",
                ].map(item => (
                  <div key={item} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, marginBottom: 9, color: "#1E293B" }}>
                    <span style={{ color: "#D97706", fontWeight: 800, fontSize: 15, lineHeight: 1 }}>✦</span>
                    <span style={{ fontWeight: 600 }}>{item}</span>
                  </div>
                ))}
              </div>
              <a
                href="mailto:bot@thebotcompany.in"
                style={{ display: "block", width: "100%", marginTop: "auto", background: "#D97706", color: "#fff", fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 15, textAlign: "center", padding: "14px 0", borderRadius: 12, border: "2px solid #92400E", boxShadow: "3px 3px 0 #92400E", textDecoration: "none", cursor: "pointer", boxSizing: "border-box" }}
              >
                Contact Sales →
              </a>
            </div>

          </div>

          <p style={{ marginTop: 32, fontSize: 14, color: "#94A3B8", textAlign: "center" }}>
            Credits are shared across all features — image generation, prints, and try-on. No subscription. No monthly renewal. Buy once, use anytime.
          </p>
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

    </div>

    <CinematicFooter />
    </>
  );
}
