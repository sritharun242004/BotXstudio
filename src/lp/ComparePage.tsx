import { Link } from "react-router-dom";
import { Nav } from "./Nav";
import { CinematicFooter } from "../components/ui/motion-footer";
import { Check, X, Minus, ArrowRight, Trophy, AlertTriangle } from "lucide-react";

// ─── Data ───────────────────────────────────────────────────────────────────

type Cell = "yes" | "no" | "partial";

const FEATURES: { label: string; note?: string }[] = [
  { label: "AI Fashion Model Photography" },
  { label: "Virtual Garment Try-On", note: "Place any garment on a real person's photo" },
  { label: "Indian / South Asian Model Styles", note: "Diverse representation for local markets" },
  { label: "Ethnic Wear Support", note: "Kurtas, sarees, sherwanis, co-ords" },
  { label: "Pay-Per-Use (No Subscription Required)" },
  { label: "Credits Roll Over", note: "Unused credits carry to next month" },
  { label: "Results in < 60 Seconds" },
  { label: "No Design Skills Needed" },
  { label: "Garment Colour & Texture Accuracy" },
  { label: "Catalog-Scale Production", note: "100+ images without quality drop" },
  { label: "Free Trial Available" },
];

const COMPETITORS: {
  name: string;
  tagline: string;
  url: string;
  startingPrice: string;
  cells: Cell[];
  bgColor: string;
  textColor: string;
}[] = [
  {
    name: "Botika",
    tagline: "AI model photos for fashion",
    url: "botika.online",
    startingPrice: "$49 / mo",
    bgColor: "#EDE9FE",
    textColor: "#7C3AED",
    cells: ["yes", "no", "partial", "no", "no", "no", "partial", "yes", "yes", "partial", "partial"],
  },
  {
    name: "Pebblely",
    tagline: "AI product photography & backgrounds",
    url: "pebblely.com",
    startingPrice: "$19 / mo",
    bgColor: "#DCFCE7",
    textColor: "#16A34A",
    cells: ["no", "no", "no", "no", "partial", "no", "yes", "yes", "partial", "partial", "yes"],
  },
  {
    name: "Pixelcut",
    tagline: "AI product photo tools",
    url: "pixelcut.ai",
    startingPrice: "$9.99 / mo",
    bgColor: "#FEF3C7",
    textColor: "#D97706",
    cells: ["no", "no", "no", "no", "partial", "no", "yes", "yes", "no", "no", "yes"],
  },
  {
    name: "Claid.ai",
    tagline: "AI image enhancement & upscaling",
    url: "claid.ai",
    startingPrice: "~$100 / mo",
    bgColor: "#FCE7F3",
    textColor: "#DB2777",
    cells: ["no", "no", "no", "no", "no", "no", "yes", "partial", "partial", "yes", "no"],
  },
  {
    name: "Runway ML",
    tagline: "General-purpose AI creative tools",
    url: "runwayml.com",
    startingPrice: "$15 / mo",
    bgColor: "#E0F2FE",
    textColor: "#0284C7",
    cells: ["partial", "no", "partial", "no", "no", "no", "no", "no", "partial", "no", "partial"],
  },
  {
    name: "Adobe Firefly",
    tagline: "Enterprise AI image generation",
    url: "adobe.com/firefly",
    startingPrice: "$29.99 / mo",
    bgColor: "#FEE2E2",
    textColor: "#DC2626",
    cells: ["no", "no", "no", "no", "no", "no", "partial", "no", "partial", "no", "partial"],
  },
];

const BOTZUDIO_CELLS: Cell[] = ["yes", "yes", "yes", "yes", "yes", "yes", "yes", "yes", "yes", "yes", "yes"];

// ─── Competitor deep-dives ──────────────────────────────────────────────────

