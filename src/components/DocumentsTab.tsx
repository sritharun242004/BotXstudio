import { useState, useRef, useEffect } from "react";
import { useCredits } from "../context/CreditsContext";
import { IMAGE_GENERATION_MODELS } from "../lib/storyboards";
import {
  BookOpen, Sparkles, Palette, Bookmark, FolderOpen,
  CreditCard, BarChart2, Star, HelpCircle, Lightbulb,
  Info, CheckCircle2, AlertTriangle, ChevronRight,
  Upload, Image, Layers, Zap, RefreshCw, Shield, ArrowLeft,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type DocKey =
  | "start" | "generate" | "prints" | "saved"
  | "assets" | "credits" | "dashboard" | "best" | "faq";

const SECTIONS: { key: DocKey; label: string; Icon: React.ElementType; group: string }[] = [
  { key: "start",     label: "Getting Started",   Icon: BookOpen,    group: "Overview" },
  { key: "generate",  label: "Generate Images",   Icon: Sparkles,    group: "Tab Guides" },
  { key: "prints",    label: "Add Prints",        Icon: Palette,     group: "Tab Guides" },
  { key: "saved",     label: "Saved Exports",     Icon: Bookmark,    group: "Tab Guides" },
  { key: "assets",    label: "Uploaded Assets",   Icon: FolderOpen,  group: "Tab Guides" },
  { key: "credits",   label: "Credits & Billing", Icon: CreditCard,  group: "Tab Guides" },
  { key: "dashboard", label: "Dashboard",         Icon: BarChart2,   group: "Tab Guides" },
  { key: "best",      label: "Best Practices",    Icon: Star,        group: "More" },
  { key: "faq",       label: "FAQ",               Icon: HelpCircle,  group: "More" },
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
        Go to <strong>Uploaded Assets → Garments</strong> and upload a clear photo of your clothing item.
        Plain white or studio backgrounds work best.
      </Step>
      <Step n={2} title="Open Generate Images">
        Switch to the <strong>Generate Images</strong> tab. Select your storyboard (or create a new one),
        attach the garment, choose a background and model style, then click Generate.
      </Step>
      <Step n={3} title="Download or save your results">
        Once generated, images appear in the results panel. Click any image to view full-size,
        download it, or save it to <strong>Saved Exports</strong> for later.
      </Step>

      <Callout type="info">
        All tabs are accessible from the left sidebar. Each tab is a self-contained workflow —
        you don't need to complete them in any particular order.
      </Callout>

      <SubHead>App Overview</SubHead>
      <div className="docTabGrid">
        {[
          { Icon: Palette,     label: "Add Prints",        desc: "Apply print designs to garments" },
          { Icon: Sparkles,    label: "Generate Images",   desc: "Create AI model shots and scenes" },
          { Icon: Bookmark,    label: "Saved Exports",     desc: "View all your generated images" },
          { Icon: FolderOpen,  label: "Uploaded Assets",   desc: "Manage garments, backgrounds, models" },
          { Icon: CreditCard,  label: "Credits",           desc: "Balance, history, top-up" },
          { Icon: BarChart2,   label: "Dashboard",         desc: "Usage stats and API activity" },
        ].map(t => (
          <div key={t.label} className="docTabCard">
            <t.Icon size={18} strokeWidth={1.5} className="docTabCardIcon" />
            <div className="docTabCardLabel">{t.label}</div>
            <div className="docTabCardDesc">{t.desc}</div>
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

      <SubHead>How it works</SubHead>
      <p className="docPara">
        The Generate tab uses Google Gemini's vision AI to composite your garment onto virtual models and scenes.
        Each generation deducts credits from your balance.
      </p>

      <SubHead>Step-by-step workflow</SubHead>
      <Step n={1} title="Select or create a Storyboard">
        A <strong>Storyboard</strong> groups your generation settings and results. Create one per collection
        or product line. Click <strong>New Mood Board</strong> in the library, give it a name, then open it.
      </Step>
      <Step n={2} title="Upload your garment image">
        In the Assets panel on the right, upload a garment photo. For best results use a flat-lay or
        mannequin shot on a clean background. Up to 1 image for the primary garment.
      </Step>
      <Step n={3} title="Choose a background">
        Select a preset background style (Studio, Outdoor, Urban, etc.) or upload your own reference
        in <strong>Uploaded Assets → Backgrounds</strong>.
      </Step>
      <Step n={4} title="Pick a model & pose (optional)">
        Upload a model reference photo in <strong>Uploaded Assets → Models</strong> to preserve identity and skin tone.
        Add a pose reference under <strong>Poses</strong> to control the body stance.
      </Step>
      <Step n={5} title="Set generation options">
        Choose the AI model (Flash = fast & affordable, Plus = best consistency, Pro = cinematic quality, ProMax = highest detail), aspect ratio, and any additional
        prompt notes in the style field. Then click <strong>Generate Look</strong>.
      </Step>
      <Step n={6} title="Review and save">
        Results appear below. Click an image to open it full-size. Use the save icon to add it
        to Saved Exports, or download directly.
      </Step>

      <Callout type="tip">
        Generate a <strong>Detail Shot</strong> and <strong>Back View</strong> in one click after your primary look
        is generated — use the angle buttons that appear in the results panel.
      </Callout>
      <Callout type="warning">
        Each generation costs credits. Check your balance in the Credits tab before running a batch.
        You'll see a credit warning if your balance is too low.
      </Callout>

      <SubHead>Generation settings explained</SubHead>
      <div className="docSettingsTable">
        {[
          { setting: "AI Model",     options: "Flash / Plus / Pro / ProMax", desc: "Flash = fast & free tier · Plus = multi-angle consistency · Pro = cinematic editorial · ProMax = highest Gemini detail" },
          { setting: "Aspect Ratio", options: "1:1, 3:4, 4:3, 9:16…", desc: "Match your target platform — 3:4 is ideal for e-commerce PDPs" },
          { setting: "Background",   options: "Preset or Custom",      desc: "Upload a reference image to exactly match a scene" },
          { setting: "Style Notes",  options: "Free text",             desc: "Add keywords like 'editorial', 'summer vibes', 'high contrast'" },
        ].map(r => (
          <div key={r.setting} className="docSettingsRow">
            <div className="docSettingsKey">{r.setting}</div>
            <div className="docSettingsOpts">{r.options}</div>
            <div className="docSettingsDesc">{r.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PrintsSection() {
  return (
    <div className="docContent">
      <SectionTitle
        title="Add Prints"
        desc="Digitally apply print designs onto garments to visualise how they'll look in production."
      />

      <SubHead>What is Print Application?</SubHead>
      <p className="docPara">
        The Add Prints tab lets you take a base garment image and a print/pattern design, then use AI
        to realistically apply the print onto the garment — accounting for drape, folds, and fabric texture.
      </p>

      <SubHead>Workflow</SubHead>
      <Step n={1} title="Upload your base garment">
        Use a plain, single-colour garment photo (white or light grey works best). The cleaner the base,
        the more accurate the print placement.
      </Step>
      <Step n={2} title="Upload your print design">
        Upload a flat PNG/JPG of your print artwork. Transparent-background PNGs give the best edge quality.
      </Step>
      <Step n={3} title="Set application options">
        Choose the placement style (all-over, front-panel, repeat tile) and scaling. Add a prompt note
        to guide placement — e.g. <em>"centered chest placement, subtle scale"</em>.
      </Step>
      <Step n={4} title="Generate and compare">
        Click Generate. Review the result — use the side-by-side view to compare original vs. printed garment.
      </Step>

      <Callout type="success">
        For all-over prints, use a 1:1 square artwork file with at least 1000×1000px resolution
        and a white background for best tiling results.
      </Callout>
      <Callout type="tip">
        Combine the Print tab output with the Generate Images tab — first apply your print, then use
        the printed garment as the input for a model shot.
      </Callout>
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

      <SubHead>How images are saved</SubHead>
      <p className="docPara">
        Every image you explicitly save during generation is stored here. Images are grouped by storyboard
        and tagged by type — Look, Side View, Back View, Detail, or Print.
      </p>

      <SubHead>Filtering and browsing</SubHead>
      <BulletList items={[
        "Use the category pills (All / Looks / Prints) to filter by image type",
        "Each group shows the storyboard name and generation date",
        "Click any image to open the full-size lightbox viewer",
        "Use the ×2, ×3 badges to see multi-image groups — click to browse all angles",
      ]} />

      <SubHead>Bulk actions</SubHead>
      <Step n={1} title='Click "Select" in the top-right'>
        This activates multi-select mode. Tap any group card to select it.
      </Step>
      <Step n={2} title="Select all or individual groups">
        Use <strong>Select all</strong> to grab everything, or tap individual cards. The count updates in the action bar.
      </Step>
      <Step n={3} title="Delete selected">
        Click <strong>Delete</strong> to permanently remove selected images. This action cannot be undone.
      </Step>

      <Callout type="warning">
        Deleted images cannot be recovered. Download anything you want to keep before deleting.
      </Callout>
      <Callout type="info">
        Storage usage is tracked on your Dashboard. Images are stored on AWS S3 and count toward your storage quota.
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

      <SubHead>Asset types</SubHead>
      <div className="docAssetGrid">
        {[
          { Icon: Upload,  label: "Garments",    desc: "The clothing item to be placed on the model. Use flat-lay or mannequin photos on clean backgrounds." },
          { Icon: Image,   label: "Backgrounds", desc: "Scene reference images. Upload a specific environment to lock the generated background style." },
          { Icon: Layers,  label: "Models",      desc: "Human reference photos. The AI uses these to preserve skin tone, build, and facial identity." },
          { Icon: Zap,     label: "Poses",       desc: "Body pose references. Upload a photo of the stance you want to replicate in the output." },
        ].map(a => (
          <div key={a.label} className="docAssetCard">
            <div className="docAssetIcon"><a.Icon size={18} strokeWidth={1.5} /></div>
            <div className="docAssetLabel">{a.label}</div>
            <div className="docAssetDesc">{a.desc}</div>
          </div>
        ))}
      </div>

      <SubHead>Uploading assets</SubHead>
      <Step n={1} title="Select the asset category">
        Click the category tab (Garments, Backgrounds, Models, Poses) on the left upload panel.
      </Step>
      <Step n={2} title="Click to upload or drag & drop">
        Click the upload zone to browse files. You can select multiple images at once.
        Supported formats: PNG, JPG, WEBP.
      </Step>
      <Step n={3} title="Assets are session-scoped">
        Assets attach to the active Storyboard. Switching storyboards resets the active assets.
        Save frequently-used assets to the <strong>Library</strong> section below the upload panel.
      </Step>

      <Callout type="tip">
        Keep up to 4 background images to give the AI variety. It will intelligently blend styles across them.
      </Callout>
      <Callout type="success">
        Best garment photos: well-lit, minimal shadows, plain background, full garment visible, no creases.
      </Callout>
    </div>
  );
}

function getDocCreditLabel(modelId: string, pricing: Record<string, number>): string {
  if (modelId === "hybrid-editorial") {
    const flash = pricing["gemini-2.5-flash-image"] ?? 5;
    const flux  = pricing["fal-ai/flux-pro/kontext/multi"] ?? 5;
    return `${flash + flux * 2} credits/set`;
  }
  if (modelId === "gpt-image-2") {
    const min = pricing["gpt-medium-1024x768"] ?? 6;
    const max = pricing["gpt-high-1024x1024"] ?? 25;
    return `${min}–${max} credits/img`;
  }
  const cost = pricing[modelId];
  return cost !== undefined ? `${cost} credits/img` : "—";
}

const MODEL_DOC_NOTES: Record<string, string> = {
  "gemini-2.5-flash-image":        "Fast ecommerce shots · 6 free images per account",
  "hybrid-editorial":              "Multi-angle lookbook · Flash + 2× FLUX Kontext",
  "gpt-image-2":                   "OpenAI cinematic quality · medium or high resolution",
  "gemini-3-pro-image-preview":    "Highest Gemini quality · ultra-detailed outputs · 6 free images",
};

function CreditsSection() {
  const { modelPricing } = useCredits();

  return (
    <div className="docContent">
      <SectionTitle
        title="Credits & Billing"
        desc="Botzudio uses an INR-based credit system. Credits are deducted per image generation."
      />

      <SubHead>How credits work</SubHead>
      <p className="docPara">
        Every time the AI generates an image, credits are deducted from your balance.
        The cost depends on the model selected and is set by the admin — prices below update in real time.
      </p>

      <div className="docCreditBox">
        {IMAGE_GENERATION_MODELS.map(m => (
          <div key={m.id} className="docCreditRow">
            <span className="docCreditLabel">{m.label}</span>
            <span className="docCreditBadge docCreditBadgePurple">
              {getDocCreditLabel(m.id, modelPricing)}
            </span>
            <span className="docCreditNote">{MODEL_DOC_NOTES[m.id] ?? ""}</span>
          </div>
        ))}
        <div className="docCreditRow">
          <span className="docCreditLabel">AI Look Planning</span>
          <span className="docCreditBadge docCreditBadgeGreen">Free</span>
          <span className="docCreditNote">No credits deducted</span>
        </div>
      </div>

      <SubHead>Checking your balance</SubHead>
      <BulletList items={[
        "Your live balance is shown in the sidebar at all times (₹ amount below your name)",
        "Open the Credits tab for full balance details, images remaining, and transaction history",
        "A warning appears during generation if your balance is insufficient",
      ]} />

      <SubHead>Topping up</SubHead>
      <Step n={1} title="Email official@thebotcompany.in">
        Include your registered email address and the amount you'd like to add (minimum ₹100).
      </Step>
      <Step n={2} title="Complete payment">
        The team will send a UPI link or bank details within 24 hours.
      </Step>
      <Step n={3} title="Credits added instantly">
        Once payment is confirmed, your balance updates in real time — no app restart needed.
      </Step>

      <Callout type="info">
        Transaction history is available in the Credits tab. Each entry shows the amount, description, and
        running balance after the transaction.
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

      <SubHead>Stat cards</SubHead>
      <BulletList items={[
        "Mood Boards — total number of storyboards you've created",
        "Generated Images — all-time count of AI images produced",
        "Uploaded Assets — total reference files in your library",
        "Storage Used — how much AWS S3 space your saved images occupy",
      ]} />

      <SubHead>Activity Chart — Last 7 Days</SubHead>
      <p className="docPara">
        The animated bar chart shows how many images you generated on each of the last 7 days.
        Hover over a bar to see the exact count and date. Taller bars = more images that day.
      </p>

      <Callout type="tip">
        Use the activity chart to identify your most productive generation days and plan credit top-ups accordingly.
      </Callout>

      <SubHead>API Activity</SubHead>
      <BulletList items={[
        "Total API Calls — every request sent to the Gemini API (includes planning and image generation)",
        "Tokens Consumed — total prompt + output tokens used across all calls",
        "Avg Latency — average time per API call in milliseconds",
      ]} />

      <SubHead>Recent API Calls</SubHead>
      <p className="docPara">
        The log table shows your last 6 API calls with type, model, token count, latency, and status.
        Error rows are highlighted in red. Use this to diagnose failed generations.
      </p>

      <Callout type="info">
        API data refreshes each time you open the Dashboard tab. The log retains your most recent calls.
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

      <SubHead>Garment Photography</SubHead>
      <BulletList items={[
        "Shoot on a plain white or light grey background — no busy textures",
        "Use natural or diffused studio lighting; avoid harsh shadows or lens flare",
        "Capture the full garment from collar to hem in a single frame",
        "Lay flat or use a headless mannequin — both work equally well",
        "Shoot at minimum 1000×1000px; higher resolution = better texture detail in output",
        "Iron or steam the garment before shooting — wrinkles transfer into the output",
      ]} />

      <SubHead>Getting Better AI Outputs</SubHead>
      <BulletList items={[
        "Be specific in Style Notes — instead of 'outdoor', write 'golden-hour rooftop, warm tones'",
        "Use ProMax or Pro model for hero shots; Flash for quick previews and iterations",
        "Upload a model reference to keep skin tone and build consistent across a collection",
        "Use 3:4 ratio for e-commerce product detail pages (matches most platform requirements)",
        "Generate a detail shot immediately after your look to capture fabric texture close-up",
      ]} />

      <SubHead>Credit Efficiency</SubHead>
      <BulletList items={[
        "Run a Look Plan (free) before generating — it previews the prompt without spending credits",
        "Use Flash model for initial exploration; switch to Pro or ProMax only for finals",
        "Batch similar garments in one session to minimise context-switching",
        "Monitor your 7-day chart on the Dashboard to pace spending evenly",
      ]} />

      <SubHead>Organisation</SubHead>
      <BulletList items={[
        "Create one Storyboard per collection or shoot theme",
        "Name storyboards clearly: 'SS25 — Linen Shirts' is better than 'Board 3'",
        "Save only your best outputs — Saved Exports is for hero images, not every draft",
        "Delete unused storyboards to keep the library clean and improve load times",
      ]} />

      <Callout type="success">
        The single biggest quality improvement: better garment photography. If the input photo is clean,
        the AI has far more detail to work with.
      </Callout>
    </div>
  );
}

function FaqSection() {
  const items = [
    {
      q: "Why does my generated image look blurry or low-detail?",
      a: "This usually means the input garment photo was low-resolution or had poor lighting. Re-shoot at higher resolution with even lighting. Also try the ProMax or Pro model for finer detail.",
    },
    {
      q: "I generated an image but it doesn't show my garment clearly — why?",
      a: "The garment may be partially obscured or at an unusual angle in the reference photo. Use a front-facing, full-frame garment shot. Avoid photos where the garment is folded or partially hidden.",
    },
    {
      q: "Can I use someone else's model photo as a reference?",
      a: "Only use model photos you have rights to — your own photography or licensed stock images. Avoid using celebrity photos or images with watermarks.",
    },
    {
      q: "My credits were deducted but no image was generated — what happened?",
      a: "If a generation fails after the API call is made, credits may still be partially deducted. Check Recent API Calls on the Dashboard for error details, then contact support at official@thebotcompany.in.",
    },
    {
      q: "How do I cancel or stop an in-progress generation?",
      a: "Once a generation starts, it cannot be cancelled mid-way. Wait for it to complete or fail. Navigating away does not stop the generation.",
    },
    {
      q: "What image formats are supported for upload?",
      a: "PNG, JPG, and WEBP are supported for all asset types. PNG is preferred for prints and backgrounds with transparency. Maximum recommended file size is 10MB per image.",
    },
    {
      q: "Can I use Botzudio on mobile?",
      a: "The app is optimised for desktop use. On smaller screens some panels may be scrollable, but the generation workflow is best experienced on a laptop or desktop.",
    },
    {
      q: "How do I delete my account?",
      a: "Account deletion is handled by the admin team. Go to Settings → Profile → Delete Account to initiate the request. Alternatively email official@thebotcompany.in.",
    },
    {
      q: "Why is the 'Multi-Angle' tab not available?",
      a: "Multi-Angle is coming soon. It will allow generating multiple angles of the same look in a single click. Watch the sidebar for when it becomes available.",
    },
  ];

  return (
    <div className="docContent">
      <SectionTitle
        title="Frequently Asked Questions"
        desc="Quick answers to the most common questions about using Botzudio."
      />
      <div className="docFaqList">
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

// ─── Main component ───────────────────────────────────────────────────────────

export default function DocumentsTab({ onClose }: { onClose: () => void }) {
  const [active, setActive] = useState<DocKey>("start");
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [active]);

  const groups = ["Overview", "Tab Guides", "More"];

  const renderContent = () => {
    switch (active) {
      case "start":     return <StartSection />;
      case "generate":  return <GenerateSection />;
      case "prints":    return <PrintsSection />;
      case "saved":     return <SavedSection />;
      case "assets":    return <AssetsSection />;
      case "credits":   return <CreditsSection />;
      case "dashboard": return <DashboardSection />;
      case "best":      return <BestSection />;
      case "faq":       return <FaqSection />;
    }
  };

  return (
    <div className="docRoot">

      {/* ── Top bar ───────────────────────────────────────────── */}
      <div className="docTopBar">
        <div className="docTopBarLeft">
          <button type="button" className="docBackBtn" onClick={onClose}>
            <ArrowLeft size={15} strokeWidth={2.5} />
            <span>Back</span>
          </button>
          <div className="docTopBarDivider" />
          <BookOpen size={18} strokeWidth={2} className="docTopBarIcon" />
          <span className="docTopBarTitle">Documentation</span>
          <span className="docTopBarSub">User guide &amp; best practices</span>
        </div>
        <div className="docTopBarBadge">
          <Shield size={12} strokeWidth={2} />
          <span>v2.0</span>
        </div>
      </div>

      {/* ── Body ──────────────────────────────────────────────── */}
      <div className="docBody">

        {/* Left nav */}
        <aside className="docNav">
          {groups.map(group => (
            <div key={group} className="docNavGroup">
              <div className="docNavGroupLabel">{group}</div>
              {SECTIONS.filter(s => s.group === group).map(s => (
                <button
                  key={s.key}
                  type="button"
                  className={`docNavBtn${active === s.key ? " docNavBtnActive" : ""}`}
                  onClick={() => setActive(s.key)}
                >
                  <s.Icon size={14} strokeWidth={2} className="docNavBtnIcon" />
                  <span>{s.label}</span>
                </button>
              ))}
            </div>
          ))}
        </aside>

        {/* Content */}
        <div className="docContentWrap" ref={contentRef}>
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
