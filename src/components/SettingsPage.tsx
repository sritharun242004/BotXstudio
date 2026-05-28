import { useState, useEffect, useRef } from "react";
import AppSelect from "./AppSelect";
import { useNavigate, useLocation } from "react-router-dom";
import { getSession, logout } from "../lib/auth";
import { useCredits } from "../context/CreditsContext";
import { fetchCreditTransactions, type CreditTransaction } from "../lib/credits";
import { IMAGE_GENERATION_MODELS } from "../lib/storyboards";
import { apiGet, apiPost } from "../lib/api";
import {
  User, CreditCard, Sparkles, Palette, Bell, FolderOpen, Shield, Zap,
  Sliders, BarChart2, HelpCircle, Mail, Bug, Lightbulb, MessageCircle,
  Bookmark, LayoutDashboard, BookOpen, Shirt, Coins, LogOut, MessageSquare,
  Menu, X, Settings, HardDrive, Download
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type SectionKey =
  | "profile" | "credits" | "generation"
  | "notifications" | "assets" | "security" | "performance"
  | "usage" | "support";

interface UserSettings {
  displayName: string; bio: string;
  preferredModel: "flash" | "pro";
  defaultOutputCount: number;
  autoDetailShot: boolean; autoBackView: boolean;
  defaultBackground: string;
  defaultRatio: "1:1" | "3:4" | "4:3" | "9:16" | "16:9";
  fastMode: boolean; highQuality: boolean; consistencyMode: boolean;
  theme: "light" | "dark" | "system";
  compactMode: boolean; reducedAnimations: boolean; highContrast: boolean;
  notifGenComplete: boolean; notifCreditLow: boolean;
  notifPayment: boolean; notifUpdates: boolean; notifFeatures: boolean;
  autoSaveGen: boolean; autoSavePrints: boolean;
  privateGenerations: boolean; hideProfile: boolean;
  compressUploads: boolean; optimizedLoading: boolean; lowBandwidth: boolean;
  showPrompts: boolean; betaFeatures: boolean; experimentalUI: boolean;
}

const DEFAULT_SETTINGS: UserSettings = {
  displayName: "", bio: "",
  preferredModel: "flash", defaultOutputCount: 1,
  autoDetailShot: false, autoBackView: false,
  defaultBackground: "studio", defaultRatio: "3:4",
  fastMode: true, highQuality: false, consistencyMode: false,
  theme: "light", compactMode: false, reducedAnimations: false, highContrast: false,
  notifGenComplete: true, notifCreditLow: true,
  notifPayment: true, notifUpdates: false, notifFeatures: true,
  autoSaveGen: true, autoSavePrints: true,
  privateGenerations: false, hideProfile: false,
  compressUploads: true, optimizedLoading: true, lowBandwidth: false,
  showPrompts: false, betaFeatures: false, experimentalUI: false,
};

const SETTINGS_KEY = "bsx_user_settings";

function settingsStorageKey(): string | null {
  const userId = getSession()?.id;
  return userId ? `${SETTINGS_KEY}::${userId}` : null;
}

function loadSettings(): UserSettings {
  try {
    const key = settingsStorageKey();
    if (!key) return DEFAULT_SETTINGS;
    const raw = localStorage.getItem(key);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch { return DEFAULT_SETTINGS; }
}
function saveSettings(s: UserSettings) {
  const key = settingsStorageKey();
  if (!key) return;
  localStorage.setItem(key, JSON.stringify(s));
}

// ─── Nav sections ─────────────────────────────────────────────────────────────

const SECTIONS: { key: SectionKey; label: string; Icon: React.ElementType }[] = [
  { key: "profile",    label: "Profile",     Icon: User },
  { key: "credits",    label: "Billing",     Icon: CreditCard },
  { key: "generation", label: "Generation",  Icon: Sparkles },
  { key: "assets",     label: "Assets",      Icon: FolderOpen },
  { key: "security",   label: "Security",    Icon: Shield },
  { key: "usage",      label: "Usage",       Icon: BarChart2 },
  { key: "support",    label: "Support",     Icon: HelpCircle },
];

const APP_NAV = [
  { tab: "generate",   label: "Generate Images", Icon: Sparkles        },
  { tab: "tryon",      label: "Try On",          Icon: Shirt           },
  { tab: "saved",      label: "Saved Images",    Icon: Bookmark        },
  { tab: "assets",     label: "Uploaded Assets", Icon: FolderOpen      },
  { tab: "dashboard",  label: "Dashboard",       Icon: LayoutDashboard },
  { tab: "docs",       label: "Documents",       Icon: BookOpen        },
] as const;

// ─── Reusable UI atoms ────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={`stgToggle${checked ? " stgToggleOn" : ""}`}
      onClick={() => onChange(!checked)}
    >
      <span className="stgToggleThumb" />
    </button>
  );
}

function SettingRow({ label, desc, children, danger }: {
  label: string; desc?: string; children: React.ReactNode; danger?: boolean;
}) {
  return (
    <div className={`stgRow${danger ? " stgRowDanger" : ""}`}>
      <div className="stgRowText">
        <div className="stgRowLabel">{label}</div>
        {desc && <div className="stgRowDesc">{desc}</div>}
      </div>
      <div className="stgRowControl">{children}</div>
    </div>
  );
}

function SectionCard({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="stgCard">
      {title && <div className="stgCardTitle">{title}</div>}
      {children}
    </div>
  );
}

function DangerBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return <button type="button" className="stgDangerBtn" onClick={onClick}>{label}</button>;
}

function SecondaryBtn({ label, onClick, icon }: { label: string; onClick: () => void; icon?: string }) {
  return (
    <button type="button" className="stgSecondaryBtn" onClick={onClick}>
      {icon && <span>{icon}</span>}{label}
    </button>
  );
}

// ─── Section: Profile ─────────────────────────────────────────────────────────

function ProfileSection({ settings, update }: {
  settings: UserSettings; update: (k: keyof UserSettings, v: unknown) => void;
}) {
  const session = getSession();
  const [name, setName] = useState(settings.displayName || session?.name || "");
  const [bio, setBio] = useState(settings.bio || "");
  const [saved, setSaved] = useState(false);

  function handleSave() {
    update("displayName", name);
    update("bio", bio);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="stgSectionContent">
      <div className="stgSectionHeader" style={{ display: "none" }}>
        {/* Title is already in the main content header */}
        <div className="stgSectionTitle">Profile</div>
        <div className="stgSectionDesc">Manage your personal information</div>
      </div>

      <SectionCard>
        <div className="stgProfileHero">
          <div className="stgProfileAvatar">
            {(name || session?.email || "U")[0].toUpperCase()}
          </div>
          <div>
            <div className="stgProfileName" style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>
              {name || session?.name || "No name set"}
            </div>
            <div className="stgProfileEmail" style={{ fontSize: 13, color: "var(--muted-color)", marginTop: 2 }}>
              {session?.email}
            </div>
          </div>
        </div>

        <div className="stgCardPad" style={{ padding: 24 }}>
          <div className="stgGrid2Col">
            <div className="stgFieldGroup">
              <label className="stgLabel">Display Name</label>
              <input className="stgInput" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
            </div>
            <div className="stgFieldGroup">
              <label className="stgLabel">Email Address</label>
              <input className="stgInput" value={session?.email || ""} disabled />
              <span className="stgFieldNote" style={{ fontSize: 11, display: "block", marginTop: 4 }}>
                Email is managed via your Cognito account
              </span>
            </div>
            <div className="stgFieldGroup stgColSpan2">
              <label className="stgLabel">Bio <span className="stgOptional">optional</span></label>
              <textarea className="stgTextarea" value={bio} onChange={e => setBio(e.target.value)}
                placeholder="A short bio about yourself…" rows={3} />
            </div>
          </div>
        </div>

        <div className="stgProfileCardFooter">
          <button type="button" className="stgSignOutLink" onClick={logout}>
            <LogOut size={14} strokeWidth={2.5} />
            Sign Out
          </button>
          
          <button 
            type="button" 
            className="stgPrimaryBtn" 
            onClick={handleSave}
            style={{ 
              marginTop: 0, 
              padding: "9px 20px", 
              fontSize: 13, 
              borderRadius: 20, 
              background: "var(--accent)", 
              borderColor: "var(--accent)" 
            }}
          >
            {saved ? "✓ Saved" : "Save"}
          </button>
        </div>
      </SectionCard>

      <SectionCard title="Account Security">
        <SettingRow label="Change Password" desc="Send a password reset email to your account">
          <SecondaryBtn label="Send Reset Email" onClick={() => {
            window.open(`mailto:official@thebotcompany.in?subject=Password Reset Request`, "_blank");
          }} />
        </SettingRow>
        <SettingRow label="Delete Account" desc="Permanently delete your account and all data" danger>
          <DangerBtn label="Delete Account" onClick={() => {
            if (confirm("This will permanently delete your account and all data. This cannot be undone. Continue?")) {
              alert("Please contact official@thebotcompany.in to complete account deletion.");
            }
          }} />
        </SettingRow>
      </SectionCard>

      <SectionCard title="Notifications">
        {([
          { key:"notifGenComplete", label:"Generation Completed", desc:"Notify when an image finishes generating" },
          { key:"notifCreditLow",   label:"Credit Low Alert",    desc:"Warn when your balance is running low" },
          { key:"notifPayment",     label:"Payment Successful",  desc:"Confirm when credits are added to your account" },
          { key:"notifUpdates",     label:"Product Updates",     desc:"News about platform changes and improvements" },
          { key:"notifFeatures",    label:"New Features",        desc:"Be the first to know about new capabilities" },
        ] as const).map(r => (
          <SettingRow key={r.key} label={r.label} desc={r.desc}>
            <Toggle checked={settings[r.key] as boolean} onChange={v => update(r.key, v)} />
          </SettingRow>
        ))}
      </SectionCard>
    </div>
  );
}

