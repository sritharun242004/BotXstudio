import { useState, useEffect } from "react";
import { adminFetchUsers, adminTopUpUser, adminDeleteUser, type AdminUser } from "../lib/credits";
import { affiliateAdminList, type Affiliate } from "../lib/affiliateAdmin";
import { getAdminSession, ADMIN_EMAIL } from "../lib/adminAuth";

// ─── Admin Team (localStorage) ────────────────────────────────────────────────

const ADMIN_STORE = "bsx_admin_team_v1";

interface AdminRecord {
  id: string;
  name: string;
  email: string;
  creditLimit: number; // 0 = unlimited app access
  permissions: ("view" | "edit" | "export")[];
  addedAt: string;
}

function loadAdminTeam(): AdminRecord[] {
  try { return JSON.parse(localStorage.getItem(ADMIN_STORE) ?? "[]"); } catch { return []; }
}
function saveAdminTeam(list: AdminRecord[]) {
  localStorage.setItem(ADMIN_STORE, JSON.stringify(list));
}

// ─── Shared StatCard ──────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className="adStatCard" style={{ borderTopColor: color }}>
      <div className="adStatValue">{value}</div>
      <div className="adStatLabel">{label}</div>
      {sub && <div className="adStatSub">{sub}</div>}
    </div>
  );
}

// ─── Category distribution bar ────────────────────────────────────────────────

interface Seg { label: string; count: number; color: string }

