import { useEffect, useState } from "react";
import { adminApi } from "../api";

export default function ApiKey() {
  const [data, setData] = useState<{ hasKey: boolean; maskedKey: string | null } | null>(null);
  const [newKey, setNewKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [alert, setAlert] = useState<{ type: string; msg: string } | null>(null);

  useEffect(() => {
    adminApi.getApiKey().then(setData).catch(console.error);
  }, []);

  async function handleSave() {
    if (!newKey.trim()) return;
    setSaving(true);
    setAlert(null);
    try {
      const res: any = await adminApi.setApiKey(newKey.trim());
      setData({ hasKey: true, maskedKey: res.maskedKey });
      setNewKey("");
      setAlert({ type: "success", msg: "API key updated successfully" });
    } catch (e: any) {
      setAlert({ type: "error", msg: e.message });
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    setAlert(null);
    try {
      const res: any = await adminApi.testApiKey();
      setAlert({ type: res.ok ? "success" : "error", msg: res.ok ? "API key is valid" : res.error });
    } catch (e: any) {
      setAlert({ type: "error", msg: e.message });
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="adm-page">
      <div className="adm-card" style={{ maxWidth: 600 }}>
        <h3 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 600 }}>Gemini API Key</h3>

        {alert && (
          <div className={`adm-alert adm-alert-${alert.type}`} onClick={() => setAlert(null)}>
            {alert.msg}
          </div>
        )}

        <div className="adm-form-group">
          <label className="adm-label">Current Key</label>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <input
              className="adm-input"
              style={{ flex: 1 }}
              value={data?.maskedKey ?? "No key configured"}
              readOnly
            />
            <button className="adm-btn adm-btn-ghost" onClick={handleTest} disabled={testing || !data?.hasKey}>
              {testing ? "Testing…" : "Test Key"}
            </button>
          </div>
          <div style={{ fontSize: 12, color: "var(--adm-text-muted)", marginTop: 6 }}>
            Key is stored securely on the server and never exposed in full.
          </div>
        </div>

        <div className="adm-form-group">
          <label className="adm-label">Update Key</label>
          <input
            className="adm-input"
            style={{ width: "100%", boxSizing: "border-box" }}
            type="password"
            placeholder="Paste new Gemini API key…"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
          />
        </div>

        <button className="adm-btn adm-btn-primary" onClick={handleSave} disabled={saving || !newKey.trim()}>
          {saving ? "Saving…" : "Save API Key"}
        </button>
      </div>

      <div className="adm-card" style={{ maxWidth: 600, marginTop: 16 }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 600 }}>Key Usage Notes</h3>
        <div style={{ fontSize: 13, color: "var(--adm-text-muted)", lineHeight: 1.7 }}>
          <p style={{ margin: "0 0 8px" }}>• The Gemini API key is used for all image generation requests.</p>
          <p style={{ margin: "0 0 8px" }}>• Updating the key here overrides the environment variable for new requests.</p>
          <p style={{ margin: 0 }}>• All admin key changes are logged in the system audit trail.</p>
        </div>
      </div>
    </div>
  );
}
