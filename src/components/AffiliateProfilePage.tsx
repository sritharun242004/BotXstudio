import { useState, useEffect, useRef, useCallback } from "react";
import type { Affiliate, AffiliateClick, AffiliateUser } from "../lib/affiliateAdmin";
import {
  affiliateAdminGet,
  affiliateAdminUpdate,
  affiliateAdminGetActivity,
  affiliateAdminGetUsers,
  affiliateAdminGetProfileUploadUrl,
  uploadImageToS3,
} from "../lib/affiliateAdmin";

interface Props {
  affiliateId: string;
  onBack: () => void;
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try { await navigator.clipboard.writeText(text); } catch { /* ignore */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button className="adActionBtn adActionBtnEdit" onClick={copy} style={{ minWidth: 72 }}>
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className="adStatCard" style={{ borderTopColor: color }}>
      <div className="adStatValue">{value}</div>
      <div className="adStatLabel">{label}</div>
      {sub && <div className="adStatSub">{sub}</div>}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="adFormField">
      <label className="adFormLabel">{label}</label>
      {children}
    </div>
  );
}

const STATUS_MAP: Record<string, { bg: string; color: string }> = {
  active:    { bg: "#DCFCE7", color: "#16A34A" },
  suspended: { bg: "#FEF3C7", color: "#D97706" },
  inactive:  { bg: "#F1F5F9", color: "#94A3B8" },
};

// ─── form state derived from affiliate ────────────────────────────────────────

function toForm(a: Affiliate) {
  return {
    name:                 a.name,
    email:                a.email,
    phone:                a.phone ?? "",
    location:             a.location ?? "",
    bio:                  a.bio ?? "",
    instagram:            a.instagram ?? "",
    youtube:              a.youtube ?? "",
    linkedin:             a.linkedin ?? "",
    commissionPercentage: String(a.commissionPercentage),
    bonusCredits:         String(a.bonusCredits ?? 0),
    promoBonusCredits:    String(a.promoBonusCredits ?? 0),
    promoValidUntil:      a.promoValidUntil ? a.promoValidUntil.slice(0, 10) : "",
    status:               a.status,
    bankName:             a.bankName ?? "",
    accountNumber:        a.accountNumber ?? "",
    upiId:                a.upiId ?? "",
  };
}

type FormState = ReturnType<typeof toForm>;

// ─── main component ───────────────────────────────────────────────────────────