function CategoryBar({ segments }: { segments: Seg[] }) {
  const total = segments.reduce((s, g) => s + g.count, 0);
  if (total === 0) return null;
  return (
    <div>
      <div style={{ display: "flex", height: 14, borderRadius: 10, overflow: "hidden", gap: 2, marginBottom: 12 }}>
        {segments.map((seg, i) => (
          <div
            key={i}
            title={`${seg.label}: ${seg.count}`}
            style={{
              width: `${(seg.count / total) * 100}%`,
              background: seg.color,
              minWidth: seg.count > 0 ? 6 : 0,
              transition: "width 0.4s ease",
            }}
          />
        ))}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 20px" }}>
        {segments.map((seg, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: seg.color, flexShrink: 0 }} />
            <span style={{ color: "#64748B" }}>{seg.label}</span>
            <span style={{ fontWeight: 700, color: "#1E293B" }}>{seg.count}</span>
            <span style={{ color: "#94A3B8" }}>({Math.round((seg.count / total) * 100)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Topup row ────────────────────────────────────────────────────────────────

function TopupRow({
  user,
  onSaved,
  onClose,
}: {
  user: AdminUser;
  onSaved: (updated: AdminUser) => void;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [note, setNote]     = useState("");
  const [busy, setBusy]     = useState(false);
  const [err, setErr]       = useState("");

  async function submit() {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt === 0) { setErr("Enter a valid amount"); return; }
    setBusy(true); setErr("");
    try {
      const updated = await adminTopUpUser(user.id, amt, note || undefined);
      onSaved(updated);
      onClose();
    } catch (e: any) {
      setErr(e.message || "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <tr className="adTopupRow">
      <td colSpan={6}>
        <div className="adTopupForm">
          <input
            className="adNumInput"
            type="number"
            step="0.01"
            placeholder="Amount in ₹ (negative to deduct)"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            style={{ width: 240 }}
          />
          <input
            className="adSearch"
            type="text"
            placeholder="Note (optional)"
            value={note}
            onChange={e => setNote(e.target.value)}
            style={{ flex: 1 }}
          />
          <button className="adPrimaryBtn" onClick={submit} disabled={busy}>
            {busy ? "Saving…" : "Confirm"}
          </button>
          <button className="adActionBtn" onClick={onClose}>Cancel</button>
          {err && <span style={{ color: "#EF4444", fontSize: 13 }}>{err}</span>}
        </div>
      </td>
    </tr>
  );
}

// ─── All Users table ──────────────────────────────────────────────────────────

function AllUsersTable({
  users,
  onUpdate,
  onDelete,
}: {
  users: AdminUser[];
  onUpdate: (u: AdminUser) => void;
  onDelete: (id: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [topupId, setTopupId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = users.filter(
    u => !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  );

  async function handleDelete(u: AdminUser) {
    if (!confirm(`Permanently delete "${u.name}" (${u.email})?\n\nThis removes their account, images, storyboards and all data. This cannot be undone.`)) return;
    setDeletingId(u.id);
    try {
      await adminDeleteUser(u.id);
      onDelete(u.id);
    } catch (e: any) {
      alert(e.message || "Failed to delete user");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="adTableCard">
      <div className="adTableToolbar">
        <input
          className="adSearch"
          type="search"
          placeholder="Search by name or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <span style={{ fontSize: 13, color: "#94A3B8" }}>{filtered.length} users</span>
      </div>
      <div className="adTableWrap">
        <table className="adTable">
          <thead>
            <tr>
              <th>User</th><th>Balance (₹)</th><th>Images</th><th>Type</th><th>Joined</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <>
                <tr key={u.id}>
                  <td>
                    <div className="adUserCell">
                      <div className="adAvatar" style={{ background: u.isDeveloper ? "#6366F120" : "#8B5CF620", color: u.isDeveloper ? "#6366F1" : "#8B5CF6" }}>
                        {u.name[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div className="adUserName">{u.name}</div>
                        <div className="adUserEmail">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="adCreditsNum">
                      {u.isDeveloper ? "Unlimited" : `₹${u.creditsBalance.toFixed(2)}`}
                    </span>
                  </td>
                  <td><span className="adDate">{u.imagesGenerated}</span></td>
                  <td>
                    {u.isDeveloper ? (
                      <span style={{ fontSize: 11, fontWeight: 600, background: "#6366F120", color: "#6366F1", border: "1px solid #6366F140", borderRadius: 4, padding: "2px 7px" }}>Developer</span>
                    ) : u.imagesGenerated > 0 ? (
                      <span style={{ fontSize: 11, fontWeight: 600, background: "#10B98120", color: "#059669", border: "1px solid #10B98140", borderRadius: 4, padding: "2px 7px" }}>Consumer</span>
                    ) : (
                      <span style={{ fontSize: 11, fontWeight: 600, background: "#F1F5F9", color: "#64748B", border: "1px solid #E2E8F0", borderRadius: 4, padding: "2px 7px" }}>Free</span>
                    )}
                  </td>
                  <td><span className="adDate">{new Date(u.joinedAt).toLocaleDateString("en-IN")}</span></td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        className="adActionBtn adActionBtnEdit"
                        onClick={() => setTopupId(topupId === u.id ? null : u.id)}
                      >
                        {topupId === u.id ? "Cancel" : "Add / Deduct"}
                      </button>
                      <button
                        className="adActionBtn"
                        style={{ color: "#EF4444", borderColor: "#EF444440" }}
                        onClick={() => handleDelete(u)}
                        disabled={deletingId === u.id}
                      >
                        {deletingId === u.id ? "Deleting…" : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
                {topupId === u.id && (
                  <TopupRow
                    key={`${u.id}-topup`}
                    user={u}
                    onSaved={onUpdate}
                    onClose={() => setTopupId(null)}
                  />
                )}
              </>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="adEmpty">No users match your search.</div>}
      </div>
    </div>
  );
}

// ─── Consumers table ──────────────────────────────────────────────────────────

function ConsumersTable({ users, onUpdate }: { users: AdminUser[]; onUpdate: (u: AdminUser) => void }) {
  const [search, setSearch] = useState("");
  const [topupId, setTopupId] = useState<string | null>(null);

  const consumers = users.filter(u => u.imagesGenerated > 0 && !u.isDeveloper);
  const filtered = consumers.filter(
    u => !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  );
  const totalImages = consumers.reduce((s, u) => s + u.imagesGenerated, 0);
  const totalBalance = consumers.reduce((s, u) => s + u.creditsBalance, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="adStatRow">
        <StatCard label="Active Consumers" value={consumers.length} sub="Generated at least 1 image" color="#10B981" />
        <StatCard label="Total Images" value={totalImages.toLocaleString()} sub="Across all consumers" color="#3B82F6" />
        <StatCard label="Total Balance" value={`₹${totalBalance.toFixed(0)}`} sub="Remaining credits" color="#F59E0B" />
        <StatCard
          label="Conversion Rate"
          value={users.length ? `${Math.round((consumers.length / users.length) * 100)}%` : "0%"}
          sub="Signed up → used the app"
          color="#8B5CF6"
        />
      </div>

      <div className="adTableCard">
        <div className="adTableToolbar">
          <input className="adSearch" type="search" placeholder="Search consumers…" value={search} onChange={e => setSearch(e.target.value)} />
          <span style={{ fontSize: 13, color: "#94A3B8" }}>{filtered.length} consumers</span>
        </div>
        <div className="adTableWrap">
          <table className="adTable">
            <thead>
              <tr><th>User</th><th>Balance (₹)</th><th>Images Generated</th><th>Joined</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <>
                  <tr key={u.id}>
                    <td>
                      <div className="adUserCell">
                        <div className="adAvatar" style={{ background: "#10B98120", color: "#059669" }}>{u.name[0]?.toUpperCase()}</div>
                        <div>
                          <div className="adUserName">{u.name}</div>
                          <div className="adUserEmail">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="adCreditsNum">₹{u.creditsBalance.toFixed(2)}</span></td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span className="adDate" style={{ fontWeight: 700 }}>{u.imagesGenerated}</span>
                        <div style={{ flex: 1, maxWidth: 80, height: 4, background: "#F1F5F9", borderRadius: 4, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${Math.min(100, (u.imagesGenerated / Math.max(...users.map(x => x.imagesGenerated), 1)) * 100)}%`, background: "#10B981", borderRadius: 4 }} />
                        </div>
                      </div>
                    </td>
                    <td><span className="adDate">{new Date(u.joinedAt).toLocaleDateString("en-IN")}</span></td>
                    <td>
                      <button className="adActionBtn adActionBtnEdit" onClick={() => setTopupId(topupId === u.id ? null : u.id)}>
                        {topupId === u.id ? "Cancel" : "Add / Deduct"}
                      </button>
                    </td>
                  </tr>
                  {topupId === u.id && (
                    <TopupRow key={`${u.id}-topup`} user={u} onSaved={onUpdate} onClose={() => setTopupId(null)} />
                  )}
                </>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="adEmpty">No consumers found.</div>}
        </div>
      </div>
    </div>
  );
}

// ─── Affiliates summary table ─────────────────────────────────────────────────

function AffiliatesTab() {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    affiliateAdminList({ limit: 200 })
      .then(r => setAffiliates(r.affiliates))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = affiliates.filter(
    a => !search ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.affiliateCode.toLowerCase().includes(search.toLowerCase()),
  );

  const active    = affiliates.filter(a => a.status === "active").length;
  const totalSigs = affiliates.reduce((s, a) => s + a.totalUsers, 0);
  const totalRev  = affiliates.reduce((s, a) => s + a.totalRevenue, 0);
  const totalComm = affiliates.reduce((s, a) => s + a.totalCommission, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="adStatRow">
        <StatCard label="Total Affiliates" value={loading ? "…" : affiliates.length} sub="All registered" color="#8B5CF6" />
        <StatCard label="Active" value={loading ? "…" : active} sub="Currently active" color="#10B981" />
        <StatCard label="Total Signups" value={loading ? "…" : totalSigs} sub="Users referred" color="#3B82F6" />
        <StatCard label="Revenue Generated" value={loading ? "…" : `₹${totalRev.toFixed(0)}`} sub={`₹${totalComm.toFixed(0)} commission`} color="#F59E0B" />
      </div>

      <div className="adTableCard">
        <div className="adTableToolbar">
          <input className="adSearch" type="search" placeholder="Search affiliates…" value={search} onChange={e => setSearch(e.target.value)} />
          <span style={{ fontSize: 13, color: "#94A3B8" }}>{filtered.length} affiliates</span>
        </div>
        <div className="adTableWrap">
          {loading ? <div className="adEmpty">Loading affiliates…</div> : (
            <table className="adTable">
              <thead>
                <tr><th>Affiliate</th><th>Code</th><th>Signups</th><th>Revenue</th><th>Commission</th><th>Status</th></tr>
              </thead>
              <tbody>
                {filtered.map(a => (
                  <tr key={a.id}>
                    <td>
                      <div className="adUserCell">
                        {a.profileImageUrl ? (
                          <img src={a.profileImageUrl} style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover" }} alt="" />
                        ) : (
                          <div className="adAvatar" style={{ background: "#8B5CF620", color: "#8B5CF6" }}>{a.name[0]?.toUpperCase()}</div>
                        )}
                        <div>
                          <div className="adUserName">{a.name}</div>
                          <div className="adUserEmail">{a.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 700, color: "#8B5CF6", background: "#8B5CF610", padding: "2px 8px", borderRadius: 6 }}>
                        {a.affiliateCode}
                      </span>
                    </td>
                    <td><span className="adDate" style={{ fontWeight: 700 }}>{a.totalUsers}</span></td>
                    <td><span className="adCreditsNum">₹{a.totalRevenue.toFixed(0)}</span></td>
                    <td><span className="adCreditsNum" style={{ color: "#10B981" }}>₹{a.totalCommission.toFixed(0)}</span></td>
                    <td>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 10,
                        background: a.status === "active" ? "#10B98120" : a.status === "suspended" ? "#EF444420" : "#64748B20",
                        color: a.status === "active" ? "#059669" : a.status === "suspended" ? "#EF4444" : "#64748B",
                        border: `1px solid ${a.status === "active" ? "#10B98140" : a.status === "suspended" ? "#EF444440" : "#64748B40"}`,
                      }}>
                        {a.status.charAt(0).toUpperCase() + a.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {!loading && filtered.length === 0 && <div className="adEmpty">No affiliates found.</div>}
        </div>
      </div>
    </div>
  );
}

// ─── Admin Team tab ───────────────────────────────────────────────────────────

const PERM_LABELS: Record<string, string> = { view: "View Data", edit: "Edit Content", export: "Export Data" };

function AdminTeamTab({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const [team, setTeam] = useState<AdminRecord[]>(loadAdminTeam);
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // Form state
  const [fName, setFName]           = useState("");
  const [fEmail, setFEmail]         = useState("");
  const [fLimit, setFLimit]         = useState("0");
  const [fPerms, setFPerms]         = useState<string[]>(["view"]);

  function resetForm() {
    setFName(""); setFEmail(""); setFLimit("0"); setFPerms(["view"]);
    setAdding(false); setEditId(null);
  }

  function togglePerm(p: string) {
    setFPerms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  }

  function handleAdd() {
    if (!fName.trim() || !fEmail.trim()) return;
    const record: AdminRecord = {
      id: Date.now().toString(),
      name: fName.trim(),
      email: fEmail.trim().toLowerCase(),
      creditLimit: parseInt(fLimit) || 0,
      permissions: fPerms as AdminRecord["permissions"],
      addedAt: new Date().toISOString(),
    };
    const updated = [...team, record];
    setTeam(updated);
    saveAdminTeam(updated);
    resetForm();
  }

  function handleEdit(record: AdminRecord) {
    setEditId(record.id);
    setFName(record.name);
    setFEmail(record.email);
    setFLimit(String(record.creditLimit));
    setFPerms(record.permissions);
    setAdding(false);
  }

  function handleSaveEdit() {
    const updated = team.map(r =>
      r.id === editId
        ? { ...r, name: fName.trim(), email: fEmail.trim().toLowerCase(), creditLimit: parseInt(fLimit) || 0, permissions: fPerms as AdminRecord["permissions"] }
        : r,
    );
    setTeam(updated);
    saveAdminTeam(updated);
    resetForm();
  }

  function handleRemove(id: string) {
    if (!confirm("Remove this admin?")) return;
    const updated = team.filter(r => r.id !== id);
    setTeam(updated);
    saveAdminTeam(updated);
  }

  const showForm = adding || editId !== null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="adStatRow">
        <StatCard label="Super Admin" value="1" sub="mohanraj@thebotcompany.in" color="#8B5CF6" />
        <StatCard label="Admin Team" value={team.length} sub="Added by super admin" color="#3B82F6" />
        <StatCard label="Total Admins" value={team.length + 1} sub="Including super admin" color="#10B981" />
      </div>

      <div className="adTableCard">
        <div className="adTableToolbar">
          <span style={{ fontWeight: 700, fontSize: 14, color: "#1E293B" }}>Admin Team Members</span>
          {isSuperAdmin && !showForm && (
            <button className="adPrimaryBtn" onClick={() => { setAdding(true); setEditId(null); resetForm(); setAdding(true); }}>
              + Add Admin
            </button>
          )}
        </div>

        {/* Add / Edit form */}
        {isSuperAdmin && showForm && (
          <div style={{
            background: "#F8FAFC",
            border: "1.5px solid #E2E8F0",
            borderRadius: 12,
            padding: "18px 20px",
            marginBottom: 16,
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#1E293B" }}>
              {editId ? "Edit Admin" : "New Admin"}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="adFormField">
                <label className="adFormLabel">Full Name *</label>
                <input className="adFormInput" value={fName} onChange={e => setFName(e.target.value)} placeholder="Name" />
              </div>
              <div className="adFormField">
                <label className="adFormLabel">Email *</label>
                <input className="adFormInput" type="email" value={fEmail} onChange={e => setFEmail(e.target.value)} placeholder="admin@thebotcompany.in" disabled={!!editId} />
              </div>
              <div className="adFormField">
                <label className="adFormLabel">App Credit Limit (₹)</label>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input className="adFormInput" type="number" min="0" step="100" value={fLimit} onChange={e => setFLimit(e.target.value)} style={{ maxWidth: 120 }} />
                  <span style={{ fontSize: 12, color: "#64748B" }}>0 = unlimited</span>
                </div>
              </div>
              <div className="adFormField">
                <label className="adFormLabel">Permissions</label>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 4 }}>
                  {(["view", "edit", "export"] as const).map(p => (
                    <label key={p} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={fPerms.includes(p)}
                        onChange={() => togglePerm(p)}
                        style={{ accentColor: "#8B5CF6" }}
                      />
                      {PERM_LABELS[p]}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="adPrimaryBtn"
                onClick={editId ? handleSaveEdit : handleAdd}
                disabled={!fName.trim() || !fEmail.trim()}
              >
                {editId ? "Save Changes" : "Add Admin"}
              </button>
              <button className="adActionBtn" onClick={resetForm}>Cancel</button>
            </div>
          </div>
        )}

        <div className="adTableWrap">
          <table className="adTable">
            <thead>
              <tr><th>Admin</th><th>Credit Limit</th><th>Permissions</th><th>Added</th>{isSuperAdmin && <th>Actions</th>}</tr>
            </thead>
            <tbody>
              {/* Super admin row — always first */}
              <tr>
                <td>
                  <div className="adUserCell">
                    <div className="adAvatar" style={{ background: "#8B5CF6", color: "#fff", fontSize: 14 }}>M</div>
                    <div>
                      <div className="adUserName" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        Mohanraj
                        <span style={{ fontSize: 10, fontWeight: 700, background: "#8B5CF6", color: "#fff", borderRadius: 4, padding: "1px 6px", letterSpacing: "0.05em" }}>
                          SUPER ADMIN
                        </span>
                      </div>
                      <div className="adUserEmail">{ADMIN_EMAIL}</div>
                    </div>
                  </div>
                </td>
                <td><span style={{ fontSize: 13, color: "#8B5CF6", fontWeight: 700 }}>Unlimited</span></td>
                <td><span style={{ fontSize: 12, color: "#64748B" }}>All permissions</span></td>
                <td><span className="adDate">Owner</span></td>
                {isSuperAdmin && <td>—</td>}
              </tr>

              {/* Other admins */}
              {team.map(r => (
                <tr key={r.id}>
                  <td>
                    <div className="adUserCell">
                      <div className="adAvatar" style={{ background: "#3B82F620", color: "#3B82F6" }}>{r.name[0]?.toUpperCase()}</div>
                      <div>
                        <div className="adUserName">{r.name}</div>
                        <div className="adUserEmail">{r.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="adCreditsNum">
                      {r.creditLimit === 0 ? "Unlimited" : `₹${r.creditLimit}`}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {r.permissions.map(p => (
                        <span key={p} style={{ fontSize: 11, fontWeight: 600, background: "#3B82F620", color: "#3B82F6", border: "1px solid #3B82F640", borderRadius: 4, padding: "1px 6px" }}>
                          {PERM_LABELS[p]}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td><span className="adDate">{new Date(r.addedAt).toLocaleDateString("en-IN")}</span></td>
                  {isSuperAdmin && (
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button className="adActionBtn adActionBtnEdit" onClick={() => handleEdit(r)}>Edit</button>
                        <button
                          className="adActionBtn"
                          style={{ color: "#EF4444", borderColor: "#EF444440" }}
                          onClick={() => handleRemove(r.id)}
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {team.length === 0 && (
            <div className="adEmpty" style={{ padding: "20px 0" }}>
              No additional admins yet.{isSuperAdmin ? " Click \"+ Add Admin\" to onboard a team member." : ""}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main UsersPage ───────────────────────────────────────────────────────────

type UserTab = "all" | "consumers" | "affiliates" | "admins";

export default function UsersPage() {
  const [tab, setTab]       = useState<UserTab>("all");
  const [users, setUsers]   = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  const session     = getAdminSession();
  const isSuperAdmin = session?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  useEffect(() => {
    adminFetchUsers()
      .then(setUsers)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function updateUser(updated: AdminUser) {
    setUsers(prev => prev.map(u => u.id === updated.id ? { ...u, ...updated } : u));
  }

  function removeUser(id: string) {
    setUsers(prev => prev.filter(u => u.id !== id));
  }

  // Category segments
  const developers  = users.filter(u => u.isDeveloper);
  const consumers   = users.filter(u => u.imagesGenerated > 0 && !u.isDeveloper);
  const freeUsers   = users.filter(u => u.imagesGenerated === 0 && !u.isDeveloper);
  const adminTeam   = loadAdminTeam();
  const converted   = consumers.length;

  const segments: Seg[] = [
    { label: "Free / Inactive",   count: freeUsers.length,  color: "#E2E8F0" },
    { label: "Active Consumers",  count: consumers.length,  color: "#10B981" },
    { label: "Developers",        count: developers.length, color: "#6366F1" },
  ];

  const TABS: { key: UserTab; label: string; count: number | string }[] = [
    { key: "all",       label: "All Users",    count: loading ? "…" : users.length },
    { key: "consumers", label: "Consumers",    count: loading ? "…" : consumers.length },
    { key: "affiliates",label: "Affiliates",   count: "" },
    { key: "admins",    label: "Admin Team",   count: adminTeam.length + 1 },
  ];

  return (
    <div className="adPage">
      {/* Header */}
      <div className="adPageHeader">
        <div>
          <h2 className="adPageTitle">User Management</h2>
          <p className="adPageSub">Manage all users, consumers, affiliates and admin team</p>
        </div>
      </div>

      {/* Top stats */}
      <div className="adStatRow">
        <StatCard
          label="Total Users"
          value={loading ? "…" : users.length}
          sub="Registered accounts"
          color="#8B5CF6"
        />
        <StatCard
          label="Converted"
          value={loading ? "…" : users.length ? `${Math.round((converted / users.length) * 100)}%` : "0%"}
          sub={`${converted} active consumers`}
          color="#10B981"
        />
        <StatCard
          label="Total Images"
          value={loading ? "…" : users.reduce((s, u) => s + u.imagesGenerated, 0).toLocaleString()}
          sub="Generated across all users"
          color="#3B82F6"
        />
        <StatCard
          label="Admin Team"
          value={adminTeam.length + 1}
          sub="Including super admin"
          color="#F59E0B"
        />
      </div>

      {/* Category distribution */}
      {!loading && users.length > 0 && (
        <div className="adTableCard" style={{ padding: "16px 20px" }}>
          <div style={{ fontWeight: 700, fontSize: 12, color: "#94A3B8", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 12 }}>
            User Category Distribution
          </div>
          <CategoryBar segments={segments} />
        </div>
      )}

      {/* Horizontal tabs */}
      <div className="adSegment">
        {TABS.map(t => (
          <button
            key={t.key}
            className={`adSegBtn${tab === t.key ? " adSegBtnActive" : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
            {t.count !== "" && <span className="adSegCount">{t.count}</span>}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {loading && tab !== "affiliates" && tab !== "admins" ? (
        <div className="adTableCard"><div className="adEmpty">Loading users…</div></div>
      ) : (
        <>
          {tab === "all"        && <AllUsersTable  users={users} onUpdate={updateUser} onDelete={removeUser} />}
          {tab === "consumers"  && <ConsumersTable users={users} onUpdate={updateUser} />}
          {tab === "affiliates" && <AffiliatesTab />}
          {tab === "admins"     && <AdminTeamTab isSuperAdmin={isSuperAdmin} />}
        </>
      )}
    </div>
  );
}
