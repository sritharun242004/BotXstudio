import { useState } from "react";
import { Link } from "react-router-dom";
import { Nav } from "./Nav";
import { CinematicFooter } from "../components/ui/motion-footer";
import { Check, Minus, X, ArrowRight, Trophy, AlertTriangle } from "lucide-react";

// ─── Data ───────────────────────────────────────────────────────────────────

type Cell = "yes" | "no" | "partial";

const FEATURES: { label: string; note?: string }[] = [
  { label: "AI Fashion Model Photography" },
  { label: "Virtual Garment Try-On", note: "Place any garment on a real person's photo" },
  { label: "Indian / South Asian Model Styles", note: "Diverse representation for local markets" },
  { label: "Ethnic Wear Support", note: "Kurtas, sarees, sherwanis, co-ords" },
  { label: "FLUX Pro Image Pipeline", note: "World-leading image quality" },
  { label: "Pay-Per-Use (No Subscription)" },
  { label: "Credits Roll Over", note: "Unused credits carry forward" },
  { label: "Results in < 60 Seconds" },
  { label: "No Design Skills Needed" },
  { label: "Garment Colour & Texture Accuracy" },
  { label: "Catalog-Scale Production", note: "100+ images without quality drop" },
  { label: "Free Trial Available" },
];

const COMPETITORS: {
  name: string; slug: string; url: string; startingPrice: string;
  cells: Cell[]; bgColor: string; textColor: string;
}[] = [
  { name: "Botika",        slug: "vs-botika",        url: "botika.online",      startingPrice: "$49/mo",      bgColor: "#EDE9FE", textColor: "#7C3AED", cells: ["yes","no","partial","no","no","no","no","partial","yes","yes","partial","partial"] },
  { name: "Pebblely",      slug: "vs-pebblely",      url: "pebblely.com",       startingPrice: "$19/mo",      bgColor: "#DCFCE7", textColor: "#16A34A", cells: ["no","no","no","no","no","partial","no","yes","yes","partial","partial","yes"] },
  { name: "Pixelcut",      slug: "vs-pixelcut",      url: "pixelcut.ai",        startingPrice: "$9.99/mo",    bgColor: "#FEF3C7", textColor: "#D97706", cells: ["no","no","no","no","no","partial","no","yes","yes","no","no","yes"] },
  { name: "Claid.ai",      slug: "vs-claid",         url: "claid.ai",           startingPrice: "~$100/mo",    bgColor: "#FCE7F3", textColor: "#DB2777", cells: ["no","no","no","no","no","no","no","yes","partial","partial","yes","no"] },
  { name: "Runway ML",     slug: "vs-runway",        url: "runwayml.com",       startingPrice: "$15/mo",      bgColor: "#E0F2FE", textColor: "#0284C7", cells: ["partial","no","partial","no","no","no","no","no","no","partial","no","partial"] },
  { name: "Adobe Firefly", slug: "vs-adobe-firefly", url: "adobe.com/firefly",  startingPrice: "$29.99/mo",   bgColor: "#FEE2E2", textColor: "#DC2626", cells: ["no","no","no","no","no","no","no","partial","no","partial","no","partial"] },
  { name: "Midjourney",    slug: "vs-midjourney",    url: "midjourney.com",     startingPrice: "$10/mo",      bgColor: "#EEF2FF", textColor: "#6366F1", cells: ["partial","no","partial","no","no","no","no","yes","partial","no","no","no"] },
  { name: "DALL-E 3",      slug: "vs-dalle",         url: "openai.com",         startingPrice: "~$0.04/img",  bgColor: "#D1FAE5", textColor: "#10B981", cells: ["partial","no","partial","no","no","yes","yes","yes","partial","no","no","no"] },
  { name: "Zyler",         slug: "vs-zyler",         url: "zyler.com",          startingPrice: "Enterprise",  bgColor: "#CFFAFE", textColor: "#0891B2", cells: ["no","yes","no","no","no","no","no","partial","partial","yes","no","no"] },
  { name: "Vue.ai",        slug: "vs-vue-ai",        url: "vue.ai",             startingPrice: "Enterprise",  bgColor: "#F3E8FF", textColor: "#7C3AED", cells: ["yes","yes","partial","partial","no","no","no","partial","no","yes","yes","no"] },
];

const BOTZUDIO_CELLS: Cell[] = ["yes","yes","yes","yes","yes","yes","yes","yes","yes","yes","yes","yes"];

