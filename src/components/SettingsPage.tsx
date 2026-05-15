import { useState, useEffect, useRef } from "react";
import { getSession, logout } from "../lib/auth";
import { useCredits } from "../context/CreditsContext";
import { fetchCreditTransactions, type CreditTransaction } from "../lib/credits";
import { IMAGE_GENERATION_MODELS } from "../lib/storyboards";
import { apiGet } from "../lib/api";
import {
  User, CreditCard, Sparkles, Palette, Bell, FolderOpen, Shield, Zap,
  Sliders, BarChart2, HelpCircle, Mail, Bug, Lightbulb, MessageCircle
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type SectionKey =
  | "profile" | "credits" | "generation" | "appearance"
  | "notifications" | "assets" | "security" | "performance"
  | "advanced" | "usage" | "support";

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
  { key: "appearance",    label: "Appearance",           Icon: Palette },
  { key: "notifications", label: "Notifications",        Icon: Bell },
  { key: "assets",        label: "Saved Assets",         Icon: FolderOpen },
  { key: "security",      label: "Privacy & Security",   Icon: Shield },
  { key: "performance",   label: "Performance",          Icon: Zap },
  { key: "advanced",      label: "Advanced",             Icon: Sliders },
  { key: "usage",         label: "Usage",                Icon: BarChart2 },
  { key: "support",       label: "Support",              Icon: HelpCircle },
];

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

function CreditsSection() {
  const { balance, costPerImageInr, freeImagesRemaining, modelPricing } = useCredits();
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [coupon, setCoupon] = useState("");
  const [txLoading, setTxLoading] = useState(true);
  const [showBuyModal, setShowBuyModal] = useState(false);

  useEffect(() => {
    fetchCreditTransactions()
      .then(setTransactions)
      .catch(() => {})
      .finally(() => setTxLoading(false));
  }, []);

  const imagesLeft = costPerImageInr > 0 ? Math.floor(balance / costPerImageInr) : 0;
  const totalSpent = transactions
    .filter(t => t.amountInr < 0)
    .reduce((s, t) => s + Math.abs(t.amountInr), 0);

  function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" });
  }

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
            <div className="stgWalletAmount">{Math.floor(balance)} <span style={{ fontSize: 14, fontWeight: 500, opacity: 0.6 }}>credits</span></div>
          </div>
          <button className="stgWalletBuyBtn" onClick={() => setShowBuyModal(true)}>Buy Credits</button>
        </div>
        <div className="stgWalletMeta">
          <div className="stgWalletStat">
            <span className="stgWalletStatLabel">Free Images Left</span>
            <span className="stgWalletStatVal">{freeImagesRemaining} / 6</span>
          </div>
          <div className="stgWalletStat">
            <span className="stgWalletStatLabel">Images Left</span>
            <span className="stgWalletStatVal">~{imagesLeft}</span>
          </div>
          <div className="stgWalletStat">
            <span className="stgWalletStatLabel">Credits Spent</span>
            <span className="stgWalletStatVal">{Math.floor(totalSpent)}</span>
          </div>
        </div>
      </div>

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

      {showBuyModal && (
        <div className="stgModalOverlay" onClick={() => setShowBuyModal(false)}>
          <div className="stgModal" onClick={e => e.stopPropagation()}>
            <div className="stgModalHeader">
              <div className="stgModalTitle">Buy Credits</div>
              <button className="stgModalClose" onClick={() => setShowBuyModal(false)}>✕</button>
            </div>
            <div style={{ padding: "24px" }}>
              <p style={{ color: "var(--muted-color)", fontSize: 14, margin: "0 0 16px" }}>
                Credits are added manually after payment confirmation. Minimum top-up ₹100.
              </p>
              <ol style={{ color: "var(--text)", fontSize: 14, paddingLeft: 20, lineHeight: 2 }}>
                <li>Email <strong>official@thebotcompany.in</strong> with your registered email + desired amount</li>
                <li>We'll send a UPI/payment link within 24 hours</li>
                <li>Credits are added instantly after confirmation</li>
              </ol>
              <a className="stgPrimaryBtn" style={{ display:"block", textAlign:"center", textDecoration:"none", marginTop:20 }}
                href="mailto:official@thebotcompany.in?subject=Buy Credits - Botzudio">
                Email Us to Buy Credits →
              </a>
            </div>
          </div>
        </div>
      )}
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
          <select className="stgSelect" value={settings.preferredModel} onChange={e => update("preferredModel", e.target.value)}>
            <option value="flash">Gemini 2.5 Flash — Faster</option>
            <option value="pro">Gemini 2.5 Pro — Higher quality</option>
          </select>
        </SettingRow>
        <SettingRow label="Default Image Ratio" desc="Aspect ratio for generated images">
          <select className="stgSelect" value={settings.defaultRatio} onChange={e => update("defaultRatio", e.target.value)}>
            {(["1:1","3:4","4:3","9:16","16:9"] as const).map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </SettingRow>
        <SettingRow label="Default Background Style" desc="Starting background theme">
          <select className="stgSelect" value={settings.defaultBackground} onChange={e => update("defaultBackground", e.target.value)}>
            {["Studio","Outdoor","Urban","Nature","Minimal","Custom"].map(b => (
              <option key={b} value={b.toLowerCase()}>{b}</option>
            ))}
          </select>
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
    </div>
  );
}

