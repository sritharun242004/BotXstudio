import { useState, useRef, useMemo, useEffect } from "react";
import FieldLabel from "./FieldLabel";
import type { StoryboardConfig } from "../lib/storyboards";
import { normalizeHexColor } from "../lib/utils";

type GarmentConfig = {
  id: string;
  name: string;
  description: string;
  type: "standard" | "full_cloth";
};

const COLOR_SELECTOR_GARMENTS = ["T-shirt", "Hoodie", "Sweater", "Jacket"] as const;

const PRESET_COLORS: { label: string; hex: string }[] = [
  { label: "White",  hex: "#FFFFFF" },
  { label: "Black",  hex: "#1A1A1A" },
  { label: "Red",    hex: "#C62828" },
  { label: "Blue",   hex: "#1565C0" },
  { label: "Green",  hex: "#2E7D32" },
  { label: "Beige",  hex: "#F0E6D3" },
  { label: "Grey",   hex: "#757575" },
  { label: "Navy",   hex: "#0D1B4B" },
];

const ALL_GARMENTS: GarmentConfig[] = [
  { id: "Tshirt", name: "T-shirt", description: "Casual short-sleeve tee", type: "standard" },
  { id: "Shirt", name: "Shirt", description: "Button-down shirt", type: "standard" },
  { id: "Pant", name: "Pant", description: "Formal or casual trousers", type: "standard" },
  { id: "Jeans", name: "Jeans", description: "Denim pants", type: "standard" },

  { id: "Jacket", name: "Jacket", description: "Outerwear jacket", type: "standard" },
  { id: "Hoodie", name: "Hoodie", description: "Hooded sweatshirt", type: "standard" },
  { id: "Sweater", name: "Sweater", description: "Knitted sweater", type: "standard" },
  { id: "Blazer", name: "Blazer", description: "Formal blazer jacket", type: "standard" },
  { id: "Saree", name: "Saree", description: "Traditional long drape", type: "full_cloth" },
];

// Built-in white garment template images stored in /public/garment-templates/
// Keys match garment names exactly. 1=front, 2=back, 3=side
const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const GARMENT_TEMPLATES: Record<string, { front?: string; back?: string; side?: string }> = {
  "T-shirt": { front: `${BASE}/garment-templates/T1.png`, back: `${BASE}/garment-templates/T2.png`, side: `${BASE}/garment-templates/T3.png` },
  "Shirt":   { front: `${BASE}/garment-templates/S1.png`, back: `${BASE}/garment-templates/S2.png`, side: `${BASE}/garment-templates/S3.png` },
  "Pant":    { front: `${BASE}/garment-templates/P1.png`, back: `${BASE}/garment-templates/P2.png`, side: `${BASE}/garment-templates/P3.png` },
  "Jeans":   { front: `${BASE}/garment-templates/J1.png`, back: `${BASE}/garment-templates/J2.png`, side: `${BASE}/garment-templates/J3.png` },
  "Jacket":  { front: `${BASE}/garment-templates/JK1.png`, back: `${BASE}/garment-templates/JK2.png`, side: `${BASE}/garment-templates/JK3.png` },
  "Hoodie":  { front: `${BASE}/garment-templates/H1.png`, back: `${BASE}/garment-templates/H2.png`, side: `${BASE}/garment-templates/H3.png` },
  "Sweater": { front: `${BASE}/garment-templates/SW1.png`, back: `${BASE}/garment-templates/SW2.png`, side: `${BASE}/garment-templates/SW3.png` },
  "Blazer":  { front: `${BASE}/garment-templates/B1.png`, back: `${BASE}/garment-templates/B2.png`, side: `${BASE}/garment-templates/B3.png` },
};

type PrintsRuntimeLite = {
  baseGarmentFrontDataUrl: string | null;
  baseGarmentBackDataUrl: string | null;
  baseGarmentSideDataUrl: string | null;
  printDesignFrontDataUrl: string | null;
  printDesignBackDataUrl: string | null;
  printDesignSideDataUrl: string | null;
  outputFrontDataUrl: string | null;
  outputFrontMimeType: string | null;
  outputBackDataUrl: string | null;
  outputBackMimeType: string | null;
  outputSideDataUrl: string | null;
  outputSideMimeType: string | null;
  generating: boolean;
  error: string | null;
};

type RuntimeLite = { prints: PrintsRuntimeLite };

