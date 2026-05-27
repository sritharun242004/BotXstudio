import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useCredits } from "../context/CreditsContext";
import {
  BookOpen, Sparkles, Palette, Bookmark, FolderOpen,
  CreditCard, BarChart2, Star, HelpCircle, Lightbulb,
  Info, CheckCircle2, AlertTriangle, ChevronRight,
  Upload, Image, Layers, Zap, Shield,
  Menu, X, Code2, Key, Globe, Lock, Copy, Check as CheckIcon,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type DocKey =
  | "start" | "generate" | "saved"
  | "assets" | "credits" | "dashboard" | "best" | "faq" | "api";

const SECTIONS: { key: DocKey; label: string; Icon: React.ElementType; group: string }[] = [
  { key: "start",     label: "Getting Started",   Icon: BookOpen,    group: "Overview" },
  { key: "generate",  label: "Generate Images",   Icon: Sparkles,    group: "Tab Guides" },
  { key: "saved",     label: "Saved Exports",     Icon: Bookmark,    group: "Tab Guides" },
  { key: "assets",    label: "Uploaded Assets",   Icon: FolderOpen,  group: "Tab Guides" },
  { key: "credits",   label: "Credits & Billing", Icon: CreditCard,  group: "Tab Guides" },
  { key: "dashboard", label: "Dashboard",         Icon: BarChart2,   group: "Tab Guides" },
  { key: "best",      label: "Best Practices",    Icon: Star,        group: "Resources" },
  { key: "faq",       label: "FAQ",               Icon: HelpCircle,  group: "Resources" },
  { key: "api",       label: "API Reference",     Icon: Code2,       group: "Resources" },
];

// ─── Content atoms ────────────────────────────────────────────────────────────

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="docStep">
      <div className="docStepNum">{n}</div>
      <div className="docStepBody">
        <div className="docStepTitle">{title}</div>
        <div className="docStepDesc">{children}</div>
      </div>
    </div>
  );
}

function Callout({ type, children }: { type: "tip" | "info" | "warning" | "success"; children: React.ReactNode }) {
  const map = {
    tip:     { Icon: Lightbulb,    cls: "docCalloutTip",     label: "Tip" },
    info:    { Icon: Info,         cls: "docCalloutInfo",    label: "Note" },
    warning: { Icon: AlertTriangle,cls: "docCalloutWarn",    label: "Important" },
    success: { Icon: CheckCircle2, cls: "docCalloutSuccess", label: "Best result" },
  };
  const { Icon, cls, label } = map[type];
  return (
    <div className={`docCallout ${cls}`}>
      <Icon size={15} strokeWidth={2} className="docCalloutIcon" />
      <div><span className="docCalloutLabel">{label}: </span>{children}</div>
    </div>
  );
}

function SectionTitle({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="docSectionHead">
      <h2 className="docSectionTitle">{title}</h2>
      <p className="docSectionDesc">{desc}</p>
    </div>
  );
}

