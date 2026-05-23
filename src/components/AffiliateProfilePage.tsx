import { useState, useEffect } from "react";
import type { Affiliate, AffiliateClick, AffiliateUser } from "../lib/affiliateAdmin";
import { affiliateAdminGet, affiliateAdminGetActivity, affiliateAdminGetUsers } from "../lib/affiliateAdmin";

interface Props {
  affiliateId: string;
  onBack: () => void;
  onEdit: (id: string) => void;
}

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

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  active:    { bg: "#DCFCE7", color: "#16A34A" },
  suspended: { bg: "#FEF3C7", color: "#D97706" },
  inactive:  { bg: "#F1F5F9", color: "#94A3B8" },
};

export default function AffiliateProfilePage({ affiliateId, onBack, onEdit }: Props) {
  const [aff, setAff] = useState<Affiliate | null>(null);
  const [activity, setActivity] = useState<AffiliateClick[]>([]);
  const [users, setUsers] = useState<AffiliateUser[]>([]);
  const [tab, setTab] = useState<"activity" | "users">("activity");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    Promise.all([
      affiliateAdminGet(affiliateId),
      affiliateAdminGetActivity(affiliateId),
      affiliateAdminGetUsers(affiliateId),
    ])
      .then(([affData, actData, usersData]) => {
        setAff(affData);
        setActivity(actData);
        setUsers(usersData);
      })
      .catch((e: any) => setError(e.message || "Failed to load"))
      .finally(() => setLoading(false));
  }, [affiliateId]);

  if (loading) return <div className="adPage"><div className="adEmpty">Loading affiliate…</div></div>;
  if (error || !aff) return <div className="adPage"><div className="adEmpty" style={{ color: "#EF4444" }}>{error || "Affiliate not found"}</div></div>;

  const sc = STATUS_COLORS[aff.status] ?? STATUS_COLORS.inactive;

  return (
    <div className="adPage">
      <div className="adPageHeader">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button className="adActionBtn" onClick={onBack}>← Back</button>
          <div>
            <h2 className="adPageTitle">Affiliate Profile</h2>
            <p className="adPageSub">Analytics and referral details</p>
          </div>
        </div>
        <button className="adPrimaryBtn" onClick={() => onEdit(aff.id)}>Edit</button>
      </div>

      {/* Profile card */}
      <div className="adTableCard">
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "flex-start" }}>
          {aff.profileImageUrl ? (
            <img src={aff.profileImageUrl} alt={aff.name} style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover", border: "3px solid #E2E8F0", flexShrink: 0 }} />
          ) : (
            <div style={{ width: 80, height: 80, borderRadius: "50%", background: "#8B5CF620", color: "#8B5CF6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, fontWeight: 800, flexShrink: 0 }}>
              {aff.name[0]?.toUpperCase()}
            </div>
          )}

          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 4 }}>
              <span style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", fontFamily: "Outfit,system-ui,sans-serif" }}>{aff.name}</span>
              <span style={{ padding: "3px 10px", borderRadius: 9999, fontSize: 11, fontWeight: 700, background: sc.bg, color: sc.color, textTransform: "capitalize" }}>{aff.status}</span>
            </div>
            <div style={{ fontSize: 13, color: "#64748B" }}>{aff.email}{aff.phone ? ` · ${aff.phone}` : ""}</div>
            {aff.location && <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 2 }}>{aff.location}</div>}
            {aff.bio && <div style={{ fontSize: 13, color: "#475569", marginTop: 8, maxWidth: 480 }}>{aff.bio}</div>}
            {(aff.instagram || aff.youtube || aff.linkedin) && (
              <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                {aff.instagram && (
                  <a href={aff.instagram.startsWith("http") ? aff.instagram : `https://instagram.com/${aff.instagram.replace("@", "")}`} target="_blank" rel="noopener noreferrer" className="adSocialChip adSocialInsta">Instagram</a>
                )}
                {aff.youtube && (
                  <a href={aff.youtube} target="_blank" rel="noopener noreferrer" className="adSocialChip adSocialYt">YouTube</a>
                )}
                {aff.linkedin && (
                  <a href={aff.linkedin} target="_blank" rel="noopener noreferrer" className="adSocialChip adSocialLi">LinkedIn</a>
                )}
              </div>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 180 }}>
            <div>
              <div className="adSectionLabel" style={{ marginBottom: 4 }}>Code</div>
              <span style={{ fontFamily: "monospace", fontSize: 15, fontWeight: 800, background: "#F1F5F9", padding: "5px 12px", borderRadius: 8, color: "#475569" }}>{aff.affiliateCode}</span>
            </div>
            <div>
              <div className="adSectionLabel" style={{ marginBottom: 4 }}>Commission</div>
              <span style={{ fontSize: 18, fontWeight: 800, color: "#8B5CF6" }}>{aff.commissionPercentage}%</span>
            </div>
            <div>
              <div className="adSectionLabel" style={{ marginBottom: 4 }}>Signup Bonus</div>
              <span style={{ fontSize: 18, fontWeight: 800, color: "#10B981" }}>₹{aff.bonusCredits ?? 0}</span>
            </div>
            <div>
              <div className="adSectionLabel" style={{ marginBottom: 4 }}>Joined</div>
              <span style={{ fontSize: 13, color: "#475569" }}>{new Date(aff.joinedDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
            </div>
          </div>
        </div>

        {/* Referral link */}
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #F1F5F9" }}>
          <div className="adSectionLabel" style={{ marginBottom: 8 }}>Referral Link</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <div style={{ flex: 1, fontFamily: "monospace", fontSize: 13, background: "#F8FAFC", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "10px 14px", color: "#475569", minWidth: 200, wordBreak: "break-all" }}>
              {aff.referralLink}
            </div>
            <CopyBtn text={aff.referralLink} />
            {aff.qrCodeUrl && (
              <a href={aff.qrCodeUrl} target="_blank" rel="noopener noreferrer" className="adActionBtn">QR Code</a>
            )}
          </div>
        </div>

        {aff.qrCodeUrl && (
          <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 16 }}>
            <img src={aff.qrCodeUrl} alt="QR Code" style={{ width: 110, height: 110, borderRadius: 10, border: "2px solid #E2E8F0" }} />
            <div style={{ fontSize: 13, color: "#64748B" }}>Share this QR code for easy referral link distribution.</div>
          </div>
        )}

        {(aff.bankName || aff.upiId) && (
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #F1F5F9" }}>
            <div className="adSectionLabel" style={{ marginBottom: 8 }}>Payment Details</div>
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap", fontSize: 13, color: "#475569" }}>
              {aff.bankName && <span><strong>Bank:</strong> {aff.bankName}{aff.accountNumber ? ` · ${aff.accountNumber}` : ""}</span>}
              {aff.upiId && <span><strong>UPI:</strong> {aff.upiId}</span>}
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="adStatRow">
        <StatCard label="Total Clicks"   value={aff.totalClicks.toLocaleString()}              sub="Link visits"  color="#3B82F6" />
        <StatCard label="Referred Users" value={aff.totalUsers}                                sub="Signed up"    color="#10B981" />
        <StatCard label="Revenue"        value={`₹${Number(aff.totalRevenue).toFixed(0)}`}    sub="Attributed"   color="#F59E0B" />
        <StatCard label="Commission"     value={`₹${Number(aff.totalCommission).toFixed(0)}`} sub="To pay out"   color="#EF4444" />
      </div>

      {/* Activity / Users tabs */}
      <div className="adTableCard">
        <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
          {(["activity", "users"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{ padding: "7px 18px", borderRadius: 8, border: "none", background: tab === t ? "#8B5CF6" : "#F1F5F9", color: tab === t ? "#fff" : "#64748B", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}
            >
              {t === "activity" ? `Clicks (${activity.length})` : `Users (${users.length})`}
            </button>
          ))}
        </div>

        {tab === "activity" && (
          activity.length === 0 ? (
            <div className="adEmpty">No click activity yet.</div>
          ) : (
            <div className="adTableWrap">
              <table className="adTable">
                <thead>
                  <tr><th>Date & Time</th><th>Device</th><th>Browser</th><th>UTM Source</th><th>UTM Medium</th></tr>
                </thead>
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
          users.length === 0 ? (
            <div className="adEmpty">No referred users yet.</div>
          ) : (
            <div className="adTableWrap">
              <table className="adTable">
                <thead>
                  <tr><th>User</th><th>Signup Date</th><th>Purchase Amount</th><th>Commission</th></tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.userId}>
                      <td>
                        <div className="adUserCell">
                          <div className="adAvatar" style={{ background: "#8B5CF620", color: "#8B5CF6" }}>{u.name[0]?.toUpperCase()}</div>
                          <div>
                            <div className="adUserName">{u.name}</div>
                            <div className="adUserEmail">{u.email}</div>
                          </div>
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
    </div>
  );
}
