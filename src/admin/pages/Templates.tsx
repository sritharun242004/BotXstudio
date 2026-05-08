import { useCallback, useEffect, useRef, useState } from "react";
import LogoLoader from "../../components/LogoLoader";
import { adminApi } from "../api";
import { modelTemplates } from "../../lib/modelLibrary";
import { poseTemplates } from "../../lib/poseLibrary";
import { backgroundTemplates } from "../../lib/backgroundLibrary";

const CATEGORIES = [
  { key: "model",      label: "Model",      icon: "👤" },
  { key: "pose",       label: "Pose",       icon: "🧍" },
  { key: "background", label: "Background", icon: "🖼️" },
] as const;

type CategoryKey = typeof CATEGORIES[number]["key"];

// ─── Category-specific options ───────────────────────────────────────────────

const MODEL_SUBCATEGORIES = ["Men", "Women", "Kids", "Middle-Aged", "Diverse"];
const MODEL_ETHNICITY_LABELS = [
  "White / European",
  "Black / African American",
  "East Asian",
  "South Asian / Indian",
  "Hispanic",
  "Middle Eastern",
  "Native American",
  "Mixed Ethnicity",
  "Other",
];
const GARMENT_CATEGORIES = ["T-shirt", "Shirt", "Jacket", "Pant", "Hoodie", "Sweater", "Blazer", "Saree", "Other"];
const BG_CATEGORIES = ["Solids & Pastels", "Environments"];

// ─── Types ───────────────────────────────────────────────────────────────────

