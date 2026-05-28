import { useParams, Link, Navigate } from "react-router-dom";
import { Nav } from "./Nav";
import { CinematicFooter } from "../components/ui/motion-footer";
import { Check, X, Minus, ArrowRight, Trophy, Zap, Camera, Star } from "lucide-react";

type Cell = "yes" | "no" | "partial";

interface CompData {
  name: string;
  url: string;
  category: string;
  tagColor: string;
  tagBg: string;
  startingPrice: string;
  pricingModel: string;
  verdict: string;
  verdictPoints: string[];
  strengths: string[];
  weaknesses: string[];
  features: { label: string; us: Cell; them: Cell; note?: string }[];
  useCases: { title: string; winner: "us" | "them"; why: string }[];
}

const DATA: Record<string, CompData> = {
  "vs-botika": {
    name: "Botika",
    url: "botika.online",
    category: "AI Fashion Photography",
    tagColor: "#7C3AED",
    tagBg: "#EDE9FE",
    startingPrice: "$49",
    pricingModel: "Monthly subscription",
    verdict:
      "Botika is solid for western garments but misses virtual try-on, Indian diversity, and pay-per-use flexibility.",
    verdictPoints: [
      "No virtual try-on — cannot place any garment on an existing person's photo",
      "Subscription-only: pay $49/mo even if you generate nothing",
      "Almost no South Asian / Indian model options or ethnic wear support",
    ],
    strengths: [
      "Decent garment accuracy for western clothing",
      "Clean UI for non-technical users",
    ],
    weaknesses: [
      "No virtual garment try-on",
      "Zero Indian model diversity",
      "No ethnic wear: sarees, kurtas, sherwanis not supported",
      "Credits expire monthly",
      "Older image pipeline vs. FLUX Pro",
    ],
    features: [
      { label: "AI Fashion Model Photography", us: "yes", them: "yes" },
      { label: "Virtual Garment Try-On", us: "yes", them: "no" },
      { label: "Indian / South Asian Models", us: "yes", them: "partial" },
      { label: "Ethnic Wear – Kurtas, Sarees, Sherwanis", us: "yes", them: "no" },
      { label: "FLUX Pro Image Pipeline", us: "yes", them: "no" },
      { label: "Pay-Per-Use – No Subscription", us: "yes", them: "no" },
      { label: "Credits Roll Over", us: "yes", them: "no" },
      { label: "Results in < 60 Seconds", us: "yes", them: "partial" },
      { label: "Catalog-Scale (100+ images)", us: "yes", them: "partial" },
      { label: "Free Trial", us: "yes", them: "partial" },
    ],
    useCases: [
      {
        title: "Indian D2C fashion brand",
        winner: "us",
        why: "Botzudio supports Indian model diversity and ethnic wear out of the box — Botika has no equivalent.",
      },
      {
        title: "Western womenswear catalog",
        winner: "us",
        why: "Both work, but Botzudio's FLUX Pro pipeline produces higher fidelity and you only pay per image.",
      },
      {
        title: "Virtual try-on for product pages",
        winner: "us",
        why: "Botika has no try-on feature. Botzudio places any garment on any uploaded photo in seconds.",
      },
    ],
  },

  "vs-pebblely": {
    name: "Pebblely",
    url: "pebblely.com",
    category: "AI Product Photography",
    tagColor: "#16A34A",
    tagBg: "#DCFCE7",
    startingPrice: "$19",
    pricingModel: "Monthly subscription",
    verdict:
      "Pebblely is a background-replacement tool — it has zero fashion model photography capability.",
    verdictPoints: [
      "Completely different product: replaces backgrounds, not models",
      "Cannot generate or place a garment on a human model in any way",
      "Not fashion-specific — same tool for furniture, food, and electronics",
    ],
    strengths: [
      "Fast accurate background replacement",
      "Good for flat-lay product photography",
    ],
    weaknesses: [
      "No human model photography at all",
      "Cannot produce model catalog images",
      "Not trained on fashion data",
      "Subscription required even for light usage",
      "Zero Indian or ethnic wear support",
    ],
    features: [
      { label: "AI Fashion Model Photography", us: "yes", them: "no" },
      { label: "Virtual Garment Try-On", us: "yes", them: "no" },
      { label: "Background Generation", us: "partial", them: "yes" },
      { label: "Indian / South Asian Models", us: "yes", them: "no" },
      { label: "Ethnic Wear Support", us: "yes", them: "no" },
      { label: "Pay-Per-Use", us: "yes", them: "partial" },
      { label: "FLUX Pro Pipeline", us: "yes", them: "no" },
      { label: "Results in < 60 Seconds", us: "yes", them: "yes" },
      { label: "Catalog-Scale Production", us: "yes", them: "partial" },
      { label: "Free Trial", us: "yes", them: "yes" },
    ],
    useCases: [
      {
        title: "Catalog with models wearing clothes",
        winner: "us",
        why: "Pebblely cannot generate model images at all.",
      },
      {
        title: "Flat-lay product backgrounds only",
        winner: "them",
        why: "Pebblely excels at background replacement for flat product images.",
      },
      {
        title: "Virtual try-on",
        winner: "us",
        why: "Pebblely has no try-on. Botzudio does.",
      },
    ],
  },

  "vs-pixelcut": {
    name: "Pixelcut",
    url: "pixelcut.ai",
    category: "AI Photo Editing",
    tagColor: "#D97706",
    tagBg: "#FEF3C7",
    startingPrice: "$9.99",
    pricingModel: "Monthly subscription",
    verdict:
      "Pixelcut is a basic photo editing app — it cannot generate fashion model images at all.",
    verdictPoints: [
      "Editing tool only (remove backgrounds, upscale) — not a generation tool",
      "Cannot create or place garments on models in any automated way",
      "Output quality too inconsistent for professional catalog production",
    ],
    strengths: [
      "Easy background removal for beginners",
      "Mobile app available",
    ],
    weaknesses: [
      "No model generation capability",
      "Cannot automate garment placement",
      "Inconsistent output at scale",
      "Not fashion-specific training",
      "No Indian diversity or ethnic wear",
    ],
    features: [
      { label: "AI Fashion Model Photography", us: "yes", them: "no" },
      { label: "Virtual Garment Try-On", us: "yes", them: "no" },
      { label: "Background Removal", us: "partial", them: "yes" },
      { label: "Indian / South Asian Models", us: "yes", them: "no" },
      { label: "Ethnic Wear Support", us: "yes", them: "no" },
      { label: "FLUX Pro Pipeline", us: "yes", them: "no" },
      { label: "Pay-Per-Use", us: "yes", them: "partial" },
      { label: "Catalog-Scale Production", us: "yes", them: "no" },
      { label: "Results in < 60 Seconds", us: "yes", them: "yes" },
      { label: "Free Trial", us: "yes", them: "yes" },
    ],
    useCases: [
      {
        title: "Fashion catalog model images",
        winner: "us",
        why: "Pixelcut cannot generate models — Botzudio is purpose-built for this.",
      },
      {
        title: "Simple background removal for flat images",
        winner: "them",
        why: "Pixelcut's background removal is polished and affordable.",
      },
      {
        title: "Scale to 100+ catalog images",
        winner: "us",
        why: "Pixelcut requires manual work per image. Botzudio automates the full pipeline.",
      },
    ],
  },

  "vs-claid": {
    name: "Claid.ai",
    url: "claid.ai",
    category: "AI Image Enhancement",
    tagColor: "#DB2777",
    tagBg: "#FCE7F3",
    startingPrice: "~$100",
    pricingModel: "Enterprise monthly",
    verdict:
      "Claid.ai is an enterprise enhancement tool — not a model generation platform — and pricing starts at ~$100/mo.",
    verdictPoints: [
      "Enhancement and upscaling only — no fashion model generation",
      "Enterprise pricing (~$100/mo minimum) not viable for most D2C brands",
      "Requires API integration — no simple upload-and-generate workflow",
    ],
    strengths: [
      "Best-in-class image upscaling",
      "API access for enterprise workflows",
    ],
    weaknesses: [
      "No fashion model photography feature",
      "Minimum ~$100/month commitment",
      "No free trial",
      "Requires developer integration",
      "No virtual try-on or garment-to-model pipeline",
    ],
    features: [
      { label: "AI Fashion Model Photography", us: "yes", them: "no" },
      { label: "Virtual Garment Try-On", us: "yes", them: "no" },
      { label: "Image Upscaling", us: "partial", them: "yes" },
      { label: "Indian / South Asian Models", us: "yes", them: "no" },
      { label: "Ethnic Wear Support", us: "yes", them: "no" },
      { label: "FLUX Pro Pipeline", us: "yes", them: "no" },
      { label: "Pay-Per-Use", us: "yes", them: "no" },
      { label: "No Technical Setup Needed", us: "yes", them: "no" },
      { label: "Free Trial", us: "yes", them: "no" },
      { label: "Results in < 60 Seconds", us: "yes", them: "yes" },
    ],
    useCases: [
      {
        title: "Generate catalog images with models",
        winner: "us",
        why: "Claid.ai cannot generate model images — it's an enhancement tool.",
      },
      {
        title: "Upscale and enhance existing catalog photos",
        winner: "them",
        why: "Claid.ai excels at upscaling existing images.",
      },
      {
        title: "Small or medium fashion brand",
        winner: "us",
        why: "Claid.ai's enterprise pricing ($100+/mo) is for large operations. Botzudio starts at ₹499.",
      },
    ],
  },

  "vs-runway": {
    name: "Runway ML",
    url: "runwayml.com",
    category: "General AI Creative Tools",
    tagColor: "#0284C7",
    tagBg: "#E0F2FE",
    startingPrice: "$15",
    pricingModel: "Monthly subscription",
    verdict:
      "Runway requires significant prompt expertise and produces inconsistent garment accuracy for fashion catalogs.",
    verdictPoints: [
      "Garment accuracy is unpredictable — your design may change completely in output",
      "Generation takes 3–5 minutes, not suited for catalog-scale production",
      "No Indian fashion models; requires deep prompt engineering for any fashion output",
    ],
    strengths: [
      "Powerful general-purpose AI video and image tools",
      "Strong for creative/artistic applications",
    ],
    weaknesses: [
      "Requires significant prompt engineering",
      "Inconsistent garment preservation",
      "3–5 minute generation per image",
      "No Indian or South Asian model diversity",
      "Not trained on fashion catalog data",
    ],
    features: [
      { label: "AI Fashion Model Photography", us: "yes", them: "partial" },
      { label: "Virtual Garment Try-On", us: "yes", them: "no" },
      { label: "Consistent Garment Accuracy", us: "yes", them: "no" },
      { label: "Indian / South Asian Models", us: "yes", them: "partial" },
      { label: "Ethnic Wear Support", us: "yes", them: "no" },
      { label: "Results in < 60 Seconds", us: "yes", them: "no" },
      { label: "No Prompt Engineering Needed", us: "yes", them: "no" },
      { label: "Pay-Per-Use", us: "yes", them: "no" },
      { label: "Catalog-Scale Production", us: "yes", them: "no" },
      { label: "Free Trial", us: "yes", them: "partial" },
    ],
    useCases: [
      {
        title: "Fashion brand catalog at scale",
        winner: "us",
        why: "Runway's 3–5 min generation and inconsistent garment accuracy make it impractical for catalog production.",
      },
      {
        title: "Creative editorial / mood boards",
        winner: "them",
        why: "Runway excels at creative, artistic imagery for editorial and moodboard work.",
      },
      {
        title: "Indian market fashion catalog",
        winner: "us",
        why: "Runway has no Indian diversity or ethnic wear training.",
      },
    ],
  },

  "vs-adobe-firefly": {
    name: "Adobe Firefly",
    url: "adobe.com/firefly",
    category: "Enterprise AI Creative Suite",
    tagColor: "#DC2626",
    tagBg: "#FEE2E2",
    startingPrice: "$29.99",
    pricingModel: "Creative Cloud subscription",
    verdict:
      "Adobe Firefly requires design expertise, expensive CC subscriptions, and has no fashion-specific training or workflow.",
    verdictPoints: [
      "Built for Creative Cloud professionals — requires Photoshop knowledge",
      "Full capability needs Creative Cloud All Apps (~₹5,000/mo)",
      "No Indian fashion, ethnic wear, or South Asian models in training data",
    ],
    strengths: [
      "Integrated with Creative Cloud ecosystem",
      "Commercially safe training data",
    ],
    weaknesses: [
      "Requires design expertise",
      "No fashion model generation workflow",
      "Expensive subscription tiers",
      "Not trained for Indian fashion or ethnic wear",
      "No virtual try-on pipeline",
    ],
    features: [
      { label: "AI Fashion Model Photography", us: "yes", them: "no" },
      { label: "Virtual Garment Try-On", us: "yes", them: "no" },
      { label: "Indian / South Asian Models", us: "yes", them: "no" },
      { label: "Ethnic Wear Support", us: "yes", them: "no" },
      { label: "No Design Skills Needed", us: "yes", them: "no" },
      { label: "Pay-Per-Use", us: "yes", them: "no" },
      { label: "FLUX Pro Pipeline", us: "yes", them: "no" },
      { label: "Results in < 60 Seconds", us: "yes", them: "partial" },
      { label: "Catalog-Scale Production", us: "yes", them: "no" },
      { label: "Free Trial", us: "yes", them: "partial" },
    ],
    useCases: [
      {
        title: "Fashion brand without a design team",
        winner: "us",
        why: "Firefly requires Photoshop expertise. Botzudio works for any ops team member.",
      },
      {
        title: "Already using Creative Cloud for design",
        winner: "them",
        why: "If your team is already in CC doing design work, Firefly integrates well.",
      },
      {
        title: "Indian D2C fashion brand",
        winner: "us",
        why: "Firefly has no Indian fashion training. Botzudio is built for this market.",
      },
    ],
  },

  "vs-midjourney": {
    name: "Midjourney",
    url: "midjourney.com",
    category: "General AI Image Generation",
    tagColor: "#6366F1",
    tagBg: "#EEF2FF",
    startingPrice: "$10",
    pricingModel: "Monthly (Discord-based)",
    verdict:
      "Midjourney produces stunning art but cannot preserve your actual garment design — making it unusable for real fashion catalogs.",
    verdictPoints: [
      "Cannot preserve your garment — generates 'similar style', not your actual product",
      "Operates through Discord, not a professional workflow",
      "No virtual try-on, no Indian diversity, no ethnic wear, no catalog automation",
    ],
    strengths: [
      "World-class general image quality and aesthetics",
      "Active community and fast iteration",
    ],
    weaknesses: [
      "Garments are completely regenerated — not your actual product",
      "Discord-only interface",
      "No Indian model diversity options",
      "No ethnic wear training data",
      "Cannot batch-produce consistent catalog images",
    ],
    features: [
      { label: "AI Fashion Model Photography", us: "yes", them: "partial" },
      { label: "Preserves Your Actual Garment Design", us: "yes", them: "no" },
      { label: "Virtual Garment Try-On", us: "yes", them: "no" },
      { label: "Indian / South Asian Models", us: "yes", them: "partial" },
      { label: "Ethnic Wear Support", us: "yes", them: "no" },
      { label: "Professional Dashboard – not Discord", us: "yes", them: "no" },
      { label: "Pay-Per-Use", us: "yes", them: "no" },
      { label: "Catalog-Scale Automation", us: "yes", them: "no" },
      { label: "Results in < 60 Seconds", us: "yes", them: "yes" },
      { label: "Free Trial", us: "yes", them: "no" },
    ],
    useCases: [
      {
        title: "Real product catalog images",
        winner: "us",
        why: "Midjourney can't use your actual garment — it generates a similar style. Botzudio places your real garment on a model.",
      },
      {
        title: "Creative editorial / mood boards",
        winner: "them",
        why: "Midjourney's aesthetic quality is unmatched for creative direction and moodboard work.",
      },
      {
        title: "Indian fashion e-commerce catalog",
        winner: "us",
        why: "Midjourney has no Indian fashion training. Botzudio is built specifically for this market.",
      },
    ],
  },

  "vs-dalle": {
    name: "DALL-E 3",
    url: "openai.com",
    category: "General AI Image Generation",
    tagColor: "#10B981",
    tagBg: "#D1FAE5",
    startingPrice: "~$0.04/img",
    pricingModel: "Per-image API pricing",
    verdict:
      "DALL-E 3 cannot preserve garment identity — it generates from text descriptions, not your actual product image.",
    verdictPoints: [
      "No garment preservation — describes clothing in text, doesn't use your actual product",
      "No virtual try-on or image-to-image garment placement",
      "API-only — requires developer integration; no SaaS UI for fashion teams",
    ],
    strengths: [
      "Strong text-following and prompt adherence",
      "Pay-per-image API pricing",
    ],
    weaknesses: [
      "Cannot use your actual garment as input",
      "No virtual try-on",
      "No Indian model diversity training",
      "No ethnic wear support",
      "API-only — no ready SaaS dashboard",
      "No catalog automation",
    ],
    features: [
      { label: "AI Fashion Model Photography", us: "yes", them: "partial" },
      { label: "Uses Your Actual Garment Photo", us: "yes", them: "no" },
      { label: "Virtual Garment Try-On", us: "yes", them: "no" },
      { label: "Indian / South Asian Models", us: "yes", them: "partial" },
      { label: "Ethnic Wear Support", us: "yes", them: "no" },
      { label: "Ready-to-Use Dashboard – No Code", us: "yes", them: "no" },
      { label: "Pay-Per-Use", us: "yes", them: "yes" },
      { label: "Results in < 60 Seconds", us: "yes", them: "yes" },
      { label: "Catalog-Scale Automation", us: "yes", them: "no" },
      { label: "Free Trial", us: "yes", them: "no" },
    ],
    useCases: [
      {
        title: "Fashion catalog from real product photos",
        winner: "us",
        why: "DALL-E 3 works from text only — cannot take your garment photo and place it on a model.",
      },
      {
        title: "Creative text-based image generation",
        winner: "them",
        why: "DALL-E 3 excels at following complex text prompts for creative/editorial work.",
      },
      {
        title: "Non-technical fashion operations team",
        winner: "us",
        why: "DALL-E 3 requires API integration. Botzudio is fully ready — upload your garment and generate.",
      },
    ],
  },

  "vs-zyler": {
    name: "Zyler",
    url: "zyler.com",
    category: "Virtual Try-On Platform",
    tagColor: "#0891B2",
    tagBg: "#CFFAFE",
    startingPrice: "Enterprise only",
    pricingModel: "Enterprise annual contract",
    verdict:
      "Zyler offers try-on but only through enterprise contracts — no self-serve access, no pay-per-use, and no image generation pipeline.",
    verdictPoints: [
      "Enterprise-only: no self-serve pricing, requires sales negotiation",
      "Try-on only — no AI fashion model photography or catalog generation",
      "No Indian market focus or ethnic wear support",
    ],
    strengths: [
      "Solid virtual try-on for customer-facing experiences",
      "Widget integration for large e-commerce stores",
    ],
    weaknesses: [
      "No self-serve access — must go through enterprise sales",
      "No AI catalog generation",
      "No Indian/ethnic wear training",
      "Cannot generate fashion photography",
      "Annual contracts only",
    ],
    features: [
      { label: "AI Fashion Model Photography", us: "yes", them: "no" },
      { label: "Virtual Garment Try-On", us: "yes", them: "yes" },
      { label: "Indian / South Asian Models", us: "yes", them: "no" },
      { label: "Ethnic Wear Support", us: "yes", them: "no" },
      { label: "Self-Serve Instant Access", us: "yes", them: "no" },
      { label: "Pay-Per-Use", us: "yes", them: "no" },
      { label: "FLUX Pro Image Generation", us: "yes", them: "no" },
      { label: "Catalog Image Creation", us: "yes", them: "no" },
      { label: "Free Trial", us: "yes", them: "no" },
      { label: "Results in < 60 Seconds", us: "yes", them: "partial" },
    ],
    useCases: [
      {
        title: "Quick try-on for small brand",
        winner: "us",
        why: "Zyler requires an enterprise contract. Botzudio lets you start immediately from ₹499.",
      },
      {
        title: "Full try-on widget for large enterprise store",
        winner: "them",
        why: "Zyler's customer-facing widget is designed for large-scale retail integrations.",
      },
      {
        title: "Generate new catalog photography",
        winner: "us",
        why: "Zyler only overlays garments on existing photos. Botzudio generates entirely new model photography.",
      },
    ],
  },

  "vs-vue-ai": {
    name: "Vue.ai",
    url: "vue.ai",
    category: "Enterprise Fashion AI",
    tagColor: "#7C3AED",
    tagBg: "#F3E8FF",
    startingPrice: "Enterprise only",
    pricingModel: "Enterprise annual contract",
    verdict:
      "Vue.ai is an enterprise platform for large retailers — not accessible or affordable for D2C or mid-size fashion brands.",
    verdictPoints: [
      "Enterprise-only: contracts typically in lakhs, not accessible to D2C brands",
      "Weeks-to-months implementation time — not minutes",
      "Heavy sales-led process with no instant access or free trial",
    ],
    strengths: [
      "Comprehensive enterprise fashion AI suite",
      "Strong integrations with large retail platforms",
    ],
    weaknesses: [
      "Not accessible to small or medium fashion brands",
      "Multi-month implementation timelines",
      "No self-serve access",
      "Designed for large retailers not D2C",
      "No free trial",
    ],
    features: [
      { label: "AI Fashion Model Photography", us: "yes", them: "yes" },
      { label: "Virtual Garment Try-On", us: "yes", them: "yes" },
      { label: "Indian / South Asian Models", us: "yes", them: "partial" },
      { label: "Self-Serve Instant Access", us: "yes", them: "no" },
      { label: "Pay-Per-Use", us: "yes", them: "no" },
      { label: "FLUX Pro Image Generation", us: "yes", them: "no" },
      { label: "Free Trial", us: "yes", them: "no" },
      { label: "Start in < 5 Minutes", us: "yes", them: "no" },
      { label: "Ethnic Wear Support", us: "yes", them: "partial" },
      { label: "Catalog-Scale Production", us: "yes", them: "yes" },
    ],
    useCases: [
      {
        title: "D2C fashion brand getting started",
        winner: "us",
        why: "Vue.ai's enterprise process takes months. Botzudio lets you generate your first image in under 2 minutes.",
      },
      {
        title: "Large retailer needing full platform integration",
        winner: "them",
        why: "Vue.ai's enterprise features are designed for large-scale retail operations.",
      },
      {
        title: "Brand testing AI photography before committing",
        winner: "us",
        why: "Vue.ai has no free trial. Botzudio lets you start with a small credit pack and see results immediately.",
      },
    ],
  },
};