const DEEP_DIVES = [
  { name:"Botika",        slug:"vs-botika",        tagColor:"#7C3AED", tagBg:"#EDE9FE", pros:["Good garment accuracy for western wear","Clean output quality"], cons:["No virtual try-on — only flat garment → model generation","Subscription-only pricing, credits expire monthly","Very limited South Asian model options; no ethnic wear","No FLUX Pro integration — older generation pipeline"] },
  { name:"Pebblely",      slug:"vs-pebblely",      tagColor:"#16A34A", tagBg:"#DCFCE7", pros:["Fast background replacement","Good for flat-lay product photography"], cons:["No human model photography at all","Cannot generate a garment on a model","Not fashion-specific — same tool for furniture and food","No try-on or garment-on-person capability"] },
  { name:"Pixelcut",      slug:"vs-pixelcut",      tagColor:"#D97706", tagBg:"#FEF3C7", pros:["Easy background removal","Mobile app available"], cons:["No AI model generation whatsoever","Cannot place garments on models in any automated way","Quality inconsistent for catalog production at scale","No Indian model diversity or ethnic wear support"] },
  { name:"Claid.ai",      slug:"vs-claid",         tagColor:"#DB2777", tagBg:"#FCE7F3", pros:["Best-in-class image upscaling","API access for enterprise workflows"], cons:["Enterprise-only pricing — minimum ~$100/month","No fashion model photography","Requires developer integration; no simple workflow","No virtual try-on, no free trial"] },
  { name:"Runway ML",     slug:"vs-runway",        tagColor:"#0284C7", tagBg:"#E0F2FE", pros:["Powerful general AI creative tools","Strong for editorial/artistic work"], cons:["Requires significant prompt engineering — not point-and-shoot","Inconsistent garment accuracy: design may change completely","Generation takes 3–5 minutes per image","No Indian fashion model options"] },
  { name:"Adobe Firefly", slug:"vs-adobe-firefly", tagColor:"#DC2626", tagBg:"#FEE2E2", pros:["Integrated with Creative Cloud","Commercially safe training data"], cons:["Requires design expertise — not for fashion ops teams","Full capability needs Creative Cloud All Apps (~₹5,000/mo)","No Indian fashion, ethnic wear, or South Asian model styles","No virtual try-on pipeline"] },
  { name:"Midjourney",    slug:"vs-midjourney",    tagColor:"#6366F1", tagBg:"#EEF2FF", pros:["World-class general image aesthetics","Active community, fast iteration"], cons:["Cannot preserve your actual garment — generates 'similar style'","Discord-only interface — no professional SaaS workflow","No virtual try-on or garment placement on real person","Cannot batch-produce consistent catalog images at scale"] },
  { name:"DALL-E 3",      slug:"vs-dalle",         tagColor:"#10B981", tagBg:"#D1FAE5", pros:["Strong text-following capability","Pay-per-image API pricing"], cons:["Cannot use your actual garment photo as input — text-only","No virtual try-on or image-to-image garment placement","API-only — requires developer to build a usable UI","No Indian model diversity or ethnic wear training"] },
  { name:"Zyler",         slug:"vs-zyler",         tagColor:"#0891B2", tagBg:"#CFFAFE", pros:["Solid virtual try-on for customer-facing experiences","E-commerce widget integration"], cons:["Enterprise-only — no self-serve access, requires sales","No AI fashion model photography or catalog generation","Annual contracts only — no monthly or pay-per-use option","No Indian market focus or ethnic wear support"] },
  { name:"Vue.ai",        slug:"vs-vue-ai",        tagColor:"#7C3AED", tagBg:"#F3E8FF", pros:["Comprehensive enterprise fashion AI suite","Strong large-retailer integrations"], cons:["Enterprise-only — contracts in lakhs, not for D2C brands","Weeks-to-months implementation timelines, not minutes","No self-serve access, no free trial","FLUX Pro generation pipeline not available"] },
];

// ─── Cell icon ───────────────────────────────────────────────────────────────

