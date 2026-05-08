import { useEffect, useState } from "react";
import { adminApi } from "../api";
import LogoLoader from "../../components/LogoLoader";

const CONTROLS = [
  { key: "flash_enabled", label: "Flash Model", sub: "Gemini 2.0 Flash — fast, cost-effective" },
  { key: "pro_enabled", label: "Pro Model", sub: "Gemini 1.5 Pro — higher quality, slower" },
  { key: "feature_prints", label: "Prints Feature", sub: "Allow users to apply prints and recoloring" },
  { key: "feature_multiangle", label: "Multi-Angle Feature", sub: "Allow side/back/detail view generation" },
  { key: "feature_saree", label: "Saree Specialist", sub: "Dedicated pipeline for Indian traditional wear" },
];

export default function ImageControl() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<{ type: string; msg: string } | null>(null);

  useEffect(() => {
    adminApi.getImageControl()
      .then((d: any) => setSettings(d.settings))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    setAlert(null);
    try {
      await adminApi.updateImageControl(settings);
      setAlert({ type: "success", msg: "Settings saved successfully" });
    } catch (e: any) {
      setAlert({ type: "error", msg: e.message });
    } finally {
      setSaving(false);
    }
  }

  function toggle(key: string) {
    setSettings((p) => ({ ...p, [key]: p[key] === "true" ? "false" : "true" }));
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
          <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 600 }}>Feature Toggles</h3>
          {CONTROLS.map((c) => (
            <div key={c.key} className="adm-toggle-row">
              <div>
                <div className="adm-toggle-label">{c.label}</div>
                <div className="adm-toggle-sub">{c.sub}</div>
              </div>
              <label className="adm-toggle">
                <input type="checkbox" checked={settings[c.key] === "true"}
                  onChange={() => toggle(c.key)} />
                <span className="adm-toggle-slider" />
              </label>
            </div>
          ))}
        </div>

        <div className="adm-card">
          <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 600 }}>Generation Limits</h3>

          <div className="adm-form-group">
            <label className="adm-label">Default Model</label>
            <select className="adm-input" style={{ width: "100%" }}
              value={settings.default_model ?? ""}
              onChange={(e) => setVal("default_model", e.target.value)}>
              <option value="gemini-2.0-flash-preview-image-generation">Flash (gemini-2.0-flash)</option>
              <option value="gemini-1.5-pro">Pro (gemini-1.5-pro)</option>
            </select>
          </div>

          <div className="adm-form-group">
            <label className="adm-label">Max Generations Per Day (per user)</label>
            <input className="adm-input" style={{ width: "100%", boxSizing: "border-box" }}
              type="number" min={1} max={1000}
              value={settings.max_generations_per_day ?? "50"}
              onChange={(e) => setVal("max_generations_per_day", e.target.value)}
            />
          </div>

          <div className="adm-form-group">
            <label className="adm-label">Rate Limit (requests/minute per IP)</label>
            <input className="adm-input" style={{ width: "100%", boxSizing: "border-box" }}
              type="number" min={1} max={100}
              value={settings.rate_limit_per_minute ?? "10"}
              onChange={(e) => setVal("rate_limit_per_minute", e.target.value)}
            />
          </div>
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <button className="adm-btn adm-btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save All Settings"}
        </button>
      </div>
    </div>
  );
}
