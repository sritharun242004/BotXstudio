import { useState, useEffect, useCallback } from "react";
import type { Affiliate, OverviewStats, DailySignup } from "../lib/affiliateAdmin";
import {
  affiliateAdminGetOverview,
  affiliateAdminList,
  affiliateAdminSuspend,
  affiliateAdminDelete,
} from "../lib/affiliateAdmin";

// ─── Mini sparkline chart ─────────────────────────────────────────────────────

function Sparkline({ data }: { data: DailySignup[] }) {
  const vals = data.map((d) => d.signups);
  const max = Math.max(...vals, 1);
  const w = 200, h = 48;
  const points = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * w;
    const y = h - (v / max) * (h - 4) - 2;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg width={w} height={h} style={{ display: "block" }}>
      <polyline fill="none" stroke="#8B5CF6" strokeWidth="2" points={points} />
      {vals.map((v, i) => {
        const x = (i / (vals.length - 1)) * w;
        const y = h - (v / max) * (h - 4) - 2;
        return v > 0 ? <circle key={i} cx={x} cy={y} r="2.5" fill="#8B5CF6" /> : null;
      })}
    </svg>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className="adStatCard" style={{ borderTopColor: color }}>
      <div className="adStatValue">{value}</div>
      <div className="adStatLabel">{label}</div>
      {sub && <div className="adStatSub">{sub}</div>}
    </div>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    active:    { bg: "#DCFCE7", color: "#16A34A" },
    suspended: { bg: "#FEF3C7", color: "#D97706" },
    inactive:  { bg: "#F1F5F9", color: "#94A3B8" },
  };
  const s = map[status] ?? map.inactive;
  return (
    <span className="adBadge" style={{ background: s.bg, color: s.color }}>
      {status}
    </span>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function AffAvatar({ aff }: { aff: Affiliate }) {
  if (aff.profileImageUrl) {
    return (
      <img
        src={aff.profileImageUrl}
        alt={aff.name}
        style={{ width: 34, height: 34, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "2px solid #E2E8F0" }}
      />
    );
  }
  return (
    <div className="adAvatar" style={{ background: "#8B5CF620", color: "#8B5CF6" }}>
      {aff.name[0]?.toUpperCase()}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

interface Props {
  onCreateNew: () => void;
  onViewProfile: (id: string) => void;
  onEdit: (id: string) => void;
}

export default function AffiliatesPage({ onCreateNew, onViewProfile, onEdit }: Props) {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [daily, setDaily] = useState<DailySignup[]>([]);
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(0);
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [error, setError] = useState("");

  const PAGE_SIZE = 20;

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [overviewRes, listRes] = await Promise.all([
        affiliateAdminGetOverview(),
        affiliateAdminList({ search, status: statusFilter || undefined, limit: PAGE_SIZE, offset: page * PAGE_SIZE }),
      ]);
      setStats(overviewRes.stats);
      setDaily(overviewRes.daily);
      setAffiliates(listRes.affiliates);
      setTotal(listRes.total);
    } catch (e: any) {
      setError(e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page]);

  useEffect(() => { load(); }, [load]);

  async function handleSuspend(id: string) {
    setActionBusy(id);
    try {
      const updated = await affiliateAdminSuspend(id);
      setAffiliates((prev) => prev.map((a) => (a.id === id ? updated : a)));
    } catch (e: any) { setError(e.message || "Failed"); }
    setActionBusy(null);
  }

  async function handleDelete(id: string) {
    setActionBusy(id);
    try {
      await affiliateAdminDelete(id);
      setAffiliates((prev) => prev.filter((a) => a.id !== id));
      setTotal((t) => t - 1);
      setConfirmDelete(null);
    } catch (e: any) { setError(e.message || "Failed"); }
    setActionBusy(null);
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="adPage">
      {/* Header */}
      <div className="adPageHeader">
        <div>
          <h2 className="adPageTitle">Affiliates</h2>
          <p className="adPageSub">Manage affiliate partners and track referrals</p>
        </div>
        <button className="adPrimaryBtn" onClick={onCreateNew}>+ New Affiliate</button>
      </div>

      {error && (
        <div style={{ padding: "12px 16px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, color: "#DC2626", fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="adStatRow">
        <StatCard label="Total Affiliates" value={stats?.totalAffiliates ?? "…"} sub="Partners" color="#8B5CF6" />
        <StatCard label="Total Clicks"     value={stats?.totalClicks ?? "…"}     sub="Link visits" color="#3B82F6" />
        <StatCard label="Total Signups"    value={stats?.totalSignups ?? "…"}    sub="Via affiliate" color="#10B981" />
        <StatCard label="Revenue"          value={stats ? `₹${Number(stats.totalRevenue).toFixed(0)}` : "…"} sub="Attributed" color="#F59E0B" />
        <StatCard label="Commission Paid"  value={stats ? `₹${Number(stats.totalCommission).toFixed(0)}` : "…"} sub="To affiliates" color="#EF4444" />
        <StatCard label="Pending Payouts"  value={stats ? `₹${Number(stats.pendingPayouts).toFixed(0)}` : "…"} sub="To pay" color="#6366F1" />
      </div>

      {/* Chart */}
      {daily.length > 0 && (
        <div className="adTableCard" style={{ padding: "18px 20px" }}>
          <div className="adSectionLabel" style={{ marginBottom: 12 }}>Daily Signups (last 30 days)</div>
          <Sparkline data={daily} />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 11, color: "#94A3B8" }}>
            <span>{daily[0]?.date}</span>
            <span>{daily[daily.length - 1]?.date}</span>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="adTableCard">
        <div className="adTableToolbar">
          <input
            className="adSearch"
            type="search"
            placeholder="Search by name, email or code…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          />
          <div className="adFilterGroup">
            {["", "active", "suspended", "inactive"].map((s) => (
              <button
                key={s}
                className={`adFilterPill${statusFilter === s ? " adFilterPillActive" : ""}`}
                onClick={() => { setStatusFilter(s); setPage(0); }}
              >
                {s || "All"}
              </button>
            ))}
          </div>
        </div>

        <div className="adTableWrap">
          {loading ? (
            <div className="adEmpty">Loading affiliates…</div>
          ) : affiliates.length === 0 ? (
            <div className="adEmpty">
              No affiliates found.{" "}
              <button style={{ color: "#8B5CF6", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }} onClick={onCreateNew}>
                Create your first affiliate
              </button>
            </div>
          ) : (
            <table className="adTable">
              <thead>
                <tr>
                  <th>Affiliate</th>
                  <th>Code</th>
                  <th>Clicks</th>
                  <th>Users</th>
                  <th>Revenue</th>
                  <th>Commission</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {affiliates.map((aff) => (
                  <tr key={aff.id}>
                    <td>
                      <div className="adUserCell">
                        <AffAvatar aff={aff} />
                        <div>
                          <div className="adUserName">{aff.name}</div>
                          <div className="adUserEmail">{aff.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 700, background: "#F1F5F9", padding: "3px 8px", borderRadius: 6, color: "#475569" }}>
                        {aff.affiliateCode}
                      </span>
                    </td>
                    <td><span className="adDate">{aff.totalClicks.toLocaleString()}</span></td>
                    <td><span className="adDate">{aff.totalUsers}</span></td>
                    <td><span className="adCreditsNum">₹{Number(aff.totalRevenue).toFixed(0)}</span></td>
                    <td><span className="adCreditsNum" style={{ color: "#10B981" }}>₹{Number(aff.totalCommission).toFixed(0)}</span></td>
                    <td><StatusBadge status={aff.status} /></td>
                    <td><span className="adDate">{new Date(aff.joinedDate).toLocaleDateString("en-IN")}</span></td>
                    <td>
                      <div className="adActionRow">
                        <button className="adActionBtn adActionBtnEdit" onClick={() => onViewProfile(aff.id)}>View</button>
                        <button className="adActionBtn adActionBtnEdit" onClick={() => onEdit(aff.id)}>Edit</button>
                        {aff.status === "active" ? (
                          <button
                            className="adActionBtn"
                            disabled={actionBusy === aff.id}
                            onClick={() => handleSuspend(aff.id)}
                            style={{ borderColor: "#F59E0B", color: "#D97706" }}
                          >
                            {actionBusy === aff.id ? "…" : "Suspend"}
                          </button>
                        ) : null}
                        {confirmDelete === aff.id ? (
                          <>
                            <button className="adActionBtn" disabled={actionBusy === aff.id} onClick={() => handleDelete(aff.id)} style={{ borderColor: "#EF4444", color: "#EF4444", fontWeight: 700 }}>
                              {actionBusy === aff.id ? "…" : "Confirm"}
                            </button>
                            <button className="adActionBtn" onClick={() => setConfirmDelete(null)}>Cancel</button>
                          </>
                        ) : (
                          <button className="adActionBtn" onClick={() => setConfirmDelete(aff.id)}>Delete</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16, paddingTop: 14, borderTop: "1px solid #F1F5F9", fontSize: 13, color: "#64748B" }}>
            <span>Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}</span>
            <div style={{ display: "flex", gap: 6 }}>
              <button className="adActionBtn" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>← Prev</button>
              <button className="adActionBtn" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
