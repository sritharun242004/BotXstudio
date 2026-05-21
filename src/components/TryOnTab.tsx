import { useState, useRef } from "react";
import { Upload, X, Sparkles, Download, RefreshCw } from "lucide-react";
import { apiPost } from "../lib/api";
import { fileToDataUrl, effectiveMimeType } from "../lib/utils";

type Category = "upper_body" | "lower_body" | "full_body";

const CATEGORY_LABELS: Record<Category, string> = {
  upper_body: "Upper Body",
  lower_body: "Lower Body",
  full_body:  "Full Body",
};

interface ImageSlot {
  dataUrl: string;
  mimeType: string;
  fileName: string;
}

function UploadSlot({
  label,
  hint,
  slot,
  onFile,
  onClear,
}: {
  label: string;
  hint: string;
  slot: ImageSlot | null;
  onFile: (file: File) => void;
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontWeight: 700, fontSize: 13, color: "#1E293B", marginBottom: 8, letterSpacing: "0.04em", textTransform: "uppercase" }}>
        {label}
      </div>
      {slot ? (
        <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", border: "2px solid #1E293B", boxShadow: "4px 4px 0 #1E293B", background: "#F8FAFC" }}>
          <img
            src={slot.dataUrl}
            alt={label}
            style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover", display: "block" }}
          />
          <button
            type="button"
            onClick={onClear}
            style={{
              position: "absolute", top: 8, right: 8,
              background: "#1E293B", color: "#fff",
              border: "none", borderRadius: 9999, width: 28, height: 28,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <X size={14} />
          </button>
          <div style={{ padding: "8px 12px", fontSize: 11, color: "#64748B", background: "#F8FAFC", borderTop: "1px solid #E2E8F0" }}>
            {slot.fileName}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          style={{
            width: "100%", aspectRatio: "3/4",
            border: "2px dashed #CBD5E1", borderRadius: 16,
            background: "#F8FAFC",
            cursor: "pointer",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 10,
            transition: "border-color .15s, background .15s",
            color: "#94A3B8",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = "#8B5CF6";
            e.currentTarget.style.background = "rgba(139,92,246,0.04)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = "#CBD5E1";
            e.currentTarget.style.background = "#F8FAFC";
          }}
        >
          <Upload size={28} strokeWidth={1.5} />
          <span style={{ fontSize: 13, fontWeight: 600, color: "#64748B" }}>Upload {label}</span>
          <span style={{ fontSize: 11, color: "#94A3B8", textAlign: "center", padding: "0 16px" }}>{hint}</span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}

export default function TryOnTab() {
  const [garment, setGarment] = useState<ImageSlot | null>(null);
  const [model, setModel]     = useState<ImageSlot | null>(null);
  const [category, setCategory] = useState<Category>("upper_body");
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState<{ dataUrl: string; mimeType: string } | null>(null);
  const [error, setError]       = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState<number | null>(null);

  async function handleFile(which: "garment" | "model", file: File) {
    const dataUrl = await fileToDataUrl(file);
    const mimeType = effectiveMimeType(file);
    const slot = { dataUrl, mimeType, fileName: file.name };
    if (which === "garment") { setGarment(slot); setResult(null); setError(null); }
    else                     { setModel(slot);   setResult(null); setError(null); }
  }

  async function generate() {
    if (!garment || !model) return;
    setLoading(true);
    setError(null);
    setResult(null);
    const start = Date.now();

    try {
      const toBase64 = (dataUrl: string) => dataUrl.split(",")[1] ?? "";

      const data = await apiPost<{ mimeType: string; imageBase64: string }>("/api/tryon", {
        garmentImage: { mimeType: garment.mimeType, data: toBase64(garment.dataUrl) },
        humanImage:   { mimeType: model.mimeType,   data: toBase64(model.dataUrl) },
        category,
      });

      setElapsedMs(Date.now() - start);
      setResult({ dataUrl: `data:${data.mimeType};base64,${data.imageBase64}`, mimeType: data.mimeType });
    } catch (err: any) {
      setError(err?.message || "Try-on failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function downloadResult() {
    if (!result) return;
    const ext = result.mimeType.includes("png") ? "png" : "jpg";
    const a = document.createElement("a");
    a.href = result.dataUrl;
    a.download = `tryon-result.${ext}`;
    a.click();
  }

  const canGenerate = !!garment && !!model && !loading;

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "8px 0 40px" }}>

      {/* ── Category selector ─────────────────────────── */}
      <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
        {(Object.keys(CATEGORY_LABELS) as Category[]).map(cat => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategory(cat)}
            style={{
              padding: "7px 18px", borderRadius: 9999, fontSize: 13, fontWeight: 600,
              border: "2px solid",
              borderColor: category === cat ? "#8B5CF6" : "#E2E8F0",
              background: category === cat ? "rgba(139,92,246,0.1)" : "#fff",
              color: category === cat ? "#7C3AED" : "#64748B",
              cursor: "pointer",
              transition: "all .15s",
            }}
          >
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24, alignItems: "start" }}>

        {/* ── Inputs ───────────────────────────────────── */}
        <UploadSlot
          label="Garment Photo"
          hint="Clear flat-lay or mannequin shot works best"
          slot={garment}
          onFile={f => handleFile("garment", f)}
          onClear={() => { setGarment(null); setResult(null); }}
        />

        <UploadSlot
          label="Model Photo"
          hint="Full-body or upper-body portrait, front-facing"
          slot={model}
          onFile={f => handleFile("model", f)}
          onClear={() => { setModel(null); setResult(null); }}
        />

        {/* ── Output ───────────────────────────────────── */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#1E293B", marginBottom: 8, letterSpacing: "0.04em", textTransform: "uppercase" }}>
            Result
          </div>

          {result ? (
            <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", border: "2px solid #1E293B", boxShadow: "4px 4px 0 #1E293B" }}>
              <img
                src={result.dataUrl}
                alt="Try-on result"
                style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover", display: "block" }}
              />
              <div style={{ padding: "10px 12px", background: "#F8FAFC", borderTop: "1px solid #E2E8F0", display: "flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={downloadResult}
                  style={{
                    flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    padding: "8px 0", borderRadius: 9999, fontSize: 13, fontWeight: 700,
                    border: "2px solid #1E293B", background: "#fff", color: "#1E293B", cursor: "pointer",
                    boxShadow: "3px 3px 0 #1E293B", transition: "transform .15s, box-shadow .15s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translate(-2px,-2px)"; e.currentTarget.style.boxShadow = "5px 5px 0 #1E293B"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "3px 3px 0 #1E293B"; }}
                >
                  <Download size={14} /> Download
                </button>
                <button
                  type="button"
                  onClick={generate}
                  style={{
                    flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    padding: "8px 0", borderRadius: 9999, fontSize: 13, fontWeight: 700,
                    border: "2px solid #8B5CF6", background: "rgba(139,92,246,0.08)", color: "#7C3AED", cursor: "pointer",
                    boxShadow: "3px 3px 0 #8B5CF6", transition: "transform .15s, box-shadow .15s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translate(-2px,-2px)"; e.currentTarget.style.boxShadow = "5px 5px 0 #8B5CF6"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "3px 3px 0 #8B5CF6"; }}
                >
                  <RefreshCw size={13} /> Retry
                </button>
              </div>
              {elapsedMs && (
                <div style={{ padding: "4px 12px 8px", fontSize: 11, color: "#94A3B8", background: "#F8FAFC" }}>
                  Generated in {(elapsedMs / 1000).toFixed(1)}s
                </div>
              )}
            </div>
          ) : loading ? (
            <div style={{
              width: "100%", aspectRatio: "3/4", borderRadius: 16,
              border: "2px dashed #CBD5E1", background: "#F8FAFC",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14,
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 9999,
                border: "3px solid #E2E8F0", borderTopColor: "#8B5CF6",
                animation: "spin 0.8s linear infinite",
              }} />
              <span style={{ fontSize: 13, color: "#64748B", fontWeight: 600 }}>Generating try-on…</span>
              <span style={{ fontSize: 11, color: "#94A3B8" }}>Powered by Gemini Flash · ~20–40s</span>
            </div>
          ) : (
            <div style={{
              width: "100%", aspectRatio: "3/4", borderRadius: 16,
              border: "2px dashed #CBD5E1", background: "#F8FAFC",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10,
              color: "#CBD5E1",
            }}>
              <Sparkles size={32} strokeWidth={1.2} />
              <span style={{ fontSize: 13, color: "#94A3B8", fontWeight: 600 }}>Result will appear here</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Error ─────────────────────────────────────── */}
      {error && (
        <div style={{
          marginTop: 20, padding: "14px 18px", borderRadius: 12,
          background: "rgba(239,68,68,0.06)", border: "2px solid rgba(239,68,68,0.3)",
          color: "#DC2626", fontSize: 13, fontWeight: 600,
        }}>
          {error}
        </div>
      )}

      {/* ── Generate button ───────────────────────────── */}
      <div style={{ marginTop: 28, display: "flex", justifyContent: "center" }}>
        <button
          type="button"
          disabled={!canGenerate}
          onClick={generate}
          style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            padding: "14px 40px", borderRadius: 9999, fontSize: 15, fontWeight: 800,
            border: "2px solid #1E293B",
            background: canGenerate
              ? "linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)"
              : "#E2E8F0",
            color: canGenerate ? "#fff" : "#94A3B8",
            cursor: canGenerate ? "pointer" : "not-allowed",
            boxShadow: canGenerate ? "4px 4px 0 #1E293B" : "none",
            transition: "transform .2s cubic-bezier(.34,1.56,.64,1), box-shadow .2s",
          }}
          onMouseEnter={e => { if (canGenerate) { e.currentTarget.style.transform = "translate(-2px,-2px)"; e.currentTarget.style.boxShadow = "6px 6px 0 #1E293B"; } }}
          onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = canGenerate ? "4px 4px 0 #1E293B" : "none"; }}
        >
          <Sparkles size={16} />
          {loading ? "Generating…" : "Try On Garment"}
        </button>
      </div>

      {/* spinner keyframes */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