interface TemplateRow {
  id: string;
  title: string;
  category: string;
  s3Key: string;
  signedUrl: string | null;
  metadata?: Record<string, string> | null;
  createdAt: string;
  createdByUser?: { email: string };
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function Templates() {
  const [activeCategory, setActiveCategory] = useState<CategoryKey>("model");
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [title, setTitle] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [alert, setAlert] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Model metadata
  const [modelSubCat, setModelSubCat] = useState("Men");
  const [modelEthLabel, setModelEthLabel] = useState("White / European");
  const [modelEthKeyword, setModelEthKeyword] = useState("");

  // ── Pose metadata
  const [poseGarment, setPoseGarment] = useState("T-shirt");
  const [poseLabel, setPoseLabel] = useState("");
  const [poseKeyword, setPoseKeyword] = useState("");

  // ── Background metadata
  const [bgSubCat, setBgSubCat] = useState("Environments");
  const [bgThemePreset, setBgThemePreset] = useState("custom");
  const [bgThemeDetails, setBgThemeDetails] = useState("");

  // ── Soft-delete bucket: set of disabled static template IDs
  const [disabledIds, setDisabledIds] = useState<Set<string>>(new Set());

  function loadDisabled() {
    adminApi
      .getDisabledTemplates()
      .then((d: any) => setDisabledIds(new Set((d.disabledIds ?? []) as string[])))
      .catch(() => {});
  }

  function load() {
    setLoading(true);
    adminApi
      .getTemplates(activeCategory)
      .then((d: any) => setTemplates(d.templates ?? []))
      .catch(() => setTemplates([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); loadDisabled(); }, [activeCategory]);

  useEffect(() => {
    return () => { if (previewSrc) URL.revokeObjectURL(previewSrc); };
  }, [previewSrc]);

  function pickFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setAlert({ type: "error", msg: "Only image files are supported (PNG, JPG, WEBP)" });
      return;
    }
    if (previewSrc) URL.revokeObjectURL(previewSrc);
    setPendingFile(file);
    setPreviewSrc(URL.createObjectURL(file));
    if (!title.trim()) {
      setTitle(file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim());
    }
  }

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);
  const onDragLeave = useCallback(() => setDragOver(false), []);
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) pickFile(file);
  }, [title]);

  function clearFile() {
    if (previewSrc) URL.revokeObjectURL(previewSrc);
    setPendingFile(null);
    setPreviewSrc(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function metadataValidationError(): string | null {
    if (activeCategory === "model") {
      if (!modelEthKeyword.trim()) return "Ethnicity keyword is required (shown in LLM prompt)";
    } else if (activeCategory === "pose") {
      if (!poseLabel.trim()) return "Pose label is required (e.g. \"Front Poses\")";
      if (!poseKeyword.trim()) return "Pose keyword is required (injected into LLM)";
    } else if (activeCategory === "background") {
      if (!bgThemePreset.trim()) return "Theme preset is required (e.g. \"beach\", \"custom\")";
      if (!bgThemeDetails.trim()) return "Theme details is required (LLM background description)";
    }
    return null;
  }

  async function handleUpload() {
    if (!pendingFile) { setAlert({ type: "error", msg: "Please select an image" }); return; }
    if (!title.trim()) { setAlert({ type: "error", msg: "Please enter a title" }); return; }
    const metaErr = metadataValidationError();
    if (metaErr) { setAlert({ type: "error", msg: metaErr }); return; }

    setUploading(true);
    setProgress(15);
    setAlert(null);

    try {
      // Convert image to base64 (uploads through backend — no S3 CORS issues)
      const base64Data = await fileToBase64(pendingFile);
      setProgress(40);

      // Build category-specific metadata
      let metadata: Record<string, string> = {};
      if (activeCategory === "model") {
        metadata = {
          subCategory: modelSubCat,
          ethnicityLabel: modelEthLabel,
          ethnicityKeyword: modelEthKeyword.trim(),
        };
      } else if (activeCategory === "pose") {
        metadata = {
          garmentCategory: poseGarment,
          poseLabel: poseLabel.trim(),
          poseKeyword: poseKeyword.trim(),
        };
      } else if (activeCategory === "background") {
        metadata = {
          bgCategory: bgSubCat,
          themePreset: bgThemePreset.trim(),
          themeDetails: bgThemeDetails.trim(),
        };
      }

      setProgress(60);

      await adminApi.createTemplate({
        title: title.trim(),
        category: activeCategory,
        base64Data,
        filename: pendingFile.name,
        mimeType: pendingFile.type,
        metadata,
      });

      setProgress(100);
      setAlert({ type: "success", msg: `"${title.trim()}" uploaded successfully` });
      setTitle("");
      clearFile();
      setTimeout(() => { setProgress(0); load(); }, 400);
    } catch (e: any) {
      setAlert({ type: "error", msg: e.message ?? "Upload failed" });
      setProgress(0);
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete template "${name}"? This cannot be undone.`)) return;
    try {
      await adminApi.deleteTemplate(id);
      setAlert({ type: "success", msg: `"${name}" deleted` });
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    } catch (e: any) {
      setAlert({ type: "error", msg: e.message ?? "Delete failed" });
    }
  }

  const activeCat = CATEGORIES.find((c) => c.key === activeCategory)!;

  const BASE_URL = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");

  const staticTemplates =
    activeCategory === "model"      ? modelTemplates :
    activeCategory === "pose"       ? poseTemplates :
    activeCategory === "background" ? backgroundTemplates : [];

  return (
    <div className="adm-page">

      {alert && (
        <div
          className={`adm-alert adm-alert-${alert.type === "success" ? "success" : "error"}`}
          style={{ marginBottom: 20, cursor: "pointer", display: "flex", justifyContent: "space-between" }}
          onClick={() => setAlert(null)}
        >
          <span>{alert.msg}</span>
          <span style={{ opacity: 0.6 }}>✕</span>
        </div>
      )}

      {/* Category tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            className={`adm-btn ${activeCategory === c.key ? "adm-btn-primary" : "adm-btn-ghost"}`}
            style={{ fontSize: 14, padding: "9px 22px", gap: 8 }}
            onClick={() => { setActiveCategory(c.key); setAlert(null); }}
          >
            <span>{c.icon}</span>
            {c.label}
          </button>
        ))}
      </div>

      {/* ── Upload panel ── */}
      <div className="adm-card" style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 18, color: "var(--adm-text)" }}>
          Upload {activeCat.label} Template
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 24, alignItems: "start" }}>

          {/* Drop zone */}
          <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => !pendingFile && fileRef.current?.click()}
            style={{
              border: `2px dashed ${dragOver ? "var(--adm-accent)" : pendingFile ? "rgba(99,102,241,0.4)" : "var(--adm-border)"}`,
              borderRadius: "var(--adm-radius)",
              background: dragOver ? "var(--adm-accent-glow)" : pendingFile ? "rgba(99,102,241,0.05)" : "var(--adm-surface-2)",
              minHeight: 180,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              padding: 24,
              cursor: pendingFile ? "default" : "pointer",
              transition: "all 0.18s",
            }}
          >
            {pendingFile && previewSrc ? (
              <>
                <img
                  src={previewSrc}
                  alt="preview"
                  style={{ maxHeight: 140, maxWidth: "100%", borderRadius: 8, objectFit: "contain" }}
                />
                <div style={{ fontSize: 12, color: "var(--adm-text-dim)", textAlign: "center" }}>
                  <strong style={{ color: "var(--adm-text)" }}>{pendingFile.name}</strong>
                  <span style={{ display: "block", color: "var(--adm-text-muted)", marginTop: 2 }}>
                    {(pendingFile.size / 1024).toFixed(0)} KB · {pendingFile.type.split("/")[1].toUpperCase()}
                  </span>
                </div>
                <button
                  className="adm-btn adm-btn-ghost adm-btn-sm"
                  onClick={(e) => { e.stopPropagation(); clearFile(); }}
                  style={{ marginTop: 4 }}
                >
                  ✕ Remove
                </button>
              </>
            ) : (
              <>
                <div style={{ fontSize: 36, lineHeight: 1, filter: dragOver ? "none" : "grayscale(0.3)" }}>
                  {dragOver ? "📂" : "🖼️"}
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--adm-text-dim)" }}>
                  {dragOver ? "Drop it here" : "Drag & drop image"}
                </div>
                <div style={{ fontSize: 12, color: "var(--adm-text-muted)" }}>
                  or click to browse · PNG · JPG · WEBP
                </div>
              </>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              style={{ display: "none" }}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) pickFile(f); }}
            />
          </div>

          {/* Fields */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

            {/* Title */}
            <div>
              <label className="adm-label">Display Title *</label>
              <input
                className="adm-input"
                style={{ width: "100%", boxSizing: "border-box" }}
                placeholder={
                  activeCategory === "model" ? "e.g. Young Male" :
                  activeCategory === "pose"  ? "e.g. Front Standing" :
                  "e.g. Pastel Blue"
                }
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* ── Model-specific fields ── */}
            {activeCategory === "model" && (
              <>
                <div>
                  <label className="adm-label">Model Group *</label>
                  <select
                    className="adm-input"
                    style={{ width: "100%", boxSizing: "border-box" }}
                    value={modelSubCat}
                    onChange={(e) => setModelSubCat(e.target.value)}
                  >
                    {MODEL_SUBCATEGORIES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <div style={{ fontSize: 11, color: "var(--adm-text-muted)", marginTop: 4 }}>
                    Groups this model under Men / Women / Kids / etc. in the picker.
                  </div>
                </div>

                <div>
                  <label className="adm-label">Ethnicity Label *</label>
                  <select
                    className="adm-input"
                    style={{ width: "100%", boxSizing: "border-box" }}
                    value={modelEthLabel}
                    onChange={(e) => setModelEthLabel(e.target.value)}
                  >
                    {MODEL_ETHNICITY_LABELS.map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="adm-label">Ethnicity Keyword * <span style={{ fontWeight: 400, color: "var(--adm-text-muted)" }}>(LLM)</span></label>
                  <input
                    className="adm-input"
                    style={{ width: "100%", boxSizing: "border-box" }}
                    placeholder="e.g. Young adult male, White / European"
                    value={modelEthKeyword}
                    onChange={(e) => setModelEthKeyword(e.target.value)}
                  />
                  <div style={{ fontSize: 11, color: "var(--adm-text-muted)", marginTop: 4 }}>
                    Injected into image generation prompt.
                  </div>
                </div>
              </>
            )}

            {/* ── Pose-specific fields ── */}
            {activeCategory === "pose" && (
              <>
                <div>
                  <label className="adm-label">Garment Type *</label>
                  <select
                    className="adm-input"
                    style={{ width: "100%", boxSizing: "border-box" }}
                    value={poseGarment}
                    onChange={(e) => setPoseGarment(e.target.value)}
                  >
                    {GARMENT_CATEGORIES.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                  <div style={{ fontSize: 11, color: "var(--adm-text-muted)", marginTop: 4 }}>
                    Groups this pose under a garment section in the picker.
                  </div>
                </div>

                <div>
                  <label className="adm-label">Pose Label *</label>
                  <input
                    className="adm-input"
                    style={{ width: "100%", boxSizing: "border-box" }}
                    placeholder="e.g. Front Poses, Wall Lean, Side Angle"
                    value={poseLabel}
                    onChange={(e) => setPoseLabel(e.target.value)}
                  />
                  <div style={{ fontSize: 11, color: "var(--adm-text-muted)", marginTop: 4 }}>
                    Sub-group header within the garment section.
                  </div>
                </div>

                <div>
                  <label className="adm-label">Pose Keyword * <span style={{ fontWeight: 400, color: "var(--adm-text-muted)" }}>(LLM)</span></label>
                  <input
                    className="adm-input"
                    style={{ width: "100%", boxSizing: "border-box" }}
                    placeholder="e.g. front-facing pose, standing, arms relaxed"
                    value={poseKeyword}
                    onChange={(e) => setPoseKeyword(e.target.value)}
                  />
                  <div style={{ fontSize: 11, color: "var(--adm-text-muted)", marginTop: 4 }}>
                    Injected into image generation prompt.
                  </div>
                </div>
              </>
            )}

            {/* ── Background-specific fields ── */}
            {activeCategory === "background" && (
              <>
                <div>
                  <label className="adm-label">Background Category *</label>
                  <select
                    className="adm-input"
                    style={{ width: "100%", boxSizing: "border-box" }}
                    value={bgSubCat}
                    onChange={(e) => setBgSubCat(e.target.value)}
                  >
                    {BG_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="adm-label">Theme Preset * <span style={{ fontWeight: 400, color: "var(--adm-text-muted)" }}>(LLM)</span></label>
                  <input
                    className="adm-input"
                    style={{ width: "100%", boxSizing: "border-box" }}
                    placeholder="e.g. beach, studio, custom"
                    value={bgThemePreset}
                    onChange={(e) => setBgThemePreset(e.target.value)}
                  />
                  <div style={{ fontSize: 11, color: "var(--adm-text-muted)", marginTop: 4 }}>
                    Short preset name used to match theme setting.
                  </div>
                </div>

                <div>
                  <label className="adm-label">Theme Details * <span style={{ fontWeight: 400, color: "var(--adm-text-muted)" }}>(LLM)</span></label>
                  <textarea
                    className="adm-input"
                    style={{ width: "100%", boxSizing: "border-box", minHeight: 64, resize: "vertical", fontFamily: "inherit", fontSize: "inherit" }}
                    placeholder="e.g. sunny coastal beach, clean sand, gentle waves, daytime"
                    value={bgThemeDetails}
                    onChange={(e) => setBgThemeDetails(e.target.value)}
                  />
                  <div style={{ fontSize: 11, color: "var(--adm-text-muted)", marginTop: 4 }}>
                    Full background description injected into generation prompt.
                  </div>
                </div>
              </>
            )}

            {/* Progress bar */}
            {progress > 0 && (
              <div>
                <div style={{ height: 6, background: "var(--adm-border)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{
                    height: "100%",
                    width: `${progress}%`,
                    background: "linear-gradient(90deg, #6366f1, #818cf8)",
                    borderRadius: 3,
                    transition: "width 0.3s ease",
                  }} />
                </div>
                <div style={{ fontSize: 11, color: "var(--adm-text-muted)", marginTop: 4 }}>
                  {progress < 40 ? "Reading file…" : progress < 60 ? "Preparing…" : progress < 100 ? "Uploading…" : "Done!"}
                </div>
              </div>
            )}

            <button
              className="adm-btn adm-btn-primary"
              onClick={handleUpload}
              disabled={uploading || !pendingFile || !title.trim()}
              style={{
                width: "100%",
                justifyContent: "center",
                padding: "11px 0",
                fontSize: 14,
                fontWeight: 600,
                marginTop: "auto",
                opacity: !pendingFile || !title.trim() ? 0.5 : 1,
              }}
            >
              {uploading
                ? <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{
                      width: 14, height: 14,
                      border: "2px solid rgba(255,255,255,0.3)",
                      borderTopColor: "#fff",
                      borderRadius: "50%",
                      animation: "adm-spin 0.7s linear infinite",
                      display: "inline-block",
                    }} />
                    Uploading…
                  </span>
                : `Upload ${activeCat.label} Template`}
            </button>
          </div>
        </div>
      </div>

      {/* ── Uploaded (DB) template grid — original, untouched ── */}
      <div className="adm-card" style={{ padding: 0, overflow: "hidden", marginBottom: 28 }}>
        <div className="adm-table-header" style={{ padding: "16px 20px" }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
            {activeCat.icon} Uploaded {activeCat.label} Templates
            <span style={{ marginLeft: 8, color: "var(--adm-text-muted)", fontWeight: 400, fontSize: 13 }}>
              ({templates.length})
            </span>
          </h3>
          <button className="adm-btn adm-btn-ghost adm-btn-sm" onClick={load} disabled={loading}>
            {loading ? "Loading…" : "↺ Refresh"}
          </button>
        </div>

        {loading ? (
          <div className="adm-loading" style={{ padding: "60px 0" }}>
            <LogoLoader size={80} color="var(--adm-text)" label="Loading templates…" />
          </div>
        ) : templates.length === 0 ? (
          <div className="adm-empty" style={{ padding: "60px 0" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>{activeCat.icon}</div>
            <div style={{ fontWeight: 500, marginBottom: 4 }}>No uploaded {activeCat.label.toLowerCase()} templates yet</div>
            <div style={{ fontSize: 12, color: "var(--adm-text-muted)" }}>Upload one above to get started.</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 16, padding: 20 }}>
            {templates.map((t) => (
              <div key={t.id} style={{ background: "var(--adm-surface-2)", border: "1px solid var(--adm-border)", borderRadius: "var(--adm-radius-sm)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                <div style={{ aspectRatio: "1", background: "var(--adm-surface)", overflow: "hidden" }}>
                  {t.signedUrl ? (
                    <img src={t.signedUrl} alt={t.title} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, color: "var(--adm-text-muted)" }}>{activeCat.icon}</div>
                  )}
                </div>
                <div style={{ padding: "10px 12px 4px" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--adm-text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.title}</div>
                  {t.metadata && (
                    <div style={{ fontSize: 11, color: "var(--adm-text-muted)", marginTop: 2 }}>
                      {activeCategory === "model"      && `${t.metadata.subCategory} · ${t.metadata.ethnicityLabel}`}
                      {activeCategory === "pose"       && `${t.metadata.garmentCategory} · ${t.metadata.poseLabel}`}
                      {activeCategory === "background" && `${t.metadata.bgCategory} · ${t.metadata.themePreset}`}
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: "var(--adm-text-muted)", marginTop: 2 }}>
                    {new Date(t.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                  </div>
                </div>
                <div style={{ padding: "8px 12px 12px", marginTop: "auto" }}>
                  <button className="adm-btn adm-btn-danger adm-btn-sm" style={{ width: "100%", justifyContent: "center" }} onClick={() => handleDelete(t.id, t.title)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Live app (static) template gallery with soft-delete ── */}
      <div className="adm-card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="adm-table-header" style={{ padding: "16px 20px" }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
            {activeCat.icon} Built-in {activeCat.label} Templates
            <span style={{ marginLeft: 8, color: "var(--adm-text-muted)", fontWeight: 400, fontSize: 13 }}>
              ({staticTemplates.length} total · {disabledIds.size} hidden)
            </span>
          </h3>
          <span style={{ fontSize: 11, color: "var(--adm-text-muted)", background: "var(--adm-surface-2)", border: "1px solid var(--adm-border)", borderRadius: 6, padding: "3px 9px" }}>
            Bundled in code · delete hides from app
          </span>
        </div>

        {staticTemplates.length === 0 ? (
          <div className="adm-empty" style={{ padding: "48px 0" }}>
            <div style={{ fontWeight: 500, marginBottom: 4 }}>No built-in templates for this category</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 16, padding: 20 }}>
            {(staticTemplates as any[]).map((t) => {
              const hidden = disabledIds.has(t.id);
              const imgSrc = BASE_URL + t.url;
              const subLine =
                activeCategory === "model"      ? `${t.category} · ${t.ethnicityLabel}` :
                activeCategory === "pose"       ? `${t.category} · ${t.label}` :
                activeCategory === "background" ? `${t.category} · ${t.themePreset}` : "";
              return (
                <div key={t.id} style={{
                  background: "var(--adm-surface-2)",
                  border: `1px solid ${hidden ? "rgba(239,68,68,0.3)" : "var(--adm-border)"}`,
                  borderRadius: "var(--adm-radius-sm)",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  opacity: hidden ? 0.55 : 1,
                  transition: "opacity 0.2s, border-color 0.2s",
                }}>
                  <div style={{ aspectRatio: "1", background: "var(--adm-surface)", overflow: "hidden", position: "relative" }}>
                    <img
                      src={imgSrc}
                      alt={t.label ?? t.title}
                      loading="lazy"
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                    <span style={{
                      position: "absolute", top: 6, left: 6,
                      fontSize: 9, fontWeight: 700, letterSpacing: "0.06em",
                      background: hidden ? "rgba(239,68,68,0.85)" : "rgba(99,102,241,0.85)",
                      color: "#fff",
                      padding: "2px 6px", borderRadius: 4, textTransform: "uppercase" as const,
                    }}>
                      {hidden ? "Hidden" : "Built-in"}
                    </span>
                  </div>

                  <div style={{ padding: "10px 12px 4px", flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--adm-text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {t.label ?? t.title}
                    </div>
                    {subLine && (
                      <div style={{ fontSize: 11, color: "var(--adm-text-muted)", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {subLine}
                      </div>
                    )}
                  </div>

                  <div style={{ padding: "8px 12px 12px" }}>
                    {hidden ? (
                      <button
                        className="adm-btn adm-btn-ghost adm-btn-sm"
                        style={{ width: "100%", justifyContent: "center", color: "var(--adm-success, #4ade80)" }}
                        onClick={async () => {
                          try {
                            await adminApi.enableStaticTemplate(t.id);
                            setDisabledIds((prev) => { const next = new Set(prev); next.delete(t.id); return next; });
                            setAlert({ type: "success", msg: `"${t.label ?? t.title}" restored — visible in app again` });
                          } catch (e: any) {
                            setAlert({ type: "error", msg: e.message ?? "Restore failed" });
                          }
                        }}
                      >
                        ↩ Restore
                      </button>
                    ) : (
                      <button
                        className="adm-btn adm-btn-danger adm-btn-sm"
                        style={{ width: "100%", justifyContent: "center" }}
                        onClick={async () => {
                          if (!confirm(`Hide "${t.label ?? t.title}" from the app? It stays in code but users won't see it.`)) return;
                          try {
                            await adminApi.disableStaticTemplate(t.id, activeCategory);
                            setDisabledIds((prev) => new Set([...prev, t.id]));
                            setAlert({ type: "success", msg: `"${t.label ?? t.title}" hidden from app` });
                          } catch (e: any) {
                            setAlert({ type: "error", msg: e.message ?? "Hide failed" });
                          }
                        }}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