// ─── Section: Credits ─────────────────────────────────────────────────────────

function getModelCreditLabel(modelId: string, pricing: Record<string, number>): string {
  if (modelId === "hybrid-editorial") {
    const flash = pricing["gemini-2.5-flash-image"] ?? 5;
    const flux  = pricing["fal-ai/flux-pro/kontext/multi"] ?? 5;
    return `${flash + flux * 2} cr / set`;
  }
  if (modelId === "gpt-image-2") {
    const min = pricing["gpt-medium-1024x768"] ?? 6;
    const max = pricing["gpt-high-1024x1024"] ?? 25;
    return `${min} – ${max} cr / img`;
  }
  const cost = pricing[modelId];
  return cost !== undefined ? `${cost} cr / img` : "—";
}

interface CreditPack {
  key: "basic" | "growth" | "enterprise";
  label: string;
  credits: number | null;
  price: number | null;
  orig: number | null;
  badge: string;
  accent: string;
}

const CREDIT_PACKS: CreditPack[] = [
  { key: "basic",      label: "Basic",      credits: 300,  price: 499,  orig: null, badge: "",         accent: "#8B5CF6" },
  { key: "growth",     label: "Growth",     credits: 1000, price: 1299, orig: 1663, badge: "Popular",  accent: "#7C3AED" },
  { key: "enterprise", label: "Enterprise", credits: null, price: null, orig: null, badge: "Custom",   accent: "#0369A1" },
];

type BuyPackKey = "basic" | "growth" | "enterprise" | "custom";

