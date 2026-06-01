import React, { useState, useEffect, useRef, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { getAdminSession, adminLogout } from "../lib/adminAuth";
import {
  adminFetchModelPricing, adminSaveModelPricing,
  type ModelPricingRow,
} from "../lib/credits";
import { API_COSTS_INR } from "../lib/pricing";
import UsersPage from "./UsersPage";
import AffiliatesPage from "./AffiliatesPage";
import AffiliateFormPage from "./AffiliateFormPage";
import AffiliateProfilePage from "./AffiliateProfilePage";
import type { Affiliate } from "../lib/affiliateAdmin";
import {
  loadTabVisibility, saveTabVisibility,
  type TabVisibilityMap, type AppTabKey,
  TAB_LABELS, DEFAULT_TAB_VISIBILITY,
} from "../lib/tabVisibility";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

// ─── Persistence helpers ──────────────────────────────────────────────────────

function loadJson<T>(key: string, fallback: T): T {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback; } catch { return fallback; }
}
function saveJson<T>(key: string, val: T) { localStorage.setItem(key, JSON.stringify(val)); }

// ─── Types ────────────────────────────────────────────────────────────────────

type NavItem = "users" | "templates" | "credits" | "api" | "health" | "affiliates" | "tabs";

type AffView =
  | { mode: "list" }
  | { mode: "form"; id?: string }
  | { mode: "profile"; id: string };

interface Template { id: string; label: string; prompt: string; dataUrl: string | null; active: boolean; }

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className="adStatCard" style={{ borderTopColor: color }}>
      <div className="adStatValue">{value}</div>
      <div className="adStatLabel">{label}</div>
      {sub && <div className="adStatSub">{sub}</div>}
    </div>
  );
}

// ─── Templates ────────────────────────────────────────────────────────────────

type TplCat = "model" | "background" | "pose";
const TPL_KEY = "bsx_admin_templates";

interface TemplateStore { model: Template[]; background: Template[]; pose: Template[]; }