export default function AffiliateProfilePage({ affiliateId, onBack }: Props) {
  const [aff, setAff]           = useState<Affiliate | null>(null);
  const [form, setForm]         = useState<FormState | null>(null);
  const [activity, setActivity] = useState<AffiliateClick[]>([]);
  const [users, setUsers]       = useState<AffiliateUser[]>([]);
  const [tab, setTab]           = useState<"activity" | "users">("activity");
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [imgUploading, setImgUploading] = useState(false);
  const [savedAt, setSavedAt]   = useState<Date | null>(null);
  const [error, setError]       = useState("");
  const [saveError, setSaveError] = useState("");
  const [imgPreview, setImgPreview] = useState<string | null>(null);
  const [pendingImg, setPendingImg] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [affData, actData, usersData] = await Promise.all([
        affiliateAdminGet(affiliateId),
        affiliateAdminGetActivity(affiliateId),
        affiliateAdminGetUsers(affiliateId),
      ]);
      setAff(affData);
      setForm(toForm(affData));
      setImgPreview(affData.profileImageUrl);
      setActivity(actData);
      setUsers(usersData);
    } catch (e: any) {
      setError(e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [affiliateId]);

  useEffect(() => { load(); }, [load]);

  function set(key: keyof FormState, val: string) {
    setForm(prev => prev ? { ...prev, [key]: val } : prev);
    setSavedAt(null);
    setSaveError("");
  }

  function isDirty() {
    if (!aff || !form) return false;
    const orig = toForm(aff);
    return (Object.keys(form) as (keyof FormState)[]).some(k => form[k] !== orig[k]) || pendingImg !== null;
  }

  function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingImg(file);
    setSavedAt(null);
    const reader = new FileReader();
    reader.onload = () => setImgPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    if (!aff || !form) return;
    setSaving(true);
    setSaveError("");
    try {
      let updated = await affiliateAdminUpdate(aff.id, {
        name:                 form.name.trim(),
        email:                form.email.trim(),
        phone:                form.phone.trim() || undefined,
        location:             form.location.trim() || undefined,
        bio:                  form.bio.trim() || undefined,
        instagram:            form.instagram.trim() || undefined,
        youtube:              form.youtube.trim() || undefined,
        linkedin:             form.linkedin.trim() || undefined,
        commissionPercentage: parseFloat(form.commissionPercentage) || 0,
        bonusCredits:         parseInt(form.bonusCredits) || 0,
        promoBonusCredits:    parseInt(form.promoBonusCredits) || 0,
        promoValidUntil:      form.promoValidUntil
          ? new Date(form.promoValidUntil).toISOString()
          : null,
        status:               form.status,
        bankName:             form.bankName.trim() || undefined,
        accountNumber:        form.accountNumber.trim() || undefined,
        upiId:                form.upiId.trim() || undefined,
      });

      if (pendingImg) {
        setImgUploading(true);
        try {
          const { uploadUrl, publicUrl } = await affiliateAdminGetProfileUploadUrl(aff.id, pendingImg.type);
          await uploadImageToS3(uploadUrl, pendingImg);
          updated = await affiliateAdminUpdate(aff.id, { profileImageUrl: publicUrl });
          setPendingImg(null);
        } finally {
          setImgUploading(false);
        }
      }

      setAff(updated);
      setForm(toForm(updated));
      setSavedAt(new Date());
    } catch (e: any) {
      setSaveError(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="adPage"><div className="adEmpty">Loading affiliate…</div></div>;
  if (error || !aff || !form) return <div className="adPage"><div className="adEmpty" style={{ color: "#EF4444" }}>{error || "Not found"}</div></div>;

  const sc = STATUS_MAP[form.status] ?? STATUS_MAP.inactive;
  const dirty = isDirty();
  const busy = saving || imgUploading;

  return (
    <div className="adPage">
      {/* ── Header ── */}
      <div className="adPageHeader">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button className="adActionBtn" onClick={onBack}>← Back</button>
          <div>
            <h2 className="adPageTitle">{form.name || aff.name}</h2>
            <p className="adPageSub">Edit affiliate details — changes save immediately</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {savedAt && !dirty && (
            <span style={{ fontSize: 13, color: "#10B981", fontWeight: 600 }}>
              ✓ Saved {savedAt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          {saveError && <span style={{ fontSize: 13, color: "#EF4444" }}>{saveError}</span>}
          <button
            className="adPrimaryBtn"
            onClick={handleSave}
            disabled={!dirty || busy}
            style={{ opacity: !dirty || busy ? 0.55 : 1, minWidth: 130 }}
          >
            {busy ? "Saving…" : dirty ? "Save Changes" : "Saved"}
          </button>
        </div>
      </div>

      {/* ── Two-column edit layout ── */}
      <div className="adAffFormLayout">

        {/* ── Left: info + social + payment ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Profile basics */}
          <div className="adTableCard">
            <div className="adSectionLabel">Profile Information</div>
            <div className="adFormGrid">
              <Field label="Full Name">
                <input className="adFormInput" value={form.name} onChange={e => set("name", e.target.value)} />
              </Field>
              <Field label="Email">
                <input className="adFormInput" type="email" value={form.email} onChange={e => set("email", e.target.value)} />
              </Field>
              <Field label="Phone">
                <input className="adFormInput" value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="+91 9999999999" />
              </Field>
              <Field label="Location">
                <input className="adFormInput" value={form.location} onChange={e => set("location", e.target.value)} placeholder="City, State" />
              </Field>
              <div className="adFormField" style={{ gridColumn: "1 / -1" }}>
                <label className="adFormLabel">Bio</label>
                <textarea className="adFormTextarea" value={form.bio} onChange={e => set("bio", e.target.value)} rows={3} placeholder="Short intro…" />
              </div>
            </div>
          </div>

          {/* Social */}
          <div className="adTableCard">
            <div className="adSectionLabel">Social Media</div>
            <div className="adFormGrid">
              <Field label="Instagram">
                <input className="adFormInput" value={form.instagram} onChange={e => set("instagram", e.target.value)} placeholder="@handle or URL" />
              </Field>
              <Field label="YouTube">
                <input className="adFormInput" value={form.youtube} onChange={e => set("youtube", e.target.value)} placeholder="Channel URL" />
              </Field>
              <div className="adFormField" style={{ gridColumn: "1 / -1" }}>
                <label className="adFormLabel">LinkedIn</label>
                <input className="adFormInput" value={form.linkedin} onChange={e => set("linkedin", e.target.value)} placeholder="Profile URL" />
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="adTableCard">
            <div className="adSectionLabel">Payment Details</div>
            <div className="adFormGrid">
              <Field label="Bank Name">
                <input className="adFormInput" value={form.bankName} onChange={e => set("bankName", e.target.value)} placeholder="HDFC Bank" />
              </Field>
              <Field label="Account Number">
                <input className="adFormInput" value={form.accountNumber} onChange={e => set("accountNumber", e.target.value)} placeholder="XXXXXXXXXXXXXXXX" />
              </Field>
              <div className="adFormField" style={{ gridColumn: "1 / -1" }}>
                <label className="adFormLabel">UPI ID</label>
                <input className="adFormInput" value={form.upiId} onChange={e => set("upiId", e.target.value)} placeholder="name@upi" />
              </div>
            </div>
          </div>

          {/* Referral link + promo code (read-only) */}
          <div className="adTableCard">
            <div className="adSectionLabel" style={{ marginBottom: 12 }}>Referral Link & Promo Code</div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#64748B", marginBottom: 6 }}>REFERRAL LINK</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <div style={{ flex: 1, fontFamily: "monospace", fontSize: 12, background: "#F8FAFC", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "10px 14px", color: "#475569", wordBreak: "break-all", minWidth: 180 }}>
                  {aff.referralLink}
                </div>
                <CopyBtn text={aff.referralLink} />
              </div>
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#64748B", marginBottom: 6 }}>PROMO CODE</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ fontFamily: "monospace", fontSize: 20, fontWeight: 800, background: "#F1F5F9", padding: "10px 18px", borderRadius: 10, color: "#8B5CF6", letterSpacing: 2 }}>
                  {aff.affiliateCode}
                </div>
                <CopyBtn text={aff.affiliateCode} />
              </div>
              <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 6 }}>Users can enter this code in Credits & Billing to redeem the promo bonus</div>
            </div>
          </div>
        </div>

        {/* ── Right: image + commission + status ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Profile image */}
          <div className="adTableCard">
            <div className="adSectionLabel">Profile Image</div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
              {imgPreview ? (
                <img src={imgPreview} alt="Profile" style={{ width: 100, height: 100, borderRadius: "50%", objectFit: "cover", border: "3px solid #E2E8F0" }} />
              ) : (
                <div style={{ width: 100, height: 100, borderRadius: "50%", background: "#8B5CF620", color: "#8B5CF6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, fontWeight: 800 }}>
                  {form.name[0]?.toUpperCase() || "?"}
                </div>
              )}
              <button type="button" className="adActionBtn adActionBtnEdit" style={{ width: "100%" }} onClick={() => fileRef.current?.click()}>
                Change Image
              </button>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImagePick} />
              <div style={{ fontSize: 11, color: "#94A3B8" }}>PNG · JPG · WEBP · Saved with the form</div>
            </div>
          </div>

          {/* Commission & bonus */}
          <div className="adTableCard" style={{ border: "2px solid rgba(139,92,246,0.25)", background: "rgba(139,92,246,0.02)" }}>
            <div className="adSectionLabel">Commission & Signup Bonus</div>

            <Field label="Commission Rate (%)">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  className="adFormInput"
                  type="number" min="0" max="100" step="0.5"
                  value={form.commissionPercentage}
                  onChange={e => set("commissionPercentage", e.target.value)}
                  style={{ maxWidth: 90 }}
                />
                <span style={{ fontSize: 13, color: "#64748B" }}>% of purchase</span>
              </div>
              <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 4 }}>
                ₹1000 purchase → ₹{((parseFloat(form.commissionPercentage) || 0) * 10).toFixed(0)} earned
              </div>
            </Field>

            <div style={{ height: 14 }} />

            <Field label="Signup Bonus Credits (₹)">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  className="adFormInput"
                  type="number" min="0" max="10000" step="10"
                  value={form.bonusCredits}
                  onChange={e => set("bonusCredits", e.target.value)}
                  style={{ maxWidth: 90 }}
                />
                <span style={{ fontSize: 13, color: "#64748B" }}>given on link signup</span>
              </div>
              <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 4 }}>
                Auto-credited when user signs up via the referral link
              </div>
            </Field>

            <div style={{ marginTop: 14, padding: "10px 14px", background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10, fontSize: 13, color: "#16A34A", fontWeight: 600 }}>
              🔗 Banner: <em>"Sign up and get ₹{parseInt(form.bonusCredits) || 0} free credits"</em>
            </div>
          </div>

          {/* Promo code bonus — separate from signup bonus */}
          <div className="adTableCard" style={{ border: "2px solid rgba(59,130,246,0.25)", background: "rgba(59,130,246,0.02)" }}>
            <div className="adSectionLabel">Promo Code Bonus</div>
            <div style={{ fontSize: 12, color: "#64748B", marginBottom: 14 }}>
              Any user can enter the promo code <strong style={{ color: "#8B5CF6" }}>{aff.affiliateCode}</strong> in Credits & Billing to claim this bonus (one per account).
            </div>

            <Field label="Promo Bonus Credits (₹)">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  className="adFormInput"
                  type="number" min="0" max="10000" step="10"
                  value={form.promoBonusCredits}
                  onChange={e => set("promoBonusCredits", e.target.value)}
                  style={{ maxWidth: 90 }}
                />
                <span style={{ fontSize: 13, color: "#64748B" }}>credits on redemption</span>
              </div>
              <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 4 }}>
                Set to 0 to disable promo code redemption
              </div>
            </Field>

            <div style={{ height: 14 }} />

            <Field label="Valid Until">
              <input
                className="adFormInput"
                type="date"
                value={form.promoValidUntil}
                onChange={e => set("promoValidUntil", e.target.value)}
                min={new Date().toISOString().slice(0, 10)}
                style={{ maxWidth: 180 }}
              />
              <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 4 }}>
                {form.promoValidUntil
                  ? `Expires ${new Date(form.promoValidUntil).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`
                  : "Leave empty for no expiry"}
              </div>
            </Field>

            {parseInt(form.promoBonusCredits) > 0 && (
              <div style={{ marginTop: 14, padding: "10px 14px", background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 10, fontSize: 13, color: "#1D4ED8", fontWeight: 600 }}>
                🎟️ Redeeming <strong>{aff.affiliateCode}</strong> gives ₹{parseInt(form.promoBonusCredits)} credits
                {form.promoValidUntil ? ` · Valid till ${new Date(form.promoValidUntil).toLocaleDateString("en-IN")}` : " · No expiry"}
              </div>
            )}
          </div>

          {/* Status */}
          <div className="adTableCard">
            <div className="adSectionLabel">Account Status</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {(["active", "suspended", "inactive"] as const).map(s => {
                const col = STATUS_MAP[s];
                const active = form.status === s;
                return (
                  <button
                    key={s}
                    onClick={() => set("status", s)}
                    style={{
                      padding: "8px 18px",
                      borderRadius: 9999,
                      border: `2px solid ${active ? col.color : "#E2E8F0"}`,
                      background: active ? col.bg : "#fff",
                      color: active ? col.color : "#94A3B8",
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      textTransform: "capitalize",
                      transition: "all 150ms",
                    }}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
            <div style={{ marginTop: 10, fontSize: 12, color: "#94A3B8" }}>
              {form.status === "active"    && "Referral link is live and tracking clicks."}
              {form.status === "suspended" && "Link is paused — clicks tracked but not attributed."}
              {form.status === "inactive"  && "Affiliate is inactive — link returns 404."}
            </div>
          </div>

          {/* Joined */}
          <div style={{ padding: "12px 16px", background: "#F8FAFC", borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 13, color: "#64748B" }}>
            <span style={{ fontWeight: 700, color: "#475569" }}>Joined:</span>{" "}
            {new Date(aff.joinedDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="adStatRow">
        <StatCard label="Total Clicks"   value={aff.totalClicks.toLocaleString()}              sub="Link visits"  color="#3B82F6" />
        <StatCard label="Referred Users" value={aff.totalUsers}                                sub="Signed up"    color="#10B981" />
        <StatCard label="Revenue"        value={`₹${Number(aff.totalRevenue).toFixed(0)}`}    sub="Attributed"   color="#F59E0B" />
        <StatCard label="Commission"     value={`₹${Number(aff.totalCommission).toFixed(0)}`} sub="To pay out"   color="#EF4444" />
      </div>

      {/* ── Activity / Users tabs ── */}
      <div className="adTableCard">
        <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
          {(["activity", "users"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: "7px 18px", borderRadius: 8, border: "none", background: tab === t ? "#8B5CF6" : "#F1F5F9", color: tab === t ? "#fff" : "#64748B", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
              {t === "activity" ? `Clicks (${activity.length})` : `Users (${users.length})`}
            </button>
          ))}
        </div>

        {tab === "activity" && (
          activity.length === 0 ? <div className="adEmpty">No click activity yet.</div> : (
            <div className="adTableWrap">
              <table className="adTable">
                <thead><tr><th>Date & Time</th><th>Device</th><th>Browser</th><th>UTM Source</th><th>UTM Medium</th></tr></thead>
                <tbody>
                  {activity.slice(0, 50).map(c => (
                    <tr key={c.id}>
                      <td><span className="adDate">{new Date(c.timestamp).toLocaleString("en-IN")}</span></td>
                      <td><span className="adDate">{c.device || "—"}</span></td>
                      <td><span className="adDate">{c.browser || "—"}</span></td>
                      <td><span className="adDate">{c.utmSource || "—"}</span></td>
                      <td><span className="adDate">{c.utmMedium || "—"}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {tab === "users" && (
          users.length === 0 ? <div className="adEmpty">No referred users yet.</div> : (
            <div className="adTableWrap">
              <table className="adTable">
                <thead><tr><th>User</th><th>Signup Date</th><th>Purchase</th><th>Commission</th></tr></thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.userId}>
                      <td>
                        <div className="adUserCell">
                          <div className="adAvatar" style={{ background: "#8B5CF620", color: "#8B5CF6" }}>{u.name[0]?.toUpperCase()}</div>
                          <div><div className="adUserName">{u.name}</div><div className="adUserEmail">{u.email}</div></div>
                        </div>
                      </td>
                      <td><span className="adDate">{new Date(u.signupDate).toLocaleDateString("en-IN")}</span></td>
                      <td><span className="adCreditsNum">₹{Number(u.purchaseAmount).toFixed(0)}</span></td>
                      <td><span className="adCreditsNum" style={{ color: "#10B981" }}>₹{Number(u.commissionGenerated).toFixed(0)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* ── Sticky save bar shown when dirty ── */}
      {dirty && (
        <div style={{ position: "sticky", bottom: 20, display: "flex", justifyContent: "flex-end", pointerEvents: "none" }}>
          <div style={{ pointerEvents: "auto", background: "#0F172A", borderRadius: 14, padding: "12px 20px", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.3)" }}>
            <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>You have unsaved changes</span>
            <button
              className="adPrimaryBtn"
              onClick={handleSave}
              disabled={busy}
              style={{ padding: "8px 22px", fontSize: 13 }}
            >
              {busy ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