function CellIcon({ value }: { value: Cell }) {
  if (value === "yes") {
    return (
      <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
        <Check size={18} color="#22C55E" strokeWidth={2.5} />
      </span>
    );
  }
  if (value === "partial") {
    return (
      <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
        <Minus size={18} color="#F59E0B" strokeWidth={2.5} />
      </span>
    );
  }
  return (
    <span style={{ color: "#94A3B8", fontSize: 18, fontWeight: 700, lineHeight: 1 }}>—</span>
  );
}

export default function CompareDetailPage() {
  const { slug } = useParams<{ slug: string }>();

  if (!slug || !DATA[slug]) {
    return <Navigate to="/compare" replace />;
  }

  const d = DATA[slug];

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#FFFDF5", minHeight: "100vh" }}>
      <Nav />

      {/* ── Hero ── */}
      <section
        style={{
          background: "#0F172A",
          padding: "120px 24px 64px",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          {/* Category badge */}
          <span
            style={{
              display: "inline-block",
              background: d.tagBg,
              color: d.tagColor,
              fontWeight: 700,
              fontSize: 13,
              letterSpacing: "0.04em",
              padding: "5px 14px",
              borderRadius: 999,
              marginBottom: 28,
            }}
          >
            Botzudio vs {d.name}
          </span>

          <h1
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 900,
              fontSize: "clamp(32px, 5vw, 56px)",
              color: "#FFFFFF",
              letterSpacing: "-1px",
              lineHeight: 1.1,
              margin: "0 0 20px",
            }}
          >
            Why fashion brands choose Botzudio over {d.name}
          </h1>

          <p
            style={{
              fontSize: 16,
              color: "rgba(255,255,255,0.6)",
              maxWidth: 600,
              margin: "0 auto 36px",
              lineHeight: 1.7,
            }}
          >
            {d.verdict}
          </p>

          {/* Verdict points */}
          <div
            style={{
              maxWidth: 680,
              margin: "0 auto 40px",
              textAlign: "left",
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            {d.verdictPoints.map((pt, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <Check size={18} color="#A78BFA" strokeWidth={2.5} style={{ flexShrink: 0, marginTop: 3 }} />
                <span style={{ fontSize: 15, color: "#FFFFFF", lineHeight: 1.6 }}>{pt}</span>
              </div>
            ))}
          </div>

          {/* CTA buttons */}
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <Link
              to="/login"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "#8B5CF6",
                color: "#FFFFFF",
                fontWeight: 700,
                fontSize: 15,
                padding: "13px 28px",
                borderRadius: 999,
                border: "2px solid #1E293B",
                boxShadow: "4px 4px 0 #1E293B",
                textDecoration: "none",
                transition: "transform 0.15s, box-shadow 0.15s",
              }}
            >
              Get Started Free <ArrowRight size={16} />
            </Link>
            <Link
              to="/compare"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "transparent",
                color: "#FFFFFF",
                fontWeight: 700,
                fontSize: 15,
                padding: "13px 28px",
                borderRadius: 999,
                border: "2px solid rgba(255,255,255,0.3)",
                textDecoration: "none",
              }}
            >
              See All Comparisons
            </Link>
          </div>
        </div>
      </section>

      {/* ── Quick wins bar ── */}
      <section style={{ background: "#FFFFFF", padding: "48px 24px" }}>
        <div
          style={{
            maxWidth: 960,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 16,
          }}
        >
          {/* Card 1 */}
          <div
            style={{
              border: "1.5px solid #E2E8F0",
              borderRadius: 16,
              padding: 24,
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: "rgba(139,92,246,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Camera size={20} color="#8B5CF6" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#1E293B", marginBottom: 6 }}>
                AI Image Generation
              </div>
              <div style={{ fontSize: 14, color: "#64748B", lineHeight: 1.6 }}>
                FLUX Pro — the world's best image quality. Competitors use older, generic pipelines.
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div
            style={{
              border: "1.5px solid #E2E8F0",
              borderRadius: 16,
              padding: 24,
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: "rgba(16,185,129,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Zap size={20} color="#10B981" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#1E293B", marginBottom: 6 }}>
                Pay Only What You Use
              </div>
              <div style={{ fontSize: 14, color: "#64748B", lineHeight: 1.6 }}>
                Credits from ₹499. No monthly lock-in.
              </div>
            </div>
          </div>

          {/* Card 3 */}
          <div
            style={{
              border: "1.5px solid #E2E8F0",
              borderRadius: 16,
              padding: 24,
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: "rgba(245,158,11,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Star size={20} color="#F59E0B" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#1E293B", marginBottom: 6 }}>
                Indian Fashion Focus
              </div>
              <div style={{ fontSize: 14, color: "#64748B", lineHeight: 1.6 }}>
                South Asian models, ethnic wear — built for this market.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature comparison table ── */}
      <section style={{ background: "#F8FAFC", padding: "64px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <h2
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 900,
              fontSize: "clamp(24px, 3vw, 36px)",
              color: "#1E293B",
              textAlign: "center",
              marginBottom: 40,
              letterSpacing: "-0.5px",
            }}
          >
            Feature-by-feature breakdown
          </h2>

          <div
            style={{
              border: "2px solid #1E293B",
              borderRadius: 16,
              overflow: "hidden",
            }}
          >
            {/* Table header */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 160px 160px",
                background: "#1E293B",
              }}
            >
              <div
                style={{
                  padding: "14px 20px",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.6)",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}
              >
                Feature
              </div>
              <div
                style={{
                  padding: "14px 20px",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#C4B5FD",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  textAlign: "center",
                  background: "rgba(139,92,246,0.25)",
                }}
              >
                Botzudio
              </div>
              <div
                style={{
                  padding: "14px 20px",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.6)",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  textAlign: "center",
                }}
              >
                {d.name}
              </div>
            </div>

            {/* Table rows */}
            {d.features.map((f, i) => (
              <div
                key={i}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 160px 160px",
                  background: i % 2 === 0 ? "#FFFFFF" : "#FAFAF8",
                  borderTop: "1px solid #E2E8F0",
                }}
              >
                <div
                  style={{
                    padding: "14px 20px",
                    fontSize: 14,
                    color: "#334155",
                    fontWeight: 500,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {f.label}
                  {f.note && (
                    <span style={{ marginLeft: 6, fontSize: 12, color: "#94A3B8" }}>
                      ({f.note})
                    </span>
                  )}
                </div>
                <div
                  style={{
                    padding: "14px 20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "rgba(139,92,246,0.07)",
                  }}
                >
                  <CellIcon value={f.us} />
                </div>
                <div
                  style={{
                    padding: "14px 20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <CellIcon value={f.them} />
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div
            style={{
              display: "flex",
              gap: 24,
              marginTop: 16,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#64748B" }}>
              <Check size={14} color="#22C55E" /> Yes / Supported
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#64748B" }}>
              <Minus size={14} color="#F59E0B" /> Partial / Limited
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#94A3B8" }}>
              — Not available
            </span>
          </div>
        </div>
      </section>

      {/* ── Pricing section ── */}
      <section style={{ background: "#FFFFFF", padding: "64px 24px" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <h2
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 900,
              fontSize: "clamp(24px, 3vw, 36px)",
              color: "#1E293B",
              textAlign: "center",
              marginBottom: 36,
              letterSpacing: "-0.5px",
            }}
          >
            Pricing comparison
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 20,
            }}
          >
            {/* Botzudio card */}
            <div
              style={{
                border: "2px solid #8B5CF6",
                borderRadius: 16,
                padding: 28,
                background: "rgba(139,92,246,0.04)",
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Trophy size={18} color="#8B5CF6" />
                <span
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontWeight: 800,
                    fontSize: 18,
                    color: "#1E293B",
                  }}
                >
                  Botzudio
                </span>
              </div>
              <div
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 900,
                  fontSize: 28,
                  color: "#8B5CF6",
                }}
              >
                ₹499 for 300 credits
              </div>
              <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.6, margin: 0 }}>
                Pay per image. Credits never expire. No monthly fees.
              </p>
              <Link
                to="/login"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: "#22C55E",
                  color: "#FFFFFF",
                  fontWeight: 700,
                  fontSize: 14,
                  padding: "10px 22px",
                  borderRadius: 999,
                  border: "2px solid #1E293B",
                  boxShadow: "3px 3px 0 #1E293B",
                  textDecoration: "none",
                  alignSelf: "flex-start",
                  marginTop: 4,
                }}
              >
                Get Started <ArrowRight size={14} />
              </Link>
            </div>

            {/* Competitor card */}
            <div
              style={{
                border: "2px solid #E2E8F0",
                borderRadius: 16,
                padding: 28,
                background: "#F8FAFC",
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <div
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 800,
                  fontSize: 18,
                  color: "#1E293B",
                }}
              >
                {d.name}
              </div>
              <div
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 900,
                  fontSize: 28,
                  color: "#475569",
                }}
              >
                {d.startingPrice}
              </div>
              <p style={{ fontSize: 14, color: "#64748B", lineHeight: 1.6, margin: 0 }}>
                {d.pricingModel}
              </p>
              <a
                href={`https://${d.url}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: "transparent",
                  color: "#64748B",
                  fontWeight: 700,
                  fontSize: 14,
                  padding: "10px 22px",
                  borderRadius: 999,
                  border: "2px solid #CBD5E1",
                  textDecoration: "none",
                  alignSelf: "flex-start",
                  marginTop: 4,
                }}
              >
                Visit {d.url}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Use cases ── */}
      <section style={{ background: "#0F172A", padding: "64px 24px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <h2
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 900,
              fontSize: "clamp(24px, 3vw, 36px)",
              color: "#FFFFFF",
              textAlign: "center",
              marginBottom: 40,
              letterSpacing: "-0.5px",
            }}
          >
            When to choose which?
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 20,
            }}
          >
            {d.useCases.map((uc, i) => (
              <div
                key={i}
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1.5px solid rgba(255,255,255,0.1)",
                  borderRadius: 16,
                  padding: 24,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: "#FFFFFF",
                    lineHeight: 1.4,
                  }}
                >
                  {uc.title}
                </div>
                <div>
                  {uc.winner === "us" ? (
                    <span
                      style={{
                        display: "inline-block",
                        background: "rgba(139,92,246,0.25)",
                        color: "#C4B5FD",
                        fontWeight: 700,
                        fontSize: 12,
                        padding: "4px 12px",
                        borderRadius: 999,
                        border: "1px solid rgba(139,92,246,0.4)",
                      }}
                    >
                      ✓ Botzudio wins
                    </span>
                  ) : (
                    <span
                      style={{
                        display: "inline-block",
                        background: `${d.tagBg}22`,
                        color: d.tagColor,
                        fontWeight: 700,
                        fontSize: 12,
                        padding: "4px 12px",
                        borderRadius: 999,
                        border: `1px solid ${d.tagColor}44`,
                      }}
                    >
                      ✓ {d.name} wins
                    </span>
                  )}
                </div>
                <p
                  style={{
                    fontSize: 14,
                    color: "rgba(255,255,255,0.6)",
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  {uc.why}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section
        style={{
          background: "#FFFDF5",
          padding: "72px 24px",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <h2
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 900,
              fontSize: "clamp(28px, 4vw, 44px)",
              color: "#1E293B",
              letterSpacing: "-0.5px",
              marginBottom: 16,
            }}
          >
            Ready to see the difference?
          </h2>
          <p
            style={{
              fontSize: 16,
              color: "#475569",
              marginBottom: 36,
              lineHeight: 1.7,
            }}
          >
            No subscription. Your first images in under 2 minutes.
          </p>
          <Link
            to="/login"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "#8B5CF6",
              color: "#FFFFFF",
              fontWeight: 700,
              fontSize: 16,
              padding: "14px 32px",
              borderRadius: 999,
              border: "2px solid #1E293B",
              boxShadow: "4px 4px 0 #1E293B",
              textDecoration: "none",
            }}
          >
            Start Free <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <CinematicFooter />
    </div>
  );
}
