import { useState } from "react";
import { Link } from "react-router-dom";
import { Nav } from "./Nav";
import { CinematicFooter } from "../components/ui/motion-footer";
import { Clock, Calendar, ArrowLeft, ArrowRight, Sparkles } from "lucide-react";

// ─── Blog data ─────────────────────────────────────────────────────────────

const BLOGS = [
  {
    id: "photoshoot-costs",
    tag: "Industry Insight",
    tagColor: "#F472B6",
    title: "Why Fashion Brands Are Ditching Traditional Photoshoots in 2025",
    excerpt:
      "A single model day costs ₹20,000–₹80,000. Add studio rental, photographer, stylist, and retouching — and a 50-SKU catalog shoot can run ₹3–8 lakhs. Here's why hundreds of brands are walking away from that math entirely.",
    readTime: "5 min read",
    date: "May 2025",
    content: [
      {
        type: "p",
        text: "Running a fashion brand means running a content machine. Every SKU you launch needs photography. Every season means new shoots. Every unsold photo is a sunk cost that never earns back.",
      },
      { type: "h2", text: "The real cost breakdown nobody talks about" },
      {
        type: "p",
        text: "Brands often quote just the photographer's day rate when estimating shoot costs. The actual list is much longer:",
      },
      {
        type: "ul",
        items: [
          "Model: ₹15,000–₹80,000 per day (per model)",
          "Studio rental: ₹10,000–₹40,000 per day",
          "Photographer: ₹15,000–₹60,000 per day",
          "Stylist and makeup artist: ₹8,000–₹25,000",
          "Post-production retouching: ₹200–₹800 per image",
          "Logistics, transport, food: ₹5,000–₹15,000",
          "Reshoots for garments that didn't photograph well: unpredictable",
        ],
      },
      {
        type: "p",
        text: "For a 50-SKU catalog with front, back, and detail shots — you're looking at 150+ final images. At even the conservative end, that's ₹3–4 lakhs per shoot, twice a year. For a lean D2C startup, that's money that could fund 3 months of marketing.",
      },
      { type: "h2", text: "The time problem is even worse" },
      {
        type: "p",
        text: "Book a studio 3 weeks out. Coordinate the model's availability. Wait a week for edited files. Upload to your product listings. By the time your catalog goes live, your launch window has shifted. Meanwhile, competitors who shoot faster are already capturing search traffic.",
      },
      {
        type: "p",
        text: "In D2C fashion, velocity matters. A brand that can go from sample to live listing in 48 hours will consistently out-execute one that needs 3 weeks. Speed is a product advantage.",
      },
      { type: "h2", text: "The flexibility trap" },
      {
        type: "p",
        text: "Say you shot 200 images, and then the manufacturer changes the collar slightly, or a colour-way comes in differently than swatches showed. You can't just re-edit in Photoshop — the garment is physically different. That's a reshoot. More budget, more time, more coordination.",
      },
      {
        type: "p",
        text: "AI model photography doesn't have this problem. Upload the new image of the garment, generate fresh shots in under a minute. No rescheduling.",
      },
      { type: "h2", text: "What's actually changing in 2025" },
      {
        type: "p",
        text: "The quality barrier that kept AI photography as a 'not quite there yet' option has disappeared. FLUX Pro and similar models now produce images that are indistinguishable from studio work to the average shopper. Garment texture, drape, colour accuracy — all rendered faithfully. The only thing left to give up is the invoice from the studio.",
      },
      {
        type: "p",
        text: "Botzudio was built for exactly this transition. Upload your garment flat or on a hanger. Pick a model. Your catalog photo generates in 30–60 seconds. No booking, no coordination, no post-production queue.",
      },
      { type: "cta", text: "Try it free — your first image in under 2 minutes", to: "/login" },
    ],
  },
  {
    id: "ai-model-photography-guide",
    tag: "How-To Guide",
    tagColor: "#8B5CF6",
    title: "AI Model Photography 101: Studio-Quality Images Without a Studio",
    excerpt:
      "AI model photography is the fastest-growing content workflow in fashion e-commerce. This guide explains exactly how it works, what to look for in a tool, and how to get the best output from Botzudio on your first try.",
    readTime: "7 min read",
    date: "April 2025",
    content: [
      {
        type: "p",
        text: "If you've heard the term 'AI model photography' but aren't sure how it actually works — or whether the outputs are usable for real e-commerce — this guide is for you.",
      },
      { type: "h2", text: "What is AI model photography?" },
      {
        type: "p",
        text: "AI model photography is the process of generating realistic product images by combining a photo of your garment with an AI-rendered human model. You upload a flat-lay or hanger shot of the garment, and the system generates a photo of a model wearing it — with accurate fabric drape, colour, texture, and fit.",
      },
      {
        type: "p",
        text: "Unlike simple background removal or Photoshop compositing, modern AI model photography uses diffusion models trained on millions of fashion images. The result is a photo that was never actually taken, but looks like it was.",
      },
      { type: "h2", text: "How the technology works" },
      {
        type: "p",
        text: "At the core is a technique called image-conditioned diffusion. The AI model takes your garment image as a 'condition' — it understands the garment's shape, colour, and texture — and generates a full photo of a model wearing it. This is different from simply copy-pasting a garment onto a stock model photo; the AI actually understands how fabric hangs, how light falls on it, and how it would look from different angles.",
      },
      {
        type: "p",
        text: "Botzudio uses both Gemini and FLUX Pro pipelines. Gemini handles the understanding and prompt generation. FLUX Pro handles the image synthesis. The combination gives you fast generation (30–60 seconds) with studio-level quality.",
      },
      { type: "h2", text: "What makes a good input image?" },
      {
        type: "ul",
        items: [
          "Clean background (white or neutral) — makes garment edges easier to read",
          "Good lighting with no harsh shadows obscuring the garment",
          "Full garment visible — no cropped hems or necklines",
          "High resolution — at least 1000px on the short side",
          "Flat-lay or straight-on hanger shots work best",
        ],
      },
      {
        type: "p",
        text: "Even imperfect inputs produce good results, but starting with a clean garment photo gives you more control over the final output.",
      },
      { type: "h2", text: "Choosing the right model" },
      {
        type: "p",
        text: "Botzudio offers multiple model styles — different body types, skin tones, poses, and settings. For Indian fashion brands in particular, choosing a model that matches your target customer's profile dramatically increases engagement. Shoppers buy more when they can see themselves in the product.",
      },
      { type: "h2", text: "What you can and can't do" },
      {
        type: "p",
        text: "AI model photography works exceptionally well for tops, kurtas, dresses, co-ords, jackets, and most garments where the front view is the primary purchase signal. It works less well for structured tailoring where precise shoulder and lapel fit are critical (though this is improving rapidly).",
      },
      {
        type: "p",
        text: "For Try-On — placing a specific customer's or influencer's image in the garment — Botzudio has a dedicated Virtual Try-On tab that handles this use case separately.",
      },
      { type: "cta", text: "Generate your first AI model photo →", to: "/login" },
    ],
  },
  {
    id: "indian-d2c-brands",
    tag: "Case Study",
    tagColor: "#34D399",
    title: "How Indian D2C Fashion Brands Are Cutting Photography Costs by 90%",
    excerpt:
      "The Indian fashion D2C market is growing at 30% annually — but rising input costs are squeezing margins. AI photography is the single highest-leverage change brands are making to stay profitable without sacrificing content quality.",
    readTime: "6 min read",
    date: "March 2025",
    content: [
      {
        type: "p",
        text: "Indian D2C fashion has never moved faster. Brands that launched two years ago are now doing ₹5–20 crore ARR. But with that growth comes a content problem: more SKUs, more platforms, more formats — and photography costs that scale linearly with catalog size.",
      },
      { type: "h2", text: "The catalog content bottleneck" },
      {
        type: "p",
        text: "A typical D2C fashion brand launching a new collection needs 8–12 photos per product: front, back, detail shots, and at least one lifestyle or model shot. For a 30-piece collection, that's 240–360 photos before you can even think about listing. At traditional shoot rates, this creates a 3-week window between product arrival and going live — a window where your capital is tied up in inventory earning nothing.",
      },
      {
        type: "p",
        text: "The brands that are scaling fastest have found a way to compress this to 48 hours. They shoot product flat-lays in-house, upload to Botzudio, and have model photos ready before the courier delivers their stock to the warehouse.",
      },
      { type: "h2", text: "Where the 90% savings actually come from" },
      {
        type: "ul",
        items: [
          "Model fees eliminated: ₹0 vs ₹15,000–₹80,000 per day",
          "Studio rental eliminated: ₹0 vs ₹10,000–₹40,000 per day",
          "Post-production dramatically reduced: 2 hours vs 2 weeks",
          "Reshoot costs eliminated: change the garment, re-generate instantly",
          "Team travel and logistics eliminated completely",
        ],
      },
      {
        type: "p",
        text: "A brand generating 200 model photos per month with Botzudio spends approximately ₹3,000–₹6,000 in credits. The equivalent traditional shoot would cost ₹60,000–₹1,20,000. That's an 85–95% reduction.",
      },
      { type: "h2", text: "The quality question" },
      {
        type: "p",
        text: "The concern we hear most: 'Will customers notice?' Based on results across dozens of brands, the answer is no — and in some cases, AI images actually perform better. Because you can generate 10 variations and pick the one that converts best, rather than using whatever came back from the photographer.",
      },
      { type: "h2", text: "Getting started without disrupting existing workflows" },
      {
        type: "p",
        text: "You don't need to switch your entire photography workflow overnight. Most brands start by using AI model photography for restock items, newer collections, or lower-tier listings. Once they see the quality, they expand. Within a season, many have eliminated traditional shoots for model photography entirely, keeping human photographers only for brand campaign work.",
      },
      {
        type: "p",
        text: "Botzudio's credit system means there's no subscription risk. Buy credits when you have inventory to shoot. Pause when you don't. The math works at 20 SKUs just as well as at 2,000.",
      },
      { type: "cta", text: "Start with free credits — no card required", to: "/login" },
    ],
  },
  {
    id: "hidden-costs",
    tag: "Business Strategy",
    tagColor: "#FBBF24",
    title: "The Hidden Costs of Fashion Photography (And How to Eliminate Them)",
    excerpt:
      "The invoice from the photographer is just the beginning. Here are the costs that never show up on a shoot quote — but quietly eat into every brand's margin.",
    readTime: "4 min read",
    date: "February 2025",
    content: [
      {
        type: "p",
        text: "When a brand calculates the cost of a shoot, they add up the obvious line items: photographer, model, studio. What they miss are the costs that are harder to measure but just as real.",
      },
      { type: "h2", text: "Opportunity cost: inventory that can't be sold yet" },
      {
        type: "p",
        text: "Your garments arrive. They sit in storage for 2–3 weeks while you wait for shoot slots and edited images. That's inventory with a cost of goods that hasn't generated a single rupee of revenue. The working capital tied up in that gap compounds across every new collection.",
      },
      {
        type: "p",
        text: "For a brand with ₹20 lakh in inventory at any time, even a 2-week photography delay represents a meaningful drag on capital efficiency.",
      },
      { type: "h2", text: "Coordination overhead" },
      {
        type: "p",
        text: "Someone on your team spends hours every shoot cycle: contacting agencies, comparing models, negotiating rates, coordinating call times, managing logistics on the day. This time has a cost. For a founder-led brand, that's hours not spent on product, marketing, or operations.",
      },
      { type: "h2", text: "The reshoot tax" },
      {
        type: "p",
        text: "Garments that photograph poorly are common — a seam that shows badly, a colour that's off under studio lighting, a fit issue that wasn't visible on the hanger. Reshoots require rebooking the full setup. Many brands accept mediocre images rather than absorb the reshoot cost. Mediocre images reduce conversion.",
      },
      { type: "h2", text: "Inconsistency across your catalog" },
      {
        type: "p",
        text: "When shoots happen at different times, with different photographers and studios, your catalog develops inconsistent aesthetics — different shadows, different skin tones, different crop ratios. Customers notice. Inconsistency signals an amateur brand.",
      },
      {
        type: "p",
        text: "AI model photography solves this by default. Every image uses the same generation pipeline, the same model settings, the same visual language. Your catalog looks cohesive even if you uploaded garments a month apart.",
      },
      { type: "h2", text: "What 'eliminating photography costs' actually unlocks" },
      {
        type: "p",
        text: "Brands that shift to AI photography don't just save money — they reinvest it into the activities that compound: more SKUs, faster launches, A/B testing different model styles to find which converts better. Speed and cost together create a structural advantage that traditional-shoot brands can't match at scale.",
      },
      { type: "cta", text: "See what AI photography costs for your catalog size →", to: "/login" },
    ],
  },
];

