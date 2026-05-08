import { useEffect, useState } from "react";
import { adminApi } from "../api";
import LogoLoader from "../../components/LogoLoader";

export default function ApiUsage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ model: "", status: "", dateFrom: "", dateTo: "" });
  const [loading, setLoading] = useState(true);
  const limit = 50;

  function load() {
    setLoading(true);
    const params: Record<string, string> = { page: String(page), limit: String(limit) };
    if (filters.model) params.model = filters.model;
    if (filters.status) params.status = filters.status;
    if (filters.dateFrom) params.dateFrom = filters.dateFrom;
    if (filters.dateTo) params.dateTo = filters.dateTo;

    adminApi.getApiLogs(params)
      .then((d: any) => { setLogs(d.logs); setTotal(d.total); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [page, filters]);

  function filt(key: string, value: string) {
    setFilters((p) => ({ ...p, [key]: value }));
    setPage(1);
  }

  return (
    <div className="adm-page">
      <div className="adm-table-wrap">
        <div className="adm-table-header">
          <h3>API Logs ({total})</h3>
          <div className="adm-input-row">
            <select className="adm-input" value={filters.model} onChange={(e) => filt("model", e.target.value)}>
              <option value="">All Models</option>
              <option value="flash">Flash</option>
              <option value="pro">Pro</option>
            </select>
            <select className="adm-input" value={filters.status} onChange={(e) => filt("status", e.target.value)}>
              <option value="">All Status</option>
              <option value="success">Success</option>
              <option value="error">Error</option>
            </select>
            <input type="date" className="adm-input" value={filters.dateFrom} onChange={(e) => filt("dateFrom", e.target.value)} />
            <input type="date" className="adm-input" value={filters.dateTo} onChange={(e) => filt("dateTo", e.target.value)} />
          </div>
        </div>

        {loading ? (
          <div className="adm-loading"><LogoLoader size={80} color="var(--adm-text)" label="Loading…" /></div>
        ) : (
          <table className="adm-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Type</th>
                <th>Model</th>
                <th>Tokens</th>
                <th>Latency</th>
                <th>Status</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id}>
                  <td><strong>{l.user?.email ?? "—"}</strong></td>
                  <td>{l.type}</td>
                  <td>
                    <span className={`adm-badge ${l.model?.includes("flash") ? "adm-badge-success" : "adm-badge-accent"}`}>
                      {l.model?.includes("flash") ? "Flash" : "Pro"}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: 12 }}>{l.totalTokens.toLocaleString()}</span>
                    <span style={{ fontSize: 11, color: "var(--adm-text-muted)", display: "block" }}>
                      {l.promptTokens}↑ {l.outputTokens}↓
                    </span>
                  </td>
                  <td>{l.latencyMs.toLocaleString()}ms</td>
                  <td>
                    <span className={`adm-badge ${l.status === "success" ? "adm-badge-success" : "adm-badge-danger"}`}>
                      {l.status}
                    </span>
                    {l.errorMessage && (
                      <div style={{ fontSize: 11, color: "#f87171", marginTop: 2, maxWidth: 200 }}
                        title={l.errorMessage}>
                        {l.errorMessage.slice(0, 50)}…
                      </div>
                    )}
                  </td>
                  <td style={{ whiteSpace: "nowrap" }}>{new Date(l.createdAt).toLocaleString()}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr><td colSpan={7}><div className="adm-empty">No logs found</div></td></tr>
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
    </div>
  );
}