interface PrintsTabProps {
  storyboardTitle: string;
  config: StoryboardConfig;
  onConfigUpdate: (updates: Partial<StoryboardConfig>) => void;
  runtime: RuntimeLite;
  isBusy: boolean;
  mimeToExtension: (mimeType: string | null) => string;
  onBaseGarmentFrontFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBaseGarmentBackFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBaseGarmentSideFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onLoadBuiltInFront: (url: string) => void;
  onLoadBuiltInBack: (url: string) => void;
  onLoadBuiltInSide: (url: string) => void;
  onPrintDesignFrontFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPrintDesignBackFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPrintDesignSideFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeBaseGarmentFront: () => void;
  removeBaseGarmentBack: () => void;
  removeBaseGarmentSide: () => void;
  removePrintDesignFront: () => void;
  removePrintDesignBack: () => void;
  removePrintDesignSide: () => void;
  printElapsedMs?: number;
  onGenerate: () => void;
  onRetry: (comment: string) => void;
  onOpenImage: (src: string, title: string, alt?: string, gallery?: Array<{ src: string; title: string; alt?: string }>) => void;
}

export default function PrintsTab({
  config,
  onConfigUpdate,
  runtime,
  isBusy,
  mimeToExtension,
  onBaseGarmentFrontFileChange,
  onBaseGarmentBackFileChange,
  onBaseGarmentSideFileChange,
  onLoadBuiltInFront,
  onLoadBuiltInBack,
  onLoadBuiltInSide,
  onPrintDesignFrontFileChange,
  onPrintDesignBackFileChange,
  onPrintDesignSideFileChange,
  removeBaseGarmentFront,
  removeBaseGarmentBack,
  removeBaseGarmentSide,
  removePrintDesignFront,
  removePrintDesignBack,
  removePrintDesignSide,
  printElapsedMs = 0,
  onGenerate,
  onRetry,
  onOpenImage,
}: PrintsTabProps) {
  const [retryOpen, setRetryOpen] = useState(false);
  const [retryComments, setRetryComments] = useState("");
  const [showCustomUpload, setShowCustomUpload] = useState(false);

  const frontFileRef = useRef<HTMLInputElement>(null);
  const backFileRef = useRef<HTMLInputElement>(null);
  const sideFileRef = useRef<HTMLInputElement>(null);

  const timerText = useMemo(() => {
    const s = Math.floor(printElapsedMs / 1000);
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    const rs = s % 60;
    return `${m}m ${rs}s`;
  }, [printElapsedMs]);

  const colorPickerValue = useMemo(() => normalizeHexColor(config.printColorHex) || "#000000", [config.printColorHex]);
  const isValidColorHex = useMemo(() => Boolean(normalizeHexColor(config.printColorHex)), [config.printColorHex]);
  const hasPrintedOutputs = Boolean(
    runtime.prints.outputFrontDataUrl || runtime.prints.outputBackDataUrl,
  );
  const primaryPrintedOutput =
    runtime.prints.outputFrontDataUrl ||
    runtime.prints.outputBackDataUrl ||
    "";

  function handleColorPickerInput(e: React.ChangeEvent<HTMLInputElement>) {
    const value = (e.target.value || "").trim();
    onConfigUpdate({ printColorHex: normalizeHexColor(value) || value });
  }

  function handleColorHexBlur() {
    const normalized = normalizeHexColor(config.printColorHex);
    if (normalized) onConfigUpdate({ printColorHex: normalized });
  }

  function handleRetry() {
    onRetry(retryComments);
    setRetryOpen(false);
    setRetryComments("");
  }

  const selectedGarment = ALL_GARMENTS.find(g => g.name === config.printGarmentCategory) || ALL_GARMENTS[0]!;
  const isFullCloth = selectedGarment.type === "full_cloth";
  const showColorSelector = (COLOR_SELECTOR_GARMENTS as readonly string[]).includes(selectedGarment.name);

  function handlePresetColor(hex: string) {
    onConfigUpdate({ printColorHex: hex });
  }

  const templates = GARMENT_TEMPLATES[selectedGarment.name] ?? {};

  // Auto-load templates when garment selection changes (and on mount)
  useEffect(() => {
    if (templates.front) onLoadBuiltInFront(templates.front);
    if (!isFullCloth && templates.back) onLoadBuiltInBack(templates.back);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGarment.name]);

  const isMissingGarmentInputs = isFullCloth
    ? !runtime.prints.baseGarmentFrontDataUrl
    : (!runtime.prints.baseGarmentFrontDataUrl || !runtime.prints.baseGarmentBackDataUrl);

  const generateDisabled =
    isBusy ||
    isMissingGarmentInputs ||
    (!runtime.prints.printDesignFrontDataUrl && !runtime.prints.printDesignBackDataUrl && !isValidColorHex);

  const anyGarmentLoaded = Boolean(
    runtime.prints.baseGarmentFrontDataUrl ||
    runtime.prints.baseGarmentBackDataUrl
  );

  const uploadIcon = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 13, height: 13 }}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );

  return (
    <div className="storyboardLibrary">
      <div>
        <div className="sectionTitle" style={{ marginTop: 0 }}>Inputs</div>

        {/* ── Garment Category + White Garment Photos (full-width) ── */}
        <div className="card" style={{ marginTop: 10 }}>
          <div style={{ marginBottom: 20 }}>
            <FieldLabel label="Garment Category" info={selectedGarment.description} />
            <select
              className="control"
              value={config.printGarmentCategory}
              onChange={(e) => onConfigUpdate({ printGarmentCategory: e.target.value })}
            >
              {ALL_GARMENTS.map(g => (
                <option key={g.id} value={g.name}>{g.name}</option>
              ))}
            </select>
          </div>

          {selectedGarment.name !== "Saree" && <FieldLabel
            label="White garment photos"
            info={isFullCloth ? "A full view of the cloth is required." : "Front and back views are required."}
          />}

          {/* Loaded garment previews */}
          {selectedGarment.name !== "Saree" && anyGarmentLoaded && (
            <div style={{ marginBottom: 12 }}>
              <div className="preview">
                {runtime.prints.baseGarmentFrontDataUrl && (
                  <div style={{ display: "grid", gap: 4, placeItems: "center" }}>
                    <div className="previewItem">
                      <img
                        src={runtime.prints.baseGarmentFrontDataUrl}
                        alt={isFullCloth ? "Garment photo" : "White garment — front"}
                        draggable={false}
                        onClick={() => onOpenImage(runtime.prints.baseGarmentFrontDataUrl!, isFullCloth ? "Garment photo" : "White garment — front")}
                      />
                      <button type="button" className="removePreviewButton" onClick={removeBaseGarmentFront} aria-label="Remove" title="Remove">
                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18" /><path d="M6 6l12 12" /></svg>
                      </button>
                    </div>
                    <span className="muted" style={{ fontSize: 11 }}>{isFullCloth ? "Full" : "Front"}</span>
                  </div>
                )}
                {!isFullCloth && runtime.prints.baseGarmentBackDataUrl && (
                  <div style={{ display: "grid", gap: 4, placeItems: "center" }}>
                    <div className="previewItem">
                      <img
                        src={runtime.prints.baseGarmentBackDataUrl}
                        alt="White garment — back"
                        draggable={false}
                        onClick={() => onOpenImage(runtime.prints.baseGarmentBackDataUrl!, "White garment — back")}
                      />
                      <button type="button" className="removePreviewButton" onClick={removeBaseGarmentBack} aria-label="Remove" title="Remove">
                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18" /><path d="M6 6l12 12" /></svg>
                      </button>
                    </div>
                    <span className="muted" style={{ fontSize: 11 }}>Back</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Upload Custom button */}
          {selectedGarment.name !== "Saree" && <div>
            <button
              type="button"
              className="btnGhost"
              style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13 }}
              onClick={() => setShowCustomUpload(v => !v)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Upload Custom
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 12, height: 12, transform: showCustomUpload ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {showCustomUpload && (
              <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap", paddingLeft: 4 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label htmlFor="printBaseGarmentFront" className="btnSecondary" style={{ fontSize: 12, padding: "6px 12px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5 }}>
                    {uploadIcon}
                    {isFullCloth ? "Full cloth" : "Front view"}
                  </label>
                  <input id="printBaseGarmentFront" ref={frontFileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={onBaseGarmentFrontFileChange} />
                </div>
                {!isFullCloth && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <label htmlFor="printBaseGarmentBack" className="btnSecondary" style={{ fontSize: 12, padding: "6px 12px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5 }}>
                      {uploadIcon}
                      Back view
                    </label>
                    <input id="printBaseGarmentBack" ref={backFileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={onBaseGarmentBackFileChange} />
                  </div>
                )}
              </div>
            )}
          </div>}
        </div>

        {/* ── Garment Color Selector (T-shirt / Hoodie / Sweater only) ── */}
        {showColorSelector && (
          <div className="card" style={{ marginTop: 10 }}>
            <FieldLabel label="Choose Garment Color" info="Select a base color for the garment before applying a print." />

            {/* Color picker + hex input */}
            <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 14 }}>
              <input
                id="garmentColorPicker"
                type="color"
                value={colorPickerValue}
                onChange={(e) => {
                  handleColorPickerInput(e);
                }}
                aria-label="Pick garment color"
                style={{ width: 48, height: 40, padding: 2, borderRadius: 8, border: "2px solid #E2E8F0", cursor: "pointer", flexShrink: 0 }}
              />
              <input
                id="garmentColorHex"
                className="control"
                type="text"
                value={config.printColorHex}
                onChange={(e) => onConfigUpdate({ printColorHex: e.target.value })}
                onBlur={handleColorHexBlur}
                placeholder="#RRGGBB"
                style={{ flex: 1 }}
              />
            </div>

            {/* Preset color buttons */}
            <div className="printColorPresets">
              {PRESET_COLORS.map(({ label, hex }) => {
                const isActive = config.printColorHex?.toUpperCase() === hex.toUpperCase();
                return (
                  <button
                    key={hex}
                    type="button"
                    className={`printColorPresetBtn${isActive ? " printColorPresetBtnActive" : ""}`}
                    onClick={() => handlePresetColor(hex)}
                    title={label}
                  >
                    <span
                      className="printColorSwatch"
                      style={{
                        background: hex,
                        border: hex === "#FFFFFF" || hex === "#F0E6D3" ? "1.5px solid #D1D5DB" : "1.5px solid transparent",
                      }}
                    />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Design Upload ── */}
        <div className="card" style={{ marginTop: 10 }}>
          <FieldLabel label="Print Design" info="Upload your design artwork. Back is optional — if omitted, the front design is applied to both views." />
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginTop: 12 }}>
            {/* Front Design */}
            <div style={{ flex: 1, minWidth: 120 }}>
              <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 8, color: "var(--muted)", letterSpacing: "0.05em" }}>FRONT</div>
              {runtime.prints.printDesignFrontDataUrl ? (
                <div>
                  <div className="previewItem" style={{ width: 90, height: 110, display: "inline-block" }}>
                    <img src={runtime.prints.printDesignFrontDataUrl} alt="Front design" draggable={false}
                      onClick={() => onOpenImage(runtime.prints.printDesignFrontDataUrl!, "Front design")} />
                    <button type="button" className="removePreviewButton" onClick={removePrintDesignFront} aria-label="Remove" title="Remove">
                      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18" /><path d="M6 6l12 12" /></svg>
                    </button>
                  </div>
                </div>
              ) : (
                <label htmlFor="printDesignFront" className="btnSecondary" style={{ display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 12 }}>
                  {uploadIcon} Upload front
                </label>
              )}
              <input id="printDesignFront" type="file" accept="image/*" style={{ display: "none" }} onChange={onPrintDesignFrontFileChange} />
            </div>

            {/* Back Design */}
            {!isFullCloth && (
              <div style={{ flex: 1, minWidth: 120 }}>
                <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 8, color: "var(--muted)", letterSpacing: "0.05em" }}>
                  BACK <span style={{ fontWeight: 400, fontSize: 10 }}>(optional)</span>
                </div>
                {runtime.prints.printDesignBackDataUrl ? (
                  <div>
                    <div className="previewItem" style={{ width: 90, height: 110, display: "inline-block" }}>
                      <img src={runtime.prints.printDesignBackDataUrl} alt="Back design" draggable={false}
                        onClick={() => onOpenImage(runtime.prints.printDesignBackDataUrl!, "Back design")} />
                      <button type="button" className="removePreviewButton" onClick={removePrintDesignBack} aria-label="Remove" title="Remove">
                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18" /><path d="M6 6l12 12" /></svg>
                      </button>
                    </div>
                  </div>
                ) : (
                  <label htmlFor="printDesignBack" className="btnSecondary" style={{ display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 12 }}>
                    {uploadIcon} Upload back
                  </label>
                )}
                <input id="printDesignBack" type="file" accept="image/*" style={{ display: "none" }} onChange={onPrintDesignBackFileChange} />
              </div>
            )}
          </div>
          {!isFullCloth && runtime.prints.printDesignFrontDataUrl && !runtime.prints.printDesignBackDataUrl && (
            <div className="muted" style={{ fontSize: 11, marginTop: 10 }}>No back design — front design will be applied to both views.</div>
          )}
        </div>

        <div style={{ height: 10 }} />

        <div>
          <FieldLabel htmlFor="printAdditionalPrompt" label="Additional prompt" info="Optional notes for how the print should be applied." />
          <textarea id="printAdditionalPrompt" className="control" rows={4} value={config.printAdditionalPrompt} onChange={(e) => onConfigUpdate({ printAdditionalPrompt: e.target.value })} placeholder="Optional: e.g., all-over small repeating pattern; align with seams; keep neckline and cuffs clean." />
        </div>

        <div className="actions" style={{ marginTop: 14, justifyContent: "space-between" }}>
          <button type="button" className="btnPrimary" onClick={onGenerate} disabled={generateDisabled}>
            {runtime.prints.generating ? `Generating... ${timerText}` : "Generate Printed Garment"}
          </button>
        </div>

        {runtime.prints.error && <div className="error">{runtime.prints.error}</div>}

        {(runtime.prints.outputFrontDataUrl || runtime.prints.outputBackDataUrl) && (() => {
          const outputGallery = [
            runtime.prints.outputFrontDataUrl && { src: runtime.prints.outputFrontDataUrl, title: "Printed garment — front" },
            runtime.prints.outputBackDataUrl  && { src: runtime.prints.outputBackDataUrl,  title: "Printed garment — back" },
          ].filter(Boolean) as Array<{ src: string; title: string }>;
          return (
          <div style={{ marginTop: 14 }}>
            <div className="preview">
              {runtime.prints.outputFrontDataUrl && (
                <div style={{ display: "grid", gap: 6, placeItems: "center" }}>
                  <div className="previewItem">
                    <img src={runtime.prints.outputFrontDataUrl} alt="Printed garment result — front" draggable={false} onClick={() => onOpenImage(runtime.prints.outputFrontDataUrl!, "Printed garment — front", undefined, outputGallery)} />
                  </div>
                  <div className="muted" style={{ fontSize: 12 }}>Front</div>
                </div>
              )}
              {runtime.prints.outputBackDataUrl && (
                <div style={{ display: "grid", gap: 6, placeItems: "center" }}>
                  <div className="previewItem">
                    <img src={runtime.prints.outputBackDataUrl} alt="Printed garment result — back" draggable={false} onClick={() => onOpenImage(runtime.prints.outputBackDataUrl!, "Printed garment — back", undefined, outputGallery)} />
                  </div>
                  <div className="muted" style={{ fontSize: 12 }}>Back</div>
                </div>
              )}
            </div>

            <div className="resultImageButtons">
              {runtime.prints.outputFrontDataUrl && (
                <a className="btn btnGhost iconButton" style={{ width: 170 }} href={runtime.prints.outputFrontDataUrl} download={`printed-garment-front-${Date.now()}.${mimeToExtension(runtime.prints.outputFrontMimeType)}`} aria-label="Download printed garment front">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3v10" /><path d="M8 11l4 4 4-4" /><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" /></svg>
                  &nbsp;&nbsp;Download front
                </a>
              )}
              {runtime.prints.outputBackDataUrl && (
                <a className="btn btnGhost iconButton" style={{ width: 170 }} href={runtime.prints.outputBackDataUrl} download={`printed-garment-back-${Date.now()}.${mimeToExtension(runtime.prints.outputBackMimeType)}`} aria-label="Download printed garment back">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3v10" /><path d="M8 11l4 4 4-4" /><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" /></svg>
                  &nbsp;&nbsp;Download back
                </a>
              )}
              <button type="button" className="btnGhost iconButton" onClick={() => hasPrintedOutputs && onOpenImage(primaryPrintedOutput, "Printed garment", undefined, outputGallery)} disabled={!hasPrintedOutputs} aria-label="Open printed garment" title="Open">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M10 10 5 5" /><path d="M5 8V5H8" /><path d="M14 10 19 5" /><path d="M16 5h3v3" /><path d="M10 14 5 19" /><path d="M5 16v3h3" /><path d="M14 14 19 19" /><path d="M16 19h3v-3" />
                </svg>
              </button>
              <button type="button" className="btnGhost iconButton" onClick={() => setRetryOpen((v) => !v)} aria-expanded={retryOpen} aria-label="Retry printed garment" title="Retry">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-2.64-6.36" /><path d="M21 3v6h-6" /></svg>
              </button>
            </div>

            {retryOpen && (
              <div style={{ marginTop: 14 }}>
                <FieldLabel htmlFor="printRetryComments" label="Retry Comments" info="Optional notes for what to improve on this retry." />
                <input id="printRetryComments" className="control" type="text" value={retryComments} onChange={(e) => setRetryComments(e.target.value)} placeholder="What improvements would you like?" />
                <div className="actions" style={{ marginTop: 12, justifyContent: "flex-end" }}>
                  <button type="button" className="btnPrimary" onClick={handleRetry} disabled={isBusy}>Generate</button>
                </div>
              </div>
            )}
          </div>
          );
        })()}
      </div>
    </div>
  );
}