const DEEP_DIVES = [
  {
    name: "Botika",
    tagColor: "#7C3AED",
    tagBg: "#EDE9FE",
    pros: ["Good garment accuracy for western wear", "Clean output quality"],
    cons: [
      "No virtual try-on — only flat garment → model generation",
      "Subscription-only: you pay whether you generate or not",
      "Very limited South Asian model options; Indian ethnic wear not supported",
      "Credits don't roll over, so unused capacity is wasted",
      "No FLUX Pro integration — older generation pipeline",
    ],
  },
  {
    name: "Pebblely",
    tagColor: "#16A34A",
    tagBg: "#DCFCE7",
    pros: ["Fast background replacement", "Good for flat product photography"],
    cons: [
      "No human model photography at all — purely background and lifestyle scenes",
      "Cannot generate a garment on a model; completely different use case",
      "Subscription required even for light usage",
      "Not fashion-specific — same tool used for furniture, food, electronics",
      "No try-on or garment-on-person capability",
    ],
  },
  {
    name: "Pixelcut",
    tagColor: "#D97706",
    tagBg: "#FEF3C7",
    pros: ["Easy background removal", "Mobile app available"],
    cons: [
      "No AI model generation — a background removal and basic editing tool, not a photography replacement",
      "Cannot place garments on models in any automated way",
      "Results vary significantly by garment complexity",
      "No Indian model diversity or ethnic wear support",
      "Per-image quality too inconsistent for catalog production at scale",
    ],
  },
  {
    name: "Claid.ai",
    tagColor: "#DB2777",
    tagBg: "#FCE7F3",
    pros: ["Best-in-class image upscaling", "API access for enterprise workflows"],
    cons: [
      "Enterprise-only pricing — minimum commitment of ~$100/month, not viable for most D2C brands",
      "No fashion model photography — an enhancement tool, not a generation tool",
      "Requires technical integration; no simple upload-and-generate workflow",
      "No virtual try-on or garment placement",
      "No free trial — must commit to a paid plan before testing",
    ],
  },
  {
    name: "Runway ML",
    tagColor: "#0284C7",
    tagBg: "#E0F2FE",
    pros: ["Powerful general AI video and image tools", "Active research team"],
    cons: [
      "Requires significant prompt engineering to get fashion-relevant outputs — not a point-and-shoot tool",
      "Highly inconsistent garment accuracy: the AI doesn't reliably preserve your garment's design",
      "Generation can take 3–5 minutes; not suited for catalog production",
      "No Indian fashion model options",
      "General-purpose tool — not trained on fashion catalog data specifically",
    ],
  },
  {
    name: "Adobe Firefly",
    tagColor: "#DC2626",
    tagBg: "#FEE2E2",
    pros: ["Integrated with Creative Cloud ecosystem", "Commercially safe training data"],
    cons: [
      "Requires design expertise — built for Creative Cloud professionals, not fashion ops teams",
      "No fashion model generation workflow; outputs require manual compositing in Photoshop",
      "Expensive subscription tiers; full capability requires Creative Cloud All Apps (~₹5,000/mo)",
      "Not trained for Indian fashion, ethnic wear, or South Asian model styles",
      "No virtual try-on, no garment-to-model pipeline; must build your own workflow",
    ],
  },
];

// ─── Cell renderer ──────────────────────────────────────────────────────────

