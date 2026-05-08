import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { adminApi } from "../api";
import LogoLoader from "../../components/LogoLoader";

const ALL_PERMISSIONS = [
  { key: "canViewUsers", label: "View Users" },
  { key: "canEditUsers", label: "Edit Users" },
  { key: "canViewCosts", label: "View Costs" },
  { key: "canManageTemplates", label: "Manage Templates" },
  { key: "canViewApiLogs", label: "View API Logs" },
  { key: "canManageApiKeys", label: "Manage API Keys" },
];

function roleBadge(role: string) {
  if (role === "SUPER_ADMIN") return <span className="adm-badge adm-badge-accent">Super Admin</span>;
  if (role === "ADMIN") return <span className="adm-badge adm-badge-warning">Admin</span>;
  return <span className="adm-badge adm-badge-muted">User</span>;
}

export default function Users({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPermModal, setShowPermModal] = useState<any>(null);
  const [newEmail, setNewEmail] = useState("");
  const [newPerms, setNewPerms] = useState<Record<string, boolean>>({});
  const [editPerms, setEditPerms] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<{ type: string; msg: string } | null>(null);

  const limit = 20;

  function load() {
    setLoading(true);
    adminApi.getUsers({ search, page: String(page), limit: String(limit) })
      .then((d: any) => { setUsers(d.users); setTotal(d.total); })
      .catch(() => setAlert({ type: "error", msg: "Failed to load users" }))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [page, search]);

  async function handleAddAdmin() {
    if (!newEmail) return;
    setSaving(true);
    try {
      await adminApi.addAdmin(newEmail, newPerms);
      setShowAddModal(false);
      setNewEmail("");
      setNewPerms({});
      setAlert({ type: "success", msg: "Admin added successfully" });
      load();
    } catch (e: any) {
      setAlert({ type: "error", msg: e.message });
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdatePerms() {
    if (!showPermModal) return;
    setSaving(true);
    try {
      await adminApi.updatePermissions(showPermModal.id, editPerms);
      setShowPermModal(null);
      setAlert({ type: "success", msg: "Permissions updated" });
      load();
    } catch (e: any) {
      setAlert({ type: "error", msg: e.message });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(user: any) {
    if (!confirm(`Delete ${user.email}? This cannot be undone.`)) return;
    try {
      await adminApi.deleteUser(user.id);
      setAlert({ type: "success", msg: "User deleted" });
      load();
    } catch (e: any) {
      setAlert({ type: "error", msg: e.message });
    }
  }

  return (
    <div className="adm-page">
      {alert && (
        <div className={`adm-alert adm-alert-${alert.type}`} onClick={() => setAlert(null)}>
          {alert.msg}
        </div>
      )}

      <div className="adm-table-wrap">
        <div className="adm-table-header">
          <h3>Users ({total})</h3>
          <div className="adm-input-row">
            <input
              className="adm-input"
              placeholder="Search by email or name…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              style={{ width: 240 }}
            />
            {isSuperAdmin && (
              <button className="adm-btn adm-btn-primary adm-btn-sm" onClick={() => setShowAddModal(true)}>
                + Add Admin
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="adm-loading">
            <LogoLoader size={80} color="var(--adm-text)" label="Loading users…" />
          </div>
        ) : (
          <table className="adm-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Images</th>
                <th>Storyboards</th>
                <th>API Calls</th>
                <th>Joined</th>
                {isSuperAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <strong>{u.name}</strong>
                    <div style={{ fontSize: 11, color: "var(--adm-text-muted)" }}>{u.email}</div>
                  </td>
                  <td>{roleBadge(u.role)}</td>
                  <td>{u._count.images}</td>
                  <td>{u._count.storyboards}</td>
                  <td>{u._count.apiLogs}</td>
                  <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                  {isSuperAdmin && (
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        {u.role === "ADMIN" && (
                          <button
                            className="adm-btn adm-btn-ghost adm-btn-sm"
                            onClick={() => { setShowPermModal(u); setEditPerms((u.permissions as Record<string, boolean>) ?? {}); }}
                          >
                            Perms
                          </button>
                        )}
                        {u.role !== "SUPER_ADMIN" && (
                          <button className="adm-btn adm-btn-danger adm-btn-sm" onClick={() => handleDelete(u)}>
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={7}><div className="adm-empty">No users found</div></td></tr>
              )}
            </tbody>
          </table>
        )}

        <div className="adm-pagination">
          <span>Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}</span>
          <div className="adm-pagination-btns">
            <button className="adm-btn adm-btn-ghost adm-btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</button>
            <button className="adm-btn adm-btn-ghost adm-btn-sm" disabled={page * limit >= total} onClick={() => setPage(p => p + 1)}>Next</button>
          </div>
        </div>
      </div>

      {/* Add Admin Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div className="adm-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={(e) => e.target === e.currentTarget && setShowAddModal(false)}>
            <motion.div className="adm-modal" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
              <h3>Add Admin User</h3>
              <div className="adm-form-group">
                <label className="adm-label">Email (@thebotcompany.in only)</label>
                <input className="adm-input" style={{ width: "100%", boxSizing: "border-box" }}
                  placeholder="name@thebotcompany.in"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
              </div>
              <div className="adm-form-group">
                <label className="adm-label">Permissions</label>
                <div className="adm-perm-grid">
                  {ALL_PERMISSIONS.map((p) => (
                    <label key={p.key} className="adm-perm-item">
                      <input type="checkbox" checked={!!newPerms[p.key]}
                        onChange={(e) => setNewPerms(prev => ({ ...prev, [p.key]: e.target.checked }))} />
                      {p.label}
                    </label>
                  ))}
                </div>
              </div>
              <div className="adm-modal-actions">
                <button className="adm-btn adm-btn-ghost" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button className="adm-btn adm-btn-primary" onClick={handleAddAdmin} disabled={saving}>
                  {saving ? "Saving…" : "Add Admin"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Permissions Modal */}
      <AnimatePresence>
        {showPermModal && (
          <motion.div className="adm-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={(e) => e.target === e.currentTarget && setShowPermModal(null)}>
            <motion.div className="adm-modal" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
              <h3>Edit Permissions — {showPermModal.email}</h3>
              <div className="adm-perm-grid">
                {ALL_PERMISSIONS.map((p) => (
                  <label key={p.key} className="adm-perm-item">
                    <input type="checkbox" checked={!!editPerms[p.key]}
                      onChange={(e) => setEditPerms(prev => ({ ...prev, [p.key]: e.target.checked }))} />
                    {p.label}
                  </label>
                ))}
              </div>
              <div className="adm-modal-actions">
                <button className="adm-btn adm-btn-ghost" onClick={() => setShowPermModal(null)}>Cancel</button>
                <button className="adm-btn adm-btn-primary" onClick={handleUpdatePerms} disabled={saving}>
                  {saving ? "Saving…" : "Save Permissions"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
