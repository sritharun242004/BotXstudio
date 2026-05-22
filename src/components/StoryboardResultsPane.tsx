import { useState, useCallback } from "react";
import FieldLabel from "./FieldLabel";
import Spinner from "./Spinner";

type Timings = { textLlmMs: number; imageGenMs: number; totalMs: number };

type PoseResult = {
  dataUrl: string;
  mimeType: string;
  poseIndex: number;
};

type AnglesRuntime = {
  generating: boolean;
  error: string | null;
  backDataUrl: string | null;
  backMimeType: string | null;
  detailDataUrl: string | null;
  detailMimeType: string | null;
  timingsMs: { back: number; detail: number; total: number } | null;
};

type PromptsUsed = {
  garmentRef?: string;
  composite?: string;
  backView?: string;
  detailView?: string;
} | null;

type RuntimeLite = {
  resultDataUrl: string | null;
  resultMimeType: string | null;
  resultTimingsMs: Record<string, number> | null;
  angles: AnglesRuntime;
  poseResults: PoseResult[];
  promptsUsed?: PromptsUsed;
};

interface StoryboardResultsPaneProps {
  isGenerating: boolean;
  generationStepIndex: number;
  generationElapsedMs: number;
  generationSteps: readonly string[];
  runtime: RuntimeLite;
  computedTimings: Timings;
  formatDurationMs: (ms: number | null | undefined) => string;
  mimeToExtension: (mimeType: string | null) => string;
  imageModel: string;
  onGenerateAngles: () => void;
  onResultImagePointerMove: (event: React.PointerEvent<HTMLDivElement>) => void;
  onResultImagePointerLeave: (event: React.PointerEvent<HTMLDivElement>) => void;
  onOpenImage: (src: string, title: string, alt?: string, gallery?: Array<{ src: string; title: string; alt?: string }>) => void;
  onRetry: (comment: string) => void;
}