function CellIcon({ v, isBotzudio = false }: { v: Cell; isBotzudio?: boolean }) {
  if (v === "yes") return (
    <Check size={18} strokeWidth={2.5} color={isBotzudio ? "#8B5CF6" : "#22C55E"} />
  );
  if (v === "partial") return (
    <Minus size={18} strokeWidth={2.5} color="#F59E0B" />
  );
  return (
    <span style={{ fontSize: 18, color: "#CBD5E1", lineHeight: 1, fontWeight: 600, userSelect: "none" }}>—</span>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function ComparePage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg, #FFFDF5)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <Nav />

      {/* ── Hero ──────────────────────────────────────── */}
      <div style={{ padding: "120px 24px 56px", textAlign: "center" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 7,
          background: "#EDE9FE", color: "#7C3AED",
          border: "1.5px solid #DDD6FE",
          borderRadius: 9999, fontSize: 11, fontWeight: 800,
          letterSpacing: "0.08em", textTransform: "uppercase",
          padding: "5px 14px", marginBottom: 20,
        }}>
          <Trophy size={11} strokeWidth={2.5} /> Honest Comparison
        </div>
        <h1 style={{
          fontFamily: "'Outfit', sans-serif",
          fontWeight: 900,
          fontSize: "clamp(30px, 6vw, 54px)",
          lineHeight: 1.1,
          color: "#1E293B",
          letterSpacing: "-1px",
          maxWidth: 760,
          margin: "0 auto 16px",
        }}>
          How Botzudio compares to the alternatives
        </h1>
        <p style={{ fontSize: 16, color: "#64748B", maxWidth: 560, margin: "0 auto 12px" }}>
          We've compared Botzudio against the six most popular tools in AI fashion photography and product imaging. Here's the full breakdown — including where they fall short.
        </p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 24, marginTop: 24, flexWrap: "wrap" }}>
          {[
            { icon: <Check size={15} strokeWidth={2.5} color="#22C55E" />, label: "Yes" },
            { icon: <Minus size={15} strokeWidth={2.5} color="#F59E0B" />, label: "Partial / Limited" },
            { icon: <span style={{ fontSize: 16, color: "#CBD5E1", fontWeight: 600, lineHeight: 1 }}>—</span>, label: "No" },
          ].map(l => (
            <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: "#475569", fontWeight: 600 }}>
              {l.icon} {l.label}
            </div>
          ))}
        </div>
      </div>

      {/* ── Comparison Table ──────────────────────────── */}
      <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 24px 80px", overflowX: "auto" }}>
        <div style={{ minWidth: 900 }}>

          {/* Header row */}
          <div style={{
            display: "grid",
            gridTemplateColumns: `240px 1fr repeat(${COMPETITORS.length}, 1fr)`,
            gap: 0,
            marginBottom: 0,
          }}>
            {/* Feature column header */}
            <div style={{
              padding: "18px 16px",
              display: "flex", alignItems: "center",
              background: "#F8FAFC",
              border: "2px solid #1E293B",
              borderRight: "none",
              borderRadius: "16px 0 0 0",
            }}>
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "#1E293B" }}>
                Features
              </span>
            </div>

            {/* Botzudio column header */}
            <div style={{
              background: "linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)",
              border: "2px solid #1E293B",
              borderRadius: "0 0 0 0",
              padding: "18px 14px",
              textAlign: "center",
              borderRight: "1px solid rgba(255,255,255,0.2)",
            }}>
              <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: 16, color: "#fff" }}>Botzudio</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.8)", marginTop: 2 }}>From ₹499 (no sub)</div>
            </div>

            {/* Competitor column headers */}
            {COMPETITORS.map((c, ci) => (
              <div key={c.name} style={{
                background: "#F8FAFC",
                border: "2px solid #1E293B",
                borderLeft: "1px solid #E2E8F0",
                borderRadius: ci === COMPETITORS.length - 1 ? "0 16px 0 0" : 0,
                padding: "18px 10px",
                textAlign: "center",
              }}>
                <div style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 800, fontSize: 13,
                  color: "#1E293B", marginBottom: 4,
                }}>{c.name}</div>
                <div style={{ fontSize: 10, color: "#94A3B8" }}>{c.startingPrice}</div>
              </div>
            ))}
          </div>

          {/* Feature rows */}
          {FEATURES.map((feat, fi) => {
            const isLast = fi === FEATURES.length - 1;
            return (
              <div key={feat.label} style={{
                display: "grid",
                gridTemplateColumns: `240px 1fr repeat(${COMPETITORS.length}, 1fr)`,
                background: fi % 2 === 0 ? "#fff" : "#FAFAF8",
                borderBottom: isLast ? "2px solid #1E293B" : "1px solid #E2E8F0",
                borderLeft: "2px solid #1E293B",
                borderRight: "2px solid #1E293B",
              }}>
                {/* Feature label */}
                <div style={{ padding: "14px 16px", borderRight: "1px solid #E2E8F0" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#1E293B" }}>{feat.label}</div>
                  {feat.note && (
                    <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>{feat.note}</div>
                  )}
                </div>

                {/* Botzudio cell */}
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  padding: "14px 10px",
                  background: "linear-gradient(135deg, rgba(139,92,246,0.07) 0%, rgba(236,72,153,0.05) 100%)",
                  borderRight: "1px solid rgba(139,92,246,0.2)",
                }}>
                  <CellIcon v={BOTZUDIO_CELLS[fi]!} isBotzudio />
                </div>

                {/* Competitor cells */}
                {COMPETITORS.map(c => (
                  <div key={c.name} style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    padding: "14px 10px",
                    borderLeft: "1px solid #F1F5F9",
                  }}>
                    <CellIcon v={c.cells[fi] as Cell} />
                  </div>
                ))}
              </div>
            );
          })}

          {/* Bottom row — competitor names reminder */}
          <div style={{
            display: "grid",
            gridTemplateColumns: `240px 1fr repeat(${COMPETITORS.length}, 1fr)`,
            borderLeft: "2px solid #1E293B",
            borderRight: "2px solid #1E293B",
            borderBottom: "2px solid #1E293B",
            borderRadius: "0 0 16px 16px",
            overflow: "hidden",
          }}>
            <div />
            <div style={{
              background: "linear-gradient(135deg, #8B5CF6, #EC4899)",
              padding: "14px 10px",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Link to="/login" style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 16px", borderRadius: 9999,
                background: "#fff", color: "#8B5CF6",
                border: "1.5px solid #fff",
                fontSize: 11, fontWeight: 800,
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}>
                Try Free <ArrowRight size={10} strokeWidth={2.5} />
              </Link>
            </div>
            {COMPETITORS.map(c => (
              <div key={c.name} style={{
                background: "#F8FAFC",
                padding: "14px 10px",
                display: "flex", alignItems: "center", justifyContent: "center",
                borderLeft: "1px solid #E2E8F0",
              }}>
                <span style={{ fontSize: 10, color: "#94A3B8" }}>{c.url}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Where competitors fall short ─────────────── */}
      <div style={{ background: "#0F172A", padding: "72px 24px" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.8)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 9999, fontSize: 11, fontWeight: 800,
              letterSpacing: "0.08em", textTransform: "uppercase",
              padding: "5px 14px", marginBottom: 16,
            }}>
              <AlertTriangle size={11} strokeWidth={2.5} /> Where They Fall Short
            </div>
            <h2 style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 900, fontSize: "clamp(26px, 5vw, 40px)",
              color: "#fff", margin: "0 auto", maxWidth: 600,
            }}>
              What the table doesn't show
            </h2>
            <p style={{ color: "rgba(255,255,255,0.55)", marginTop: 12, fontSize: 15, maxWidth: 480, margin: "12px auto 0" }}>
              Numbers tell part of the story. Here's what using these tools actually looks like for a fashion brand.
            </p>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: 20,
          }}>
            {DEEP_DIVES.map(d => (
              <div key={d.name} style={{
                background: "rgba(255,255,255,0.05)",
                border: "1.5px solid rgba(255,255,255,0.1)",
                borderRadius: 16,
                padding: 24,
              }}>
                <div style={{
                  display: "inline-block",
                  background: d.tagBg,
                  color: d.tagColor,
                  border: `1.5px solid ${d.tagColor}`,
                  borderRadius: 9999,
                  fontSize: 11, fontWeight: 800,
                  padding: "3px 12px",
                  marginBottom: 16,
                }}>{d.name}</div>

                {d.pros.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginBottom: 8 }}>
                      What it does well
                    </div>
                    {d.pros.map((p, i) => (
                      <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 5 }}>
                        <Check size={12} strokeWidth={3} color="#34D399" style={{ flexShrink: 0, marginTop: 2 }} />
                        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 1.55 }}>{p}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div>
                  <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginBottom: 8 }}>
                    Where it falls short
                  </div>
                  {d.cons.map((c, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 7 }}>
                      <X size={12} strokeWidth={3} color="#F87171" style={{ flexShrink: 0, marginTop: 2 }} />
                      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", lineHeight: 1.55 }}>{c}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CTA ──────────────────────────────────────── */}
      <div style={{ padding: "72px 24px", textAlign: "center", background: "var(--bg, #FFFDF5)" }}>
        <h2 style={{
          fontFamily: "'Outfit', sans-serif",
          fontWeight: 900, fontSize: "clamp(26px, 5vw, 42px)",
          color: "#1E293B", margin: "0 auto 14px", maxWidth: 580,
        }}>
          Ready to switch to the tool built for fashion?
        </h2>
        <p style={{ fontSize: 15, color: "#64748B", maxWidth: 440, margin: "0 auto 32px" }}>
          No subscription. No design skills required. Your first catalog images in under 2 minutes.
        </p>
        <Link
          to="/login"
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "14px 32px",
            borderRadius: 9999,
            background: "#8B5CF6",
            color: "#fff",
            border: "2px solid #1E293B",
            boxShadow: "4px 4px 0 #1E293B",
            fontSize: 15, fontWeight: 900,
            textDecoration: "none",
            fontFamily: "'Outfit', sans-serif",
            transition: "transform .18s cubic-bezier(.34,1.56,.64,1), box-shadow .18s ease",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = "translate(-2px,-2px)";
            e.currentTarget.style.boxShadow = "6px 6px 0 #1E293B";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = "translate(0,0)";
            e.currentTarget.style.boxShadow = "4px 4px 0 #1E293B";
          }}
        >
          Get Started Free <ArrowRight size={14} strokeWidth={2.5} />
        </Link>
      </div>

      <CinematicFooter />
    </div>
  );
}