function CreditsSection() {
  const { balance, freeImagesRemaining, modelPricing, isDeveloper, creditsSpent } = useCredits();
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [coupon, setCoupon] = useState("");
  const [couponBusy, setCouponBusy] = useState(false);
  const [couponMsg, setCouponMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [txLoading, setTxLoading] = useState(true);

  const SLIDER_MIN = 300;
  const SLIDER_MAX = 10000;
  const QUICK_PICKS = [
    { credits: 300,   label: "300" },
    { credits: 500,   label: "500" },
    { credits: 1000,  label: "1K" },
    { credits: 2000,  label: "2K" },
    { credits: 5000,  label: "5K" },
    { credits: 10000, label: "10K" },
  ];
  const SCALE_MARKS = [
    { credits: 300,   label: "300" },
    { credits: 1000,  label: "1K" },
    { credits: 5000,  label: "5K" },
    { credits: 10000, label: "10K" },
  ];
  const [credits, setCredits] = useState(1000);

  function computePrice(cr: number): { price: number; rate: number; discount: number } {
    if (cr >= 10000) return { price: Math.round(cr * 1.33), rate: 1.33, discount: 20 };
    if (cr >= 5000)  return { price: Math.round(cr * 1.49), rate: 1.49, discount: 10 };
    return                  { price: Math.round(cr * 1.66), rate: 1.66, discount: 0 };
  }

  useEffect(() => {
    fetchCreditTransactions()
      .then(setTransactions)
      .catch(() => {})
      .finally(() => setTxLoading(false));
  }, []);

  async function handleRedeem() {
    const code = coupon.trim().toUpperCase();
    if (!code) return;
    setCouponBusy(true);
    setCouponMsg(null);
    try {
      const res = await apiPost<{ creditsAdded: number; newBalance: number }>("/api/affiliates/redeem", { code });
      setCouponMsg({ ok: true, text: `₹${res.creditsAdded} credits added! Your new balance is ₹${res.newBalance}.` });
      setCoupon("");
      fetchCreditTransactions().then(setTransactions).catch(() => {});
    } catch (e: any) {
      setCouponMsg({ ok: false, text: e.message || "Failed to redeem code" });
    } finally {
      setCouponBusy(false);
    }
  }

  function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  }

  const flashCr  = modelPricing["gemini-2.5-flash-image"] ?? 5;
  const fluxCr   = modelPricing["fal-ai/flux-pro/kontext/multi"] ?? 5;
  const proMaxCr = modelPricing["gemini-3-pro-image-preview"] ?? 20;
  const gptMinCr = modelPricing["gpt-medium-1024x768"] ?? 6;
  const gptMaxCr = modelPricing["gpt-high-1024x1024"] ?? 25;
  const plusCr   = flashCr + fluxCr * 2;
  const proAvgCr = Math.round((gptMinCr + gptMaxCr) / 2);

  const { price: activePrice, rate: activeRate, discount: activeDiscount } = computePrice(credits);
  const mailBody = `Hi, I'd like to purchase ${credits.toLocaleString()} credits for ₹${activePrice.toLocaleString()}. My registered email is [your email]. Please send payment details.`;
  const mailLink = `mailto:official@thebotcompany.in?subject=Buy Credits - Botzudio&body=${encodeURIComponent(mailBody)}`;

  return (
    <div className="stgSectionContent">
      <div className="stgSectionHeader">
        <div className="stgSectionTitle">Credits & Billing</div>
        <div className="stgSectionDesc">Manage your balance and view spending history</div>
      </div>

      {/* Credits Card (Top Panel) */}
      <div style={{
        background: "var(--surface)", border: "2px solid var(--border-strong)",
        borderRadius: "var(--radius-md)", padding: "24px 32px",
        boxShadow: "var(--shadow-card)", marginBottom: 24
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--muted-color)", textTransform: "uppercase", letterSpacing: "0.8px" }}>Credits</div>
        <div style={{ fontSize: 14, color: "var(--muted-color)", marginTop: 4 }}>Current Balance</div>
        
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 8 }}>
          <span style={{
            fontSize: 48, fontWeight: 900, color: "var(--quaternary)", // green color for credits!
            fontFamily: "var(--font-heading)", letterSpacing: "-1px", lineHeight: 1
          }}>
            {isDeveloper ? "Unlimited" : Math.floor(balance).toLocaleString()}
          </span>
          <span style={{ fontSize: 16, fontWeight: 700, color: "var(--muted-color)" }}>credits</span>
        </div>
        
        <div style={{ fontSize: 13.5, color: "var(--muted-color)", marginTop: 14, fontWeight: 500 }}>
          Purchase credits to use with Generate, Try On, and Uploaded Assets.
        </div>
      </div>

      {/* Credit Packages */}
      {!isDeveloper && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text)", textTransform: "uppercase", letterSpacing: "0.7px", marginBottom: 14 }}>
            Credit Packages
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="stgPackGrid">
            {/* Pack 1 — Basic */}
            {(() => {
              const cr = 300;
              const mailB = `Hi, I'd like to purchase the Basic Pack (${cr} credits) for ₹499. My registered email is [your email]. Please send payment details.`;
              return (
                <div style={{
                  background: "var(--surface)", border: "2px solid var(--border-strong)",
                  borderRadius: 20, padding: "24px 24px 20px", position: "relative",
                  boxShadow: "var(--shadow-card)", display: "flex", flexDirection: "column", gap: 0,
                }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "var(--muted-color)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>Pack 1</div>
                  <div style={{ fontFamily: "var(--font-heading)", fontSize: 28, fontWeight: 900, color: "var(--text)", marginBottom: 8 }}>Basic</div>
                  <div style={{ fontFamily: "var(--font-heading)", fontSize: 32, fontWeight: 900, color: "var(--text)", marginBottom: 10 }}>₹499</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
                    <div style={{ background: "#F3F0FF", border: "2px solid #DDD6FE", borderRadius: 10, padding: "6px 12px", textAlign: "center" }}>
                      <div style={{ fontSize: 18, fontWeight: 900, color: "var(--accent)" }}>{cr}</div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "var(--muted-color)" }}>credits</div>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--muted-color)", fontWeight: 500, lineHeight: 1.5 }}>one-time<br />never expires</div>
                  </div>
                  <div style={{ height: 1, background: "var(--border)", marginBottom: 14 }} />
                  <div style={{ fontSize: 10, fontWeight: 800, color: "var(--muted-color)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>What you can generate</div>
                  {[
                    { label: "Flash",  val: `~${Math.floor(cr / flashCr)} images`,           note: `${flashCr} cr each` },
                    { label: "ProMax", val: `~${Math.floor(cr / proMaxCr)} images`,           note: `${proMaxCr} cr each` },
                    { label: "Plus",   val: `~${Math.floor(cr / plusCr)} sets`,               note: `${plusCr} cr/set` },
                    { label: "Pro",    val: `${Math.floor(cr / gptMaxCr)}–${Math.floor(cr / gptMinCr)} images`, note: `${gptMinCr}–${gptMaxCr} cr each` },
                  ].map(r => (
                    <div key={r.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 0", fontSize: 13 }}>
                      <span style={{ fontWeight: 700, color: "var(--text)", minWidth: 52 }}>{r.label}</span>
                      <span style={{ fontWeight: 800, color: "var(--accent)", flex: 1 }}>{r.val}</span>
                      <span style={{ fontSize: 11, color: "var(--muted-color)", fontWeight: 500 }}>{r.note}</span>
                    </div>
                  ))}
                  <a
                    href={`mailto:official@thebotcompany.in?subject=Buy Credits - Basic Pack&body=${encodeURIComponent(mailB)}`}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center",
                      marginTop: 18, padding: "11px 0", borderRadius: 999,
                      border: "2px solid var(--text)", background: "transparent",
                      color: "var(--text)", textDecoration: "none", fontSize: 13, fontWeight: 800,
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = "var(--text)"; e.currentTarget.style.color = "#fff"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text)"; }}
                  >
                    Buy {cr} Credits →
                  </a>
                </div>
              );
            })()}

            {/* Pack 2 — Growth (Most Popular) */}
            {(() => {
              const cr = 1000;
              const mailB = `Hi, I'd like to purchase the Growth Pack (${cr} credits) for ₹1,299. My registered email is [your email]. Please send payment details.`;
              return (
                <div style={{
                  background: "linear-gradient(135deg, #EDE9FE 0%, #DDD6FE 100%)",
                  border: "2.5px solid #8B5CF6",
                  borderRadius: 20, padding: "24px 24px 20px", position: "relative",
                  boxShadow: "0 4px 24px rgba(139,92,246,0.18)", display: "flex", flexDirection: "column",
                }}>
                  {/* Most popular badge */}
                  <div style={{
                    position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)",
                    background: "#F59E0B", color: "#fff", fontSize: 10, fontWeight: 900,
                    letterSpacing: "0.12em", textTransform: "uppercase", padding: "5px 14px",
                    borderRadius: 999, whiteSpace: "nowrap",
                  }}>
                    Most Popular
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "var(--accent)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>Most Popular</div>
                  <div style={{ fontFamily: "var(--font-heading)", fontSize: 28, fontWeight: 900, color: "var(--text)", marginBottom: 8 }}>Growth</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 10 }}>
                    <div style={{ fontFamily: "var(--font-heading)", fontSize: 32, fontWeight: 900, color: "var(--text)" }}>₹1,299</div>
                    <div style={{ fontSize: 14, color: "var(--muted-color)", textDecoration: "line-through", fontWeight: 600 }}>₹1,663</div>
                    <div style={{ background: "#F59E0B", color: "#fff", fontSize: 11, fontWeight: 800, padding: "2px 8px", borderRadius: 999 }}>Save 22%</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
                    <div style={{ background: "#fff", border: "2px solid #DDD6FE", borderRadius: 10, padding: "6px 12px", textAlign: "center" }}>
                      <div style={{ fontSize: 18, fontWeight: 900, color: "var(--accent)" }}>{cr}</div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "var(--muted-color)" }}>credits</div>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--muted-color)", fontWeight: 500, lineHeight: 1.5 }}>one-time<br />never expires</div>
                  </div>
                  <div style={{ height: 1, background: "rgba(139,92,246,0.2)", marginBottom: 14 }} />
                  <div style={{ fontSize: 10, fontWeight: 800, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>What you can generate</div>
                  {[
                    { label: "Flash",  val: `~${Math.floor(cr / flashCr)} images`,           note: `${flashCr} cr each` },
                    { label: "ProMax", val: `~${Math.floor(cr / proMaxCr)} images`,           note: `${proMaxCr} cr each` },
                    { label: "Plus",   val: `~${Math.floor(cr / plusCr)} sets`,               note: `${plusCr} cr/set` },
                    { label: "Pro",    val: `${Math.floor(cr / gptMaxCr)}–${Math.floor(cr / gptMinCr)} images`, note: `${gptMinCr}–${gptMaxCr} cr each` },
                  ].map(r => (
                    <div key={r.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 0", fontSize: 13 }}>
                      <span style={{ fontWeight: 700, color: "var(--text)", minWidth: 52 }}>{r.label}</span>
                      <span style={{ fontWeight: 800, color: "var(--accent)", flex: 1 }}>{r.val}</span>
                      <span style={{ fontSize: 11, color: "var(--muted-color)", fontWeight: 500 }}>{r.note}</span>
                    </div>
                  ))}
                  <a
                    href={`mailto:official@thebotcompany.in?subject=Buy Credits - Growth Pack&body=${encodeURIComponent(mailB)}`}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center",
                      marginTop: 18, padding: "11px 0", borderRadius: 999,
                      border: "none", background: "var(--accent)",
                      color: "#fff", textDecoration: "none", fontSize: 13, fontWeight: 800,
                      boxShadow: "0 4px 14px rgba(139,92,246,0.35)", transition: "all 0.15s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = "translateY(-1px)"}
                    onMouseLeave={e => e.currentTarget.style.transform = "none"}
                  >
                    Buy {cr} Credits →
                  </a>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Buy Credits — Loops-style two-card layout */}
      {!isDeveloper && (() => {
        const sliderFill = ((credits - SLIDER_MIN) / (SLIDER_MAX - SLIDER_MIN)) * 100;
        return (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16, marginBottom: 24 }} className="stgBillingGrid">

            {/* ── Left card: calculator ── */}
            <div style={{
              border: "1.5px solid var(--border-strong)", borderRadius: 18,
              padding: "32px 32px 28px", background: "var(--surface)",
              position: "relative", display: "flex", flexDirection: "column",
            }} className="stgBillingLeft">
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted-color)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                Custom Credits
              </div>

              {/* Large credit count */}
              <div style={{ marginBottom: 28 }}>
                <span style={{ fontFamily: "var(--font-heading)", fontSize: 42, fontWeight: 900, color: "var(--text)", lineHeight: 1 }}>
                  {credits.toLocaleString()}
                </span>
                <span style={{ fontSize: 16, fontWeight: 700, color: "var(--muted-color)", marginLeft: 8 }}>credits</span>
              </div>

              {/* Slider with colored fill */}
              <div style={{ marginBottom: 8 }}>
                <style>{`
                  .bz-range::-webkit-slider-thumb { -webkit-appearance:none; width:26px; height:26px; background:#fff; border:2px solid #DDD6FE; border-radius:50%; cursor:pointer; box-shadow:0 1px 6px rgba(139,92,246,0.25); }
                  .bz-range::-moz-range-thumb { width:24px; height:24px; background:#fff; border:2px solid #DDD6FE; border-radius:50%; cursor:pointer; box-shadow:0 1px 6px rgba(139,92,246,0.25); }
                `}</style>
                <input
                  type="range"
                  className="bz-range"
                  min={SLIDER_MIN}
                  max={SLIDER_MAX}
                  step={50}
                  value={credits}
                  onChange={e => setCredits(parseInt(e.target.value))}
                  style={{
                    width: "100%", appearance: "none" as any, WebkitAppearance: "none" as any,
                    height: 10, borderRadius: 99, cursor: "pointer", outline: "none", border: "none",
                    background: `linear-gradient(to right, var(--accent) 0%, var(--accent) ${sliderFill}%, #E2E8F0 ${sliderFill}%, #E2E8F0 100%)`,
                  }}
                />
              </div>

              {/* Scale marks at correct proportional positions */}
              <div style={{ position: "relative", height: 18, marginBottom: 24 }}>
                {SCALE_MARKS.map(m => {
                  const pct = (m.credits - SLIDER_MIN) / (SLIDER_MAX - SLIDER_MIN) * 100;
                  return (
                    <span key={m.label} style={{
                      position: "absolute", left: `${pct}%`,
                      transform: pct === 0 ? "none" : pct === 100 ? "translateX(-100%)" : "translateX(-50%)",
                      fontSize: 11, fontWeight: 700, color: "var(--muted-color)", whiteSpace: "nowrap",
                    }}>{m.label}</span>
                  );
                })}
              </div>

              {/* Quick-pick pills */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 28 }}>
                {QUICK_PICKS.map(p => {
                  const isSel = credits === p.credits;
                  return (
                    <button key={p.label} type="button" onClick={() => setCredits(p.credits)} style={{
                      padding: "6px 16px", borderRadius: 99, fontSize: 12, fontWeight: 700,
                      border: `2px solid ${isSel ? "var(--accent)" : "var(--border-strong)"}`,
                      cursor: "pointer", transition: "all 0.15s",
                      background: isSel ? "var(--accent)" : "transparent",
                      color: isSel ? "#fff" : "var(--text)",
                    }}>{p.label}</button>
                  );
                })}
              </div>

              {/* Stats row */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginTop: "auto" }}>
                {[
                  { label: "Total Price", value: `₹${activePrice.toLocaleString()}`, color: "var(--text)" },
                  { label: "Per Credit",  value: `₹${activeRate.toFixed(2)}`,        color: "var(--accent)" },
                  { label: "You Save",    value: `${activeDiscount}%`,               color: activeDiscount > 0 ? "var(--quaternary)" : "var(--muted-color)" },
                ].map(s => (
                  <div key={s.label} style={{ background: "#F8F7FF", border: "1.5px solid #EDE9FE", borderRadius: 12, padding: "12px 8px", textAlign: "center" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "var(--muted-color)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>{s.label}</div>
                    <div style={{ fontSize: 15, fontWeight: 900, color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Right card: order summary ── */}
            <div style={{
              border: "1.5px solid var(--border-strong)", borderRadius: 18,
              padding: "32px 24px 28px", background: "#F8F7FF",
              display: "flex", flexDirection: "column",
            }} className="stgBillingRight">
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted-color)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                Your Order
              </div>

              {/* Price */}
              <div style={{ marginBottom: 6 }}>
                <div style={{ fontFamily: "var(--font-heading)", fontSize: 38, fontWeight: 900, color: "var(--text)", lineHeight: 1 }}>
                  ₹{activePrice.toLocaleString()}
                </div>
                <div style={{ fontSize: 12, color: "var(--muted-color)", fontWeight: 600, marginTop: 6 }}>
                  ₹{activeRate.toFixed(2)} per credit · one-time
                </div>
              </div>

              <div style={{ height: 1, background: "#DDD6FE", margin: "18px 0" }} />

              {/* Line items */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13, flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", color: "var(--muted-color)", fontWeight: 500 }}>
                  <span>{credits.toLocaleString()} credits</span>
                  <span>₹{activePrice.toLocaleString()}</span>
                </div>
                {activeDiscount > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", color: "var(--quaternary)", fontWeight: 600 }}>
                    <span>Bulk discount</span>
                    <span>−{activeDiscount}%</span>
                  </div>
                )}
                <div style={{ height: 1, background: "#DDD6FE", margin: "4px 0" }} />
                <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text)", fontWeight: 800, fontSize: 15 }}>
                  <span>Total</span>
                  <span>₹{activePrice.toLocaleString()}</span>
                </div>
              </div>

              {/* CTA */}
              <a href={mailLink} style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                marginTop: 24, padding: "13px 0", borderRadius: 999,
                background: "var(--accent)", color: "#fff", textDecoration: "none",
                fontSize: 14, fontWeight: 800, boxShadow: "0 4px 16px rgba(139,92,246,0.35)",
                transition: "all 0.15s",
              }}
                onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
                onMouseLeave={e => e.currentTarget.style.transform = "none"}
              >
                Proceed to Payment
              </a>
              <div style={{ fontSize: 11, color: "var(--muted-color)", textAlign: "center", marginTop: 10, fontWeight: 500 }}>
                Credit updates in 24h via UPI link
              </div>
            </div>

          </div>
        );
      })()}

      {/* Model Pricing Table */}
      <SectionCard title="Credits Per Generation">
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <th style={{ textAlign: "left", padding: "6px 10px", color: "var(--muted-color)", fontWeight: 600 }}>Model</th>
              <th style={{ textAlign: "left", padding: "6px 10px", color: "var(--muted-color)", fontWeight: 600 }}>Credits</th>
              <th style={{ textAlign: "left", padding: "6px 10px", color: "var(--muted-color)", fontWeight: 600 }}>Notes</th>
            </tr>
          </thead>
          <tbody>
            {IMAGE_GENERATION_MODELS.map(m => (
              <tr key={m.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <td style={{ padding: "8px 10px", color: "var(--text)", fontWeight: 500 }}>{m.label}</td>
                <td style={{ padding: "8px 10px" }}>
                  <span style={{ color: "#fbbf24", fontWeight: 700 }}>
                    {getModelCreditLabel(m.id, modelPricing)}
                  </span>
                </td>
                <td style={{ padding: "8px 10px", color: "var(--muted-color)", fontSize: 12 }}>
                  {m.id === "gemini-2.5-flash-image" && `6 free images included`}
                  {m.id === "gemini-3-pro-image-preview" && `6 free images included`}
                  {m.id === "hybrid-editorial" && "Flash + 2× FLUX angles"}
                  {m.id === "gpt-image-2" && "Varies by quality & size"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ marginTop: 12, fontSize: 12, color: "var(--muted-color)", fontStyle: "italic" }}>
          * Prices are set by admin and update in real time. 1 credit = ₹1 INR.
        </div>
      </SectionCard>

      {/* Redeem promo code */}
      <SectionCard title="Redeem Coupon">
        <div style={{ position: "relative" }}>
          <input
            className="stgInput"
            placeholder="Enter promo / affiliate code"
            value={coupon}
            onChange={e => { setCoupon(e.target.value.toUpperCase()); setCouponMsg(null); }}
            onKeyDown={e => e.key === "Enter" && handleRedeem()}
            disabled={couponBusy}
            style={{ width: "100%", paddingRight: 110 }}
          />
          <button
            onClick={handleRedeem}
            disabled={couponBusy || !coupon.trim()}
            style={{
              position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)",
              background: coupon.trim() ? "var(--text)" : "var(--border-strong)",
              color: coupon.trim() ? "#fff" : "var(--muted-color)",
              border: "none", borderRadius: 8, padding: "8px 18px",
              fontSize: 13, fontWeight: 700, cursor: coupon.trim() ? "pointer" : "default",
              transition: "all 0.15s", whiteSpace: "nowrap",
            }}
          >
            {couponBusy ? "Checking…" : "Redeem"}
          </button>
        </div>
        {couponMsg && (
          <div style={{
            marginTop: 10,
            padding: "10px 14px",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            background: couponMsg.ok ? "#F0FDF4" : "#FEF2F2",
            color: couponMsg.ok ? "#16A34A" : "#DC2626",
            border: `1px solid ${couponMsg.ok ? "#BBF7D0" : "#FECACA"}`,
          }}>
            {couponMsg.ok ? "✓ " : "✗ "}{couponMsg.text}
          </div>
        )}
      </SectionCard>

      {/* Invoices (Invoice / Transaction History) */}
      <SectionCard title="Invoices">
        <div style={{ fontSize: 12, color: "var(--muted-color)", marginBottom: 16, fontStyle: "italic" }}>
          View and download your receipt and transaction invoices.
        </div>
        {txLoading ? (
          <div className="stgEmpty">Loading transactions…</div>
        ) : transactions.length === 0 ? (
          <div className="stgEmpty">No transactions yet.</div>
        ) : (
          <div className="stgTxTable">
            <div className="stgTxHead" style={{ display: "grid", gridTemplateColumns: "110px 90px 1fr 90px 90px 80px", padding: "10px 14px" }}>
              <span>Invoice ID</span><span>Date</span><span>Description</span><span>Amount</span><span>Balance</span><span>Status</span>
            </div>
            {transactions.map(tx => {
              const isCredit = tx.amountInr >= 0;
              const invId = `INV-${tx.id.slice(0, 8).toUpperCase()}`;
              return (
                <div key={tx.id} className="stgTxRow" style={{ display: "grid", gridTemplateColumns: "110px 90px 1fr 90px 90px 80px", alignItems: "center", padding: "12px 14px" }}>
                  <span style={{ fontWeight: 700, color: "var(--text)" }}>{invId}</span>
                  <span className="stgTxDate">{fmtDate(tx.createdAt)}</span>
                  <span className="stgTxDesc">{tx.description || (tx.type === "image_gen" ? "AI Image Generation" : "Credit Top-up")}</span>
                  <span className={`stgTxAmt ${!isCredit ? "stgTxDebit" : "stgTxCredit"}`}>
                    {!isCredit ? "−" : "+"}₹{Math.abs(tx.amountInr).toFixed(2)}
                  </span>
                  <span className="stgTxBal">₹{tx.balanceAfter.toFixed(2)}</span>
                  <span>
                    <span style={{
                      display: "inline-block", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700,
                      background: isCredit ? "#F0FDF4" : "#F3F4F6",
                      color: isCredit ? "#16A34A" : "var(--muted-color)",
                      border: `1.5px solid ${isCredit ? "#BBF7D0" : "var(--border)"}`
                    }}>
                      {isCredit ? "Paid" : "Success"}
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>
    </div>
  );
}

// ─── Section: Generation ──────────────────────────────────────────────────────

function GenerationSection({ settings, update }: {
  settings: UserSettings; update: (k: keyof UserSettings, v: unknown) => void;
}) {
  return (
    <div className="stgSectionContent">
      <div className="stgSectionHeader">
        <div className="stgSectionTitle">Generation Preferences</div>
        <div className="stgSectionDesc">Your default settings for AI image generation</div>
      </div>

      <SectionCard title="Default Options">
        <SettingRow label="Preferred AI Model" desc="Which model to use by default">
          <AppSelect
            size="lg"
            value={settings.preferredModel}
            onChange={val => update("preferredModel", val)}
            options={[
              { value: "flash", label: "Gemini 2.5 Flash — Faster" },
              { value: "pro",   label: "Gemini 2.5 Pro — Higher quality" },
            ]}
          />
        </SettingRow>
        <SettingRow label="Default Image Ratio" desc="Aspect ratio for generated images">
          <AppSelect
            size="lg"
            value={settings.defaultRatio}
            onChange={val => update("defaultRatio", val)}
            options={(["1:1","3:4","4:3","9:16","16:9"] as const).map(r => ({ value: r, label: r }))}
          />
        </SettingRow>
        <SettingRow label="Default Background Style" desc="Starting background theme">
          <AppSelect
            size="lg"
            value={settings.defaultBackground}
            onChange={val => update("defaultBackground", val)}
            options={["Studio","Outdoor","Urban","Nature","Minimal","Custom"].map(b => ({ value: b.toLowerCase(), label: b }))}
          />
        </SettingRow>
        <SettingRow label="Auto-generate Detail Shot" desc="Automatically create a close-up view after generation">
          <Toggle checked={settings.autoDetailShot} onChange={v => update("autoDetailShot", v)} />
        </SettingRow>
        <SettingRow label="Auto-generate Back View" desc="Automatically create a back view after generation">
          <Toggle checked={settings.autoBackView} onChange={v => update("autoBackView", v)} />
        </SettingRow>
      </SectionCard>

      <SectionCard title="Quality Options">
        <SettingRow label="Fast Mode" desc="Prioritise speed over detail">
          <Toggle checked={settings.fastMode} onChange={v => update("fastMode", v)} />
        </SettingRow>
        <SettingRow label="High Quality Mode" desc="Maximum detail, slower generation">
          <Toggle checked={settings.highQuality} onChange={v => update("highQuality", v)} />
        </SettingRow>
        <SettingRow label="Consistency Mode" desc="Keep style consistent across multiple generations">
          <Toggle checked={settings.consistencyMode} onChange={v => update("consistencyMode", v)} />
        </SettingRow>
      </SectionCard>

      <SectionCard title="Advanced">
        <SettingRow label="Show Generation Prompts" desc="Display the AI prompt used for each generation">
          <Toggle checked={settings.showPrompts} onChange={v => update("showPrompts", v)} />
        </SettingRow>
        <SettingRow label="Enable Beta Features" desc="Get access to features that are still being tested">
          <Toggle checked={settings.betaFeatures} onChange={v => update("betaFeatures", v)} />
        </SettingRow>
        <SettingRow label="Experimental UI" desc="Try out interface changes before they go live">
          <Toggle checked={settings.experimentalUI} onChange={v => update("experimentalUI", v)} />
        </SettingRow>
      </SectionCard>

      <SectionCard title="Advanced Settings">
        <SettingRow label="Compress Uploads Before Send" desc="Reduce image size before uploading to improve speed">
          <Toggle checked={settings.compressUploads} onChange={v => update("compressUploads", v)} />
        </SettingRow>
        <SettingRow label="Use Optimised Loading" desc="Lazy-load assets and images for faster navigation">
          <Toggle checked={settings.optimizedLoading} onChange={v => update("optimizedLoading", v)} />
        </SettingRow>
        <SettingRow label="Low Bandwidth Mode" desc="Reduce preview quality and defer non-essential requests">
          <Toggle checked={settings.lowBandwidth} onChange={v => update("lowBandwidth", v)} />
        </SettingRow>
      </SectionCard>
    </div>
  );
}

// ─── Section: Appearance (kept for internal use only, not shown in nav) ───────

function AppearanceSection({ settings, update }: {
  settings: UserSettings; update: (k: keyof UserSettings, v: unknown) => void;
}) {
  function applyTheme(theme: string) {
    document.documentElement.setAttribute("data-theme", theme);
    update("theme", theme);
  }

  return (
    <div className="stgSectionContent">
      <div className="stgSectionHeader">
        <div className="stgSectionTitle">Appearance</div>
        <div className="stgSectionDesc">Customise how Botzudio looks for you</div>
      </div>

      <SectionCard title="Theme">
        <div className="stgThemeGrid">
          {(["light","dark","system"] as const).map(t => (
            <button
              key={t}
              type="button"
              className={`stgThemeCard${settings.theme === t ? " stgThemeCardActive" : ""}`}
              onClick={() => applyTheme(t)}
            >
              <div className="stgThemePreview stgThemePreview-{t}">
                {t === "light" && <div className="stgThemeDot" style={{ background:"#fff", border:"2px solid #e2e8f0" }} />}
                {t === "dark" && <div className="stgThemeDot" style={{ background:"#1e293b" }} />}
                {t === "system" && <div className="stgThemeDot" style={{ background:"linear-gradient(135deg,#fff 50%,#1e293b 50%)" }} />}
              </div>
              <div className="stgThemeLabel">{t.charAt(0).toUpperCase() + t.slice(1)}</div>
            </button>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="UI Options">
        <SettingRow label="Compact Mode" desc="Reduce padding and spacing throughout the UI">
          <Toggle checked={settings.compactMode} onChange={v => update("compactMode", v)} />
        </SettingRow>
        <SettingRow label="Reduced Animations" desc="Minimize motion for better performance or accessibility">
          <Toggle checked={settings.reducedAnimations} onChange={v => update("reducedAnimations", v)} />
        </SettingRow>
        <SettingRow label="High Contrast Mode" desc="Increase contrast for better readability">
          <Toggle checked={settings.highContrast} onChange={v => update("highContrast", v)} />
        </SettingRow>
      </SectionCard>
    </div>
  );
}



// ─── Section: Saved Assets ────────────────────────────────────────────────────

function AssetsSection({ settings, update }: {
  settings: UserSettings; update: (k: keyof UserSettings, v: unknown) => void;
}) {
  const [storageInfo, setStorageInfo] = useState<{ bytes: number } | null>(null);
  useEffect(() => {
    apiGet<any>("/api/usage").then(d => {
      setStorageInfo({ bytes: d.storageBytes ?? 0 });
    }).catch(() => {});
  }, []);

  function fmtBytes(b: number) {
    if (!b) return "0 B";
    const u = ["B","KB","MB","GB"]; const i = Math.floor(Math.log(b)/Math.log(1024));
    return (b/Math.pow(1024,i)).toFixed(i>0?1:0)+" "+u[i];
  }

  return (
    <div className="stgSectionContent">
      <div className="stgSectionHeader">
        <div className="stgSectionTitle">Saved Assets</div>
        <div className="stgSectionDesc">Control what gets automatically saved</div>
      </div>
      <SectionCard title="Auto-Save">
        <SettingRow label="Auto-save Generations" desc="Automatically save every generated image to your library">
          <Toggle checked={settings.autoSaveGen} onChange={v => update("autoSaveGen", v)} />
        </SettingRow>
        <SettingRow label="Auto-save Prints" desc="Automatically save print outputs when complete">
          <Toggle checked={settings.autoSavePrints} onChange={v => update("autoSavePrints", v)} />
        </SettingRow>
      </SectionCard>
      <SectionCard title="Storage">
        <SettingRow label="Storage Used" desc={storageInfo ? fmtBytes(storageInfo.bytes) + " used on AWS S3" : "Loading…"}>
          <div className="stgStoragePill">{storageInfo ? fmtBytes(storageInfo.bytes) : "—"}</div>
        </SettingRow>
        <SettingRow label="Delete All Saved Images" desc="Permanently removes all images from your library" danger>
          <DangerBtn label="Delete All" onClick={() => {
            if (confirm("This will permanently delete ALL saved images. Are you sure?")) {
              alert("Please contact support to bulk-delete your storage.");
            }
          }} />
        </SettingRow>
      </SectionCard>
    </div>
  );
}

// ─── Section: Security ────────────────────────────────────────────────────────

function SecuritySection({ settings, update }: {
  settings: UserSettings; update: (k: keyof UserSettings, v: unknown) => void;
}) {
  return (
    <div className="stgSectionContent">
      <div className="stgSectionHeader">
        <div className="stgSectionTitle">Privacy & Security</div>
        <div className="stgSectionDesc">Protect your account and control your data</div>
      </div>
      <SectionCard title="Security">
        <SettingRow label="Change Password" desc="Send a reset link to your registered email">
          <SecondaryBtn label="Send Reset Email" onClick={() =>
            window.open("mailto:official@thebotcompany.in?subject=Password Reset", "_blank")} />
        </SettingRow>
      </SectionCard>
      <SectionCard title="Privacy">
        <SettingRow label="Private Generations" desc="Hide your generated images from admin previews">
          <Toggle checked={settings.privateGenerations} onChange={v => update("privateGenerations", v)} />
        </SettingRow>
        <SettingRow label="Delete Generation History" desc="Wipe your API call logs and history" danger>
          <DangerBtn label="Delete History" onClick={() => {
            if (confirm("Delete all generation history? This cannot be undone.")) {
              alert("Please contact support to complete this action.");
            }
          }} />
        </SettingRow>
      </SectionCard>
    </div>
  );
}



// ─── useCountUp hook for Settings Page ──────────────────────────────────────
// Only depends on [active] so target changes after animation starts don't restart it.
function useSettingsCountUp(target: number, active: boolean, duration = 500) {
  const [val, setVal] = useState(0);
  const targetRef = useRef(target);
  targetRef.current = target;
  useEffect(() => {
    if (!active) return;
    const end = targetRef.current;
    if (end === 0) { setVal(0); return; }
    let raf: number;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(ease * end));
      if (p < 1) raf = requestAnimationFrame(tick);
      else setVal(end);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active]); // target excluded: captured via ref to prevent re-animation on data updates
  return val;
}

// ─── UsageStatCard — defined outside UsageSection to keep a stable component type ─
function UsageStatCard({ Icon, label, value, suffix = "", color, animate }: {
  Icon: React.ElementType; label: string; value: number;
  suffix?: string; color: string; animate: boolean;
}) {
  const count = useSettingsCountUp(value, animate);
  return (
    <div className="stgUsageCard" style={{
      background: "var(--surface)", border: "2px solid var(--border-strong)",
      borderRadius: "var(--radius-md)", borderTop: `6px solid ${color}`,
      display: "flex", alignItems: "center", gap: 16, padding: "20px 24px",
      boxShadow: "var(--shadow-card)", transition: "all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)"
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: "50%", background: `${color}14`, color,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
      }}>
        <Icon size={20} strokeWidth={2} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="stgUsageValue" style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "var(--text)", fontFamily: "var(--font-heading)", lineHeight: 1.1 }}>
          {count.toLocaleString()}{suffix}
        </div>
        <div style={{ fontSize: 13, color: "var(--muted-color)", fontWeight: 600, marginTop: 4 }}>{label}</div>
      </div>
    </div>
  );
}

// ─── Section: Usage ───────────────────────────────────────────────────────────

function UsageSection() {
  const { balance, costPerImageInr } = useCredits();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [animate, setAnimate] = useState(false);
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);

  useEffect(() => {
    apiGet<any>("/api/usage")
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!loading) {
      const t = setTimeout(() => setAnimate(true), 50);
      return () => clearTimeout(t);
    }
  }, [loading]);

  function fmtBytes(b: number) {
    if (!b) return "0 B";
    const u = ["B","KB","MB","GB"]; const i = Math.floor(Math.log(b)/Math.log(1024));
    return (b/Math.pow(1024,i)).toFixed(i>0?1:0)+" "+u[i];
  }

  function downloadFile(content: string, filename: string, contentType: string) {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportJSON() {
    const report = {
      timestamp: new Date().toISOString(),
      user: data?.user?.email || "unknown",
      metrics: {
        imagesGenerated: data?.images ?? 0,
        moodBoards: data?.storyboards ?? 0,
        creditsSpent: Math.floor((data?.images ?? 0) * costPerImageInr),
        storageBytes: data?.storageBytes ?? 0,
        currentBalance: balance,
        totalApiCalls: data?.apiActivity?.totalApiCalls ?? 0,
        avgLatencyMs: data?.apiActivity?.avgLatencyMs ?? 0,
      },
      dailyImageCounts: data?.dailyImageCounts ?? {},
      apiLogs: data?.apiActivity?.logs ?? []
    };
    downloadFile(JSON.stringify(report, null, 2), "botzudio-usage-report.json", "application/json");
    setExportDropdownOpen(false);
  }

  function exportCSV() {
    let csv = "ID,Type,Model,Prompt Tokens,Output Tokens,Total Tokens,Latency (ms),Status,Error,Created At\n";
    if (data?.apiActivity?.logs) {
      for (const log of data.apiActivity.logs) {
        const safeError = log.errorMessage ? log.errorMessage.replace(/"/g, '""') : "";
        csv += `"${log.id}","${log.type}","${log.model}",${log.promptTokens},${log.outputTokens},${log.totalTokens},${log.latencyMs},"${log.status}","${safeError}","${log.createdAt}"\n`;
      }
    }
    downloadFile(csv, "botzudio-api-activity.csv", "text/csv");
    setExportDropdownOpen(false);
  }

  // Last-7-days bar data
  const days: { short: string; full: string; count: number }[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d   = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    days.push({
      short: d.toLocaleDateString("en-US", { weekday: "short" }),
      full:  d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }),
      count: data?.dailyImageCounts?.[key] ?? 0,
    });
  }
  const totalWeek = days.reduce((s, d) => s + d.count, 0);

  const MODEL_GROUPS = [
    { key: "flash",   label: "Flash",    color: "#8B5CF6", match: (m: string) => m.includes("flash") },
    { key: "pro",     label: "Pro",      color: "#3B82F6", match: (m: string) => m.includes("pro") && !m.includes("kontext") },
    { key: "flux",    label: "Flux Pro", color: "#F59E0B", match: (m: string) => m.includes("flux") || m.includes("kontext") },
    { key: "gpt",     label: "GPT",      color: "#10B981", match: (m: string) => m.includes("gpt") || m.includes("openai") },
    { key: "other",   label: "Other",    color: "#94A3B8", match: () => true },
  ];

  function classifyModel(model: string): typeof MODEL_GROUPS[0] {
    const m = (model || "").toLowerCase();
    return MODEL_GROUPS.find(g => g.match(m)) ?? MODEL_GROUPS[MODEL_GROUPS.length - 1]!;
  }

  const activity = data?.apiActivity ?? { totalApiCalls: 0, totalTokens: 0, avgLatencyMs: 0, logs: [] };
  const modelCounts: Record<string, number> = {};
  for (const log of activity.logs ?? []) {
    const group = classifyModel(log.model);
    modelCounts[group.key] = (modelCounts[group.key] ?? 0) + 1;
  }
  const pieSlices = MODEL_GROUPS
    .map(g => ({ label: g.label, value: modelCounts[g.key] ?? 0, color: g.color }))
    .filter(s => s.value > 0);

  const storageVal = data?.storageBytes ?? 0;
  const storageMB = parseFloat((storageVal / (1024 * 1024)).toFixed(1));

  return (
    <div className="stgSectionContent">
      <div className="stgSectionHeader" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <div>
          <div className="stgSectionTitle">Usage & Analytics</div>
          <div className="stgSectionDesc">Your activity and consumption stats</div>
        </div>
        
        {/* Export Data Dropdown Trigger */}
        {!loading && (
          <div style={{ position: "relative", display: "inline-block" }}>
            <button
              type="button"
              className="stgSecondaryBtn"
              onClick={() => setExportDropdownOpen(v => !v)}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 999, height: 38, border: "2px solid var(--border-strong)", fontSize: 13, fontWeight: 700 }}
            >
              <Download size={14} />
              <span>Export Data</span>
              <span style={{ fontSize: 8 }}>▼</span>
            </button>
            
            {exportDropdownOpen && (
              <>
                <div 
                  style={{ position: "fixed", inset: 0, zIndex: 100 }} 
                  onClick={() => setExportDropdownOpen(false)} 
                />
                <div style={{
                  position: "absolute", right: 0, top: "calc(100% + 6px)",
                  background: "#fff", border: "2px solid var(--border-strong)",
                  borderRadius: 12, boxShadow: "0 8px 30px rgba(0,0,0,0.18)",
                  padding: 6, zIndex: 101, minWidth: 160, display: "flex", flexDirection: "column", gap: 2,
                  animation: "menuFadeIn 0.12s ease"
                }}>
                  <button
                    type="button"
                    onClick={exportJSON}
                    style={{
                      display: "flex", alignItems: "center", gap: 8, width: "100%",
                      padding: "9px 12px", border: "none", borderRadius: 8,
                      background: "transparent", color: "var(--text)", fontSize: 13,
                      fontWeight: 600, fontFamily: "inherit", cursor: "pointer", textAlign: "left"
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "#F3F4F6"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    📄 Export JSON
                  </button>
                  <button
                    type="button"
                    onClick={exportCSV}
                    style={{
                      display: "flex", alignItems: "center", gap: 8, width: "100%",
                      padding: "9px 12px", border: "none", borderRadius: 8,
                      background: "transparent", color: "var(--text)", fontSize: 13,
                      fontWeight: 600, fontFamily: "inherit", cursor: "pointer", textAlign: "left"
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "#F3F4F6"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    📊 Export CSV
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Stat card skeletons */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
            {[...Array(5)].map((_, i) => (
              <div key={i} style={{ background: "#F3F0FB", border: "none", borderRadius: "var(--radius-md)", borderTop: "6px solid #DDD6FE", padding: "20px 24px", display: "flex", alignItems: "center", gap: 16 }}>
                <div className="dbSk" style={{ width: 44, height: 44, borderRadius: "50%", flexShrink: 0 }} />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                  <div className="dbSk" style={{ height: 26, width: "60%", borderRadius: 6 }} />
                  <div className="dbSk" style={{ height: 13, width: "80%", borderRadius: 4 }} />
                </div>
              </div>
            ))}
          </div>
          {/* Chart skeletons */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
            {[...Array(2)].map((_, i) => (
              <div key={i} style={{ background: "#F3F0FB", border: "none", borderRadius: "var(--radius-md)", padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div className="dbSk" style={{ height: 18, width: "50%", borderRadius: 6 }} />
                  <div className="dbSk" style={{ height: 13, width: "35%", borderRadius: 4 }} />
                </div>
                <div className="dbSkBarChart" style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 160 }}>
                  {[70, 45, 85, 30, 60, 90, 50].map((h, j) => (
                    <div key={j} className="dbSk" style={{ flex: 1, height: `${h}%`, borderRadius: "4px 4px 0 0" }} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Grid Cards */}
          <div className="stgUsageGrid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 24 }}>
            <UsageStatCard animate={animate} Icon={Sparkles}   label="Images Generated" value={data?.images ?? 0} color="#8B5CF6" />
            <UsageStatCard animate={animate} Icon={Bookmark}   label="Mood Boards"      value={data?.storyboards ?? 0} color="#3B82F6" />
            <UsageStatCard animate={animate} Icon={Coins}      label="Credits Spent"    value={Math.floor((data?.images ?? 0) * costPerImageInr)} suffix=" cr" color="#EF4444" />
            <UsageStatCard animate={animate} Icon={HardDrive}  label="Storage Used"     value={storageMB} suffix=" MB" color="#10B981" />
            <UsageStatCard animate={animate} Icon={CreditCard} label="Current Balance"  value={Math.floor(balance)} suffix=" credits" color="#F59E0B" />
          </div>

          {/* Visualizations row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16, marginBottom: 16 }}>
            
            {/* SVG Bar Chart for Generation Activity */}
            <div className="stgCard" style={{ padding: 20 }}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: "var(--text)" }}>Image Generation Activity</div>
                <div style={{ fontSize: 12, color: "var(--muted-color)", marginTop: 2 }}>Last 7 days · {totalWeek} total images</div>
              </div>
              <div style={{ height: 160, width: "100%" }}>
                <UsageBarChart days={days} animate={animate} />
              </div>
            </div>

            {/* Donut Chart for Model Distribution */}
            <div className="stgCard" style={{ padding: 20 }}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: "var(--text)" }}>Models Used</div>
                <div style={{ fontSize: 12, color: "var(--muted-color)", marginTop: 2 }}>Based on API call history</div>
              </div>
              <UsageDonutChart slices={pieSlices} animate={animate} />
            </div>

          </div>
        </>
      )}
    </div>
  );
}

// ─── SVG Bar Chart for Usage Section ───────────────────────────────────────
function UsageBarChart({ days, animate }: {
  days: { short: string; full: string; count: number }[];
  animate: boolean;
}) {
  const W = 420, H = 160, padL = 32, padR = 8, padT = 16, padB = 24;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;
  const maxCount = Math.max(1, ...days.map(d => d.count));
  const barW = Math.floor(chartW / days.length * 0.55);
  const gap  = chartW / days.length;
  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "100%", overflow: "visible" }}>
      <defs>
        <linearGradient id="usageBarGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#C4B5FD" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>

      {/* Grid lines + Y labels */}
      {gridLines.map(frac => {
        const y = padT + chartH * (1 - frac);
        const val = Math.round(maxCount * frac);
        return (
          <g key={frac}>
            <line x1={padL} y1={y} x2={W - padR} y2={y}
              stroke={frac === 0 ? "#CBD5E1" : "#E2E8F0"}
              strokeWidth={frac === 0 ? 1.5 : 1}
              strokeDasharray={frac === 0 ? "none" : "3 3"}
            />
            {frac > 0 && (
              <text x={padL - 5} y={y + 4} textAnchor="end"
                fontSize={9} fill="#94A3B8" fontFamily="inherit" fontWeight={600}>
                {val}
              </text>
            )}
          </g>
        );
      })}

      {/* Bars */}
      {days.map((d, i) => {
        const cx    = padL + gap * i + gap / 2;
        const bx    = cx - barW / 2;
        const pct   = maxCount > 0 ? d.count / maxCount : 0;
        const bh    = animate ? Math.max(pct * chartH, d.count > 0 ? 4 : 0) : 0;
        const by    = padT + chartH - bh;
        const rFull = 5;

        return (
          <g key={i}>
            <rect
              x={bx} y={by} width={barW} height={bh}
              rx={bh >= rFull * 2 ? rFull : bh / 2}
              fill="url(#usageBarGrad)"
              style={{
                transition: `y 0.7s cubic-bezier(0.22,1,0.36,1) ${i * 60}ms, height 0.7s cubic-bezier(0.22,1,0.36,1) ${i * 60}ms`,
              }}
            >
              <title>{d.full}: {d.count} images</title>
            </rect>

            {/* Count label above bar */}
            {d.count > 0 && animate && (
              <text
                x={cx} y={by - 4}
                textAnchor="middle" fontSize={9} fontWeight={800}
                fill="#8B5CF6" fontFamily="inherit"
                style={{ transition: `opacity 0.4s ease ${i * 60 + 400}ms` }}
              >
                {d.count}
              </text>
            )}

            {/* Day label */}
            <text x={cx} y={H - 4} textAnchor="middle"
              fontSize={10} fontWeight={700} fill="#94A3B8"
              fontFamily="inherit" style={{ textTransform: "uppercase" }}>
              {d.short}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── SVG Donut Chart for Usage Section ─────────────────────────────────────
function UsageDonutChart({ slices, animate }: {
  slices: { label: string; value: number; color: string }[];
  animate: boolean;
}) {
  const cx = 80, cy = 80, r = 58, rInner = 36;
  const total = slices.reduce((s, sl) => s + sl.value, 0);
  if (total === 0) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 160, color: "#94A3B8", fontSize: 12 }}>
        No model data yet
      </div>
    );
  }

  const sorted = [...slices].sort((a, b) => b.value - a.value);
  const startAngle = -90;

  function polarToXY(deg: number, radius: number) {
    const rad = (deg * Math.PI) / 180;
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  }

  function arcPath(startDeg: number, endDeg: number): string {
    const s = polarToXY(startDeg, r);
    const e = polarToXY(endDeg, r);
    const si = polarToXY(startDeg, rInner);
    const ei = polarToXY(endDeg, rInner);
    const large = endDeg - startDeg > 180 ? 1 : 0;
    return [
      `M ${s.x} ${s.y}`,
      `A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`,
      `L ${ei.x} ${ei.y}`,
      `A ${rInner} ${rInner} 0 ${large} 0 ${si.x} ${si.y}`,
      "Z",
    ].join(" ");
  }

  let angle = startAngle;
  const arcs = sorted.map(sl => {
    const sweep = (sl.value / total) * 360;
    const start = angle;
    const end   = angle + sweep;
    angle = end;
    return { ...sl, start, end, sweep };
  });

  const biggest = sorted[0];

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <svg viewBox="0 0 160 160" style={{ width: 130, height: 130, flexShrink: 0 }}>
        {arcs.map((arc, i) => (
          <path
            key={arc.label}
            d={arcPath(arc.start, arc.end)}
            fill={arc.color}
            stroke="#fff"
            strokeWidth={2}
            style={{
              opacity: animate ? 1 : 0,
              transition: `opacity 0.5s ease ${i * 80}ms`,
            }}
          >
            <title>{arc.label}: {arc.value} ({((arc.value / total) * 100).toFixed(1)}%)</title>
          </path>
        ))}

        {biggest && (
          <>
            <text x={cx} y={cy - 4} textAnchor="middle" fontSize={18} fontWeight={900} fill="#1E293B" fontFamily="inherit">
              {biggest.value}
            </text>
            <text x={cx} y={cy + 10} textAnchor="middle" fontSize={8} fontWeight={800} fill="#8B5CF6" fontFamily="inherit" style={{ textTransform: "uppercase" }}>
              {biggest.label}
            </text>
          </>
        )}
      </svg>

      {/* Legend */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1, minWidth: 0 }}>
        {arcs.map(arc => (
          <div key={arc.label} style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: arc.color, flexShrink: 0 }} />
            <span style={{ fontSize: 11.5, fontWeight: 700, color: "#1E293B", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{arc.label}</span>
            <span style={{ fontSize: 11, color: "#64748B", fontWeight: 600 }}>{arc.value}</span>
            <span style={{ fontSize: 10, color: "#94A3B8", fontWeight: 600, minWidth: 28, textAlign: "right" }}>
              {((arc.value / total) * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Section: Support ─────────────────────────────────────────────────────────

function SupportSection() {
  const actions: Array<{ Icon: React.ElementType; label: string; desc: string; action: () => void }> = [
    { Icon: Mail,          label: "Contact Support",   desc: "Email our team for help",                       action: () => window.open("mailto:official@thebotcompany.in?subject=Support Request", "_blank") },
    { Icon: Bug,           label: "Report a Bug",      desc: "Found something broken? Let us know",           action: () => window.open("mailto:official@thebotcompany.in?subject=Bug Report - Botzudio", "_blank") },
    { Icon: Lightbulb,     label: "Request a Feature", desc: "Suggest something you'd love to see",           action: () => window.open("mailto:official@thebotcompany.in?subject=Feature Request - Botzudio", "_blank") },
    { Icon: MessageCircle, label: "Join Community",    desc: "Connect with other Botzudio creators",        action: () => alert("Community link coming soon!") },
  ];
  return (
    <div className="stgSectionContent">
      <div className="stgSectionHeader">
        <div className="stgSectionTitle">Support</div>
        <div className="stgSectionDesc">We're here to help</div>
      </div>
      <SectionCard>
        {actions.map(a => (
          <button key={a.label} type="button" className="stgSupportRow" onClick={a.action}>
            <span className="stgSupportIcon"><a.Icon size={18} strokeWidth={2} /></span>
            <div className="stgSupportText">
              <div className="stgSupportLabel">{a.label}</div>
              <div className="stgSupportDesc">{a.desc}</div>
            </div>
            <span className="stgSupportArrow">→</span>
          </button>
        ))}
      </SectionCard>
      <SectionCard title="About">
        <div className="stgAboutRow">
          <span>App Version</span><span className="stgAboutVal">Botzudio v2.0</span>
        </div>
        <div className="stgAboutRow">
          <span>Made by</span><span className="stgAboutVal">The Bot Company</span>
        </div>
        <div className="stgAboutRow">
          <span>Contact</span><span className="stgAboutVal">official@thebotcompany.in</span>
        </div>
      </SectionCard>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { balance, isDeveloper } = useCredits();
  const session = getSession();
  const navigate = useNavigate();
  const location = useLocation();
  const rawSection = (location.state as { section?: string } | null)?.section;
  
  const validSections: SectionKey[] = ["profile","credits","generation","assets","security","usage","support"];
  
  // Map consolidated routes for backward compatibility
  let mappedSection: SectionKey = rawSection as SectionKey;
  if (rawSection === "notifications") mappedSection = "profile";
  if (rawSection === "performance") mappedSection = "generation";
  
  const initialSection: SectionKey = (validSections.includes(mappedSection) ? mappedSection : "profile") as SectionKey;
  
  const [activeSection, setActiveSection] = useState<SectionKey>(initialSection);
  const [settings, setSettings] = useState<UserSettings>(loadSettings);
  const [transitioning, setTransitioning] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  function update(key: keyof UserSettings, value: unknown) {
    setSettings(prev => {
      const next = { ...prev, [key]: value };
      saveSettings(next);
      return next;
    });
  }

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeSection]);

  function goBackToApp() {
    localStorage.setItem("esg_active_tab_v1", "generate");
    setTransitioning(true);
    setTimeout(() => navigate("/app"), 1000);
  }

  const SIDEBAR_W = 220;



  if (transitioning) {
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", background: "var(--bg)" }}>
        <div style={{
          width: SIDEBAR_W, flexShrink: 0,
          background: "var(--accent)",
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)",
          backgroundSize: "18px 18px",
          display: "flex", flexDirection: "column",
          padding: "14px 12px", gap: 6,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 6px", marginBottom: 14 }}>
            <div className="stgTransSkSide" style={{ width: 34, height: 34, borderRadius: 8, flexShrink: 0 }} />
            <div className="stgTransSkSide" style={{ width: 80, height: 16 }} />
          </div>
          {[1,2,3,4,5,6,7,8].map(i => (
            <div key={i} className="stgTransSkSide" style={{ height: 36 }} />
          ))}
        </div>
        <div style={{ flex: 1, padding: 28, display: "flex", flexDirection: "column", gap: 18, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div className="stgTransSk" style={{ height: 32, width: 220, borderRadius: 8 }} />
            <div className="stgTransSk" style={{ height: 32, width: 120, borderRadius: 8, marginLeft: "auto" }} />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {[160, 130, 110].map((w, i) => (
              <div key={i} className="stgTransSk" style={{ height: 38, width: w, borderRadius: 8 }} />
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, flex: 1 }}>
            {[1,2,3,4,5,6,7,8].map(i => (
              <div key={i} className="stgTransSk" style={{ borderRadius: 10, aspectRatio: "3/4" }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const activeLabel = SECTIONS.find(s => s.key === activeSection)?.label ?? "Settings";

  return (
    <div className="stgRootPage" style={{ height: "100vh", overflow: "hidden", background: "var(--bg)", display: "flex" }}>

      {/* ── Purple app sidebar (Full Height, real app nav) ────────────────── */}
      <aside className="stgAppSidebar" style={{
        width: SIDEBAR_W, flexShrink: 0,
        background: "var(--accent)",
        backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)",
        backgroundSize: "18px 18px",
        display: "flex", flexDirection: "column",
        borderRight: "2px solid rgba(255,255,255,0.15)",
        height: "100vh",
      }}>
        {/* Top Brand Area in Sidebar */}
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

        {/* Navigation Menu — exact copy of main app navbar */}
        <nav className="sidebarNav" role="tablist" aria-label="Main sections" style={{ padding: "16px 12px", flex: 1, overflowY: "auto" }}>
          {APP_NAV.map(({ tab, label, Icon }) => (
            <button
              key={tab}
              type="button"
              className="navButton"
              onClick={() => {
                if (tab === "docs") { navigate("/app/documentation"); return; }
                localStorage.setItem("esg_active_tab_v1", tab);
                navigate("/app");
              }}
            >
              <Icon size={16} className="navButtonIcon" />
              {label}
            </button>
          ))}
        </nav>

        {/* Bottom Sidebar Widgets (EmailKit style) */}
        <div className="sidebarFooter">
          {/* Credits tracker pill */}
          <div className="creditsPillCard">
            <div>
              <div className="creditsPillLabel">Credits</div>
              <div className="creditsPillValue">
                {isDeveloper ? "Unlimited" : Math.floor(balance)}
              </div>
            </div>
            {!isDeveloper && (
              <button
                type="button"
                className="creditsPillAddBtn"
                onClick={() => {
                  setActiveSection("credits");
                  contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
                }}
                title="Buy Credits"
              >
                +
              </button>
            )}
          </div>

          {/* User footer row */}
          <div className="userFooterRow">
            <div className="userFooterAvatar">
              {(session?.name || session?.email || "U")[0].toUpperCase()}
            </div>
            <div className="userFooterDetails">
              <div className="userFooterName">{session?.name || "No name set"}</div>
              <div className="userFooterEmail">{session?.email}</div>
            </div>
            <button type="button" className="userFooterLogout" onClick={logout} title="Sign Out">
              <LogOut size={15} strokeWidth={2.2} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Mobile Hamburger Header ────────────────────────────────────── */}
      <header className="mobileHeader">
        <button
          type="button"
          className="mobileHamburgerBtn"
          onClick={() => setMobileNavOpen(true)}
          aria-label="Open navigation"
        >
          <Menu size={22} />
        </button>
        <div className="mobileHeaderBrand">
          <div className="mobileHeaderLogo">BZ</div>
          <span className="mobileHeaderTitle">Botzudio</span>
        </div>
        <div style={{ width: 34 }} />
      </header>

      {/* ── Mobile Drawer Overlay ───────────────────────────────────────── */}
      {mobileNavOpen && (
        <div className="mobileDrawerOverlay" onClick={() => setMobileNavOpen(false)} />
      )}

      {/* ── Mobile Drawer ──────────────────────────────────────────────── */}
      <div className={`mobileDrawer${mobileNavOpen ? " mobileDrawerOpen" : ""}`} aria-hidden={!mobileNavOpen}>
        <div className="mobileDrawerHeader">
          <div className="mobileHeaderBrand">
            <div className="mobileHeaderLogo">BZ</div>
            <span className="mobileHeaderTitle">Botzudio</span>
          </div>
          <button
            type="button"
            className="mobileDrawerClose"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="sidebarNav" role="tablist" aria-label="Main sections" style={{ padding: "16px 12px", flex: 1, overflowY: "auto" }}>
          {APP_NAV.map(({ tab, label, Icon }) => (
            <button
              key={tab}
              type="button"
              className="navButton"
              onClick={() => {
                if (tab === "docs") { navigate("/app/documentation"); return; }
                localStorage.setItem("esg_active_tab_v1", tab);
                navigate("/app");
                setMobileNavOpen(false);
              }}
            >
              <Icon size={16} className="navButtonIcon" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* ── Main Content Area ────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

        {/* ── Content Header (Breadcrumbs + Title) ─────────────────── */}
        <div className="stgContentHeader">
          <div className="stgBreadcrumbs">
            <span className="stgBreadcrumbLink" style={{ cursor: "pointer" }} onClick={() => { localStorage.setItem("esg_active_tab_v1", "generate"); navigate("/app"); }}>App</span>
            <span className="stgBreadcrumbSep">›</span>
            <span className="stgBreadcrumbActive">Settings</span>
            <span className="stgBreadcrumbSep">›</span>
            <span className="stgBreadcrumbActive" style={{ fontWeight: 700, color: "var(--accent)" }}>{activeLabel}</span>
          </div>
          
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", marginBottom: 12 }}>
            <h1 className="stgHeaderTitle">{activeLabel}</h1>
          </div>
        </div>

        {/* ── Horizontal Navigation Tabs (Flat Underline) ───────────── */}
        <div className="stgHorizontalTabs">
          {SECTIONS.map(s => {
            const active = activeSection === s.key;
            return (
              <button
                key={s.key}
                type="button"
                className={`stgTabItem${active ? " stgTabItemActive" : ""}`}
                onClick={() => setActiveSection(s.key)}
              >
                {s.label}
              </button>
            );
          })}
        </div>

        {/* ── Scrolling Section content ─────────────────────────────── */}
        <div className="stgContent" ref={contentRef}>
          <div className="stgContentInner">
            {activeSection === "profile"    && <ProfileSection    settings={settings} update={update} />}
            {activeSection === "credits"    && <CreditsSection />}
            {activeSection === "generation" && <GenerationSection settings={settings} update={update} />}
            {activeSection === "assets"     && <AssetsSection     settings={settings} update={update} />}
            {activeSection === "security"   && <SecuritySection   settings={settings} update={update} />}
            {activeSection === "usage"      && <UsageSection />}
            {activeSection === "support"    && <SupportSection />}
          </div>
        </div>
      </div>
    </div>
  );
}
