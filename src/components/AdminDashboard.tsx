import React, { useState, useEffect, useRef, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { getAdminSession, adminLogout } from "../lib/adminAuth";
import {
  adminFetchUsers, adminTopUpUser,
  adminFetchModelPricing, adminSaveModelPricing,
  type AdminUser, type ModelPricingRow,
} from "../lib/credits";
import { API_COSTS_INR } from "../lib/pricing";
import AffiliatesPage from "./AffiliatesPage";
import AffiliateFormPage from "./AffiliateFormPage";
import AffiliateProfilePage from "./AffiliateProfilePage";
import type { Affiliate } from "../lib/affiliateAdmin";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

// ─── Persistence helpers ──────────────────────────────────────────────────────

function loadJson<T>(key: string, fallback: T): T {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback; } catch { return fallback; }
}
function saveJson<T>(key: string, val: T) { localStorage.setItem(key, JSON.stringify(val)); }

// ─── Types ────────────────────────────────────────────────────────────────────

type NavItem = "users" | "templates" | "credits" | "api" | "health" | "affiliates";

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

// ─── Pages ───────────────────────────────────────────────────────────────────

function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [topupId, setTopupId] = useState<string | null>(null);
  const [topupAmount, setTopupAmount] = useState("");
  const [topupNote, setTopupNote] = useState("");
  const [topupBusy, setTopupBusy] = useState(false);
  const [topupError, setTopupError] = useState("");

  useEffect(() => {
    adminFetchUsers()
      .then(setUsers)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter(u =>
    !search ||
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  async function handleTopup(userId: string) {
    const amount = parseFloat(topupAmount);
    if (isNaN(amount) || amount === 0) { setTopupError("Enter a valid amount"); return; }
    setTopupBusy(true);
    setTopupError("");
    try {
      const updated = await adminTopUpUser(userId, amount, topupNote || undefined);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, creditsBalance: updated.creditsBalance } : u));
      setTopupId(null);
      setTopupAmount("");
      setTopupNote("");
    } catch (e: any) {
      setTopupError(e.message || "Failed");
    } finally {
      setTopupBusy(false);
    }
  }

  const totalBalance = users.reduce((s, u) => s + u.creditsBalance, 0);

  return (
    <div className="adPage">
      <div className="adPageHeader">
        <div>
          <h2 className="adPageTitle">Users</h2>
          <p className="adPageSub">Manage user accounts and credit balances</p>
        </div>
      </div>

      <div className="adStatRow">
        <StatCard label="Total Users"    value={loading ? "…" : users.length}                            sub="Registered accounts"   color="#8B5CF6" />
        <StatCard label="Total Balance"  value={loading ? "…" : `₹${totalBalance.toFixed(2)}`}           sub="Across all users"      color="#3B82F6" />
        <StatCard label="Images Total"   value={loading ? "…" : users.reduce((s,u)=>s+u.imagesGenerated,0).toLocaleString()} sub="Generated" color="#10B981" />
      </div>

      <div className="adTableCard">
        <div className="adTableToolbar">
          <input className="adSearch" type="search" placeholder="Search by name or email…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <div className="adTableWrap">
          {loading ? (
            <div className="adEmpty">Loading users…</div>
          ) : (
            <table className="adTable">
              <thead>
                <tr><th>User</th><th>Balance (₹)</th><th>Images</th><th>Joined</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <>
                    <tr key={u.id}>
                      <td>
                        <div className="adUserCell">
                          <div className="adAvatar" style={{ background: u.isDeveloper ? "#6366F120" : "#8B5CF620", color: u.isDeveloper ? "#6366F1" : "#8B5CF6" }}>{u.name[0]}</div>
                          <div>
                            <div className="adUserName" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              {u.name}
                              {u.isDeveloper && (
                                <span style={{ fontSize: 11, fontWeight: 600, background: "#6366F120", color: "#6366F1", border: "1px solid #6366F140", borderRadius: 4, padding: "1px 6px", letterSpacing: "0.02em" }}>
                                  Developer
                                </span>
                              )}
                            </div>
                            <div className="adUserEmail">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td><span className="adCreditsNum">{u.isDeveloper ? "Unlimited" : `₹${u.creditsBalance.toFixed(2)}`}</span></td>
                      <td><span className="adDate">{u.imagesGenerated}</span></td>
                      <td><span className="adDate">{new Date(u.joinedAt).toLocaleDateString("en-IN")}</span></td>
                      <td>
                        <button className="adActionBtn adActionBtnEdit" onClick={() => { setTopupId(topupId === u.id ? null : u.id); setTopupError(""); setTopupAmount(""); setTopupNote(""); }}>
                          {topupId === u.id ? "Cancel" : "Add / Deduct"}
                        </button>
                      </td>
                    </tr>
                    {topupId === u.id && (
                      <tr key={`${u.id}-topup`} className="adTopupRow">
                        <td colSpan={5}>
                          <div className="adTopupForm">
                            <input className="adNumInput" type="number" step="0.01" placeholder="Amount in ₹ (negative to deduct)" value={topupAmount} onChange={e => setTopupAmount(e.target.value)} style={{width:220}} />
                            <input className="adSearch" type="text" placeholder="Note (optional)" value={topupNote} onChange={e => setTopupNote(e.target.value)} style={{flex:1}} />
                            <button className="adPrimaryBtn" onClick={() => handleTopup(u.id)} disabled={topupBusy}>
                              {topupBusy ? "Saving…" : "Confirm"}
                            </button>
                            {topupError && <span style={{color:"#EF4444",fontSize:13}}>{topupError}</span>}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          )}
          {!loading && filtered.length === 0 && <div className="adEmpty">No users match your search.</div>}
        </div>
      </div>
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

        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
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

// ─── Admin sidebar nav ────────────────────────────────────────────────────────

const NAV: { key: NavItem; label: string; icon: React.ReactNode }[] = [
  { key:"users",      label:"Users",      icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
  { key:"affiliates", label:"Affiliates", icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg> },
  { key:"templates",  label:"Templates",  icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg> },
  { key:"credits",    label:"Credits",    icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M15 9.354a4 4 0 1 0 0 5.292"/></svg> },
  { key:"api",        label:"API Usage",  icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
  { key:"health",     label:"App Health", icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg> },
];

// ─── Root dashboard ───────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [page, setPage] = useState<NavItem>("users");
  const [affView, setAffView] = useState<AffView>({ mode: "list" });
  const session = getAdminSession();

  function handleAffNavChange(next: NavItem) {
    if (next !== "affiliates") setAffView({ mode: "list" });
    setPage(next);
  }

  useEffect(() => {
    if (!session) navigate("/admin/login", { replace: true });
  }, [session, navigate]);

  if (!session) return null;

  function handleLogout() {
    adminLogout();
    navigate("/admin/login", { replace: true });
  }

  return (
    <div className="adRoot">
      {/* Sidebar */}
      <aside className="adSidebar">
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
            onEdit={(id) => setAffView({ mode: "form", id })}
          />
        )}
        {page === "templates" && <TemplatesPage />}
        {page === "credits"   && <CreditsPage />}
        {page === "api"       && <ApiUsagePage />}
        {page === "health"    && <AppHealthPage />}
      </main>
    </div>
  );
}