function CellIcon({ v, isUs = false }: { v: Cell; isUs?: boolean }) {
  if (v === "yes") return <Check size={17} strokeWidth={2.5} color={isUs ? "#8B5CF6" : "#22C55E"} />;
  if (v === "partial") return <Minus size={17} strokeWidth={2.5} color="#F59E0B" />;
  return <span style={{ fontSize: 17, color: "#CBD5E1", fontWeight: 700, lineHeight: 1, userSelect: "none" }}>—</span>;
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ComparePage() {
  const [mobileCmpIdx, setMobileCmpIdx] = useState(0);

  return (
    <div style={{ minHeight: "100vh", background: "#FFFDF5", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <style>{`
        .cp-desktop { display: block; }
        .cp-mobile  { display: none;  }
        .cp-chip-row { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
        .cp-chip-row::-webkit-scrollbar { display: none; }
        @media (max-width: 860px) {
          .cp-desktop { display: none;  }
          .cp-mobile  { display: block; }
        }
      `}</style>

      <Nav />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div style={{ padding: "120px 24px 48px", textAlign: "center" }}>
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
          fontFamily: "'Outfit', sans-serif", fontWeight: 900,
          fontSize: "clamp(28px, 5vw, 52px)", lineHeight: 1.1,
          color: "#1E293B", letterSpacing: "-1px",
          maxWidth: 720, margin: "0 auto 16px",
        }}>
          How Botzudio compares to <span style={{ color: "#8B5CF6" }}>10 alternatives</span>
        </h1>
        <p style={{ fontSize: 16, color: "#64748B", maxWidth: 540, margin: "0 auto 24px", lineHeight: 1.7 }}>
          We compared Botzudio against the most popular AI fashion photography, image generation, and try-on tools. Here's the full breakdown — including where they fall short.
        </p>
        {/* Legend */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20, flexWrap: "wrap" }}>
          {[
            { icon: <Check size={14} strokeWidth={2.5} color="#22C55E" />, label: "Yes" },
            { icon: <Minus size={14} strokeWidth={2.5} color="#F59E0B" />, label: "Partial" },
            { icon: <span style={{ fontSize: 15, color: "#CBD5E1", fontWeight: 700 }}>—</span>, label: "No" },
          ].map(l => (
            <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#475569", fontWeight: 600 }}>
              {l.icon} {l.label}
            </div>
          ))}
        </div>
      </div>

      {/* ── Comparison Table ─────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 16px 80px" }}>

        {/* ── DESKTOP table (scrollable) ── */}
        <div className="cp-desktop" style={{ overflowX: "auto", borderRadius: 20, border: "2px solid #1E293B", boxShadow: "4px 4px 0 #1E293B" }}>
          <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 1080 }}>
            <thead>
              <tr>
                {/* Feature col */}
                <th style={{
                  padding: "18px 20px", textAlign: "left",
                  fontSize: 11, fontWeight: 800, letterSpacing: "0.1em",
                  textTransform: "uppercase", color: "#64748B",
                  background: "#F8FAFC", borderBottom: "2px solid #1E293B",
                  width: 220, minWidth: 180,
                }}>Features</th>

                {/* Botzudio col */}
                <th style={{
                  padding: "18px 14px", textAlign: "center",
                  background: "linear-gradient(150deg, #8B5CF6 0%, #6D28D9 100%)",
                  borderBottom: "2px solid #1E293B",
                  borderLeft: "2px solid #1E293B",
                  minWidth: 110,
                }}>
                  <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: 15, color: "#fff" }}>Botzudio</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", marginTop: 3, fontWeight: 600 }}>From ₹499</div>
                </th>

                {/* Competitor cols */}
                {COMPETITORS.map((c, ci) => (
                  <th key={c.name} style={{
                    padding: "14px 10px", textAlign: "center",
                    background: "#F8FAFC",
                    borderBottom: "2px solid #1E293B",
                    borderLeft: "1px solid #E2E8F0",
                    minWidth: 88,
                  }}>
                    <Link to={`/compare/${c.slug}`} style={{ textDecoration: "none" }}>
                      <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 12, color: "#1E293B", marginBottom: 3 }}>{c.name}</div>
                      <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 600 }}>{c.startingPrice}</div>
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FEATURES.map((feat, fi) => (
                <tr key={feat.label} style={{ background: fi % 2 === 0 ? "#fff" : "#FAFAF8" }}>
                  {/* Feature label */}
                  <td style={{ padding: "13px 20px", borderBottom: "1px solid #E2E8F0", borderTop: "none" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#1E293B", lineHeight: 1.4 }}>{feat.label}</div>
                    {feat.note && <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>{feat.note}</div>}
                  </td>

                  {/* Botzudio cell */}
                  <td style={{
                    textAlign: "center", padding: "13px 10px",
                    borderBottom: "1px solid rgba(139,92,246,0.2)",
                    borderLeft: "2px solid #1E293B",
                    background: fi % 2 === 0 ? "rgba(139,92,246,0.07)" : "rgba(139,92,246,0.05)",
                  }}>
                    <CellIcon v={BOTZUDIO_CELLS[fi]!} isUs />
                  </td>

                  {/* Competitor cells */}
                  {COMPETITORS.map(c => (
                    <td key={c.name} style={{
                      textAlign: "center", padding: "13px 10px",
                      borderBottom: "1px solid #F1F5F9",
                      borderLeft: "1px solid #F1F5F9",
                    }}>
                      <CellIcon v={c.cells[fi] as Cell} />
                    </td>
                  ))}
                </tr>
              ))}

              {/* CTA row */}
              <tr>
                <td style={{ background: "#F8FAFC", borderTop: "2px solid #E2E8F0" }} />
                <td style={{
                  background: "linear-gradient(150deg, #8B5CF6, #6D28D9)",
                  borderLeft: "2px solid #1E293B",
                  padding: "16px 10px", textAlign: "center",
                  borderTop: "2px solid #1E293B",
                }}>
                  <Link to="/login" style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    padding: "7px 14px", borderRadius: 9999,
                    background: "#fff", color: "#8B5CF6",
                    fontSize: 11, fontWeight: 800,
                    textDecoration: "none", whiteSpace: "nowrap",
                    border: "1.5px solid rgba(255,255,255,0.5)",
                  }}>
                    Try Free <ArrowRight size={10} strokeWidth={2.5} />
                  </Link>
                </td>
                {COMPETITORS.map(c => (
                  <td key={c.name} style={{
                    background: "#F8FAFC", textAlign: "center",
                    padding: "16px 6px", borderLeft: "1px solid #E2E8F0",
                    borderTop: "2px solid #E2E8F0",
                  }}>
                    <Link to={`/compare/${c.slug}`} style={{
                      fontSize: 10, color: "#94A3B8", textDecoration: "none", fontWeight: 600,
                    }}>
                      {c.url}
                    </Link>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* ── MOBILE table (chip selector + 2-col) ── */}
        <div className="cp-mobile">
          {/* Competitor chip selector */}
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#64748B", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10 }}>
              Compare against:
            </p>
            <div className="cp-chip-row">
              {COMPETITORS.map((c, i) => (
                <button
                  key={c.name}
                  onClick={() => setMobileCmpIdx(i)}
                  style={{
                    padding: "7px 14px",
                    borderRadius: 9999,
                    border: `2px solid ${mobileCmpIdx === i ? c.textColor : "#E2E8F0"}`,
                    background: mobileCmpIdx === i ? c.bgColor : "#fff",
                    color: mobileCmpIdx === i ? c.textColor : "#64748B",
                    fontWeight: 700, fontSize: 12,
                    whiteSpace: "nowrap", cursor: "pointer",
                    flexShrink: 0, transition: "all .15s",
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* 2-column comparison table */}
          <div style={{ borderRadius: 16, border: "2px solid #1E293B", overflow: "hidden", boxShadow: "3px 3px 0 #1E293B" }}>
            {/* Header */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 72px 72px", background: "#1E293B" }}>
              <div style={{ padding: "13px 14px", fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Feature
              </div>
              <div style={{ padding: "13px 8px", fontSize: 11, fontWeight: 800, color: "#C4B5FD", textTransform: "uppercase", textAlign: "center", background: "rgba(139,92,246,0.3)" }}>
                Ours
              </div>
              <div style={{ padding: "13px 8px", fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", textAlign: "center" }}>
                {COMPETITORS[mobileCmpIdx].name}
              </div>
            </div>

            {/* Feature rows */}
            {FEATURES.map((feat, fi) => (
              <div key={feat.label} style={{
                display: "grid", gridTemplateColumns: "1fr 72px 72px",
                background: fi % 2 === 0 ? "#fff" : "#FAFAF8",
                borderTop: "1px solid #E2E8F0",
              }}>
                <div style={{ padding: "12px 14px" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#1E293B", lineHeight: 1.4 }}>{feat.label}</div>
                  {feat.note && <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 2, lineHeight: 1.4 }}>{feat.note}</div>}
                </div>
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: fi % 2 === 0 ? "rgba(139,92,246,0.07)" : "rgba(139,92,246,0.05)",
                }}>
                  <CellIcon v={BOTZUDIO_CELLS[fi]!} isUs />
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <CellIcon v={COMPETITORS[mobileCmpIdx].cells[fi] as Cell} />
                </div>
              </div>
            ))}

            {/* CTA row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 72px 72px", borderTop: "2px solid #1E293B" }}>
              <div style={{ padding: "14px", background: "#F8FAFC" }} />
              <div style={{ background: "linear-gradient(135deg, #8B5CF6, #6D28D9)", display: "flex", alignItems: "center", justifyContent: "center", padding: "10px 6px" }}>
                <Link to="/login" style={{ fontSize: 10, fontWeight: 800, color: "#fff", textDecoration: "none", textAlign: "center", lineHeight: 1.4 }}>
                  Try Free
                </Link>
              </div>
              <div style={{ background: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Link to={`/compare/${COMPETITORS[mobileCmpIdx].slug}`} style={{ fontSize: 10, color: "#7C3AED", fontWeight: 700, textDecoration: "none", textAlign: "center", padding: "0 4px" }}>
                  Full comparison →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Where competitors fall short ─────────────────────────────────── */}
      <div style={{ background: "#0F172A", padding: "72px 24px" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>

          {/* Section header */}
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
              fontFamily: "'Outfit', sans-serif", fontWeight: 900,
              fontSize: "clamp(26px, 4vw, 40px)",
              color: "#fff", margin: "0 auto 12px", maxWidth: 600,
            }}>
              What the table doesn't show
            </h2>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 15, maxWidth: 480, margin: "0 auto", lineHeight: 1.7 }}>
              Numbers tell part of the story. Here's what using these tools actually looks like for a fashion brand.
            </p>
          </div>

          {/* Cards grid */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 16,
          }}>
            {DEEP_DIVES.map(d => (
              <div key={d.name} style={{
                background: "rgba(255,255,255,0.04)",
                border: "1.5px solid rgba(255,255,255,0.09)",
                borderRadius: 16, padding: 24,
                display: "flex", flexDirection: "column", gap: 0,
              }}>
                {/* Name tag */}
                <div style={{
                  display: "inline-block",
                  background: d.tagBg, color: d.tagColor,
                  border: `1.5px solid ${d.tagColor}`,
                  borderRadius: 9999, fontSize: 11, fontWeight: 800,
                  padding: "3px 12px", marginBottom: 14, alignSelf: "flex-start",
                }}>{d.name}</div>

                {/* Pros */}
                {d.pros.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: 8 }}>
                      What it does well
                    </div>
                    {d.pros.map((p, i) => (
                      <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 5 }}>
                        <Check size={12} strokeWidth={3} color="#34D399" style={{ flexShrink: 0, marginTop: 2 }} />
                        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.55 }}>{p}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Cons */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: 8 }}>
                    Where it falls short
                  </div>
                  {d.cons.map((c, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 7 }}>
                      <X size={12} strokeWidth={3} color="#F87171" style={{ flexShrink: 0, marginTop: 2 }} />
                      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.55 }}>{c}</span>
                    </div>
                  ))}
                </div>

                {/* Link */}
                <Link
                  to={`/compare/${d.slug}`}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    fontSize: 11, fontWeight: 800,
                    color: d.tagColor, background: d.tagBg,
                    border: `1px solid ${d.tagColor}`,
                    borderRadius: 9999, padding: "5px 12px",
                    textDecoration: "none", alignSelf: "flex-start",
                    transition: "opacity .15s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = "0.8"; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
                >
                  Full comparison <ArrowRight size={10} strokeWidth={2.5} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <div style={{ padding: "80px 24px", textAlign: "center", background: "#FFFDF5" }}>
        <div style={{ maxWidth: 540, margin: "0 auto" }}>
          <h2 style={{
            fontFamily: "'Outfit', sans-serif", fontWeight: 900,
            fontSize: "clamp(26px, 4vw, 42px)",
            color: "#1E293B", marginBottom: 14, letterSpacing: "-0.5px",
          }}>
            Ready to switch to the tool built for fashion?
          </h2>
          <p style={{ fontSize: 16, color: "#64748B", marginBottom: 36, lineHeight: 1.7 }}>
            No subscription. No design skills required. Your first catalog images in under 2 minutes.
          </p>
          <Link
            to="/login"
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "14px 32px", borderRadius: 9999,
              background: "#8B5CF6", color: "#fff",
              border: "2px solid #1E293B", boxShadow: "4px 4px 0 #1E293B",
              fontSize: 15, fontWeight: 900,
              textDecoration: "none", fontFamily: "'Outfit', sans-serif",
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
      </div>

      <CinematicFooter />
    </div>
  );
}