function TemplatesPage() {
  const [cat, setCat] = useState<TplCat>("model");
  const [store, setStore] = useState<TemplateStore>(() =>
    loadJson<TemplateStore>(TPL_KEY, { model:[], background:[], pose:[] })
  );
  const fileRef = useRef<HTMLInputElement>(null);

  function save(next: TemplateStore) { setStore(next); saveJson(TPL_KEY, next); }

  function addTemplate(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const t: Template = { id: Date.now().toString(), label: file.name.replace(/\.[^.]+$/, ""), prompt: "", dataUrl: reader.result as string, active: true };
      const next = { ...store, [cat]: [...store[cat], t] };
      save(next);
    };
    reader.readAsDataURL(file);
  }

  function updatePrompt(id: string, prompt: string) {
    save({ ...store, [cat]: store[cat].map(t => t.id===id ? {...t, prompt} : t) });
  }

  function updateLabel(id: string, label: string) {
    save({ ...store, [cat]: store[cat].map(t => t.id===id ? {...t, label} : t) });
  }

  function toggleActive(id: string) {
    save({ ...store, [cat]: store[cat].map(t => t.id===id ? {...t, active:!t.active} : t) });
  }

  function remove(id: string) {
    save({ ...store, [cat]: store[cat].filter(t => t.id!==id) });
  }

  const CAT_LABELS: Record<TplCat, string> = { model:"🧍 Models", background:"🖼️ Backgrounds", pose:"🤸 Poses" };
  const templates = store[cat];

  return (
    <div className="adPage">
      <div className="adPageHeader">
        <div>
          <h2 className="adPageTitle">Default Templates</h2>
          <p className="adPageSub">Upload default references shown to all users. Each template includes an AI prompt.</p>
        </div>
      </div>

      {/* Category tabs */}
      <div className="adSegment">
        {(["model","background","pose"] as TplCat[]).map(c => (
          <button key={c} className={`adSegBtn${cat===c?" adSegBtnActive":""}`} onClick={()=>setCat(c)}>
            {CAT_LABELS[c]}
            <span className="adSegCount">{store[c].length}</span>
          </button>
        ))}
      </div>

      {/* Upload zone */}
      <label className="adUploadZone" onClick={() => fileRef.current?.click()}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
        <span className="adUploadText">Upload {CAT_LABELS[cat].split(" ")[1]} template</span>
        <span className="adUploadSub">PNG · JPG · WEBP</span>
        <input ref={fileRef} type="file" accept="image/*" multiple style={{display:"none"}}
          onChange={(e:ChangeEvent<HTMLInputElement>) => { Array.from(e.target.files||[]).forEach(addTemplate); e.target.value=""; }} />
      </label>

      {/* Template grid */}
      {templates.length > 0 ? (
        <div className="adTplGrid">
          {templates.map(t => (
            <div key={t.id} className={`adTplCard${t.active?"":" adTplCardInactive"}`}>
              <div className="adTplImgWrap">
                {t.dataUrl ? <img src={t.dataUrl} alt={t.label} /> : <div className="adTplPlaceholder">No image</div>}
                <div className="adTplOverlay">
                  <label className="adTplToggle" title={t.active?"Deactivate":"Activate"}>
                    <input type="checkbox" checked={t.active} onChange={()=>toggleActive(t.id)} />
                    {t.active ? "Active" : "Off"}
                  </label>
                  <button className="adTplRemove" onClick={()=>remove(t.id)} title="Remove">✕</button>
                </div>
              </div>
              <div className="adTplMeta">
                <input className="adTplLabel" value={t.label} onChange={e=>updateLabel(t.id,e.target.value)} placeholder="Template name" />
                <textarea className="adTplPrompt" value={t.prompt} onChange={e=>updatePrompt(t.id,e.target.value)}
                  placeholder="AI prompt for this template…" rows={3} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="adEmpty" style={{marginTop:24}}>No {CAT_LABELS[cat].split(" ")[1].toLowerCase()} templates yet. Upload one above.</div>
      )}
    </div>
  );
}

// ─── Credits ─────────────────────────────────────────────────────────────────

const PRICING_TABLE = [
  { model: "Flash Model (Gemini 2.5 Flash)",       key: "gemini-2.5-flash-image",        tier: "Low (30%)"  },
  { model: "ProMax Model (Gemini 3 Pro)",          key: "gemini-3-pro-image-preview",     tier: "Mid (50%)"  },
  { model: "Plus Model — FLUX (per angle)",        key: "fal-ai/flux-pro/kontext/multi",  tier: "Low (30%)"  },
  { model: "Pro Model — Medium 1024×768",          key: "gpt-medium-1024x768",            tier: "Mid (50%)"  },
  { model: "Pro Model — Medium 1024×1024",         key: "gpt-medium-1024x1024",           tier: "Mid (50%)"  },
  { model: "Pro Model — High 1024×768",            key: "gpt-high-1024x768",              tier: "High (20%)" },
  { model: "Pro Model — High 1024×1024",           key: "gpt-high-1024x1024",             tier: "High (20%)" },
];

function CreditsPage() {
  const [rows, setRows] = useState<ModelPricingRow[]>([]);
  const [loadingPricing, setLoadingPricing] = useState(true);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveDone, setSaveDone] = useState(false);

  useEffect(() => {
    adminFetchModelPricing()
      .then(data => {
        setRows(data);
        const init: Record<string, string> = {};
        data.forEach(r => { init[r.modelKey] = String(r.credits); });
        setEdits(init);
      })
      .catch(() => {})
      .finally(() => setLoadingPricing(false));
  }, []);

  function getDisplayCredits(key: string): number {
    const val = parseInt(edits[key] ?? "", 10);
    if (!isNaN(val)) return val;
    return rows.find(r => r.modelKey === key)?.credits ?? 0;
  }

  async function handleSave() {
    setSaving(true);
    setSaveError("");
    setSaveDone(false);
    try {
      const updates = PRICING_TABLE.map(row => ({
        modelKey: row.key,
        credits: Math.max(1, parseInt(edits[row.key] ?? "1", 10) || 1),
      }));
      const updated = await adminSaveModelPricing(updates);
      setRows(updated);
      const next: Record<string, string> = {};
      updated.forEach(r => { next[r.modelKey] = String(r.credits); });
      setEdits(next);
      setSaveDone(true);
      setTimeout(() => setSaveDone(false), 3000);
    } catch (e: any) {
      setSaveError(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const thStyle: React.CSSProperties = { padding: "6px 10px", borderBottom: "1px solid rgba(255,255,255,0.06)", fontWeight: 600, color: "#6b7280", textAlign: "left" };
  const tdStyle: React.CSSProperties = { padding: "6px 10px", borderBottom: "1px solid rgba(255,255,255,0.04)" };

  return (
    <div className="adPage">
      <div className="adPageHeader">
        <div>
          <h2 className="adPageTitle">Credits & Pricing</h2>
          <p className="adPageSub">Per-model API costs vs customer credit prices. 1 credit = ₹1 INR. Free quota: 6 images for Gemini Flash + Pro.</p>
        </div>
      </div>

      <div className="adStatRow">
        <StatCard label="Free Quota" value="6 images" sub="Gemini Flash + Pro per user" color="#10B981" />
        <StatCard label="Developer" value="mohankrt82@gmail.com" sub="Unlimited access, no deduction" color="#8B5CF6" />
        <StatCard label="Currency" value="1 credit = ₹1" sub="Credits shown to users" color="#F59E0B" />
      </div>

      <div className="adTableCard">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div className="adSectionLabel" style={{ marginBottom: 0 }}>Per-Model Cost Breakdown</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {saveDone && <span style={{ color: "#4ade80", fontSize: 13 }}>Saved!</span>}
            {saveError && <span style={{ color: "#EF4444", fontSize: 13 }}>{saveError}</span>}
            <button
              className="adPrimaryBtn"
              onClick={handleSave}
              disabled={saving || loadingPricing}
              style={{ padding: "6px 18px", fontSize: 13 }}
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>

        <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" as any }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 520 }}>
          <thead>
            <tr>
              <th style={thStyle}>Model</th>
              <th style={thStyle}>Margin Tier</th>
              <th style={thStyle}>API Cost (₹)</th>
              <th style={thStyle}>Credits Charged</th>
              <th style={thStyle}>Profit / Image</th>
            </tr>
          </thead>
          <tbody>
            {PRICING_TABLE.map(row => {
              const apiCost = API_COSTS_INR[row.key] ?? 0;
              const credits = getDisplayCredits(row.key);
              const profit  = credits - apiCost;
              return (
                <tr key={row.key}>
                  <td style={{ ...tdStyle, color: "#e2e8f0" }}>{row.model}</td>
                  <td style={{ ...tdStyle, color: "#94a3b8" }}>{row.tier}</td>
                  <td style={{ ...tdStyle, color: "#f87171" }}>₹{apiCost.toFixed(2)}</td>
                  <td style={tdStyle}>
                    <input
                      type="number"
                      min={1}
                      value={loadingPricing ? "" : (edits[row.key] ?? "")}
                      placeholder={loadingPricing ? "…" : "1"}
                      onChange={e => {
                        setSaveDone(false);
                        setEdits(prev => ({ ...prev, [row.key]: e.target.value }));
                      }}
                      style={{
                        width: 80,
                        background: "#1e293b",
                        border: "1px solid rgba(251,191,36,0.35)",
                        borderRadius: 6,
                        color: "#fbbf24",
                        fontWeight: 700,
                        fontSize: 13,
                        padding: "4px 8px",
                        outline: "none",
                      }}
                    />
                    <span style={{ color: "#6b7280", fontSize: 11, marginLeft: 4 }}>cr</span>
                  </td>
                  <td style={{ ...tdStyle, color: profit >= 0 ? "#4ade80" : "#f87171" }}>
                    ₹{profit.toFixed(2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
        <div style={{ marginTop: 14, padding: "10px 4px", color: "#64748b", fontSize: 12 }}>
          Hybrid Editorial (Gemini Flash primary + 2 × FLUX angles) = 5 + 5 + 5 = 15 credits total.
          Changes saved here will be reflected immediately in billing for all users.
        </div>
      </div>
    </div>
  );
}

// ─── API Usage ────────────────────────────────────────────────────────────────

const API_MODELS = [
  { id:"gemini-flash",  name:"Gemini 2.0 Flash",  used:8420,  limit:10000, cost:168.40,  requests:8420  },
  { id:"gemini-pro",    name:"Gemini 1.5 Pro",    used:1230,  limit:5000,  cost:61.50,   requests:1230  },
  { id:"imagen3",       name:"Imagen 3",           used:3100,  limit:5000,  cost:248.00,  requests:3100  },
];

function ApiUsagePage() {
  const [period, setPeriod] = useState<"today"|"month"|"all">("month");

  const totalCost = API_MODELS.reduce((s,m)=>s+m.cost,0);
  const totalReqs  = API_MODELS.reduce((s,m)=>s+m.requests,0);

  return (
    <div className="adPage">
      <div className="adPageHeader">
        <div>
          <h2 className="adPageTitle">API Usage</h2>
          <p className="adPageSub">Monitor model usage and remaining quota from the API provider.</p>
        </div>
        <div className="adSegment" style={{marginTop:0}}>
          {(["today","month","all"] as const).map(p=>(
            <button key={p} className={`adSegBtn${period===p?" adSegBtnActive":""}`} onClick={()=>setPeriod(p)}>{p}</button>
          ))}
        </div>
      </div>

      <div className="adStatRow">
        <StatCard label="Total Requests" value={totalReqs.toLocaleString()} sub="API calls made" color="#8B5CF6" />
        <StatCard label="Total Cost"     value={`$${totalCost.toFixed(2)}`} sub="USD this period" color="#F59E0B" />
        <StatCard label="Avg per Call"   value={`$${(totalCost/totalReqs).toFixed(4)}`} sub="Per API request" color="#3B82F6" />
        <StatCard label="Models Active"  value={API_MODELS.length} sub="In use" color="#10B981" />
      </div>

      <div className="adTableCard">
        <div className="adSectionLabel">Model Breakdown</div>
        <div style={{display:"flex",flexDirection:"column",gap:20,padding:"4px 0"}}>
          {API_MODELS.map(m => {
            const pct = Math.round((m.used/m.limit)*100);
            const color = pct>90?"#EF4444":pct>70?"#F59E0B":"#10B981";
            return (
              <div key={m.id} className="adUsageRow">
                <div className="adUsageHeader">
                  <span className="adUserName">{m.name}</span>
                  <span className="adUsageNums">{m.used.toLocaleString()} / {m.limit.toLocaleString()} <span style={{color:"#94A3B8",fontWeight:400}}>requests</span></span>
                  <span className="adDate" style={{marginLeft:"auto"}}>${m.cost.toFixed(2)}</span>
                </div>
                <div className="adProgressTrack">
                  <div className="adProgressBar" style={{width:`${pct}%`,background:color}} />
                </div>
                <div className="adUsagePct" style={{color}}>
                  {pct}% used · {(m.limit-m.used).toLocaleString()} remaining
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── App Health ───────────────────────────────────────────────────────────────

function AppHealthPage() {
  const services = [
    { name:"API Gateway",        status:"operational",  latency:"42ms",  uptime:"99.98%" },
    { name:"Image Generation",   status:"operational",  latency:"1.2s",  uptime:"99.91%" },
    { name:"Auth (Cognito)",      status:"operational",  latency:"88ms",  uptime:"100%"   },
    { name:"Storage (IndexedDB)", status:"operational",  latency:"3ms",   uptime:"100%"   },
    { name:"Template CDN",        status:"degraded",     latency:"340ms", uptime:"98.20%" },
    { name:"Credit Service",      status:"operational",  latency:"12ms",  uptime:"99.99%" },
  ];

  const metrics = [
    { label:"Avg Response",    value:"1.3s",    color:"#3B82F6" },
    { label:"Error Rate",      value:"0.12%",   color:"#10B981" },
    { label:"Uptime (30d)",    value:"99.6%",   color:"#10B981" },
    { label:"Active Sessions", value:"47",      color:"#8B5CF6" },
  ];

  const statusColor: Record<string,string> = { operational:"#10B981", degraded:"#F59E0B", down:"#EF4444" };
  const statusDot: Record<string,string>   = { operational:"#10B981", degraded:"#F59E0B", down:"#EF4444" };

  return (
    <div className="adPage">
      <div className="adPageHeader">
        <div>
          <h2 className="adPageTitle">App Health</h2>
          <p className="adPageSub">Real-time status of all system services and performance metrics.</p>
        </div>
        <span className="adHealthBadge">● All systems operational</span>
      </div>

      <div className="adStatRow">
        {metrics.map(m => <StatCard key={m.label} label={m.label} value={m.value} color={m.color} />)}
      </div>

      <div className="adTableCard">
        <div className="adSectionLabel">Service Status</div>
        <div className="adServiceGrid">
          {services.map(s => (
            <div key={s.name} className="adServiceCard">
              <div className="adServiceHeader">
                <span className="adServiceDot" style={{background:statusDot[s.status]}} />
                <span className="adUserName">{s.name}</span>
              </div>
              <div className="adServiceMeta">
                <span className="adServiceStatus" style={{color:statusColor[s.status]}}>{s.status}</span>
                <span className="adDate">Latency: {s.latency}</span>
                <span className="adDate">Uptime: {s.uptime}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Tab Control Page ─────────────────────────────────────────────────────────

const TAB_DESCS: Record<AppTabKey, string> = {
  generate:   "Core AI image generation — recommended to keep enabled.",
  tryon:      "Virtual try-on experience for garments.",
  saved:      "User's saved image library.",
  assets:     "Uploaded garment & model asset manager.",
  dashboard:  "Overview stats and activity dashboard.",
  multiangle: "3D multi-angle camera view generator.",
};

const TAB_ICONS_SVG: Record<AppTabKey, React.ReactNode> = {
  generate:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>,
  tryon:      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.57a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.57a2 2 0 0 0-1.34-2.23z"/></svg>,
  saved:      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>,
  assets:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>,
  dashboard:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  multiangle: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>,
};

function TabControlPage() {
  const [vis, setVis] = useState<TabVisibilityMap>(loadTabVisibility);
  const [saved, setSaved] = useState(false);

  function toggle(key: AppTabKey) {
    const next = { ...vis, [key]: !vis[key] };
    setVis(next);
    saveTabVisibility(next);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  function resetAll() {
    setVis({ ...DEFAULT_TAB_VISIBILITY });
    saveTabVisibility({ ...DEFAULT_TAB_VISIBILITY });
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  const enabledCount = (Object.values(vis) as boolean[]).filter(Boolean).length;
  const totalCount   = Object.keys(TAB_LABELS).length;

  return (
    <div className="adPageRoot">
      <div className="adPageHeader">
        <div>
          <h2 className="adPageTitle">App Tabs</h2>
          <p className="adPageSub">Enable or disable tabs in the app sidebar. Changes take effect instantly for all users — no reload needed.</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {saved && (
            <span style={{ fontSize: 13, color: "#22c55e", fontWeight: 600 }}>✓ Saved</span>
          )}
          <button className="adSecondaryBtn" onClick={resetAll}>Reset all to default</button>
        </div>
      </div>

      {/* Summary pill */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        <div className="adStatCard" style={{ borderTopColor: "#8b5cf6", minWidth: 140 }}>
          <div className="adStatValue">{enabledCount} / {totalCount}</div>
          <div className="adStatLabel">Tabs Enabled</div>
        </div>
        <div className="adStatCard" style={{ borderTopColor: "#ef4444", minWidth: 140 }}>
          <div className="adStatValue">{totalCount - enabledCount}</div>
          <div className="adStatLabel">Tabs Hidden</div>
        </div>
      </div>

      {/* Toggle cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {(Object.keys(TAB_LABELS) as AppTabKey[]).map((key) => {
          const on = vis[key];
          return (
            <div
              key={key}
              className="adTabToggleRow"
              style={{ opacity: on ? 1 : 0.6, transition: "opacity 0.2s" }}
            >
              <div className="adTabToggleIcon" style={{ color: on ? "#8b5cf6" : "#94a3b8" }}>
                {TAB_ICONS_SVG[key]}
              </div>
              <div style={{ flex: 1 }}>
                <div className="adTabToggleName">{TAB_LABELS[key]}</div>
                <div className="adTabToggleDesc">{TAB_DESCS[key]}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: on ? "#22c55e" : "#94a3b8" }}>
                  {on ? "Visible" : "Hidden"}
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={on}
                  className={`adToggle${on ? " adToggleOn" : ""}`}
                  onClick={() => toggle(key)}
                  disabled={key === "generate" && on}
                  title={key === "generate" && on ? "Generate Images cannot be hidden" : undefined}
                >
                  <span className="adToggleThumb" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <p style={{ marginTop: 20, fontSize: 12, color: "#94a3b8" }}>
        * The <strong>Generate Images</strong> tab is locked — it cannot be hidden while enabled.
      </p>
    </div>
  );
}

// ─── Admin sidebar nav ────────────────────────────────────────────────────────

const NAV: { key: NavItem; label: string; icon: React.ReactNode }[] = [
  { key:"users",      label:"Users",      icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
  { key:"affiliates", label:"Affiliates", icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg> },
  { key:"templates",  label:"Templates",  icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg> },
  { key:"credits",    label:"Credits",    icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M15 9.354a4 4 0 1 0 0 5.292"/></svg> },
  { key:"api",        label:"API Usage",  icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
  { key:"health",     label:"App Health", icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg> },
  { key:"tabs",       label:"App Tabs",   icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/><path d="M2 7h20"/><path d="M6 3v4"/><path d="M12 3v4"/></svg> },
];

// ─── Root dashboard ───────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [page, setPage] = useState<NavItem>("users");
  const [affView, setAffView] = useState<AffView>({ mode: "list" });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const session = getAdminSession();

  function handleAffNavChange(next: NavItem) {
    if (next !== "affiliates") setAffView({ mode: "list" });
    setPage(next);
    setSidebarOpen(false); // close drawer on mobile after navigation
  }

  useEffect(() => {
    if (!session) navigate("/admin/login", { replace: true });
  }, [session, navigate]);

  if (!session) return null;

  function handleLogout() {
    adminLogout();
    navigate("/admin/login", { replace: true });
  }

  const currentLabel = NAV.find(n => n.key === page)?.label ?? "Admin";

  return (
    <div className="adRoot">
      {/* Tap-to-close backdrop (mobile only) */}
      <div
        className={`adSidebarBackdrop${sidebarOpen ? " adSidebarOpen" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`adSidebar${sidebarOpen ? " adSidebarOpen" : ""}`}>
        <div className="adSidebarBrand">
          <div className="adSidebarLogo"><img src={`${BASE}/logo.png`} alt="Logo" /></div>
          <div>
            <div className="adSidebarEye">The Bot Company</div>
            <div className="adSidebarName">Botzudio Admin</div>
          </div>
        </div>

        <nav className="adSidebarNav">
          {NAV.map(n => (
            <button
              key={n.key}
              className={`adNavBtn${page===n.key?" adNavBtnActive":""}`}
              onClick={() => handleAffNavChange(n.key)}
            >
              <span className="adNavIcon">{n.icon}</span>
              {n.label}
            </button>
          ))}
        </nav>

        <div className="adSidebarFooter">
          <div className="adSidebarUser">
            <div className="adSidebarAvatar">{session.email[0].toUpperCase()}</div>
            <div className="adSidebarUserInfo">
              <div className="adSidebarUserName">Admin</div>
              <div className="adSidebarUserEmail">{session.email}</div>
            </div>
          </div>
          <button className="adLogoutBtn" onClick={handleLogout}>Sign out</button>
          <button className="adBackBtn" onClick={() => window.open("/app", "_blank")}>← Back to App</button>
        </div>
      </aside>

      {/* Main */}
      <main className="adMain">
        {/* Mobile topbar — hidden on desktop via CSS */}
        <div className="adMobileTopbar">
          <button
            className="adMobileMenuBtn"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation menu"
          >
            <span className="adMobileMenuLine" />
            <span className="adMobileMenuLine" />
            <span className="adMobileMenuLine" />
          </button>
          <span className="adMobileTopbarTitle">{currentLabel}</span>
          <div className="adMobileTopbarLogo">
            <img src={`${BASE}/logo.png`} alt="Botzudio" />
          </div>
        </div>

        {page === "users"     && <UsersPage />}
        {page === "affiliates" && affView.mode === "list" && (
          <AffiliatesPage
            onCreateNew={() => setAffView({ mode: "form" })}
            onViewProfile={(id) => setAffView({ mode: "profile", id })}
            onEdit={(id) => setAffView({ mode: "form", id })}
          />
        )}
        {page === "affiliates" && affView.mode === "form" && (
          <AffiliateFormPage
            affiliateId={affView.id}
            onSaved={(_aff: Affiliate) => setAffView({ mode: "list" })}
            onCancel={() => setAffView({ mode: "list" })}
          />
        )}
        {page === "affiliates" && affView.mode === "profile" && (
          <AffiliateProfilePage
            affiliateId={affView.id}
            onBack={() => setAffView({ mode: "list" })}
          />
        )}
        {page === "templates" && <TemplatesPage />}
        {page === "credits"   && <CreditsPage />}
        {page === "api"       && <ApiUsagePage />}
        {page === "health"    && <AppHealthPage />}
        {page === "tabs"      && <TabControlPage />}
      </main>
    </div>
  );
}
