import { useEffect, useState } from "react";
import { adminApi } from "../api";
import LogoLoader from "../../components/LogoLoader";

export default function SystemLogs() {
  const [data, setData] = useState<{ errorLogs: any[]; adminLogs: any[]; total: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"errors" | "admin">("errors");

  useEffect(() => {
    adminApi.getSystemLogs()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="adm-loading"><LogoLoader size={80} color="var(--adm-text)" label="Loading logs…" /></div>;
  if (!data) return <div className="adm-empty">Failed to load logs.</div>;

  return (
    <div className="adm-page">
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <button className={`adm-btn ${tab === "errors" ? "adm-btn-primary" : "adm-btn-ghost"}`}
          onClick={() => setTab("errors")}>
          API Errors ({data.total})
        </button>
        <button className={`adm-btn ${tab === "admin" ? "adm-btn-primary" : "adm-btn-ghost"}`}
          onClick={() => setTab("admin")}>
          Admin Actions ({data.adminLogs.length})
        </button>
      </div>

      {tab === "errors" && (
        <div className="adm-table-wrap">
          <div className="adm-table-header">
            <h3>API Error Logs</h3>
          </div>
          <table className="adm-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Type</th>
                <th>Model</th>
                <th>Error</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {data.errorLogs.map((l) => (
                <tr key={l.id}>
                  <td><strong>{l.user?.email ?? "—"}</strong></td>
                  <td>{l.type}</td>
                  <td>{l.model?.includes("flash") ? "Flash" : "Pro"}</td>
                  <td style={{ color: "#f87171", fontSize: 12, maxWidth: 300 }}>{l.errorMessage ?? "Unknown error"}</td>
                  <td style={{ whiteSpace: "nowrap" }}>{new Date(l.createdAt).toLocaleString()}</td>
                </tr>
              ))}
              {data.errorLogs.length === 0 && (
                <tr><td colSpan={5}><div className="adm-empty">No errors logged</div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === "admin" && (
        <div className="adm-table-wrap">
          <div className="adm-table-header">
            <h3>Admin Action Log</h3>
          </div>
          <table className="adm-table">
            <thead>
              <tr>
                <th>Admin</th>
                <th>Action</th>
                <th>Target</th>
                <th>Details</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {data.adminLogs.map((l) => (
                <tr key={l.id}>
                  <td><strong>{l.admin?.email ?? "—"}</strong></td>
                  <td><span className="adm-badge adm-badge-accent">{l.action}</span></td>
                  <td style={{ fontSize: 11, color: "var(--adm-text-muted)" }}>{l.targetId?.slice(0, 8) ?? "—"}</td>
                  <td style={{ fontSize: 11, color: "var(--adm-text-muted)" }}>
                    {l.details ? JSON.stringify(l.details).slice(0, 80) : "—"}
                  </td>
                  <td style={{ whiteSpace: "nowrap" }}>{new Date(l.createdAt).toLocaleString()}</td>
                </tr>
              ))}
              {data.adminLogs.length === 0 && (
                <tr><td colSpan={5}><div className="adm-empty">No admin actions logged</div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