// ─── Sub-components ─────────────────────────────────────────────────────────

function BlogCard({ blog, onRead }: { blog: typeof BLOGS[0]; onRead: () => void }) {
  return (
    <article
      style={{
        background: "#fff",
        border: "1.5px solid #1E293B",
        borderRadius: 20,
        boxShadow: "4px 4px 0 #1E293B",
        padding: 28,
        display: "flex",
        flexDirection: "column",
        gap: 14,
        cursor: "default",
        transition: "transform .18s cubic-bezier(.34,1.56,.64,1), box-shadow .18s ease",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.transform = "translate(-2px,-2px)";
        (e.currentTarget as HTMLElement).style.boxShadow = "6px 6px 0 #1E293B";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.transform = "translate(0,0)";
        (e.currentTarget as HTMLElement).style.boxShadow = "4px 4px 0 #1E293B";
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{
          background: blog.tagColor + "20",
          color: blog.tagColor,
          border: `1.5px solid ${blog.tagColor}`,
          borderRadius: 9999,
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          padding: "3px 10px",
        }}>{blog.tag}</span>
      </div>

      <h2 style={{
        fontFamily: "'Outfit', sans-serif",
        fontWeight: 800,
        fontSize: 20,
        lineHeight: 1.3,
        color: "#1E293B",
        margin: 0,
      }}>{blog.title}</h2>

      <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.65, margin: 0 }}>
        {blog.excerpt}
      </p>

      <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: "auto", paddingTop: 8 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#94A3B8" }}>
          <Clock size={12} strokeWidth={2} />{blog.readTime}
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#94A3B8" }}>
          <Calendar size={12} strokeWidth={2} />{blog.date}
        </span>
        <button
          onClick={onRead}
          style={{
            marginLeft: "auto",
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 16px",
            borderRadius: 9999,
            background: "#8B5CF6",
            color: "#fff",
            border: "1.5px solid #1E293B",
            boxShadow: "2px 2px 0 #1E293B",
            fontSize: 12, fontWeight: 800,
            cursor: "pointer",
            transition: "transform .18s cubic-bezier(.34,1.56,.64,1), box-shadow .18s ease",
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
          Read Article <ArrowRight size={11} strokeWidth={2.5} />
        </button>
      </div>
    </article>
  );
}

function BlogArticle({ blog, onBack }: { blog: typeof BLOGS[0]; onBack: () => void }) {
  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "60px 24px 80px" }}>
      <button
        onClick={onBack}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          marginBottom: 36,
          background: "none", border: "none",
          fontSize: 13, fontWeight: 700, color: "#475569",
          cursor: "pointer",
          padding: "6px 0",
          transition: "color .15s",
        }}
        onMouseEnter={e => { e.currentTarget.style.color = "#8B5CF6"; }}
        onMouseLeave={e => { e.currentTarget.style.color = "#475569"; }}
      >
        <ArrowLeft size={14} strokeWidth={2.5} /> Back to Blog
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <span style={{
          background: blog.tagColor + "20",
          color: blog.tagColor,
          border: `1.5px solid ${blog.tagColor}`,
          borderRadius: 9999,
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          padding: "3px 10px",
        }}>{blog.tag}</span>
        <span style={{ fontSize: 12, color: "#94A3B8", display: "flex", alignItems: "center", gap: 5 }}>
          <Clock size={12} strokeWidth={2} />{blog.readTime}
        </span>
        <span style={{ fontSize: 12, color: "#94A3B8", display: "flex", alignItems: "center", gap: 5 }}>
          <Calendar size={12} strokeWidth={2} />{blog.date}
        </span>
      </div>

      <h1 style={{
        fontFamily: "'Outfit', sans-serif",
        fontWeight: 900,
        fontSize: "clamp(26px, 5vw, 40px)",
        lineHeight: 1.2,
        color: "#1E293B",
        marginBottom: 40,
      }}>{blog.title}</h1>

      <div style={{ borderTop: "1.5px solid #E2E8F0", marginBottom: 40 }} />

      {blog.content.map((block, i) => {
        if (block.type === "p") return (
          <p key={i} style={{ fontSize: 16, lineHeight: 1.8, color: "#334155", marginBottom: 20 }}>
            {block.text}
          </p>
        );
        if (block.type === "h2") return (
          <h2 key={i} style={{
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 800, fontSize: 22,
            color: "#1E293B", marginTop: 40, marginBottom: 12,
          }}>{block.text}</h2>
        );
        if (block.type === "ul") return (
          <ul key={i} style={{ marginBottom: 20, paddingLeft: 20 }}>
            {(block.items ?? []).map((item, j) => (
              <li key={j} style={{ fontSize: 15, lineHeight: 1.75, color: "#334155", marginBottom: 6 }}>
                {item}
              </li>
            ))}
          </ul>
        );
        if (block.type === "cta") return (
          <div key={i} style={{
            marginTop: 48,
            background: "linear-gradient(135deg, #EDE9FE 0%, #FCE7F3 100%)",
            border: "1.5px solid #1E293B",
            borderRadius: 16,
            boxShadow: "4px 4px 0 #1E293B",
            padding: "28px 32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 20,
            flexWrap: "wrap",
          }}>
            <div style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 800, fontSize: 18,
              color: "#1E293B",
            }}>{block.text}</div>
            <Link
              to={block.to ?? "/login"}
              style={{
                display: "flex", alignItems: "center", gap: 7,
                padding: "10px 22px",
                borderRadius: 9999,
                background: "#8B5CF6",
                color: "#fff",
                border: "2px solid #1E293B",
                boxShadow: "3px 3px 0 #1E293B",
                fontSize: 13, fontWeight: 800,
                textDecoration: "none",
                flexShrink: 0,
                transition: "transform .18s cubic-bezier(.34,1.56,.64,1), box-shadow .18s ease",
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
              <Sparkles size={13} strokeWidth={2.5} /> Get Started
            </Link>
          </div>
        );
        return null;
      })}
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function BlogPage() {
  const [selected, setSelected] = useState<typeof BLOGS[0] | null>(null);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg, #FFFDF5)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <Nav />

      {selected ? (
        <BlogArticle blog={selected} onBack={() => { setSelected(null); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
      ) : (
        <>
          {/* Hero */}
          <div style={{
            paddingTop: 120,
            paddingBottom: 56,
            textAlign: "center",
            padding: "120px 24px 56px",
          }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              background: "#EDE9FE", color: "#7C3AED",
              border: "1.5px solid #DDD6FE",
              borderRadius: 9999,
              fontSize: 11, fontWeight: 800,
              letterSpacing: "0.08em", textTransform: "uppercase",
              padding: "5px 14px",
              marginBottom: 20,
            }}>
              <Sparkles size={11} strokeWidth={2.5} /> Botzudio Blog
            </div>
            <h1 style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 900,
              fontSize: "clamp(32px, 6vw, 56px)",
              lineHeight: 1.1,
              color: "#1E293B",
              letterSpacing: "-1px",
              maxWidth: 700,
              margin: "0 auto 16px",
            }}>
              Insights on AI fashion photography
            </h1>
            <p style={{ fontSize: 16, color: "#64748B", maxWidth: 520, margin: "0 auto" }}>
              Strategy, how-tos, and industry analysis for fashion brands using AI to compete smarter.
            </p>
          </div>

          {/* Grid */}
          <div style={{
            maxWidth: 1080,
            margin: "0 auto",
            padding: "0 24px 100px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(460px, 1fr))",
            gap: 24,
          }}>
            {BLOGS.map(blog => (
              <BlogCard
                key={blog.id}
                blog={blog}
                onRead={() => { setSelected(blog); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              />
            ))}
          </div>
        </>
      )}

      <CinematicFooter />
    </div>
  );
}
