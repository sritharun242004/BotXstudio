import { useState, useRef, useCallback } from "react";
import { Upload, X, Sparkles, Download, RefreshCw } from "lucide-react";
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

// ── ImagePickCard ──────────────────────────────────────────────────────────────

function ImagePickCard({
  img,
  onPickGarment,
  onPickModel,
}: {
  img: SavedImageView;
  onPickGarment: (img: SavedImageView) => void;
  onPickModel:   (img: SavedImageView) => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="tryon-imgcard"
      style={{
        position: "relative", flexShrink: 0, width: 84, height: 100,
        borderRadius: 10, overflow: "hidden",
        border: `2px solid ${hovered ? "#8B5CF6" : "#E2E8F0"}`,
        cursor: "pointer", transition: "border-color .15s",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={img.title || img.fileName}
    >
      <img
        src={img.url}
        alt={img.title}
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
      {hovered && (
        <div style={{
          position: "absolute", inset: 0,
          background: "rgba(10,10,10,0.58)",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 6,
        }}>
          <button
            type="button"
            onClick={() => onPickGarment(img)}
            style={{
              fontSize: 9, fontWeight: 800, color: "#fff",
              background: "#7C3AED", border: "none",
              borderRadius: 5, padding: "4px 0", cursor: "pointer",
              width: 62, letterSpacing: "0.05em",
            }}
          >
            Garment
          </button>
          <button
            type="button"
            onClick={() => onPickModel(img)}
            style={{
              fontSize: 9, fontWeight: 800, color: "#fff",
              background: "#DB2777", border: "none",
              borderRadius: 5, padding: "4px 0", cursor: "pointer",
              width: 62, letterSpacing: "0.05em",
            }}
          >
            Model
          </button>
        </div>
      )}
    </div>
  );
}

// ── AssetPicker ────────────────────────────────────────────────────────────────

function AssetPicker({
  tabs,
  onPickGarment,
  onPickModel,
}: {
  tabs: { label: string; images: SavedImageView[] }[];
  onPickGarment: (img: SavedImageView) => void;
  onPickModel:   (img: SavedImageView) => void;
}) {
  const visible = tabs.filter(t => t.images.length > 0);
  const [active, setActive] = useState(0);
  if (!visible.length) return null;
  const safeActive = Math.min(active, visible.length - 1);

  return (
    <div style={{ marginTop: 16 }}>
      {/* Horizontal tab bar */}
      <div style={{
        display: "flex", gap: 0,
        borderBottom: "1.5px solid #E2E8F0",
        marginBottom: 14,
        overflowX: "auto",
        scrollbarWidth: "none",
      }}>
        {visible.map((tab, i) => (
          <button
            key={tab.label}
            type="button"
            onClick={() => setActive(i)}
            style={{
              flexShrink: 0,
              padding: "6px 14px",
              fontSize: 11,
              fontWeight: 700,
              border: "none",
              borderBottom: safeActive === i ? "2.5px solid #8B5CF6" : "2.5px solid transparent",
              background: "none",
              color: safeActive === i ? "#7C3AED" : "#94A3B8",
              cursor: "pointer",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              transition: "color .15s, border-color .15s",
              marginBottom: -1,
              whiteSpace: "nowrap",
            }}
          >
            {tab.label}
            <span style={{
              marginLeft: 5, fontSize: 9, fontWeight: 600,
              color: safeActive === i ? "#8B5CF6" : "#CBD5E1",
            }}>
              {tab.images.length}
            </span>
          </button>
        ))}
      </div>

      {/* Scrollable image strip */}
      <div style={{
        display: "flex", gap: 10,
        overflowX: "auto",
        padding: "4px 2px 10px",
        scrollbarWidth: "thin",
        scrollbarColor: "#CBD5E1 transparent",
        minHeight: 108,
      }}>
        {visible[safeActive].images.map(img => (
          <ImagePickCard
            key={img.id}
            img={img}
            onPickGarment={onPickGarment}
            onPickModel={onPickModel}
          />
        ))}
      </div>

      <p style={{ margin: "2px 0 0", fontSize: 10, color: "#94A3B8" }}>
        Hover an image →{" "}
        <span style={{ color: "#7C3AED", fontWeight: 700 }}>Garment</span>
        {" "}or{" "}
        <span style={{ color: "#DB2777", fontWeight: 700 }}>Model</span>
      </p>
    </div>
  );
}

// ── UploadSlot ─────────────────────────────────────────────────────────────────

function UploadSlot({
  label,
  hint,
  info,
  dataTour,
  slot,
  onFile,
  onClear,
  required,
}: {
  label: string;
  hint: string;
  info?: string;
  dataTour?: string;
  slot: ImageSlot | null;
  onFile: (file: File) => void;
  onClear: () => void;
  required?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  return (
    <div style={{ minWidth: 0 }} data-tour={dataTour}>
      <div style={{
        display: "flex", alignItems: "center", gap: 5,
        fontWeight: 700, fontSize: 11, color: "#1E293B",
        marginBottom: 8, letterSpacing: "0.05em", textTransform: "uppercase",
        flexWrap: "wrap",
      }}>
        <span style={{ whiteSpace: "nowrap" }}>{label}</span>
        {required && <span style={{ color: "#EF4444", fontSize: 14, lineHeight: 1 }}>*</span>}
        {info && <InfoTooltip text={info} position="bottom" />}
      </div>

      {slot ? (
        <div style={{
          borderRadius: 12, overflow: "hidden",
          border: "2px solid #1E293B", boxShadow: "3px 3px 0 #1E293B",
          background: "#F8FAFC",
        }}>
          <img
            src={slot.dataUrl}
            alt={label}
            style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover", display: "block" }}
          />
          <div style={{
            padding: "6px 8px", display: "flex", alignItems: "center",
            justifyContent: "space-between", borderTop: "1px solid #E2E8F0",
          }}>
            <span style={{
              fontSize: 9, color: "#64748B",
              overflow: "hidden", textOverflow: "ellipsis",
              whiteSpace: "nowrap", maxWidth: "80%",
            }}>
              {slot.fileName}
            </span>
            <button
              type="button"
              onClick={onClear}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8", padding: 2, display: "flex" }}
            >
              <X size={13} />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            const file = e.dataTransfer.files[0];
            if (file) onFile(file);
          }}
          style={{
            width: "100%", aspectRatio: "3/4",
            border: `2px dashed ${isDragging ? "#8B5CF6" : "#CBD5E1"}`,
            borderRadius: 12,
            background: isDragging ? "rgba(139,92,246,0.08)" : "#F8FAFC",
            cursor: "pointer",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 6,
            transition: "border-color .15s, background .15s",
            padding: "8px 4px",
          }}
          onMouseEnter={e => {
            if (!isDragging) {
              e.currentTarget.style.borderColor = "#8B5CF6";
              e.currentTarget.style.background = "rgba(139,92,246,0.04)";
            }
          }}
          onMouseLeave={e => {
            if (!isDragging) {
              e.currentTarget.style.borderColor = "#CBD5E1";
              e.currentTarget.style.background = "#F8FAFC";
            }
          }}
        >
          <Upload size={20} strokeWidth={1.5} color={isDragging ? "#8B5CF6" : "#94A3B8"} />
          <span style={{ fontSize: 11, fontWeight: 600, color: isDragging ? "#7C3AED" : "#64748B", textAlign: "center" }}>
            {isDragging ? "Drop to upload" : `Upload ${label}`}
          </span>
          {!isDragging && (
            <span style={{ fontSize: 9, color: "#94A3B8", textAlign: "center", padding: "0 4px", lineHeight: 1.4 }}>
              {hint}
            </span>
          )}
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

// ── Main component ─────────────────────────────────────────────────────────────

export default function TryOnTab({
  savedPrints,
  garmentAssets,
  modelAssets,
  savedMainImages,
  onSaveResult,
}: TryOnTabProps) {
  const [garment,   setGarment]   = useState<ImageSlot | null>(null);
  const [model,     setModel]     = useState<ImageSlot | null>(null);
  const [category,  setCategory]  = useState<Category>("upper_body");
  const [loading,   setLoading]   = useState(false);
  const [result,    setResult]    = useState<{ dataUrl: string; mimeType: string } | null>(null);
  const [error,     setError]     = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState<number | null>(null);
  const [saved,     setSaved]     = useState(false);

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
    } catch {
      setError("Failed to import image from library.");
    }
  }, []);

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

  const canGenerate = !!garment && !!model && !loading;

  const assetTabs = [
    { label: "Prints",    images: savedPrints },
    { label: "Garments",  images: garmentAssets },
    { label: "Models",    images: modelAssets },
    { label: "Generated", images: savedMainImages },
  ];

  return (
    <div>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px 0 60px" }}>

        {/* ── Large card ──────────────────────────────── */}
        <div
          className="tryon-card"
          style={{
            background: "#fff",
            borderRadius: 20,
            border: "2px solid #1E293B",
            boxShadow: "6px 6px 0 #1E293B",
            padding: "36px 36px 32px",
          }}
        >
          {/* ── Category selector ─────────────────────── */}
          <div
            className="tryon-category"
            style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 28, flexWrap: "wrap" }}
            data-tour="tryon-category"
          >
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
                  padding: "5px 14px", borderRadius: 9999, fontSize: 12, fontWeight: 700,
                  border: "2px solid",
                  borderColor: category === cat ? "#8B5CF6" : "#E2E8F0",
                  background: category === cat ? "rgba(139,92,246,0.1)" : "#fff",
                  color: category === cat ? "#7C3AED" : "#64748B",
                  cursor: "pointer", transition: "all .15s",
                  whiteSpace: "nowrap",
                }}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>

          {/* ── 3-column grid ─────────────────────────── */}
          <div className="tryon-grid">

            {/* Garment slot */}
            <UploadSlot
              label="Garment Photo"
              hint="Flat-lay, mannequin, or product shot"
              info="Upload a photo of the garment you want to try on. Works best with a flat-lay, mannequin shot, or clean product photo on a plain background."
              dataTour="tryon-garment"
              slot={garment}
              required
              onFile={f => handleFile("garment", f)}
              onClear={() => { setGarment(null); setResult(null); setSaved(false); }}
            />

            {/* Model slot */}
            <UploadSlot
              label="Model Photo"
              hint="Front-facing portrait, full or upper body"
              info="Upload a photo of the person who will wear the garment. Best results with a front-facing photo, clear lighting, and the full or upper body visible."
              dataTour="tryon-model"
              slot={model}
              required
              onFile={f => handleFile("model", f)}
              onClear={() => { setModel(null); setResult(null); setSaved(false); }}
            />

            {/* Result slot */}
            <div className="tryon-result-col" style={{ minWidth: 0 }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 6,
                fontWeight: 700, fontSize: 11, color: "#1E293B",
                marginBottom: 8, letterSpacing: "0.05em", textTransform: "uppercase",
              }}>
                Result
                <InfoTooltip
                  text="The AI-generated try-on image appears here. You can save it to your library or download it directly."
                  position="bottom"
                />
              </div>

              {result ? (
                <div style={{ borderRadius: 12, overflow: "hidden", border: "2px solid #1E293B", boxShadow: "3px 3px 0 #1E293B" }}>
                  <img
                    src={result.dataUrl}
                    alt="Try-on result"
                    style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover", display: "block" }}
                  />
                  <div style={{ padding: "8px 8px 6px", background: "#F8FAFC", borderTop: "1px solid #E2E8F0", display: "flex", gap: 6 }}>
                    <button
                      type="button"
                      onClick={downloadResult}
                      style={{
                        flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                        padding: "6px 0", borderRadius: 9999, fontSize: 11, fontWeight: 700,
                        border: "2px solid #1E293B", background: "#fff", color: "#1E293B",
                        cursor: "pointer", boxShadow: "2px 2px 0 #1E293B",
                        transition: "transform .15s, box-shadow .15s",
                      }}
                      onMouseEnter={e => { e.currentTarget.style.transform = "translate(-1px,-1px)"; e.currentTarget.style.boxShadow = "4px 4px 0 #1E293B"; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "2px 2px 0 #1E293B"; }}
                    >
                      <Download size={12} /> Save
                    </button>
                    <button
                      type="button"
                      onClick={saveToLibrary}
                      disabled={saved}
                      style={{
                        flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                        padding: "6px 0", borderRadius: 9999, fontSize: 11, fontWeight: 700,
                        border: `2px solid ${saved ? "#10B981" : "#8B5CF6"}`,
                        background: saved ? "rgba(16,185,129,0.08)" : "rgba(139,92,246,0.08)",
                        color: saved ? "#10B981" : "#7C3AED",
                        cursor: saved ? "default" : "pointer",
                        boxShadow: saved ? "2px 2px 0 #10B981" : "2px 2px 0 #8B5CF6",
                        transition: "transform .15s",
                      }}
                      onMouseEnter={e => { if (!saved) e.currentTarget.style.transform = "translate(-1px,-1px)"; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = ""; }}
                    >
                      {saved ? "✓ Saved" : "Library"}
                    </button>
                  </div>
                  <div style={{ padding: "3px 8px 6px", background: "#F8FAFC", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    {elapsedMs && (
                      <span style={{ fontSize: 9, color: "#94A3B8" }}>
                        {(elapsedMs / 1000).toFixed(1)}s
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={generate}
                      style={{
                        display: "flex", alignItems: "center", gap: 3,
                        background: "none", border: "none", cursor: "pointer",
                        fontSize: 10, fontWeight: 600, color: "#8B5CF6",
                      }}
                    >
                      <RefreshCw size={10} /> Retry
                    </button>
                  </div>
                </div>
              ) : loading ? (
                <div style={{
                  width: "100%", aspectRatio: "3/4", borderRadius: 12,
                  border: "2px dashed #CBD5E1", background: "#F8FAFC",
                  display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center", gap: 10,
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 9999,
                    border: "3px solid #E2E8F0", borderTopColor: "#8B5CF6",
                    animation: "spin 0.8s linear infinite",
                  }} />
                  <span style={{ fontSize: 11, color: "#64748B", fontWeight: 600 }}>Generating…</span>
                  <span style={{ fontSize: 9, color: "#94A3B8", textAlign: "center", padding: "0 12px" }}>
                    ~20–40s
                  </span>
                </div>
              ) : (
                <div style={{
                  width: "100%", aspectRatio: "3/4", borderRadius: 12,
                  border: "2px dashed #CBD5E1", background: "#F8FAFC",
                  display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center", gap: 8,
                }}>
                  <Sparkles size={24} strokeWidth={1.2} color="#CBD5E1" />
                  <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600, textAlign: "center", padding: "0 8px" }}>
                    Result appears here
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* ── Required note ─────────────────────────── */}
          {(!garment || !model) && (
            <p style={{ margin: "12px 0 0", fontSize: 10, color: "#94A3B8" }}>
              <span style={{ color: "#EF4444", fontWeight: 700 }}>*</span>{" "}
              {!garment && !model
                ? "Garment Photo and Model Photo are required."
                : !garment
                ? "Garment Photo is required."
                : "Model Photo is required."}
            </p>
          )}

          {/* ── Error ─────────────────────────────────── */}
          {error && (
            <div style={{
              marginTop: 14, padding: "10px 14px", borderRadius: 10,
              background: "rgba(239,68,68,0.06)", border: "2px solid rgba(239,68,68,0.3)",
              color: "#DC2626", fontSize: 12, fontWeight: 600,
            }}>
              {error}
            </div>
          )}

          {/* ── Generate button ───────────────────────── */}
          <div
            style={{ marginTop: 32, display: "flex", justifyContent: "center", alignItems: "center", gap: 10 }}
            data-tour="tryon-generate"
          >
            <InfoTooltip
              text="Upload both a garment photo and a model photo above, then click to generate. Takes ~20–40 seconds."
              position="top"
            />
            <button
              type="button"
              disabled={!canGenerate}
              onClick={generate}
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "12px 32px", borderRadius: 9999, fontSize: 14, fontWeight: 800,
                border: "2px solid #1E293B",
                background: canGenerate
                  ? "linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)"
                  : "#E2E8F0",
                color: canGenerate ? "#fff" : "#94A3B8",
                cursor: canGenerate ? "pointer" : "not-allowed",
                boxShadow: canGenerate ? "4px 4px 0 #1E293B" : "none",
                transition: "transform .2s cubic-bezier(.34,1.56,.64,1), box-shadow .2s",
              }}
              onMouseEnter={e => {
                if (canGenerate) {
                  e.currentTarget.style.transform = "translate(-2px,-2px)";
                  e.currentTarget.style.boxShadow = "6px 6px 0 #1E293B";
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = "";
                e.currentTarget.style.boxShadow = canGenerate ? "4px 4px 0 #1E293B" : "none";
              }}
            >
              <Sparkles size={15} />
              {loading ? "Generating…" : "Try On Garment"}
            </button>
          </div>
        </div>

        {/* ── Asset picker — outside the card ─────────── */}
        <div style={{ marginTop: 16 }}>
          <AssetPicker
            tabs={assetTabs}
            onPickGarment={img => importFromLibrary("garment", img)}
            onPickModel={img => importFromLibrary("model", img)}
          />
        </div>

      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── Desktop: 3-column grid ── */
        .tryon-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 28px;
          align-items: start;
        }
        .tryon-result-col {
          min-width: 0;
        }

        /* ── Mobile: stack layout ── */
        @media (max-width: 600px) {
          .tryon-card {
            padding: 16px 14px 16px !important;
            border-radius: 16px !important;
          }
          .tryon-grid {
            grid-template-columns: 1fr 1fr;
            gap: 12px;
          }
          .tryon-result-col {
            grid-column: 1 / -1;
          }
          .tryon-result-col > div:first-child {
            margin-bottom: 6px;
          }
          /* Result placeholder is shorter on mobile */
          .tryon-result-col [style*="3/4"] {
            aspect-ratio: 2/1 !important;
          }
        }

        /* ── Narrow mobile ── */
        @media (max-width: 380px) {
          .tryon-grid {
            grid-template-columns: 1fr 1fr;
            gap: 8px;
          }
        }
      `}</style>
    </div>
  );
}