function PromptViewerModal({ prompts, onClose }: { prompts: NonNullable<PromptsUsed>; onClose: () => void }) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const entries: Array<{ key: string; label: string; text: string }> = [
    prompts.garmentRef  ? { key: "garmentRef",  label: "Garment Reference",  text: prompts.garmentRef  } : null,
    prompts.composite   ? { key: "composite",   label: "Main Image",          text: prompts.composite   } : null,
    prompts.backView    ? { key: "backView",    label: "Back View",           text: prompts.backView    } : null,
    prompts.detailView  ? { key: "detailView",  label: "Detail Shot",         text: prompts.detailView  } : null,
  ].filter(Boolean) as Array<{ key: string; label: string; text: string }>;

  async function copyOne(key: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch { /* clipboard not available */ }
  }

  async function copyAll() {
    const all = entries.map(e => `[${e.label}]\n${e.text}`).join("\n\n---\n\n");
    try {
      await navigator.clipboard.writeText(all);
      setCopiedKey("__all__");
      setTimeout(() => setCopiedKey(null), 2000);
    } catch { /* clipboard not available */ }
  }

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)" }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: "#1a1a2e", border: "1px solid #2d2d50", borderRadius: 12, width: "min(680px, 95vw)", maxHeight: "80vh", display: "flex", flexDirection: "column", boxShadow: "0 24px 60px rgba(0,0,0,0.6)" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #2d2d50" }}>
          <div style={{ fontWeight: 600, fontSize: 15, color: "#e2e8f0" }}>Prompts Used</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              type="button"
              onClick={copyAll}
              style={{ fontSize: 12, fontWeight: 600, padding: "5px 12px", borderRadius: 6, border: "1px solid #6366F1", background: copiedKey === "__all__" ? "#6366F1" : "transparent", color: copiedKey === "__all__" ? "#fff" : "#6366F1", cursor: "pointer", transition: "all 0.15s" }}
            >
              {copiedKey === "__all__" ? "Copied!" : "Copy All"}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #2d2d50", background: "transparent", color: "#94a3b8", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
          {entries.length === 0 ? (
            <div style={{ color: "#64748b", fontSize: 14 }}>No prompts recorded yet. Generate an image first.</div>
          ) : entries.map((e) => (
            <div key={e.key} style={{ background: "#11112a", border: "1px solid #2d2d50", borderRadius: 8, overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderBottom: "1px solid #2d2d50", background: "#16162e" }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" }}>{e.label}</span>
                <button
                  type="button"
                  onClick={() => copyOne(e.key, e.text)}
                  style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 4, border: "1px solid #2d2d50", background: copiedKey === e.key ? "#22c55e20" : "transparent", color: copiedKey === e.key ? "#22c55e" : "#64748b", cursor: "pointer", transition: "all 0.15s" }}
                >
                  {copiedKey === e.key ? "Copied!" : "Copy"}
                </button>
              </div>
              <pre style={{ margin: 0, padding: "12px", fontSize: 12, lineHeight: 1.6, color: "#cbd5e1", whiteSpace: "pre-wrap", wordBreak: "break-word", fontFamily: "inherit", maxHeight: 200, overflowY: "auto" }}>{e.text}</pre>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function StoryboardResultsPane({
  isGenerating,
  generationStepIndex,
  generationElapsedMs,
  generationSteps,
  runtime,
  computedTimings,
  formatDurationMs,
  mimeToExtension,
  imageModel,
  onGenerateAngles,
  onResultImagePointerMove,
  onResultImagePointerLeave,
  onOpenImage,
  onRetry,
}: StoryboardResultsPaneProps) {
  const [retryOpen, setRetryOpen] = useState(false);
  const [retryComments, setRetryComments] = useState("");
  const [promptViewerOpen, setPromptViewerOpen] = useState(false);

  const closePromptViewer = useCallback(() => setPromptViewerOpen(false), []);

  const hasMultiplePoses = runtime.poseResults.length > 1;

  // Build gallery from all available result images for prev/next navigation
  function buildResultGallery() {
    const gallery: Array<{ src: string; title: string; alt?: string }> = [];

    if (hasMultiplePoses) {
      runtime.poseResults.forEach((pr, i) => {
        gallery.push({ src: pr.dataUrl, title: `Pose ${i + 1}`, alt: `Generated look – Pose ${i + 1}` });
      });
    } else if (runtime.resultDataUrl) {
      gallery.push({ src: runtime.resultDataUrl, title: "Generated look", alt: "Generated look" });
    }

    if (runtime.angles.backDataUrl) gallery.push({ src: runtime.angles.backDataUrl, title: "Back view", alt: "Generated back view" });
    if (runtime.angles.detailDataUrl) gallery.push({ src: runtime.angles.detailDataUrl, title: "Detail shot", alt: "Generated detail shot" });

    return gallery;
  }

  function handleRetry() {
    onRetry(retryComments);
    setRetryOpen(false);
    setRetryComments("");
  }

  return (
    <>
    <div className="result">
      <FieldLabel
        label="Generated result"
        info="Your generated ecommerce scene will appear here. For best results, start with Auto settings."
      />

      {isGenerating ? (
        <div className="resultPlaceholder loaderPlaceholder">
          <div className="loader">
            <div className="loaderHeader">
              <Spinner />
              <div>
                <div className="loaderTitle">{generationSteps[generationStepIndex]}</div>
                <div className="loaderSubtitle">Elapsed {formatDurationMs(generationElapsedMs)}</div>
              </div>
            </div>
            <div className="loaderSteps" aria-label="Generation progress">
              {generationSteps.map((label, idx) => (
                <div
                  key={label}
                  className={[
                    "loaderStep",
                    idx < generationStepIndex ? "loaderStepDone" : "",
                    idx === generationStepIndex ? "loaderStepActive" : "",
                  ].filter(Boolean).join(" ")}
                >
                  <div className="loaderDot" aria-hidden="true" />
                  <div className="loaderStepText">{label}</div>
                </div>
              ))}
            </div>
            <div className="loaderHint muted">Keep this tab open while we generate your image.</div>
          </div>
        </div>
      ) : runtime.resultDataUrl ? (
        <>
          <div className="resultActions">
            <div className="resultActionsRight">
              {runtime.resultTimingsMs && (
                <div className="badge" title="Time spent generating this image">
                  <span>Thinking</span>
                  <code>{formatDurationMs(computedTimings.textLlmMs)}</code>
                  <span>Image gen</span>
                  <code>{formatDurationMs(computedTimings.imageGenMs)}</code>
                  <span>Total</span>
                  <code>{formatDurationMs(computedTimings.totalMs)}</code>
                </div>
              )}
            </div>
          </div>

          {/* ── Multi-pose grid ── */}
          {hasMultiplePoses ? (
            <div className="poseResultsGrid" data-count={runtime.poseResults.length}>
              {runtime.poseResults.map((pr, i) => (
                <div key={i} className="poseResultTile">
                  <div className="poseResultLabel">Pose {i + 1}</div>
                  <div className="poseResultImageWrap">
                    <img src={pr.dataUrl} alt={`Generated look – Pose ${i + 1}`} draggable={false} />
                    <div className="poseResultOverlay">
                      <button
                        type="button"
                        className="poseResultOverlayBtn"
                        onClick={() => onOpenImage(pr.dataUrl, `Pose ${i + 1}`, `Generated look – Pose ${i + 1}`, buildResultGallery())}
                        title="View"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                        </svg>
                      </button>
                      <a
                        className="poseResultOverlayBtn"
                        href={pr.dataUrl}
                        download={`look-pose${i + 1}-${Date.now()}.${mimeToExtension(pr.mimeType)}`}
                        title="Download"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 3v10" /><path d="M8 11l4 4 4-4" /><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* ── Single result ── */
            <div
              className="resultImageZoom"
              onPointerMove={onResultImagePointerMove}
              onPointerLeave={onResultImagePointerLeave}
            >
              <img className="resultImage" src={runtime.resultDataUrl} alt="Generated look" draggable={false} />
            </div>
          )}

          <div className="resultImageButtons">
            {!hasMultiplePoses && (
              <a
                className="btn btnGhost iconButton"
                style={{ width: 130 }}
                href={runtime.resultDataUrl}
                download={`look-${Date.now()}.${mimeToExtension(runtime.resultMimeType)}`}
                aria-label="Download generated image"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 3v10" /><path d="M8 11l4 4 4-4" /><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
                </svg>
                &nbsp;&nbsp;Download
              </a>
            )}
            {!hasMultiplePoses && (
              <button
                type="button"
                className="btnGhost iconButton"
                onClick={() => onOpenImage(runtime.resultDataUrl!, "Generated look", "Generated look", buildResultGallery())}
                aria-label="Open generated image"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M10 10 5 5" /><path d="M5 8V5H8" /><path d="M14 10 19 5" /><path d="M16 5h3v3" />
                  <path d="M10 14 5 19" /><path d="M5 16v3h3" /><path d="M14 14 19 19" /><path d="M16 19h3v-3" />
                </svg>
              </button>
            )}
            <button
              type="button"
              className="btnGhost iconButton"
              onClick={() => setRetryOpen((v) => !v)}
              aria-expanded={retryOpen}
              aria-label="Retry main image"
              title="Retry"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 12a9 9 0 1 1-2.64-6.36" /><path d="M21 3v6h-6" />
              </svg>
            </button>
            {runtime.promptsUsed && (
              <button
                type="button"
                className="btnGhost iconButton"
                onClick={() => setPromptViewerOpen(true)}
                aria-label="View prompts used"
                title="View Prompts"
                style={{ gap: 6, paddingInline: 10, fontSize: 12, fontWeight: 500 }}
              >
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
                </svg>
                View Prompts
              </button>
            )}
          </div>

          {retryOpen && (
            <div style={{ marginTop: 14 }}>
              <FieldLabel label="Retry Comments" info="Add targeted improvements for this retry pass." htmlFor="retryComments" />
              <input
                id="retryComments"
                className="control"
                type="text"
                value={retryComments}
                onChange={(e) => setRetryComments(e.target.value)}
                placeholder="What improvements would you like?"
              />
              <div className="actions" style={{ marginTop: 12, justifyContent: "flex-end" }}>
                <button type="button" className="btnPrimary" onClick={handleRetry} disabled={isGenerating}>
                  Generate
                </button>
              </div>
            </div>
          )}

          {/* ── Multi-angle section (Plus / Pro / ProMax only) ── */}
          {imageModel !== "gemini-2.5-flash-image" && (
            <div className="anglesSection">
              <div className="anglesSectionHeader">
                <FieldLabel
                  label="Back & Detail Views"
                  info="Generate a back view and a close-up detail shot from your main result."
                />
                <button
                  type="button"
                  className="btnSecondary"
                  onClick={onGenerateAngles}
                  disabled={isGenerating || runtime.angles.generating}
                >
                  {runtime.angles.generating ? (
                    <><Spinner /> Generating…</>
                  ) : (
                    runtime.angles.backDataUrl ? "Regenerate Angles" : "Generate Angles"
                  )}
                </button>
              </div>

              {runtime.angles.error && (
                <div className="errorMessage" style={{ marginTop: 8 }}>{runtime.angles.error}</div>
              )}

              {(runtime.angles.backDataUrl || runtime.angles.detailDataUrl) && (
                <div className="anglesGrid">
                  {runtime.angles.backDataUrl && (
                    <div className="angleTile">
                      <div className="angleTileLabel">Back view</div>
                      <div className="angleTileImageWrap">
                        <img src={runtime.angles.backDataUrl} alt="Back view" draggable={false} />
                        <div className="angleTileOverlay">
                          <button
                            type="button"
                            className="poseResultOverlayBtn"
                            onClick={() => onOpenImage(runtime.angles.backDataUrl!, "Back view", "Back view", buildResultGallery())}
                            title="View"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                            </svg>
                          </button>
                          <a
                            className="poseResultOverlayBtn"
                            href={runtime.angles.backDataUrl}
                            download={`back-${Date.now()}.${mimeToExtension(runtime.angles.backMimeType)}`}
                            title="Download"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 3v10" /><path d="M8 11l4 4 4-4" /><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
                            </svg>
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                  {runtime.angles.detailDataUrl && (
                    <div className="angleTile">
                      <div className="angleTileLabel">Detail shot</div>
                      <div className="angleTileImageWrap">
                        <img src={runtime.angles.detailDataUrl} alt="Detail shot" draggable={false} />
                        <div className="angleTileOverlay">
                          <button
                            type="button"
                            className="poseResultOverlayBtn"
                            onClick={() => onOpenImage(runtime.angles.detailDataUrl!, "Detail shot", "Detail shot", buildResultGallery())}
                            title="View"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                            </svg>
                          </button>
                          <a
                            className="poseResultOverlayBtn"
                            href={runtime.angles.detailDataUrl}
                            download={`detail-${Date.now()}.${mimeToExtension(runtime.angles.detailMimeType)}`}
                            title="Download"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 3v10" /><path d="M8 11l4 4 4-4" /><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
                            </svg>
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {runtime.angles.timingsMs && (
                <div className="badge" style={{ marginTop: 8 }} title="Time to generate angles">
                  <span>Back</span><code>{formatDurationMs(runtime.angles.timingsMs.back)}</code>
                  <span>Detail</span><code>{formatDurationMs(runtime.angles.timingsMs.detail)}</code>
                  <span>Total</span><code>{formatDurationMs(runtime.angles.timingsMs.total)}</code>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="resultPlaceholder resultEmpty">
          <div>
            <div className="resultEmptyTitle">Ready when you are</div>
            <div className="muted">Upload garment photos, then click "Generate look".</div>
          </div>
        </div>
      )}

    </div>

    {promptViewerOpen && runtime.promptsUsed && (
      <PromptViewerModal prompts={runtime.promptsUsed} onClose={closePromptViewer} />
    )}
  </>
  );
}