// ─── Section: Appearance ──────────────────────────────────────────────────────

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

export default function SettingsPage({ onClose }: { onClose: () => void }) {
  const [activeSection, setActiveSection] = useState<SectionKey>("profile");
  const [settings, setSettings] = useState<UserSettings>(loadSettings);
  const contentRef = useRef<HTMLDivElement>(null);

  function update(key: keyof UserSettings, value: unknown) {
    setSettings(prev => {
      const next = { ...prev, [key]: value };
      saveSettings(next);
      return next;
    });
  }

  // Scroll content to top when section changes
  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeSection]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const activeLabel = SECTIONS.find(s => s.key === activeSection)?.label ?? "";

  return (
    <div className="stgOverlay">
      <div className="stgShell">
        {/* Sidebar */}
        <aside className="stgSidebar">
          <div className="stgSidebarHeader">
            <div className="stgSidebarTitle">Settings</div>
          </div>
          <nav className="stgNav">
            {SECTIONS.map(s => (
              <button
                key={s.key}
                type="button"
                className={`stgNavBtn${activeSection === s.key ? " stgNavBtnActive" : ""}`}
                onClick={() => setActiveSection(s.key)}
              >
                <s.Icon size={15} className="stgNavIcon" strokeWidth={2} />
                <span>{s.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <div className="stgContent" ref={contentRef}>
          <div className="stgTopBar">
            <div className="stgTopBarTitle">{activeLabel}</div>
            <button type="button" className="stgCloseBtn" onClick={onClose} aria-label="Close settings">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <div className="stgContentInner">
            {activeSection === "profile"       && <ProfileSection       settings={settings} update={update} />}
            {activeSection === "credits"       && <CreditsSection />}
            {activeSection === "generation"    && <GenerationSection    settings={settings} update={update} />}
            {activeSection === "appearance"    && <AppearanceSection    settings={settings} update={update} />}
            {activeSection === "notifications" && <NotificationsSection settings={settings} update={update} />}
            {activeSection === "assets"        && <AssetsSection        settings={settings} update={update} />}
            {activeSection === "security"      && <SecuritySection      settings={settings} update={update} />}
            {activeSection === "performance"   && <PerformanceSection   settings={settings} update={update} />}
            {activeSection === "advanced"      && <AdvancedSection      settings={settings} update={update} />}
            {activeSection === "usage"         && <UsageSection />}
            {activeSection === "support"       && <SupportSection />}
          </div>
        </div>
      </div>
    </div>
  );
}
