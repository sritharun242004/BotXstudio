import { useState, useEffect, useRef } from "react";
import AppSelect from "./AppSelect";
import { useNavigate, useLocation } from "react-router-dom";
import { getSession, logout } from "../lib/auth";
import { useCredits } from "../context/CreditsContext";
import { fetchCreditTransactions, type CreditTransaction } from "../lib/credits";
import { IMAGE_GENERATION_MODELS } from "../lib/storyboards";
import { apiGet } from "../lib/api";
import {
  User, CreditCard, Sparkles, Palette, Bell, FolderOpen, Shield, Zap,
  Sliders, BarChart2, HelpCircle, Mail, Bug, Lightbulb, MessageCircle,
  Bookmark, LayoutDashboard, BookOpen, Shirt,
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

function loadSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch { return DEFAULT_SETTINGS; }
}
function saveSettings(s: UserSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

// ─── Nav sections ─────────────────────────────────────────────────────────────

const SECTIONS: { key: SectionKey; label: string; Icon: React.ElementType }[] = [
  { key: "profile",       label: "Profile",              Icon: User },
  { key: "credits",       label: "Credits & Billing",    Icon: CreditCard },
  { key: "generation",    label: "Generation",           Icon: Sparkles },
  { key: "notifications", label: "Notifications",        Icon: Bell },
  { key: "assets",        label: "Saved Assets",         Icon: FolderOpen },
  { key: "security",      label: "Privacy & Security",   Icon: Shield },
  { key: "performance",   label: "Performance",          Icon: Zap },
  { key: "usage",         label: "Usage",                Icon: BarChart2 },
  { key: "support",       label: "Support",              Icon: HelpCircle },
];

const APP_NAV = [
  { tab: "prints",    label: "Add Prints",       Icon: Palette         },
  { tab: "generate",  label: "Generate Images",  Icon: Sparkles        },
  { tab: "tryon",     label: "Try On",           Icon: Shirt           },
  { tab: "saved",     label: "Saved Images",     Icon: Bookmark        },
  { tab: "assets",    label: "Uploaded Assets",  Icon: FolderOpen      },
  { tab: "dashboard", label: "Dashboard",        Icon: LayoutDashboard },
  { tab: "credits",   label: "Credits",          Icon: BarChart2       },
  { tab: "docs",      label: "Documents",        Icon: BookOpen        },
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
      <div className="stgSectionHeader">
        <div className="stgSectionTitle">Profile</div>
        <div className="stgSectionDesc">Manage your personal information</div>
      </div>

      <SectionCard title="Your Account">
        <div className="stgProfileHero">
          <div className="stgProfileAvatar">
            {(name || session?.email || "U")[0].toUpperCase()}
          </div>
          <div>
            <div className="stgProfileName">{name || session?.name || "No name set"}</div>
            <div className="stgProfileEmail">{session?.email}</div>
          </div>
        </div>

        <div className="stgCardPad">
          <div className="stgFieldGroup">
            <label className="stgLabel">Display Name</label>
            <input className="stgInput" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
          </div>
          <div className="stgFieldGroup">
            <label className="stgLabel">Email</label>
            <input className="stgInput" value={session?.email || ""} disabled />
            <span className="stgFieldNote">Email is managed via your Cognito account</span>
          </div>
          <div className="stgFieldGroup">
            <label className="stgLabel">Bio <span className="stgOptional">optional</span></label>
            <textarea className="stgTextarea" value={bio} onChange={e => setBio(e.target.value)}
              placeholder="A short bio about yourself…" rows={3} />
          </div>
          <button className="stgPrimaryBtn" onClick={handleSave}>
            {saved ? "✓ Saved" : "Save Profile"}
          </button>
        </div>
      </SectionCard>

      <SectionCard title="Account Actions">
        <SettingRow label="Change Password" desc="Send a password reset email to your account">
          <SecondaryBtn label="Send Reset Email" onClick={() => {
            window.open(`mailto:official@thebotcompany.in?subject=Password Reset Request`, "_blank");
          }} />
        </SettingRow>
        <SettingRow label="Sign Out" desc="Log out of Botzudio on this device">
          <DangerBtn label="Logout" onClick={logout} />
        </SettingRow>
        <SettingRow label="Delete Account" desc="Permanently delete your account and all data" danger>
          <DangerBtn label="Delete Account" onClick={() => {
            if (confirm("This will permanently delete your account and all data. This cannot be undone. Continue?")) {
              alert("Please contact official@thebotcompany.in to complete account deletion.");
            }
          }} />
        </SettingRow>
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
  { key: "basic",      label: "Basic",      credits: 300,  price: 299,  orig: 499,  badge: "Save 40%", accent: "#8B5CF6" },
  { key: "growth",     label: "Growth",     credits: 1000, price: 999,  orig: 1499, badge: "Popular",  accent: "#7C3AED" },
  { key: "enterprise", label: "Enterprise", credits: null, price: null, orig: null, badge: "Custom",   accent: "#0369A1" },
];

type BuyPackKey = "basic" | "growth" | "enterprise" | "custom";

function CreditsSection() {
  const { balance, freeImagesRemaining, modelPricing, isDeveloper, creditsSpent } = useCredits();
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [coupon, setCoupon] = useState("");
  const [txLoading, setTxLoading] = useState(true);
  const [showBuyPanel, setShowBuyPanel] = useState(false);
  const [selectedPack, setSelectedPack] = useState<BuyPackKey>("growth");
  const [customInput, setCustomInput] = useState("500");
  const customCredits = Math.max(1, parseInt(customInput, 10) || 1);

  useEffect(() => {
    fetchCreditTransactions()
      .then(setTransactions)
      .catch(() => {})
      .finally(() => setTxLoading(false));
  }, []);

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

  const MODEL_ROWS = [
    { label: "Flash",  cr: flashCr,  unit: "img", color: "#8B5CF6" },
    { label: "ProMax", cr: proMaxCr, unit: "img", color: "#7C3AED" },
    { label: "Plus",   cr: plusCr,   unit: "set", color: "#06B6D4" },
    { label: "Pro",    cr: proAvgCr, unit: "img", color: "#F59E0B", note: "avg" },
  ] as const;

  const activePack = selectedPack !== "custom" ? CREDIT_PACKS.find(p => p.key === selectedPack) : undefined;
  const activeCredits: number | null =
    selectedPack === "enterprise" ? null :
    selectedPack === "custom" ? customCredits :
    activePack?.credits ?? null;
  const activePrice: number | null =
    selectedPack === "enterprise" ? null :
    selectedPack === "custom" ? customCredits :
    activePack?.price ?? null;

  const mailBody = activeCredits
    ? `Hi, I'd like to purchase ${activeCredits} credits for ₹${activePrice}. My registered email is [your email]. Please send payment details.`
    : "";
  const mailLink = `mailto:official@thebotcompany.in?subject=Buy Credits - Botzudio&body=${encodeURIComponent(mailBody)}`;

  return (
    <div className="stgSectionContent">
      <div className="stgSectionHeader">
        <div className="stgSectionTitle">Credits & Billing</div>
        <div className="stgSectionDesc">Manage your balance and view spending history</div>
      </div>

      {/* Wallet card */}
      <div className="stgWalletCard">
        <div className="stgWalletRow">
          <div>
            <div className="stgWalletLabel">Available Credits</div>
            <div className="stgWalletAmount">
              {isDeveloper ? "Unlimited" : Math.floor(balance)}
              {!isDeveloper && <span style={{ fontSize: 14, fontWeight: 500, opacity: 0.6 }}> credits</span>}
            </div>
          </div>
          {!isDeveloper && (
            <button className="stgWalletBuyBtn" onClick={() => setShowBuyPanel(v => !v)}>
              {showBuyPanel ? "Hide Packages" : "Buy Credits"}
            </button>
          )}
        </div>
        <div className="stgWalletMeta">
          <div className="stgWalletStat">
            <span className="stgWalletStatLabel">Free Generations</span>
            <span className="stgWalletStatVal">
              {isDeveloper ? "Unlimited" : `${freeImagesRemaining} / 30`}
            </span>
          </div>
          <div className="stgWalletStat">
            <span className="stgWalletStatLabel">Credits Spent</span>
            <span className="stgWalletStatVal">
              {isDeveloper ? "—" : creditsSpent}
            </span>
          </div>
        </div>
      </div>

      {/* ── Inline Buy Credits Panel ───────────────────────────────────── */}
      {showBuyPanel && (
        <div style={{
          background: "#fff",
          border: "2px solid #E2E8F0",
          borderRadius: 16,
          overflow: "hidden",
          marginBottom: 8,
        }}>

          {/* Header */}
          <div style={{
            padding: "16px 24px",
            borderBottom: "1.5px solid #E2E8F0",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: "#F8FAFC",
          }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 17, color: "#1E293B" }}>Choose a Credit Pack</div>
              <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>
                1 credit = ₹1 · Credits never expire · All 4 models unlocked
              </div>
            </div>
            <button
              onClick={() => setShowBuyPanel(false)}
              style={{
                width: 28, height: 28, borderRadius: "50%",
                border: "1.5px solid #E2E8F0", background: "transparent",
                cursor: "pointer", fontSize: 13, color: "#64748B",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >✕</button>
          </div>

          {/* Pack cards */}
          <div style={{ padding: "20px 24px 16px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14 }}>
            {CREDIT_PACKS.map(pack => {
              const isSel = selectedPack === pack.key;
              return (
                <div
                  key={pack.key}
                  onClick={() => setSelectedPack(pack.key)}
                  style={{
                    cursor: "pointer", position: "relative",
                    border: `2px solid ${isSel ? pack.accent : "#E2E8F0"}`,
                    borderRadius: 14, padding: "18px 16px",
                    background: isSel ? `${pack.accent}0d` : "#fff",
                    boxShadow: isSel ? `0 0 0 3px ${pack.accent}22` : "none",
                    transition: "all .15s",
                  }}
                >
                  {isSel && (
                    <div style={{
                      position: "absolute", top: 10, right: 10,
                      width: 20, height: 20, borderRadius: "50%",
                      background: pack.accent,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11, color: "#fff", fontWeight: 800,
                    }}>✓</div>
                  )}
                  <div style={{
                    display: "inline-block", padding: "2px 8px", borderRadius: 9999,
                    background: `${pack.accent}1a`, color: pack.accent,
                    fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px",
                    marginBottom: 10,
                  }}>{pack.badge}</div>
                  <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: 19, color: "#1E293B", marginBottom: 8 }}>
                    {pack.label}
                  </div>
                  {pack.price !== null ? (
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, marginBottom: 6 }}>
                      <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: 30, color: "#1E293B", lineHeight: 1 }}>
                        ₹{pack.price}
                      </span>
                      {pack.orig && (
                        <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: 13, color: "#94A3B8", textDecoration: "line-through", marginBottom: 3 }}>
                          ₹{pack.orig}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: 22, color: pack.accent, marginBottom: 6 }}>
                      Contact Us
                    </div>
                  )}
                  {pack.credits !== null ? (
                    <div style={{ fontSize: 13, color: "#64748B", fontWeight: 600 }}>
                      <span style={{ color: pack.accent, fontWeight: 800 }}>{pack.credits}</span> credits
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, color: "#64748B" }}>Custom volume · Priority support</div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Custom credits row */}
          <div style={{ padding: "0 24px 20px" }}>
            <div
              onClick={() => setSelectedPack("custom")}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "12px 16px", borderRadius: 10, cursor: "pointer",
                border: `2px solid ${selectedPack === "custom" ? "#8B5CF6" : "#E2E8F0"}`,
                background: selectedPack === "custom" ? "#F5F3FF" : "#F8FAFC",
                transition: "all .15s",
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1E293B", whiteSpace: "nowrap" }}>
                Custom Amount
              </div>
              <input
                type="number"
                min={1}
                value={customInput}
                onChange={e => { setCustomInput(e.target.value); setSelectedPack("custom"); }}
                onBlur={() => setCustomInput(String(Math.max(1, parseInt(customInput, 10) || 1)))}
                onClick={e => e.stopPropagation()}
                style={{
                  flex: 1, background: "transparent", border: "none", outline: "none",
                  fontSize: 15, fontWeight: 800, color: "#8B5CF6", textAlign: "right", minWidth: 0,
                }}
                placeholder="500"
              />
              <span style={{ fontSize: 13, color: "#64748B", whiteSpace: "nowrap" }}>
                credits = ₹{customCredits}
              </span>
            </div>
          </div>

          {/* Generation breakdown */}
          {activeCredits !== null && (
            <div style={{ padding: "16px 24px 20px", borderTop: "1.5px solid #E2E8F0" }}>
              <div style={{
                fontSize: 11, fontWeight: 700, color: "#94A3B8",
                textTransform: "uppercase", letterSpacing: "0.7px", marginBottom: 12,
              }}>
                Generation Breakdown · {activeCredits} credits
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                {MODEL_ROWS.map(m => (
                  <div key={m.label} style={{
                    textAlign: "center", padding: "16px 10px",
                    background: "#F8FAFC", borderRadius: 10,
                    border: "1.5px solid #E2E8F0",
                  }}>
                    <div style={{
                      fontFamily: "'Outfit', sans-serif", fontWeight: 900,
                      fontSize: 30, color: m.color, lineHeight: 1,
                    }}>
                      {Math.floor(activeCredits / m.cr)}
                    </div>
                    <div style={{ fontSize: 12, color: "#1E293B", fontWeight: 700, marginTop: 5 }}>
                      {m.label}
                    </div>
                    <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 3 }}>
                      {"note" in m ? `${m.unit}s (${m.note})` : `${m.unit}s`} · {m.cr} cr/{m.unit}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Checkout bar */}
          <div style={{
            padding: "18px 24px",
            background: "#F8FAFC",
            borderTop: "1.5px solid #E2E8F0",
          }}>
            {selectedPack === "enterprise" ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#1E293B" }}>Need a large volume plan?</div>
                  <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>Custom pricing · Priority support · SLA</div>
                </div>
                <a
                  href="mailto:official@thebotcompany.in?subject=Enterprise Credits - Botzudio"
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "10px 22px", borderRadius: 9999,
                    background: "#0369A1", color: "#fff",
                    fontSize: 13, fontWeight: 800, textDecoration: "none",
                    border: "2px solid #1E293B", boxShadow: "3px 3px 0 #1E293B",
                  }}
                >
                  Contact Us →
                </a>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: 30, color: "#1E293B" }}>
                      ₹{activePrice}
                    </span>
                    {selectedPack !== "custom" && activePack?.orig && (
                      <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: 14, color: "#94A3B8", textDecoration: "line-through" }}>
                        ₹{activePack.orig}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: "#64748B", marginTop: 1 }}>
                    for {activeCredits} credits · Credited within 24h after payment
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                  <a
                    href={mailLink}
                    style={{
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "11px 24px", borderRadius: 9999,
                      background: "#8B5CF6", color: "#fff",
                      fontSize: 13, fontWeight: 800, textDecoration: "none",
                      border: "2px solid #1E293B", boxShadow: "3px 3px 0 #1E293B",
                    }}
                  >
                    Proceed to Pay →
                  </a>
                  <div style={{ fontSize: 11, color: "#94A3B8", textAlign: "right" }}>
                    Email sent · UPI link within 24h
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Model pricing table */}
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
        <div style={{ marginTop: 10, fontSize: 12, color: "var(--muted-color)" }}>
          Prices are set by admin and update in real time. 1 credit = ₹1 INR.
        </div>
      </SectionCard>

      {/* Redeem coupon */}
      <SectionCard title="Redeem Coupon">
        <div className="stgCouponRow">
          <input className="stgInput" placeholder="Enter coupon code" value={coupon} onChange={e => setCoupon(e.target.value.toUpperCase())} style={{ flex: 1 }} />
          <button className="stgPrimaryBtn" style={{ flexShrink: 0 }} onClick={() => {
            if (coupon.trim()) alert("Coupon redemption requires admin approval. Please contact official@thebotcompany.in with code: " + coupon.trim());
          }}>Redeem</button>
        </div>
      </SectionCard>

      {/* Transaction history */}
      <SectionCard title="Transaction History">
        {txLoading ? (
          <div className="stgEmpty">Loading transactions…</div>
        ) : transactions.length === 0 ? (
          <div className="stgEmpty">No transactions yet.</div>
        ) : (
          <div className="stgTxTable">
            <div className="stgTxHead">
              <span>Date</span><span>Description</span><span>Amount</span><span>Balance</span>
            </div>
            {transactions.map(tx => (
              <div key={tx.id} className="stgTxRow">
                <span className="stgTxDate">{fmtDate(tx.createdAt)}</span>
                <span className="stgTxDesc">{tx.description || (tx.type === "image_gen" ? "Image generated" : "Top-up")}</span>
                <span className={`stgTxAmt ${tx.amountInr < 0 ? "stgTxDebit" : "stgTxCredit"}`}>
                  {tx.amountInr < 0 ? "−" : "+"}₹{Math.abs(tx.amountInr).toFixed(2)}
                </span>
                <span className="stgTxBal">₹{tx.balanceAfter.toFixed(2)}</span>
              </div>
            ))}
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

// ─── Section: Notifications ───────────────────────────────────────────────────

function NotificationsSection({ settings, update }: {
  settings: UserSettings; update: (k: keyof UserSettings, v: unknown) => void;
}) {
  const rows: { key: keyof UserSettings; label: string; desc: string }[] = [
    { key:"notifGenComplete", label:"Generation Completed", desc:"Notify when an image finishes generating" },
    { key:"notifCreditLow",   label:"Credit Low Alert",    desc:"Warn when your balance is running low" },
    { key:"notifPayment",     label:"Payment Successful",  desc:"Confirm when credits are added to your account" },
    { key:"notifUpdates",     label:"Product Updates",     desc:"News about platform changes and improvements" },
    { key:"notifFeatures",    label:"New Features",        desc:"Be the first to know about new capabilities" },
  ];
  return (
    <div className="stgSectionContent">
      <div className="stgSectionHeader">
        <div className="stgSectionTitle">Notifications</div>
        <div className="stgSectionDesc">Choose what you want to be notified about</div>
      </div>
      <SectionCard>
        {rows.map(r => (
          <SettingRow key={r.key} label={r.label} desc={r.desc}>
            <Toggle checked={settings[r.key] as boolean} onChange={v => update(r.key, v)} />
          </SettingRow>
        ))}
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
        <SettingRow label="Two-Factor Authentication" desc="Extra protection for your account — coming soon">
          <span className="stgComingSoon">Coming Soon</span>
        </SettingRow>
        <SettingRow label="Active Sessions" desc="View and revoke other logged-in devices — coming soon">
          <span className="stgComingSoon">Coming Soon</span>
        </SettingRow>
      </SectionCard>
      <SectionCard title="Privacy">
        <SettingRow label="Private Generations" desc="Hide your generated images from admin previews">
          <Toggle checked={settings.privateGenerations} onChange={v => update("privateGenerations", v)} />
        </SettingRow>
        <SettingRow label="Hide Profile" desc="Don't show your profile to other users">
          <Toggle checked={settings.hideProfile} onChange={v => update("hideProfile", v)} />
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

// ─── Section: Performance ─────────────────────────────────────────────────────

function PerformanceSection({ settings, update }: {
  settings: UserSettings; update: (k: keyof UserSettings, v: unknown) => void;
}) {
  return (
    <div className="stgSectionContent">
      <div className="stgSectionHeader">
        <div className="stgSectionTitle">Performance</div>
        <div className="stgSectionDesc">Optimise the app for your connection and device</div>
      </div>
      <SectionCard>
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

// ─── Section: Advanced ────────────────────────────────────────────────────────

function AdvancedSection({ settings, update }: {
  settings: UserSettings; update: (k: keyof UserSettings, v: unknown) => void;
}) {
  return (
    <div className="stgSectionContent">
      <div className="stgSectionHeader">
        <div className="stgSectionTitle">Advanced</div>
        <div className="stgSectionDesc">Power-user features and experimental options</div>
      </div>
      <SectionCard>
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
    </div>
  );
}

// ─── Section: Usage ───────────────────────────────────────────────────────────

function UsageSection() {
  const { balance, costPerImageInr } = useCredits();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<any>("/api/usage")
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function fmtBytes(b: number) {
    if (!b) return "0 B";
    const u = ["B","KB","MB","GB"]; const i = Math.floor(Math.log(b)/Math.log(1024));
    return (b/Math.pow(1024,i)).toFixed(i>0?1:0)+" "+u[i];
  }

  const cards = loading ? [] : [
    { label: "Images Generated",  value: data?.images ?? 0,               color: "#8B5CF6" },
    { label: "Mood Boards",       value: data?.storyboards ?? 0,          color: "#3B82F6" },
    { label: "Credits Spent",     value: `${Math.floor((data?.images ?? 0) * costPerImageInr)} cr`, color: "#EF4444" },
    { label: "Storage Used",      value: fmtBytes(data?.storageBytes ?? 0), color: "#10B981" },
    { label: "Current Balance",   value: `${Math.floor(balance)} credits`,  color: "#F59E0B" },
    { label: "API Calls",         value: data?.apiActivity?.totalApiCalls ?? 0, color: "#EC4899" },
  ];

  return (
    <div className="stgSectionContent">
      <div className="stgSectionHeader">
        <div className="stgSectionTitle">Usage</div>
        <div className="stgSectionDesc">Your activity and consumption stats</div>
      </div>
      {loading ? (
        <div className="stgEmpty">Loading usage data…</div>
      ) : (
        <div className="stgUsageGrid">
          {cards.map(c => (
            <div key={c.label} className="stgUsageCard" style={{ borderTopColor: c.color }}>
              <div className="stgUsageValue">{c.value}</div>
              <div className="stgUsageLabel">{c.label}</div>
            </div>
          ))}
        </div>
      )}
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
  const navigate = useNavigate();
  const location = useLocation();
  const rawSection = (location.state as { section?: string } | null)?.section;
  const validSections: SectionKey[] = ["profile","credits","generation","notifications","assets","security","performance","usage","support"];
  const initialSection: SectionKey = (validSections.includes(rawSection as SectionKey) ? rawSection : "profile") as SectionKey;
  const [activeSection, setActiveSection] = useState<SectionKey>(initialSection);
  const [settings, setSettings] = useState<UserSettings>(loadSettings);
  const [transitioning, setTransitioning] = useState(false);
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
    <div className="stgRootPage" style={{ height: "100vh", overflow: "hidden", background: "var(--bg)", display: "flex", flexDirection: "column" }}>

      {/* ── Header ────────────────────────────────────────────────────── */}
      <header style={{ height: 60, flexShrink: 0, display: "flex" }}>
        {/* Purple brand — identical to main app nav */}
        <div className="stgHeaderBrandCol" style={{
          width: SIDEBAR_W, flexShrink: 0,
          background: "var(--accent)",
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)",
          backgroundSize: "18px 18px",
          borderBottom: "2px solid rgba(255,255,255,0.2)",
          display: "flex", alignItems: "center",
          padding: "0 16px", gap: 10,
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: 8, background: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "'Outfit', sans-serif", fontWeight: 900,
            fontSize: 13, color: "var(--accent)", flexShrink: 0,
          }}>BZ</div>
          <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: 17, color: "#fff", letterSpacing: "-0.3px" }}>
            Botzudio
          </span>
        </div>

        {/* Breadcrumb bar — left: path, right: back button */}
        <div style={{
          flex: 1, background: "var(--bg)", borderBottom: "2px solid var(--border-strong)",
          display: "flex", alignItems: "center", padding: "0 20px", gap: 8,
        }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.2px" }}>Settings</span>
          <span style={{ color: "var(--muted-color)", fontSize: 14, userSelect: "none" }}>›</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--accent)" }}>{activeLabel}</span>
          <button type="button" className="stgBackBtn" onClick={goBackToApp} style={{ marginLeft: "auto" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            Back to App
          </button>
        </div>
      </header>

      {/* ── Body ──────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* Purple app sidebar — real app nav, navigates back to app tabs */}
        <aside className="stgAppSidebar" style={{
          width: SIDEBAR_W, flexShrink: 0,
          background: "var(--accent)",
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)",
          backgroundSize: "18px 18px",
          display: "flex", flexDirection: "column",
          borderRight: "2px solid rgba(255,255,255,0.15)",
        }}>
          <nav className="sidebarNav" style={{ padding: "10px 10px", flex: 1 }}>
            {APP_NAV.map(({ tab, label, Icon }) => (
              <button
                key={tab}
                type="button"
                className="navButton"
                onClick={() => {
                  if (tab === "docs") { navigate("/app/documentation"); return; }
                  if (tab === "credits") { navigate("/app/settings", { state: { section: "credits" } }); setActiveSection("credits"); return; }
                  localStorage.setItem("esg_active_tab_v1", tab);
                  navigate("/app");
                }}
              >
                <Icon size={15} className="navButtonIcon" strokeWidth={2} />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Content column */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

          {/* ── Horizontal tab bar ─────────────────────────────────────── */}
          <div className="stgTabBar">
            {SECTIONS.map(s => {
              const active = activeSection === s.key;
              return (
                <button
                  key={s.key}
                  type="button"
                  className={`stgTab${active ? " stgTabActive" : ""}`}
                  onClick={() => setActiveSection(s.key)}
                >
                  <s.Icon size={13} strokeWidth={2} style={{ flexShrink: 0 }} />
                  {s.label}
                </button>
              );
            })}
          </div>

          {/* ── Section content ────────────────────────────────────────── */}
          <div className="stgContent" ref={contentRef}>
            <div className="stgContentInner">
              {activeSection === "profile"       && <ProfileSection       settings={settings} update={update} />}
              {activeSection === "credits"       && <CreditsSection />}
              {activeSection === "generation"    && <GenerationSection    settings={settings} update={update} />}
              {activeSection === "notifications" && <NotificationsSection settings={settings} update={update} />}
              {activeSection === "assets"        && <AssetsSection        settings={settings} update={update} />}
              {activeSection === "security"      && <SecuritySection      settings={settings} update={update} />}
              {activeSection === "performance"   && <PerformanceSection   settings={settings} update={update} />}
              {activeSection === "usage"         && <UsageSection />}
              {activeSection === "support"       && <SupportSection />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
