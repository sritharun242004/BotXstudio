import { useEffect, useState } from "react";
import { adminApi } from "../api";

export default function Moderation() {
  const [images, setImages] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<{ type: string; msg: string } | null>(null);
  const limit = 30;

  function load() {
    setLoading(true);
    adminApi.getModerationImages({ page: String(page), limit: String(limit) })
      .then((d: any) => { setImages(d.images); setTotal(d.total); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [page]);

  async function handleRemove(id: string, title: string) {
    if (!confirm(`Remove image "${title}"? This permanently deletes it from S3.`)) return;
    try {
      await adminApi.removeModerationImage(id);
      setAlert({ type: "success", msg: "Image removed" });
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

      <div className="adm-table-wrap" style={{ marginBottom: 0 }}>
        <div className="adm-table-header">
          <h3>All Generated Images ({total})</h3>
          <div style={{ fontSize: 12, color: "var(--adm-text-muted)" }}>
            Review and remove inappropriate content
          </div>
        </div>

        {loading ? (
          <div className="adm-loading">Loading…</div>
        ) : (
          <>
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>User</th>
                  <th>Kind</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {images.map((img) => (
                  <tr key={img.id}>
                    <td><strong>{img.title}</strong></td>
                    <td>{img.user?.email ?? "—"}</td>
                    <td><span className="adm-badge adm-badge-muted">{img.kind}</span></td>
                    <td style={{ whiteSpace: "nowrap" }}>{new Date(img.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button className="adm-btn adm-btn-danger adm-btn-sm" onClick={() => handleRemove(img.id, img.title)}>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
                {images.length === 0 && (
                  <tr><td colSpan={5}><div className="adm-empty">No images found</div></td></tr>
                )}
              </tbody>
            </table>

            <div className="adm-pagination">
              <span>Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}</span>
              <div className="adm-pagination-btns">
                <button className="adm-btn adm-btn-ghost adm-btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</button>
                <button className="adm-btn adm-btn-ghost adm-btn-sm" disabled={page * limit >= total} onClick={() => setPage(p => p + 1)}>Next</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