function SubHead({ children }: { children: React.ReactNode }) {
  return <h3 className="docSubHead">{children}</h3>;
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="docList">
      {items.map((item, i) => (
        <li key={i} className="docListItem">
          <ChevronRight size={13} strokeWidth={2.5} className="docListIcon" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

// ─── Section content ──────────────────────────────────────────────────────────

function StartSection() {
  return (
    <div className="docContent">
      <SectionTitle
        title="Getting Started with Botzudio"
        desc="Everything you need to know to start generating stunning AI fashion images in minutes."
      />

      <div className="docHeroCard">
        <div className="docHeroIcon"><Sparkles size={28} strokeWidth={1.5} /></div>
        <div>
          <div className="docHeroTitle">Welcome to Botzudio</div>
          <div className="docHeroText">
            Botzudio is an AI-powered fashion image studio by The Bot Company. Upload garment photos and instantly
            generate professional model shots, background scenes, and print applications — no photography needed.
          </div>
        </div>
      </div>

      <SubHead>Quick Start — 3 Steps</SubHead>
      <Step n={1} title="Upload your garment">
        Go to <InlineCode>Uploaded Assets → Garments</InlineCode> and upload a clear photo of your clothing item.
        Plain white or studio backgrounds work best.
      </Step>
      <Step n={2} title="Open Generate Images">
        Switch to the <InlineCode>Generate Images</InlineCode> tab. Select your storyboard (or create a new one),
        attach the garment, choose a background and model style, then click <InlineCode>Generate Look</InlineCode>.
      </Step>
      <Step n={3} title="Download or save your results">
        Once generated, images appear in the results panel. Click any image to view full-size,
        download it, or save it to <InlineCode>Saved Exports</InlineCode> for later.
      </Step>

      <Callout type="info">
        All tabs are accessible from the left sidebar. Each tab is a self-contained workflow —
        you don't need to complete them in any particular order.
      </Callout>

      <SubHead>App Overview</SubHead>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, margin: "12px 0 18px" }}>
        {[
          { Icon: Palette,    label: "Add Prints",      desc: "Apply print designs to garments using the AI compositor." },
          { Icon: Sparkles,   label: "Generate Images", desc: "Create AI model shots, editorial scenes, and catalog images." },
          { Icon: Bookmark,   label: "Saved Exports",   desc: "Your personal library of all generated and saved images." },
          { Icon: FolderOpen, label: "Uploaded Assets", desc: "Manage garments, backgrounds, model references, and poses." },
          { Icon: CreditCard, label: "Credits",         desc: "View balance, transaction history, and top up your account." },
          { Icon: BarChart2,  label: "Dashboard",       desc: "Monitor usage stats, API activity, and generation trends." },
        ].map(t => (
          <div key={t.label} style={{ display: "flex", alignItems: "flex-start", gap: 12, background: "#F8F7FF", border: "1.5px solid #EDE9FE", borderRadius: 10, padding: "12px 16px" }}>
            <t.Icon size={16} strokeWidth={1.8} style={{ color: "var(--accent)", flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#1E293B", marginBottom: 2 }}>{t.label}</div>
              <div style={{ fontSize: 13, color: "#64748B" }}>{t.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function GenerateSection() {
  return (
    <div className="docContent">
      <SectionTitle
        title="Generate Images"
        desc="The core AI image generation workflow — turn garment photos into full fashion imagery."
      />

      <div className="docHeroCard">
        <div className="docHeroIcon"><Sparkles size={26} strokeWidth={1.5} /></div>
        <div>
          <div className="docHeroTitle">AI-Powered Fashion Photography</div>
          <div className="docHeroText">
            Botzudio uses Google Gemini and FLUX Pro to composite your garment onto virtual models and editorial scenes.
            Each generation deducts credits based on the AI model selected.
          </div>
        </div>
      </div>

      <SubHead>Step-by-step workflow</SubHead>
      <Step n={1} title="Select or create a Storyboard">
        A Storyboard groups your generation settings and results. Click <InlineCode>New Mood Board</InlineCode> in the library, give it a name, then open it.
      </Step>
      <Step n={2} title="Upload your garment image">
        In the Assets panel, upload a garment photo. Use a flat-lay or mannequin shot on a clean background. Up to 1 image for the primary garment.
      </Step>
      <Step n={3} title="Choose a background">
        Select a preset background style or upload your own reference in <InlineCode>Uploaded Assets → Backgrounds</InlineCode>.
      </Step>
      <Step n={4} title="Pick a model & pose (optional)">
        Upload a model reference in <InlineCode>Uploaded Assets → Models</InlineCode> to preserve skin tone and build. Add a pose under <InlineCode>Poses</InlineCode> to control body stance.
      </Step>
      <Step n={5} title="Set generation options">
        Choose the AI model, aspect ratio, and style notes. Then click <InlineCode>Generate Look</InlineCode>.
      </Step>
      <Step n={6} title="Review and save">
        Results appear below. Click any image to open full-size. Use the save icon to add to <InlineCode>Saved Exports</InlineCode>.
      </Step>

      <Callout type="tip">
        Generate a <strong>Detail Shot</strong> and <strong>Back View</strong> in one click after your primary look is generated — use the angle buttons in the results panel.
      </Callout>
      <Callout type="warning">
        Each generation costs credits. Check your balance in the <InlineCode>Credits</InlineCode> tab before running a batch. A warning appears if your balance is too low.
      </Callout>

      <SubHead>Generation settings</SubHead>
      <PropTable rows={[
        { name: "AI Model",     type: "select", required: true,  desc: "Flash · Plus · Pro · ProMax — controls speed, quality, and credit cost." },
        { name: "Aspect Ratio", type: "select", required: false, desc: "1:1 · 3:4 · 4:3 · 9:16 — use 3:4 for e-commerce product pages." },
        { name: "Background",   type: "image",  required: false, desc: "Preset scene style or upload a reference for an exact background match." },
        { name: "Model Ref",    type: "image",  required: false, desc: "Human reference photo to preserve skin tone, build, and facial identity." },
        { name: "Pose Ref",     type: "image",  required: false, desc: "Body pose reference to control the stance of the generated model." },
        { name: "Style Notes",  type: "text",   required: false, desc: "Free-text style keywords: 'golden-hour rooftop, warm editorial tones'." },
      ]} />

      <SubHead>AI Models compared</SubHead>
      <div style={{ overflowX: "auto", margin: "12px 0 18px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#F8F7FF" }}>
              <th style={{ textAlign: "left", padding: "9px 14px", borderBottom: "2px solid #DDD6FE", fontWeight: 700, color: "#1E293B" }}>Model</th>
              <th style={{ textAlign: "left", padding: "9px 14px", borderBottom: "2px solid #DDD6FE", fontWeight: 700, color: "#1E293B" }}>Credit cost</th>
              <th style={{ textAlign: "left", padding: "9px 14px", borderBottom: "2px solid #DDD6FE", fontWeight: 700, color: "#1E293B" }}>Best for</th>
            </tr>
          </thead>
          <tbody>
            {[
              { model: "Flash",  cost: "5 cr / image",  best: "Quick previews and bulk e-commerce catalog shots" },
              { model: "Plus",   cost: "15 cr / set",   best: "Multi-angle lookbook sets with consistent identity" },
              { model: "Pro",    cost: "~15 cr / image", best: "Cinematic lifestyle and editorial campaigns" },
              { model: "ProMax", cost: "20 cr / image", best: "Hero shots requiring maximum detail and realism" },
            ].map((r, i) => (
              <tr key={r.model} style={{ background: i % 2 === 0 ? "#fff" : "#FAFAFA", borderBottom: "1px solid #EDE9FE" }}>
                <td style={{ padding: "9px 14px" }}><InlineCode>{r.model}</InlineCode></td>
                <td style={{ padding: "9px 14px", fontFamily: "monospace", fontWeight: 700, color: "#7C3AED" }}>{r.cost}</td>
                <td style={{ padding: "9px 14px", color: "#475569" }}>{r.best}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}



function SavedSection() {
  return (
    <div className="docContent">
      <SectionTitle
        title="Saved Exports"
        desc="Your personal library of all generated and saved images, organised by storyboard and type."
      />

      <div className="docHeroCard">
        <div className="docHeroIcon"><Bookmark size={26} strokeWidth={1.5} /></div>
        <div>
          <div className="docHeroTitle">Your Image Library</div>
          <div className="docHeroText">
            Every image you explicitly save during generation is stored here — organised by storyboard and
            tagged by type. Images live on AWS S3 and count toward your storage quota.
          </div>
        </div>
      </div>

      <SubHead>Image types</SubHead>
      <div style={{ overflowX: "auto", margin: "12px 0 18px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#F8F7FF" }}>
              <th style={{ textAlign: "left", padding: "9px 14px", borderBottom: "2px solid #DDD6FE", fontWeight: 700, color: "#1E293B" }}>Type tag</th>
              <th style={{ textAlign: "left", padding: "9px 14px", borderBottom: "2px solid #DDD6FE", fontWeight: 700, color: "#1E293B" }}>Description</th>
            </tr>
          </thead>
          <tbody>
            {[
              { tag: "Look",      desc: "Primary generated outfit shot — front view on model." },
              { tag: "Side View", desc: "Left or right profile of the generated look." },
              { tag: "Back View", desc: "Rear angle generated from the primary look." },
              { tag: "Detail",    desc: "Close-up crop highlighting fabric texture or print." },
              { tag: "Print",     desc: "Output from the Add Prints workflow." },
            ].map((r, i) => (
              <tr key={r.tag} style={{ background: i % 2 === 0 ? "#fff" : "#FAFAFA", borderBottom: "1px solid #EDE9FE" }}>
                <td style={{ padding: "9px 14px" }}><InlineCode>{r.tag}</InlineCode></td>
                <td style={{ padding: "9px 14px", color: "#475569" }}>{r.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SubHead>Filtering and browsing</SubHead>
      <BulletList items={[
        "Use the category pills (All / Looks / Prints) to filter by image type",
        "Each card shows the storyboard name and generation date",
        "Click any image to open the full-size lightbox viewer",
        "Use the ×2, ×3 badges to browse multi-image groups (e.g. multi-angle sets)",
      ]} />

      <SubHead>Bulk delete</SubHead>
      <Step n={1} title='Click "Select" in the top-right'>
        Activates multi-select mode. Tap any card to select it.
      </Step>
      <Step n={2} title="Select all or individual groups">
        Use <InlineCode>Select all</InlineCode> to grab everything, or tap individual cards. The count updates in the action bar.
      </Step>
      <Step n={3} title="Delete selected">
        Click <InlineCode>Delete</InlineCode> to permanently remove selected images. This action cannot be undone.
      </Step>

      <Callout type="warning">
        Deleted images cannot be recovered. Download anything you want to keep before deleting.
      </Callout>
      <Callout type="info">
        Storage usage is shown on your <InlineCode>Dashboard</InlineCode>. Images are stored on AWS S3 and count toward your storage quota.
      </Callout>
    </div>
  );
}

function AssetsSection() {
  return (
    <div className="docContent">
      <SectionTitle
        title="Uploaded Assets"
        desc="Manage all reference images the AI uses during generation — garments, backgrounds, models, and poses."
      />

      <div className="docHeroCard">
        <div className="docHeroIcon"><FolderOpen size={26} strokeWidth={1.5} /></div>
        <div>
          <div className="docHeroTitle">Reference Image Library</div>
          <div className="docHeroText">
            Assets are the raw inputs that guide the AI. The better your reference images,
            the higher the quality of every generated output.
          </div>
        </div>
      </div>

      <SubHead>Asset types</SubHead>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, margin: "12px 0 18px" }}>
        {[
          { Icon: Upload,  label: "Garments",    desc: "The clothing item placed on the model. Use flat-lay or mannequin photos on a clean, plain background." },
          { Icon: Image,   label: "Backgrounds", desc: "Scene reference images. Upload a specific environment to lock the background style for all generations in a session." },
          { Icon: Layers,  label: "Models",      desc: "Human reference photos. The AI uses these to preserve skin tone, build, and facial identity across outputs." },
          { Icon: Zap,     label: "Poses",       desc: "Body pose references. Upload a photo of the exact stance you want replicated in the generated output." },
        ].map(a => (
          <div key={a.label} style={{ display: "flex", alignItems: "flex-start", gap: 12, background: "#F8F7FF", border: "1.5px solid #EDE9FE", borderRadius: 10, padding: "12px 16px" }}>
            <a.Icon size={16} strokeWidth={1.8} style={{ color: "var(--accent)", flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#1E293B", marginBottom: 2 }}>{a.label}</div>
              <div style={{ fontSize: 13, color: "#64748B" }}>{a.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <SubHead>File requirements</SubHead>
      <PropTable rows={[
        { name: "Formats",    type: "enum",   required: true,  desc: "PNG · JPG · WEBP — PNG preferred for transparency in prints and backgrounds." },
        { name: "Max size",   type: "number", required: false, desc: "10 MB per file. Larger files will be rejected at upload." },
        { name: "Min res.",   type: "number", required: false, desc: "1000 × 1000 px recommended for garments — higher resolution = better texture detail in output." },
        { name: "Background", type: "string", required: false, desc: "Plain white or light grey for garments. Studio-lit, minimal shadow, full garment visible." },
      ]} />

      <SubHead>Uploading assets</SubHead>
      <Step n={1} title="Select the asset category">
        Click the category tab (<InlineCode>Garments</InlineCode>, <InlineCode>Backgrounds</InlineCode>, <InlineCode>Models</InlineCode>, <InlineCode>Poses</InlineCode>) on the upload panel.
      </Step>
      <Step n={2} title="Click to upload or drag & drop">
        Click the upload zone to browse files. Multiple images can be selected at once.
        Supported formats: <InlineCode>PNG</InlineCode>, <InlineCode>JPG</InlineCode>, <InlineCode>WEBP</InlineCode>.
      </Step>
      <Step n={3} title="Assets are session-scoped">
        Assets attach to the active Storyboard. Switching storyboards resets active assets.
        Save frequently-used assets to the <InlineCode>Library</InlineCode> section below the upload panel.
      </Step>

      <Callout type="tip">
        Keep up to 4 background images to give the AI variety — it intelligently blends styles across them.
      </Callout>
      <Callout type="success">
        Best garment photo: well-lit, minimal shadows, plain background, full garment visible, no creases.
      </Callout>
    </div>
  );
}

function CreditsSection() {
  const { modelPricing } = useCredits();

  const flashCr  = modelPricing["gemini-2.5-flash-image"] ?? 5;
  const fluxCr   = modelPricing["fal-ai/flux-pro/kontext/multi"] ?? 5;
  const proMaxCr = modelPricing["gemini-3-pro-image-preview"] ?? 20;
  const gptMinCr = modelPricing["gpt-medium-1024x768"] ?? 6;
  const gptMaxCr = modelPricing["gpt-high-1024x1024"] ?? 25;

  const plusCr   = flashCr + fluxCr * 2;
  const proAvgCr = Math.round((gptMinCr + gptMaxCr) / 2);

  const MODELS = [
    { label: "Flash",      cost: `${flashCr} cr / image`,  note: "Fast e-commerce preview shots · 6 free images included" },
    { label: "Plus",       cost: `${plusCr} cr / set`,     note: "Multi-angle lookbook consistency set" },
    { label: "Pro",        cost: `${proAvgCr} cr / image`, note: "Cinematic lifestyle quality shots" },
    { label: "ProMax",     cost: `${proMaxCr} cr / image`, note: "Highest detail and cinematic outputs · 6 free images" },
    { label: "AI Planning",cost: "Free",                   note: "Look Planning — no credits deducted" },
  ];

  return (
    <div className="docContent">
      <SectionTitle
        title="Credits & Billing"
        desc="Botzudio uses an INR-based credit system. Credits are deducted per image generation."
      />

      <div className="docHeroCard">
        <div className="docHeroIcon"><CreditCard size={26} strokeWidth={1.5} /></div>
        <div>
          <div className="docHeroTitle">₹1.66 per credit · No subscription</div>
          <div className="docHeroText">
            Credits are one-time purchases that never expire. Every image generation deducts credits
            based on the AI model used — prices below update in real time from the admin config.
          </div>
        </div>
      </div>

      <SubHead>Credit cost per model</SubHead>
      <div style={{ overflowX: "auto", margin: "12px 0 18px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#F8F7FF" }}>
              <th style={{ textAlign: "left", padding: "9px 14px", borderBottom: "2px solid #DDD6FE", fontWeight: 700, color: "#1E293B" }}>Model</th>
              <th style={{ textAlign: "left", padding: "9px 14px", borderBottom: "2px solid #DDD6FE", fontWeight: 700, color: "#1E293B" }}>Credit cost</th>
              <th style={{ textAlign: "left", padding: "9px 14px", borderBottom: "2px solid #DDD6FE", fontWeight: 700, color: "#1E293B" }}>Notes</th>
            </tr>
          </thead>
          <tbody>
            {MODELS.map((m, i) => (
              <tr key={m.label} style={{ background: i % 2 === 0 ? "#fff" : "#FAFAFA", borderBottom: "1px solid #EDE9FE" }}>
                <td style={{ padding: "9px 14px" }}><InlineCode>{m.label}</InlineCode></td>
                <td style={{ padding: "9px 14px" }}>
                  <span style={{
                    background: m.cost === "Free" ? "#DCFCE7" : "#EDE9FE",
                    color: m.cost === "Free" ? "#15803D" : "#7C3AED",
                    fontFamily: "monospace", fontWeight: 700, fontSize: 12,
                    padding: "3px 9px", borderRadius: 99,
                  }}>{m.cost}</span>
                </td>
                <td style={{ padding: "9px 14px", color: "#64748B" }}>{m.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SubHead>Checking your balance</SubHead>
      <BulletList items={[
        "Live balance is shown in the sidebar at all times (₹ amount below your name)",
        "Open the Credits tab for full balance, images remaining, and transaction history",
        "A warning appears during generation if your balance is insufficient",
      ]} />

      <SubHead>Credit packs</SubHead>
      <PropTable rows={[
        { name: "Basic",      type: "₹499",  required: false, desc: "300 credits — ~60 Flash images. Best for first-time buyers." },
        { name: "Growth",     type: "₹1,299", required: false, desc: "1,000 credits — ~200 Flash images. Most popular pack. Save 22% vs list price." },
        { name: "Enterprise", type: "Custom", required: false, desc: "Custom volume pricing. Contact official@thebotcompany.in." },
      ]} />

      <SubHead>Topping up</SubHead>
      <Step n={1} title="Email official@thebotcompany.in">
        Include your registered email address and the pack you'd like to purchase.
      </Step>
      <Step n={2} title="Complete payment">
        The team will send a UPI link or bank details within 24 hours.
      </Step>
      <Step n={3} title="Credits added instantly">
        Once payment is confirmed, your balance updates in real time — no app restart needed.
      </Step>

      <Callout type="info">
        Transaction history is available in the <InlineCode>Credits</InlineCode> tab. Each entry shows the amount, description, and running balance after the transaction.
      </Callout>
    </div>
  );
}

function DashboardSection() {
  return (
    <div className="docContent">
      <SectionTitle
        title="Dashboard"
        desc="Understand your usage, monitor API activity, and track image generation over time."
      />

      <div className="docHeroCard">
        <div className="docHeroIcon"><BarChart2 size={26} strokeWidth={1.5} /></div>
        <div>
          <div className="docHeroTitle">Usage Analytics & Activity Log</div>
          <div className="docHeroText">
            The Dashboard gives you a real-time view of your generation activity, credit consumption,
            and API performance — all in one place.
          </div>
        </div>
      </div>

      <SubHead>Stat cards</SubHead>
      <div style={{ overflowX: "auto", margin: "12px 0 18px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#F8F7FF" }}>
              <th style={{ textAlign: "left", padding: "9px 14px", borderBottom: "2px solid #DDD6FE", fontWeight: 700, color: "#1E293B" }}>Card</th>
              <th style={{ textAlign: "left", padding: "9px 14px", borderBottom: "2px solid #DDD6FE", fontWeight: 700, color: "#1E293B" }}>What it shows</th>
            </tr>
          </thead>
          <tbody>
            {[
              { card: "Mood Boards",       desc: "Total number of storyboards created in your account." },
              { card: "Generated Images",  desc: "All-time count of AI images produced across all storyboards." },
              { card: "Uploaded Assets",   desc: "Total reference files in your library (garments, backgrounds, models, poses)." },
              { card: "Storage Used",      desc: "AWS S3 space occupied by your saved export images." },
            ].map((r, i) => (
              <tr key={r.card} style={{ background: i % 2 === 0 ? "#fff" : "#FAFAFA", borderBottom: "1px solid #EDE9FE" }}>
                <td style={{ padding: "9px 14px" }}><InlineCode>{r.card}</InlineCode></td>
                <td style={{ padding: "9px 14px", color: "#475569" }}>{r.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SubHead>Activity chart — Last 7 Days</SubHead>
      <p className="docPara">
        The animated bar chart shows images generated on each of the last 7 days.
        Hover over a bar to see the exact count and date. Taller bars = more images that day.
      </p>

      <Callout type="tip">
        Use the activity chart to identify your most productive generation days and plan credit top-ups accordingly.
      </Callout>

      <SubHead>API activity metrics</SubHead>
      <PropTable rows={[
        { name: "Total API Calls",   type: "number", required: false, desc: "Every request sent to the AI model API, including planning and image generation calls." },
        { name: "Tokens Consumed",   type: "number", required: false, desc: "Total prompt + output tokens used across all Gemini API calls." },
        { name: "Avg Latency",       type: "ms",     required: false, desc: "Average response time per API call in milliseconds." },
      ]} />

      <SubHead>Recent API call log</SubHead>
      <p className="docPara">
        The log table shows your last 6 API calls with model, token count, latency, and status.
        Error rows are highlighted in red — use this to diagnose failed generations.
      </p>

      <Callout type="info">
        Dashboard data refreshes each time you open the tab. The call log retains your most recent requests.
      </Callout>
    </div>
  );
}

function BestSection() {
  return (
    <div className="docContent">
      <SectionTitle
        title="Best Practices"
        desc="Tips and techniques to get the highest quality results from Botzudio."
      />

      <div className="docHeroCard">
        <div className="docHeroIcon"><Star size={26} strokeWidth={1.5} /></div>
        <div>
          <div className="docHeroTitle">Quality starts with the input</div>
          <div className="docHeroText">
            The single biggest quality improvement you can make is better garment photography.
            A clean, well-lit input gives the AI far more detail to work with.
          </div>
        </div>
      </div>

      <SubHead>Garment photography</SubHead>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, margin: "12px 0 18px" }}>
        {[
          { label: "Background",   desc: "Plain white or light grey — no busy textures or coloured surfaces." },
          { label: "Lighting",     desc: "Natural or diffused studio light. Avoid harsh shadows and lens flare." },
          { label: "Framing",      desc: "Full garment visible from collar to hem in a single frame." },
          { label: "Support",      desc: "Flat-lay or headless mannequin — both produce equally good results." },
          { label: "Resolution",   desc: "Minimum 1000 × 1000 px. Higher resolution preserves finer texture detail." },
          { label: "Preparation",  desc: "Iron or steam before shooting — wrinkles transfer directly into the output." },
        ].map((r, i) => (
          <div key={r.label} style={{ display: "flex", alignItems: "flex-start", gap: 12, background: i % 2 === 0 ? "#F8F7FF" : "#fff", border: "1.5px solid #EDE9FE", borderRadius: 10, padding: "11px 16px" }}>
            <div style={{ minWidth: 90, fontWeight: 700, fontSize: 12, color: "var(--accent)" }}>{r.label}</div>
            <div style={{ fontSize: 13, color: "#475569" }}>{r.desc}</div>
          </div>
        ))}
      </div>

      <SubHead>Getting better AI outputs</SubHead>
      <BulletList items={[
        "Be specific in Style Notes — instead of 'outdoor', write 'golden-hour rooftop, warm tones'",
        "Use ProMax or Pro model for hero shots; Flash for quick previews and iterations",
        "Upload a model reference to keep skin tone and build consistent across a collection",
        "Use 3:4 ratio for e-commerce product detail pages (matches most platform requirements)",
        "Generate a detail shot immediately after your look to capture fabric texture close-up",
      ]} />

      <SubHead>Credit efficiency</SubHead>
      <PropTable rows={[
        { name: "Look Plan first", type: "free",   required: false, desc: "Run AI Look Planning before generating — previews the prompt without spending credits." },
        { name: "Flash for drafts", type: "5 cr",  required: false, desc: "Use Flash for exploration and iteration. Switch to Pro or ProMax only for final outputs." },
        { name: "Batch sessions",  type: "tip",    required: false, desc: "Group similar garments in one session to minimise context-switching overhead." },
        { name: "Monitor chart",   type: "tip",    required: false, desc: "Check your 7-day Dashboard chart to pace credit spending evenly across the month." },
      ]} />

      <SubHead>Organisation</SubHead>
      <BulletList items={[
        "Create one Storyboard per collection or shoot theme",
        "Name storyboards clearly — 'SS25 Linen Shirts' is better than 'Board 3'",
        "Save only your best outputs — Saved Exports is for hero images, not every draft",
        "Delete unused storyboards to keep the library clean and improve load times",
      ]} />

      <Callout type="success">
        The single biggest quality improvement: better garment photography. If the input photo is clean, the AI has far more detail to work with.
      </Callout>
    </div>
  );
}

function FaqSection() {
  const items = [
    {
      q: "Why does my generated image look blurry or low-detail?",
      a: "The input garment photo was likely low-resolution or poorly lit. Re-shoot at higher resolution with even diffused lighting. Also try the ProMax or Pro model for finer texture detail.",
    },
    {
      q: "I generated an image but it doesn't show my garment clearly — why?",
      a: "The garment may be partially obscured or at an unusual angle in the reference photo. Use a front-facing, full-frame shot. Avoid photos where the garment is folded or partially hidden.",
    },
    {
      q: "Can I use someone else's model photo as a reference?",
      a: "Only use model photos you have rights to — your own photography or licensed stock images. Avoid celebrity photos or images with watermarks.",
    },
    {
      q: "My credits were deducted but no image was generated — what happened?",
      a: "If a generation fails after the API call is made, credits may still be partially deducted. Check Recent API Calls on the Dashboard for error details, then contact support at official@thebotcompany.in.",
    },
    {
      q: "How do I cancel or stop an in-progress generation?",
      a: "Once a generation starts it cannot be cancelled mid-way. Wait for it to complete or fail. Navigating away does not stop the generation.",
    },
    {
      q: "What image formats are supported for upload?",
      a: "PNG, JPG, and WEBP are supported for all asset types. PNG is preferred for prints and backgrounds with transparency. Maximum recommended file size is 10 MB per image.",
    },
    {
      q: "Can I use Botzudio on mobile?",
      a: "The app is optimised for desktop use. On smaller screens some panels are scrollable, but the generation workflow is best experienced on a laptop or desktop.",
    },
    {
      q: "How do I delete my account?",
      a: "Account deletion is handled by the admin team. Go to Settings → Profile → Delete Account to initiate the request, or email official@thebotcompany.in.",
    },
    {
      q: "Why is the 'Multi-Angle' tab not available?",
      a: "Multi-Angle is coming soon — it will generate multiple angles of the same look in one click. Watch the sidebar for when it becomes available.",
    },
  ];

  return (
    <div className="docContent">
      <SectionTitle
        title="Frequently Asked Questions"
        desc="Quick answers to the most common questions about using Botzudio."
      />

      <div className="docHeroCard">
        <div className="docHeroIcon"><HelpCircle size={26} strokeWidth={1.5} /></div>
        <div>
          <div className="docHeroTitle">Got a question?</div>
          <div className="docHeroText">
            Browse the answers below. If you can't find what you're looking for, email{" "}
            <strong>official@thebotcompany.in</strong> — we typically respond within 24 hours.
          </div>
        </div>
      </div>

      <div className="docFaqList" style={{ marginTop: 8 }}>
        {items.map((item, i) => (
          <FaqItem key={i} q={item.q} a={item.a} />
        ))}
      </div>

      <Callout type="info">
        Still have a question? Email <strong>official@thebotcompany.in</strong> — we typically respond within 24 hours.
      </Callout>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`docFaqItem${open ? " docFaqItemOpen" : ""}`}>
      <button type="button" className="docFaqQ" onClick={() => setOpen(v => !v)}>
        <span>{q}</span>
        <ChevronRight size={15} strokeWidth={2.5} className={`docFaqChevron${open ? " docFaqChevronOpen" : ""}`} />
      </button>
      {open && <div className="docFaqA">{a}</div>}
    </div>
  );
}

// ─── Code Block ──────────────────────────────────────────────────────────────

function CodeBlock({ code, language = "typescript" }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div style={{ position: "relative", margin: "12px 0", borderRadius: 10, overflow: "hidden", border: "1.5px solid #1E293B" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#0F172A", padding: "8px 14px 8px 16px", borderBottom: "1px solid #1E293B" }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#64748B", letterSpacing: "0.08em", textTransform: "uppercase" }}>{language}</span>
        <button type="button" onClick={copy} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer", color: copied ? "#22C55E" : "#64748B", fontSize: 11, fontWeight: 600, padding: "2px 6px", borderRadius: 5, transition: "color 0.2s" }}>
          {copied ? <CheckIcon size={12} strokeWidth={2.5} /> : <Copy size={12} strokeWidth={2} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre style={{ margin: 0, padding: "16px 18px", background: "#0F172A", overflowX: "auto", fontSize: 12.5, lineHeight: 1.7, color: "#E2E8F0", fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace" }}>
        <code>{code.trim()}</code>
      </pre>
    </div>
  );
}

function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code style={{ background: "#EDE9FE", color: "#7C3AED", fontSize: "0.88em", fontWeight: 600, padding: "1px 6px", borderRadius: 5, fontFamily: "'JetBrains Mono', 'Consolas', monospace" }}>
      {children}
    </code>
  );
}

function PropTable({ rows }: { rows: { name: string; type: string; required?: boolean; desc: string }[] }) {
  return (
    <div style={{ overflowX: "auto", margin: "12px 0 20px" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ background: "#F8F7FF" }}>
            <th style={{ textAlign: "left", padding: "9px 14px", borderBottom: "2px solid #DDD6FE", fontWeight: 700, color: "#1E293B", whiteSpace: "nowrap" }}>Parameter</th>
            <th style={{ textAlign: "left", padding: "9px 14px", borderBottom: "2px solid #DDD6FE", fontWeight: 700, color: "#1E293B" }}>Type</th>
            <th style={{ textAlign: "left", padding: "9px 14px", borderBottom: "2px solid #DDD6FE", fontWeight: 700, color: "#1E293B" }}>Required</th>
            <th style={{ textAlign: "left", padding: "9px 14px", borderBottom: "2px solid #DDD6FE", fontWeight: 700, color: "#1E293B" }}>Description</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.name} style={{ background: i % 2 === 0 ? "#fff" : "#FAFAFA", borderBottom: "1px solid #EDE9FE" }}>
              <td style={{ padding: "9px 14px", whiteSpace: "nowrap" }}><InlineCode>{r.name}</InlineCode></td>
              <td style={{ padding: "9px 14px", color: "#7C3AED", fontWeight: 600, fontSize: 12, fontFamily: "monospace", whiteSpace: "nowrap" }}>{r.type}</td>
              <td style={{ padding: "9px 14px" }}>{r.required ? <span style={{ background: "#FEF3C7", color: "#92400E", fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 99 }}>required</span> : <span style={{ color: "#94A3B8", fontSize: 12 }}>optional</span>}</td>
              <td style={{ padding: "9px 14px", color: "#475569" }}>{r.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EndpointBadge({ method, path }: { method: "GET" | "POST" | "PATCH" | "DELETE"; path: string }) {
  const colors: Record<string, string> = { GET: "#059669", POST: "#2563EB", PATCH: "#D97706", DELETE: "#DC2626" };
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#F8FAFC", border: "1.5px solid #E2E8F0", borderRadius: 8, padding: "7px 14px", margin: "8px 0 14px", fontFamily: "monospace" }}>
      <span style={{ background: colors[method], color: "#fff", fontSize: 11, fontWeight: 800, padding: "2px 8px", borderRadius: 5, letterSpacing: "0.06em" }}>{method}</span>
      <span style={{ fontSize: 13, color: "#334155", fontWeight: 600 }}>{path}</span>
    </div>
  );
}

// ─── API Reference section ────────────────────────────────────────────────────

function ApiSection() {
  return (
    <div className="docContent">
      <SectionTitle
        title="API Reference"
        desc="Integrate Botzudio's AI image generation into your own applications using the REST API."
      />

      {/* ── Overview ── */}
      <div className="docHeroCard">
        <div className="docHeroIcon"><Globe size={26} strokeWidth={1.5} /></div>
        <div>
          <div className="docHeroTitle">REST API — Base URL</div>
          <div className="docHeroText" style={{ fontFamily: "monospace", fontSize: 13 }}>
            https://api.botzudio.com&nbsp;&nbsp;·&nbsp;&nbsp;All endpoints are prefixed with <InlineCode>/api</InlineCode>
          </div>
        </div>
      </div>

      {/* ── Authentication ── */}
      <SubHead>Authentication</SubHead>
      <p className="docPara">
        Botzudio uses <strong>AWS Cognito (PKCE OAuth 2.0)</strong> for authentication. Every protected endpoint
        requires a valid Bearer token in the <InlineCode>Authorization</InlineCode> header.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, margin: "12px 0 18px" }}>
        {[
          { Icon: Key,  label: "Get a token", desc: "Complete the Cognito PKCE login flow at /login — the app stores your access token automatically." },
          { Icon: Lock, label: "Protected endpoints", desc: "Pass the token as a Bearer header. Tokens auto-refresh using the Cognito refresh token." },
          { Icon: Shield, label: "Admin endpoints", desc: "Admin-only routes require the x-admin-secret header instead of a Bearer token." },
        ].map(r => (
          <div key={r.label} style={{ display: "flex", alignItems: "flex-start", gap: 12, background: "#F8F7FF", border: "1.5px solid #EDE9FE", borderRadius: 10, padding: "12px 16px" }}>
            <r.Icon size={16} strokeWidth={1.8} style={{ color: "var(--accent)", flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#1E293B", marginBottom: 2 }}>{r.label}</div>
              <div style={{ fontSize: 13, color: "#64748B" }}>{r.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <CodeBlock language="typescript" code={`
// All requests — set the Authorization header
const headers = {
  "Content-Type": "application/json",
  "Authorization": \`Bearer \${accessToken}\`,
};

// Example: get current user
const res = await fetch("https://api.botzudio.com/api/auth/me", { headers });
const user = await res.json();
      `} />

      <Callout type="warning">
        Never expose your access token in client-side code or commit it to version control.
        Tokens expire after 1 hour — use the refresh token flow to renew.
      </Callout>

      {/* ── Quick Start ── */}
      <SubHead>TypeScript Quick Start</SubHead>
      <p className="docPara">
        A minimal working example that authenticates, creates a storyboard, and generates an image.
      </p>

      <CodeBlock language="typescript" code={`
const BASE = "https://api.botzudio.com/api";

class BotzudioClient {
  constructor(private readonly token: string) {}

  private headers() {
    return {
      "Content-Type": "application/json",
      Authorization: \`Bearer \${this.token}\`,
    };
  }

  async createStoryboard(name: string) {
    const res = await fetch(\`\${BASE}/storyboards\`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ name }),
    });
    if (!res.ok) throw new Error(\`\${res.status} \${await res.text()}\`);
    return res.json() as Promise<{ id: string; name: string }>;
  }

  async generateImage(storyboardId: string, opts: GenerateOptions) {
    const res = await fetch(\`\${BASE}/generate/image\`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ storyboardId, ...opts }),
    });
    if (!res.ok) throw new Error(\`\${res.status} \${await res.text()}\`);
    return res.json() as Promise<GenerateResult>;
  }

  async getBalance() {
    const res = await fetch(\`\${BASE}/credits/balance\`, { headers: this.headers() });
    return res.json() as Promise<{ balance: number }>;
  }
}

// Usage
const client = new BotzudioClient(accessToken);
const board  = await client.createStoryboard("SS25 Campaign");
const result = await client.generateImage(board.id, {
  model: "gemini-2.5-flash-image",
  garmentUrl: "https://...",
  aspectRatio: "3:4",
  styleNotes: "golden-hour rooftop, warm editorial tones",
});
console.log(result.imageUrl);
      `} />

      {/* ── Generate endpoints ── */}
      <SubHead>Generate Image</SubHead>
      <EndpointBadge method="POST" path="/api/generate/image" />
      <p className="docPara">Generates a fashion image using the selected AI model. Deducts credits from your balance.</p>

      <PropTable rows={[
        { name: "storyboardId", type: "string",  required: true,  desc: "ID of the active storyboard to attach results to." },
        { name: "model",        type: "string",  required: true,  desc: "AI model key. Options: gemini-2.5-flash-image · gemini-3-pro-image-preview · fal-ai/flux-pro/kontext/multi" },
        { name: "garmentUrl",   type: "string",  required: true,  desc: "Public URL or signed S3 URL of the garment reference image." },
        { name: "aspectRatio",  type: "string",  required: false, desc: "Output aspect ratio: 1:1 · 3:4 · 4:3 · 9:16. Defaults to 3:4." },
        { name: "backgroundUrl",type: "string",  required: false, desc: "Reference background image URL. Omit to use a preset style." },
        { name: "modelRefUrl",  type: "string",  required: false, desc: "Human model reference image URL to preserve identity." },
        { name: "poseRefUrl",   type: "string",  required: false, desc: "Pose reference image URL to control body stance." },
        { name: "styleNotes",   type: "string",  required: false, desc: "Free-text style prompt appended to the generation instruction." },
      ]} />

      <CodeBlock language="typescript" code={`
const result = await fetch(\`\${BASE}/generate/image\`, {
  method: "POST",
  headers,
  body: JSON.stringify({
    storyboardId: "sb_abc123",
    model: "gemini-2.5-flash-image",
    garmentUrl: "https://cdn.example.com/shirt.png",
    aspectRatio: "3:4",
    styleNotes: "editorial, warm summer tones",
  }),
});

// Response
// {
//   id: "img_xyz789",
//   imageUrl: "https://...",
//   creditsUsed: 5,
//   model: "gemini-2.5-flash-image",
//   createdAt: "2025-05-27T10:00:00Z"
// }
      `} />

      <EndpointBadge method="POST" path="/api/generate/plan" />
      <p className="docPara">Generates a <strong>Look Plan</strong> (text-only prompt preview) without spending credits. Use this to validate your generation settings before committing.</p>

      <PropTable rows={[
        { name: "storyboardId", type: "string", required: true,  desc: "Active storyboard ID." },
        { name: "garmentUrl",   type: "string", required: true,  desc: "Garment reference image URL." },
        { name: "styleNotes",   type: "string", required: false, desc: "Additional style instructions." },
      ]} />

      {/* ── Storyboards ── */}
      <SubHead>Storyboards</SubHead>

      <EndpointBadge method="GET" path="/api/storyboards" />
      <p className="docPara">Returns all storyboards belonging to the authenticated user.</p>
      <CodeBlock language="typescript" code={`
const boards = await fetch(\`\${BASE}/storyboards\`, { headers })
  .then(r => r.json());
// Returns: { storyboards: Array<{ id, name, createdAt, isActive }> }
      `} />

      <EndpointBadge method="POST" path="/api/storyboards" />
      <PropTable rows={[
        { name: "name", type: "string", required: true, desc: "Display name for the storyboard (e.g. 'SS25 Linen Collection')." },
      ]} />

      <EndpointBadge method="PATCH" path="/api/storyboards/:id" />
      <PropTable rows={[
        { name: "name",     type: "string",  required: false, desc: "Rename the storyboard." },
        { name: "isActive", type: "boolean", required: false, desc: "Set as the active storyboard." },
      ]} />

      <EndpointBadge method="DELETE" path="/api/storyboards/:id" />
      <p className="docPara">Permanently deletes a storyboard and all its generated images. This action is irreversible.</p>

      {/* ── Assets ── */}
      <SubHead>Assets</SubHead>
      <p className="docPara">
        Assets (garments, backgrounds, models, poses) are uploaded in two steps:
        request a signed upload URL, then PUT the file directly to S3.
      </p>

      <EndpointBadge method="POST" path="/api/assets/upload" />
      <PropTable rows={[
        { name: "filename", type: "string", required: true, desc: "Original file name including extension (e.g. shirt.png)." },
        { name: "type",     type: "string", required: true, desc: "Asset category: garment · background · model · pose" },
        { name: "mimeType", type: "string", required: true, desc: "MIME type of the file: image/png · image/jpeg · image/webp" },
      ]} />

      <CodeBlock language="typescript" code={`
// Step 1 — request a signed S3 upload URL
const { uploadUrl, assetId } = await fetch(\`\${BASE}/assets/upload\`, {
  method: "POST",
  headers,
  body: JSON.stringify({
    filename: "garment.png",
    type: "garment",
    mimeType: "image/png",
  }),
}).then(r => r.json());

// Step 2 — PUT the file directly to S3 (no auth header here)
await fetch(uploadUrl, {
  method: "PUT",
  body: fileBlob,
  headers: { "Content-Type": "image/png" },
});

// Step 3 — register the asset in Botzudio
await fetch(\`\${BASE}/assets\`, {
  method: "POST",
  headers,
  body: JSON.stringify({ assetId }),
});
      `} />

      {/* ── Credits ── */}
      <SubHead>Credits</SubHead>

      <EndpointBadge method="GET" path="/api/credits/balance" />
      <p className="docPara">Returns the current credit balance and credit-to-INR conversion rate.</p>
      <CodeBlock language="typescript" code={`
const { balance, rate } = await fetch(\`\${BASE}/credits/balance\`, { headers })
  .then(r => r.json());
// balance: 842  (credits remaining)
// rate: 1.66    (₹ per credit)
      `} />

      <EndpointBadge method="GET" path="/api/credits/transactions" />
      <p className="docPara">Paginated list of credit transactions (top-ups and deductions) for the authenticated user.</p>

      <EndpointBadge method="GET" path="/api/credits/model-pricing" />
      <p className="docPara">Public endpoint — returns the current credit cost per model. No authentication required.</p>
      <CodeBlock language="typescript" code={`
// No auth header needed
const pricing = await fetch(\`\${BASE}/credits/model-pricing\`).then(r => r.json());
// {
//   "gemini-2.5-flash-image": 5,
//   "gemini-3-pro-image-preview": 20,
//   "fal-ai/flux-pro/kontext/multi": 5,
//   "gpt-medium-1024x768": 6,
//   "gpt-high-1024x1024": 25
// }
      `} />

      {/* ── Usage ── */}
      <SubHead>Usage & Dashboard</SubHead>
      <EndpointBadge method="GET" path="/api/usage" />
      <p className="docPara">Returns aggregate usage stats: storyboard count, generated images, uploaded assets, storage bytes used, and recent API call logs.</p>
      <CodeBlock language="typescript" code={`
const stats = await fetch(\`\${BASE}/usage\`, { headers }).then(r => r.json());
// {
//   storyboards: 12,
//   images: 248,
//   assets: 34,
//   storageBytes: 1048576,
//   apiCalls: 301,
//   avgLatencyMs: 4200,
//   recentCalls: [ { model, tokens, latencyMs, status, createdAt }, … ]
// }
      `} />

      {/* ── Error handling ── */}
      <SubHead>Error Handling</SubHead>
      <p className="docPara">
        All error responses follow a consistent JSON shape. HTTP status codes map to standard meanings.
      </p>

      <div style={{ overflowX: "auto", margin: "12px 0 18px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#F8F7FF" }}>
              <th style={{ textAlign: "left", padding: "9px 14px", borderBottom: "2px solid #DDD6FE", fontWeight: 700, color: "#1E293B" }}>Status</th>
              <th style={{ textAlign: "left", padding: "9px 14px", borderBottom: "2px solid #DDD6FE", fontWeight: 700, color: "#1E293B" }}>Meaning</th>
              <th style={{ textAlign: "left", padding: "9px 14px", borderBottom: "2px solid #DDD6FE", fontWeight: 700, color: "#1E293B" }}>Common cause</th>
            </tr>
          </thead>
          <tbody>
            {[
              { status: "400", meaning: "Bad Request",    cause: "Missing or invalid request body parameter." },
              { status: "401", meaning: "Unauthorized",   cause: "Missing, expired, or invalid Bearer token." },
              { status: "402", meaning: "Payment Required", cause: "Insufficient credits to complete the generation." },
              { status: "403", meaning: "Forbidden",      cause: "Requesting a resource that belongs to another user." },
              { status: "404", meaning: "Not Found",      cause: "Storyboard, image, or asset ID does not exist." },
              { status: "429", meaning: "Too Many Requests", cause: "Rate limit exceeded. Back off and retry after 60 s." },
              { status: "500", meaning: "Server Error",   cause: "Upstream AI model or internal server failure." },
            ].map((r, i) => (
              <tr key={r.status} style={{ background: i % 2 === 0 ? "#fff" : "#FAFAFA", borderBottom: "1px solid #EDE9FE" }}>
                <td style={{ padding: "9px 14px", fontFamily: "monospace", fontWeight: 700, color: parseInt(r.status) >= 500 ? "#DC2626" : parseInt(r.status) >= 400 ? "#D97706" : "#059669" }}>{r.status}</td>
                <td style={{ padding: "9px 14px", fontWeight: 600, color: "#334155" }}>{r.meaning}</td>
                <td style={{ padding: "9px 14px", color: "#64748B" }}>{r.cause}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <CodeBlock language="typescript" code={`
async function apiFetch(url: string, init: RequestInit) {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw Object.assign(new Error(body.message ?? res.statusText), {
      status: res.status,
      body,
    });
  }
  return res.json();
}

// Usage
try {
  const result = await apiFetch(\`\${BASE}/generate/image\`, { method: "POST", headers, body });
} catch (err: any) {
  if (err.status === 402) console.error("Not enough credits");
  if (err.status === 429) console.error("Rate limited — retry in 60 s");
}
      `} />

      {/* ── Rate limits ── */}
      <SubHead>Rate Limits</SubHead>
      <BulletList items={[
        "Image generation (Flash, Pro, ProMax, FLUX, OpenAI): 10 requests / minute per user",
        "Plan generation: 20 requests / minute per user",
        "Auth endpoints (login / logout): 10 requests / 15 minutes per IP",
        "Referral clicks: 5 requests / minute per IP",
        "All other endpoints: no hard rate limit beyond fair-use policy",
      ]} />

      <Callout type="info">
        Rate-limited responses return HTTP <InlineCode>429</InlineCode> with a <InlineCode>Retry-After</InlineCode> header indicating seconds to wait. Implement exponential back-off in production clients.
      </Callout>

      <Callout type="tip">
        Use the <strong>Plan endpoint</strong> (free, no credits) during development and testing. Switch to the Image endpoint only for final outputs to conserve your credit balance.
      </Callout>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function DocumentsTab() {
  const location   = useLocation();
  const navigate   = useNavigate();

  const initial  = (location.state as { section?: DocKey } | null)?.section ?? "start";
  const [active, setActive]       = useState<DocKey>(initial);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [active]);

  const groups = ["Overview", "Tab Guides", "Resources"];
  const activeLabel = SECTIONS.find(s => s.key === active)?.label ?? "Documentation";
  const activeGroup = SECTIONS.find(s => s.key === active)?.group ?? "";

  const renderContent = () => {
    switch (active) {
      case "start":     return <StartSection />;
      case "generate":  return <GenerateSection />;
      case "saved":     return <SavedSection />;
      case "assets":    return <AssetsSection />;
      case "credits":   return <CreditsSection />;
      case "dashboard": return <DashboardSection />;
      case "best":      return <BestSection />;
      case "faq":       return <FaqSection />;
      case "api":       return <ApiSection />;
    }
  };

  const DocSidebarNav = ({ onSelect }: { onSelect?: () => void }) => (
    <nav className="sidebarNav" style={{ padding: "16px 12px", flex: 1, overflowY: "auto" }}>
      {groups.map(grp => (
        <div key={grp}>
          <div style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
            textTransform: "uppercase", color: "rgba(255,255,255,0.5)",
            padding: "10px 14px 4px",
          }}>
            {grp}
          </div>
          {SECTIONS.filter(s => s.group === grp).map(s => {
            const isSel = active === s.key;
            return (
              <button key={s.key} type="button"
                className={`navButton${isSel ? " navButtonActive" : ""}`}
                onClick={() => { setActive(s.key); onSelect?.(); }}
              >
                <s.Icon size={15} strokeWidth={isSel ? 2.5 : 2} className="navButtonIcon" />
                <span>{s.label}</span>
              </button>
            );
          })}
        </div>
      ))}
    </nav>
  );

  return (
    <div className="stgRootPage" style={{ height: "100vh", overflow: "hidden", background: "var(--bg)", display: "flex" }}>

      {/* ── Purple Doc Sidebar ──────────────────────────────── */}
      <aside className="stgAppSidebar" style={{
        width: 220, flexShrink: 0,
        background: "var(--accent)",
        backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)",
        backgroundSize: "18px 18px",
        display: "flex", flexDirection: "column",
        borderRight: "2px solid rgba(255,255,255,0.15)",
        height: "100vh",
      }}>
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "20px 18px 16px", borderBottom: "1px solid rgba(255,255,255,0.12)" }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, background: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "'Outfit', sans-serif", fontWeight: 900,
            fontSize: 12, color: "var(--accent)", flexShrink: 0,
            border: "1.5px solid rgba(0,0,0,0.1)",
          }}>BZ</div>
          <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: 18, color: "#fff", letterSpacing: "-0.3px" }}>
            Botzudio
          </span>
        </div>

        <DocSidebarNav />
      </aside>

      {/* ── Mobile Hamburger Header ──────────────────────────── */}
      <header className="mobileHeader">
        <button type="button" className="mobileHamburgerBtn" onClick={() => setMobileNavOpen(true)} aria-label="Open navigation">
          <Menu size={22} />
        </button>
        <div className="mobileHeaderBrand">
          <div className="mobileHeaderLogo">BZ</div>
          <span className="mobileHeaderTitle">Botzudio</span>
        </div>
        <div style={{ width: 34 }} />
      </header>

      {/* ── Mobile Drawer ────────────────────────────────────── */}
      {mobileNavOpen && <div className="mobileDrawerOverlay" onClick={() => setMobileNavOpen(false)} />}
      <div className={`mobileDrawer${mobileNavOpen ? " mobileDrawerOpen" : ""}`} aria-hidden={!mobileNavOpen}>
        <div className="mobileDrawerHeader">
          <div className="mobileHeaderBrand">
            <div className="mobileHeaderLogo">BZ</div>
            <span className="mobileHeaderTitle">Botzudio</span>
          </div>
          <button type="button" className="mobileDrawerClose" onClick={() => setMobileNavOpen(false)} aria-label="Close navigation">
            <X size={20} />
          </button>
        </div>
        <DocSidebarNav onSelect={() => setMobileNavOpen(false)} />
      </div>

      {/* ── Main Content ─────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

        {/* Content Header */}
        <div className="stgContentHeader">
          <div className="stgBreadcrumbs">
            <span className="stgBreadcrumbLink" style={{ cursor: "pointer" }} onClick={() => { localStorage.setItem("esg_active_tab_v1", "generate"); navigate("/app"); }}>App</span>
            <span className="stgBreadcrumbSep">›</span>
            <span className="stgBreadcrumbActive" style={{ color: "var(--muted-color)" }}>{activeGroup}</span>
            <span className="stgBreadcrumbSep">›</span>
            <span className="stgBreadcrumbActive" style={{ fontWeight: 700, color: "var(--accent)" }}>{activeLabel}</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", marginBottom: 12 }}>
            <h1 className="stgHeaderTitle">{activeLabel}</h1>
            <div style={{
              display: "flex", alignItems: "center", gap: 5,
              background: "#EDE9FE", color: "var(--accent)", fontSize: 11, fontWeight: 700,
              padding: "4px 10px", borderRadius: 999, border: "1.5px solid #DDD6FE",
            }}>
              <Shield size={11} strokeWidth={2} /><span>v2.0</span>
            </div>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div ref={contentRef} className="stgContent" style={{ flex: 1, overflowY: "auto", minWidth: 0, background: "var(--bg)" }}>
          <div className="stgContentInner">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
