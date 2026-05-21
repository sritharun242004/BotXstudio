import { useState, useRef, useCallback } from "react";
import { Upload, X, Sparkles, Download, RefreshCw, BookImage, FolderOpen, Image } from "lucide-react";
import InfoTooltip from "./InfoTooltip";
import { apiPost } from "../lib/api";
import { fileToDataUrl, effectiveMimeType } from "../lib/utils";
import type { SavedImageRecord } from "../lib/indexeddb";

// ── Types ──────────────────────────────────────────────────────────────────────

type Category = "upper_body" | "lower_body" | "full_body";

interface ImageSlot {
  dataUrl: string;
  mimeType: string;
  fileName: string;
}

type SavedImageView = SavedImageRecord & { url: string };

export interface TryOnTabProps {
  savedPrints:     SavedImageView[];
  garmentAssets:   SavedImageView[];
  modelAssets:     SavedImageView[];
  savedMainImages: SavedImageView[];
  onSaveResult: (opts: { dataUrl: string; mimeType: string; fileName: string }) => Promise<void>;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<Category, string> = {
  upper_body: "Upper Body",
  lower_body: "Lower Body",
  full_body:  "Full Body",
};

// ── Helpers ────────────────────────────────────────────────────────────────────

async function urlToDataUrl(url: string, mimeType: string): Promise<string> {
  if (url.startsWith("data:")) return url;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Failed to fetch image (${resp.status})`);
  const blob = await resp.blob();
  return fileToDataUrl(new File([blob], "image", { type: blob.type || mimeType }));
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function ImportStrip({
  label,
  icon: Icon,
  images,
  onPick,
}: {
  label: string;
  icon: React.ElementType;
  images: SavedImageView[];
  onPick: (img: SavedImageView) => void;
}) {
  if (!images.length) return null;
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 5 }}>
        <Icon size={11} color="#8B5CF6" />
        <span style={{ fontSize: 10, fontWeight: 700, color: "#8B5CF6", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {label}
        </span>
      </div>
      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4, scrollbarWidth: "thin" }}>
        {images.map(img => (
          <button
            key={img.id}
            type="button"
            onClick={() => onPick(img)}
            title={img.title || img.fileName}
            style={{
              flexShrink: 0, width: 52, height: 64, borderRadius: 8,
              border: "2px solid #E2E8F0", overflow: "hidden", padding: 0, cursor: "pointer",
              background: "#F8FAFC", transition: "border-color .15s, transform .15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#8B5CF6"; e.currentTarget.style.transform = "scale(1.06)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#E2E8F0"; e.currentTarget.style.transform = ""; }}
          >
            <img
              src={img.url}
              alt={img.title}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

function UploadSlot({
  label,
  hint,
  info,
  dataTour,
  slot,
  onFile,
  onClear,
  importSections,
}: {
  label: string;
  hint: string;
  info?: string;
  dataTour?: string;
  slot: ImageSlot | null;
  onFile: (file: File) => void;
  onClear: () => void;
  importSections: React.ReactNode;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div style={{ minWidth: 0 }} data-tour={dataTour}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700, fontSize: 12, color: "#1E293B", marginBottom: 8, letterSpacing: "0.06em", textTransform: "uppercase" }}>
        {label}
        {info && <InfoTooltip text={info} position="bottom" />}
      </div>

      {slot ? (
        <div style={{ borderRadius: 14, overflow: "hidden", border: "2px solid #1E293B", boxShadow: "4px 4px 0 #1E293B", background: "#F8FAFC" }}>
          <img
            src={slot.dataUrl}
            alt={label}
            style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover", display: "block" }}
          />
          <div style={{ padding: "8px 10px", display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid #E2E8F0" }}>
            <span style={{ fontSize: 10, color: "#64748B", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "80%" }}>
              {slot.fileName}
            </span>
            <button
              type="button"
              onClick={onClear}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8", padding: 2, display: "flex" }}
            >
              <X size={14} />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          style={{
            width: "100%", aspectRatio: "3/4", border: "2px dashed #CBD5E1", borderRadius: 14,
            background: "#F8FAFC", cursor: "pointer",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8,
            transition: "border-color .15s, background .15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "#8B5CF6"; e.currentTarget.style.background = "rgba(139,92,246,0.04)"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "#CBD5E1"; e.currentTarget.style.background = "#F8FAFC"; }}
        >
          <Upload size={24} strokeWidth={1.5} color="#94A3B8" />
          <span style={{ fontSize: 12, fontWeight: 600, color: "#64748B" }}>Upload {label}</span>
          <span style={{ fontSize: 10, color: "#94A3B8", textAlign: "center", padding: "0 12px" }}>{hint}</span>
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

      {/* Import strips always visible below the slot */}
      <div style={{ marginTop: 10 }}>
        {importSections}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function TryOnTab({
  savedPrints,
  garmentAssets,
  modelAssets,
  savedMainImages,
  onSaveResult,
}: TryOnTabProps) {
  const [garment, setGarment] = useState<ImageSlot | null>(null);
  const [model,   setModel]   = useState<ImageSlot | null>(null);
  const [category, setCategory] = useState<Category>("upper_body");
  const [loading,  setLoading]  = useState(false);
  const [result,   setResult]   = useState<{ dataUrl: string; mimeType: string } | null>(null);
  const [error,    setError]    = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState<number | null>(null);
  const [saved,    setSaved]    = useState(false);

  // ── File / import handlers ──────────────────────────────────────────────────

  async function handleFile(which: "garment" | "model", file: File) {
    const dataUrl  = await fileToDataUrl(file);
    const mimeType = effectiveMimeType(file);
    const slot = { dataUrl, mimeType, fileName: file.name };
    if (which === "garment") { setGarment(slot); setResult(null); setError(null); setSaved(false); }
    else                     { setModel(slot);   setResult(null); setError(null); setSaved(false); }
  }

  const importFromLibrary = useCallback(async (which: "garment" | "model", img: SavedImageView) => {
    try {
      const dataUrl  = await urlToDataUrl(img.url, img.mimeType);
      const mimeType = img.mimeType || "image/jpeg";
      const slot = { dataUrl, mimeType, fileName: img.title || img.fileName || "image" };
      if (which === "garment") { setGarment(slot); setResult(null); setError(null); setSaved(false); }
      else                     { setModel(slot);   setResult(null); setError(null); setSaved(false); }
    } catch (err) {
      setError("Failed to import image from library.");
    }
  }, []);

  // ── Generation ──────────────────────────────────────────────────────────────

  async function generate() {
    if (!garment || !model) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setSaved(false);
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
    a.download = `tryon-${Date.now()}.${ext}`;
    a.click();
  }

  async function saveToLibrary() {
    if (!result || saved) return;
    const ext = result.mimeType.includes("png") ? "png" : "jpg";
    await onSaveResult({
      dataUrl:  result.dataUrl,
      mimeType: result.mimeType,
      fileName: `tryon-${Date.now()}.${ext}`,
    });
    setSaved(true);
  }

  // ── Derived ─────────────────────────────────────────────────────────────────

  const canGenerate = !!garment && !!model && !loading;

  return (
    <div style={{
      height: "calc(100vh - 120px)",
      overflowY: "auto",
      overflowX: "hidden",
      paddingRight: 4,
      scrollbarWidth: "thin",
    }}>
      <div style={{ maxWidth: 980, margin: "0 auto", padding: "4px 0 48px" }}>

        {/* ── Category selector ───────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }} data-tour="tryon-category">
          <InfoTooltip
            text="Select which part of the body the garment covers. This helps the AI place it accurately on the model."
            position="right"
          />
          {(Object.keys(CATEGORY_LABELS) as Category[]).map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              style={{
                padding: "6px 16px", borderRadius: 9999, fontSize: 12, fontWeight: 700,
                border: "2px solid",
                borderColor: category === cat ? "#8B5CF6" : "#E2E8F0",
                background: category === cat ? "rgba(139,92,246,0.1)" : "#fff",
                color: category === cat ? "#7C3AED" : "#64748B",
                cursor: "pointer", transition: "all .15s",
              }}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        {/* ── 3-column grid ───────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, alignItems: "start" }}>

          {/* Garment slot */}
          <UploadSlot
            label="Garment Photo"
            hint="Flat-lay, mannequin, or product shot"
            info="Upload a photo of the garment you want to try on. Works best with a flat-lay, mannequin shot, or clean product photo on a plain background."
            dataTour="tryon-garment"
            slot={garment}
            onFile={f => handleFile("garment", f)}
            onClear={() => { setGarment(null); setResult(null); setSaved(false); }}
            importSections={
              <>
                <ImportStrip
                  label="From Prints"
                  icon={BookImage}
                  images={savedPrints}
                  onPick={img => importFromLibrary("garment", img)}
                />
                <ImportStrip
                  label="From Assets"
                  icon={FolderOpen}
                  images={garmentAssets}
                  onPick={img => importFromLibrary("garment", img)}
                />
                <ImportStrip
                  label="From Generated"
                  icon={Image}
                  images={savedMainImages}
                  onPick={img => importFromLibrary("garment", img)}
                />
              </>
            }
          />

          {/* Model slot */}
          <UploadSlot
            label="Model Photo"
            hint="Front-facing portrait, full or upper body"
            info="Upload a photo of the person who will wear the garment. Best results with a front-facing photo, clear lighting, and the full or upper body visible."
            dataTour="tryon-model"
            slot={model}
            onFile={f => handleFile("model", f)}
            onClear={() => { setModel(null); setResult(null); setSaved(false); }}
            importSections={
              <>
                <ImportStrip
                  label="From Assets"
                  icon={FolderOpen}
                  images={modelAssets}
                  onPick={img => importFromLibrary("model", img)}
                />
                <ImportStrip
                  label="From Generated"
                  icon={Image}
                  images={savedMainImages}
                  onPick={img => importFromLibrary("model", img)}
                />
              </>
            }
          />

          {/* Result slot */}
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700, fontSize: 12, color: "#1E293B", marginBottom: 8, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Result
              <InfoTooltip text="The AI-generated try-on image appears here. You can save it to your library or download it directly." position="bottom" />
            </div>

            {result ? (
              <div style={{ borderRadius: 14, overflow: "hidden", border: "2px solid #1E293B", boxShadow: "4px 4px 0 #1E293B" }}>
                <img
                  src={result.dataUrl}
                  alt="Try-on result"
                  style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover", display: "block" }}
                />
                <div style={{ padding: "10px 10px 8px", background: "#F8FAFC", borderTop: "1px solid #E2E8F0", display: "flex", gap: 6 }}>
                  <button
                    type="button"
                    onClick={downloadResult}
                    style={{
                      flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                      padding: "7px 0", borderRadius: 9999, fontSize: 12, fontWeight: 700,
                      border: "2px solid #1E293B", background: "#fff", color: "#1E293B", cursor: "pointer",
                      boxShadow: "3px 3px 0 #1E293B", transition: "transform .15s, box-shadow .15s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = "translate(-2px,-2px)"; e.currentTarget.style.boxShadow = "5px 5px 0 #1E293B"; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "3px 3px 0 #1E293B"; }}
                  >
                    <Download size={13} /> Save
                  </button>
                  <button
                    type="button"
                    onClick={saveToLibrary}
                    disabled={saved}
                    style={{
                      flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                      padding: "7px 0", borderRadius: 9999, fontSize: 12, fontWeight: 700,
                      border: `2px solid ${saved ? "#10B981" : "#8B5CF6"}`,
                      background: saved ? "rgba(16,185,129,0.08)" : "rgba(139,92,246,0.08)",
                      color: saved ? "#10B981" : "#7C3AED",
                      cursor: saved ? "default" : "pointer",
                      boxShadow: saved ? "3px 3px 0 #10B981" : "3px 3px 0 #8B5CF6",
                      transition: "transform .15s, box-shadow .15s",
                    }}
                    onMouseEnter={e => { if (!saved) { e.currentTarget.style.transform = "translate(-2px,-2px)"; } }}
                    onMouseLeave={e => { e.currentTarget.style.transform = ""; }}
                  >
                    {saved ? "✓ Saved" : "Add to Library"}
                  </button>
                </div>
                <div style={{ padding: "4px 10px 8px", background: "#F8FAFC", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  {elapsedMs && (
                    <span style={{ fontSize: 10, color: "#94A3B8" }}>
                      Generated in {(elapsedMs / 1000).toFixed(1)}s
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={generate}
                    style={{
                      display: "flex", alignItems: "center", gap: 4,
                      background: "none", border: "none", cursor: "pointer",
                      fontSize: 11, fontWeight: 600, color: "#8B5CF6",
                    }}
                  >
                    <RefreshCw size={11} /> Retry
                  </button>
                </div>
              </div>
            ) : loading ? (
              <div style={{
                width: "100%", aspectRatio: "3/4", borderRadius: 14,
                border: "2px dashed #CBD5E1", background: "#F8FAFC",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 9999,
                  border: "3px solid #E2E8F0", borderTopColor: "#8B5CF6",
                  animation: "spin 0.8s linear infinite",
                }} />
                <span style={{ fontSize: 12, color: "#64748B", fontWeight: 600 }}>Generating…</span>
                <span style={{ fontSize: 10, color: "#94A3B8", textAlign: "center", padding: "0 16px" }}>
                  Gemini Flash · ~20–40s
                </span>
              </div>
            ) : (
              <div style={{
                width: "100%", aspectRatio: "3/4", borderRadius: 14,
                border: "2px dashed #CBD5E1", background: "#F8FAFC",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8,
              }}>
                <Sparkles size={28} strokeWidth={1.2} color="#CBD5E1" />
                <span style={{ fontSize: 12, color: "#94A3B8", fontWeight: 600 }}>Result appears here</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Error ───────────────────────────────────── */}
        {error && (
          <div style={{
            marginTop: 16, padding: "12px 16px", borderRadius: 10,
            background: "rgba(239,68,68,0.06)", border: "2px solid rgba(239,68,68,0.3)",
            color: "#DC2626", fontSize: 13, fontWeight: 600,
          }}>
            {error}
          </div>
        )}

        {/* ── Generate button ──────────────────────────── */}
        <div style={{ marginTop: 24, display: "flex", justifyContent: "center", alignItems: "center", gap: 10 }} data-tour="tryon-generate">
          <InfoTooltip
            text="Upload both a garment photo and a model photo above, then click to generate. The AI will dress the model in your garment. Takes ~20–40 seconds."
            position="top"
          />
          <button
            type="button"
            disabled={!canGenerate}
            onClick={generate}
            style={{
              display: "inline-flex", alignItems: "center", gap: 10,
              padding: "13px 40px", borderRadius: 9999, fontSize: 15, fontWeight: 800,
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

      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
