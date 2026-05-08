import { useEffect, useState } from "react";
import { adminApi } from "../api";
import LogoLoader from "../../components/LogoLoader";

export default function Settings() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<{ type: string; msg: string } | null>(null);

  useEffect(() => {
    adminApi.getSettings()
      .then((d: any) => setSettings(d.settings))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    setAlert(null);
    try {
      await adminApi.updateSettings(settings);
      setAlert({ type: "success", msg: "Settings saved" });
    } catch (e: any) {
      setAlert({ type: "error", msg: e.message });
    } finally {
      setSaving(false);
    }
  }

  function setVal(key: string, value: string) {
    setSettings((p) => ({ ...p, [key]: value }));
  }

  if (loading) return <div className="adm-loading"><LogoLoader size={80} color="var(--adm-text)" label="Loading settings…" /></div>;

  return (
    <div className="adm-page">
      {alert && (
        <div className={`adm-alert adm-alert-${alert.type}`} onClick={() => setAlert(null)}>
          {alert.msg}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div className="adm-card">
          <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 600 }}>App Limits</h3>

          <div className="adm-form-group">
            <label className="adm-label">Max Generations Per Day (per user)</label>
            <input className="adm-input" style={{ width: "100%", boxSizing: "border-box" }}
              type="number" value={settings.max_generations_per_day ?? "50"}
              onChange={(e) => setVal("max_generations_per_day", e.target.value)} />
          </div>

          <div className="adm-form-group">
            <label className="adm-label">API Rate Limit (requests/minute per IP)</label>
            <input className="adm-input" style={{ width: "100%", boxSizing: "border-box" }}
              type="number" value={settings.rate_limit_per_minute ?? "10"}
              onChange={(e) => setVal("rate_limit_per_minute", e.target.value)} />
          </div>
        </div>

        <div className="adm-card">
          <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 600 }}>Feature Flags</h3>

          {[
            { key: "feature_prints", label: "Prints Feature" },
            { key: "feature_multiangle", label: "Multi-Angle Feature" },
            { key: "feature_saree", label: "Saree Specialist" },
            { key: "flash_enabled", label: "Flash Model" },
            { key: "pro_enabled", label: "Pro Model" },
          ].map((f) => (
            <div key={f.key} className="adm-toggle-row">
              <span className="adm-toggle-label">{f.label}</span>
              <label className="adm-toggle">
                <input type="checkbox" checked={settings[f.key] === "true"}
                  onChange={() => setVal(f.key, settings[f.key] === "true" ? "false" : "true")} />
                <span className="adm-toggle-slider" />
              </label>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <button className="adm-btn adm-btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save Settings"}
        </button>
      </div>

      <div className="adm-card" style={{ marginTop: 16 }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 600 }}>All Config Keys</h3>
        <table className="adm-table">
          <thead><tr><th>Key</th><th>Value</th></tr></thead>
          <tbody>
            {Object.entries(settings).map(([k, v]) => (
              <tr key={k}>
                <td style={{ fontFamily: "monospace", fontSize: 12 }}>{k}</td>
                <td>
                  <input className="adm-input adm-btn-sm" value={v}
                    onChange={(e) => setVal(k, e.target.value)} style={{ minWidth: 200 }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
