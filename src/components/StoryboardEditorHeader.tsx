import { GARMENT_TYPES, IMAGE_GENERATION_MODELS, type ImageGenerationModelId } from "../lib/storyboards";
import { useCredits } from "../context/CreditsContext";

interface StoryboardEditorHeaderProps {
  title: string;
  garmentType: string;
  imageModel: ImageGenerationModelId;
  updatedAt: string;
  disabled: boolean;
  canDelete: boolean;
  formatTimestamp: (iso: string) => string;
  onBack: () => void;
  onDuplicate: () => void;
  onRequestDelete: () => void;
  onTitleChange: (value: string) => void;
  onGarmentTypeChange: (value: string) => void;
  onImageModelChange: (model: ImageGenerationModelId) => void;
}

function getModelCreditsDisplay(modelId: string, pricing: Record<string, number>): string {
  if (modelId === "hybrid-editorial") {
    const flash = pricing["gemini-2.5-flash-image"] ?? 5;
    const flux  = pricing["fal-ai/flux-pro/kontext/multi"] ?? 5;
    return `${flash + flux * 2} cr/set`;
  }
  if (modelId === "gpt-image-2") {
    const min = pricing["gpt-medium-1024x768"] ?? 6;
    const max = pricing["gpt-high-1024x1024"] ?? 25;
    return `${min}–${max} cr/img`;
  }
  const cost = pricing[modelId];
  return cost !== undefined ? `${cost} cr/img` : "";
}

export default function StoryboardEditorHeader({
  title,
  garmentType,
  imageModel,
  updatedAt,
  disabled,
  canDelete,
  formatTimestamp,
  onBack,
  onDuplicate,
  onRequestDelete,
  onTitleChange,
  onGarmentTypeChange,
  onImageModelChange,
}: StoryboardEditorHeaderProps) {
  const { modelPricing } = useCredits();

  return (
    <div className="storyboardEditorCardHeader" aria-label="Storyboard manager">
      <div className="storyboardEditorHeaderTop">
        <button
          type="button"
          className="btnGhost storyboardBackButton"
          onClick={onBack}
          disabled={disabled}
        >
          ← Mood Boards
        </button>
        <div className="badge" title="Saved locally in this browser">
          <span>Saved locally</span>
          <code>{formatTimestamp(updatedAt)}</code>
        </div>
      </div>

      <div className="storyboardEditorHeaderMain">
        <div className="storyboardEditorHeaderName">
          <div className="sectionTitle" style={{ margin: "0 0 6px" }}>Mood board name</div>
          <input
            className="control"
            value={title}
            onChange={(e) => onTitleChange(e.target.value.trim())}
            disabled={disabled}
          />
        </div>
        <div className="storyboardEditorHeaderActions">
          <button type="button" className="btnSecondary" onClick={onDuplicate} disabled={disabled}>
            Duplicate
          </button>
          <button
            type="button"
            className="btnDanger"
            onClick={onRequestDelete}
            disabled={disabled || !canDelete}
          >
            Delete
          </button>
        </div>
      </div>

      {/* ── Garment Type ─────────────────────────────────────────── */}
      <div className="garmentTypeRow">
        <div className="sectionTitle" style={{ margin: "0 0 8px" }}>
          What garment type are you generating?
        </div>
        <div className="garmentTypePills">
          {GARMENT_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              disabled={disabled}
              className={[
                "garmentTypePill",
                garmentType === type ? "garmentTypePillActive" : "",
              ].filter(Boolean).join(" ")}
              onClick={() => onGarmentTypeChange(garmentType === type ? "" : type)}
            >
              {type}
            </button>
          ))}
        </div>
        <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
          <span className="muted" style={{ fontSize: 13, whiteSpace: "nowrap" }}>Or type custom:</span>
          <input
            className="control"
            style={{ maxWidth: 220 }}
            placeholder="e.g. Kurta, Lehenga…"
            value={GARMENT_TYPES.includes(garmentType as typeof GARMENT_TYPES[number]) ? "" : garmentType}
            disabled={disabled}
            onChange={(e) => onGarmentTypeChange(e.target.value)}
          />
          {garmentType && !GARMENT_TYPES.includes(garmentType as typeof GARMENT_TYPES[number]) && (
            <span className="badge">{garmentType}</span>
          )}
        </div>
      </div>

      {/* ── Image Generation Model ───────────────────────────────── */}
      <div className="garmentTypeRow" style={{ marginTop: 16 }}>
        <div className="sectionTitle" style={{ margin: "0 0 4px" }}>
          Image generation model
        </div>
        <div className="muted" style={{ fontSize: 12, marginBottom: 10 }}>
          Choose your generation model. Flash is included in free credits — Plus, Pro &amp; ProMax require purchased credits.
        </div>
        <div className="modelSelectorCards">
          {IMAGE_GENERATION_MODELS.map((m) => {
            const active = imageModel === m.id;
            return (
              <div key={m.id} className="modelCardWrap" style={{ position: "relative" }}>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onImageModelChange(m.id)}
                  className={["modelCard", m.colorClass, active ? "modelCardActive" : ""].filter(Boolean).join(" ")}
                >
                  <div className="modelCardHeader">
                    <span className="modelCardName">{m.label}</span>
                    <span className="modelCardModeBadge">{m.mode}</span>
                  </div>
                  <div className="modelCardDesc">{m.desc}</div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4, gap: 6 }}>
                    <div className="modelCardTokenBadge">{m.tokenBadge}</div>
                    <span style={{
                      background: active ? "rgba(139,92,246,0.15)" : "#F3F0FB",
                      color: active ? "#7C3AED" : "#8B5CF6",
                      border: `1.5px solid ${active ? "rgba(139,92,246,0.4)" : "rgba(139,92,246,0.2)"}`,
                      borderRadius: 6, padding: "3px 8px", fontSize: 11, fontWeight: 800,
                      flexShrink: 0, whiteSpace: "nowrap",
                      fontFamily: "var(--font-heading, 'Outfit', sans-serif)",
                    }}>
                      {getModelCreditsDisplay(m.id, modelPricing)}
                    </span>
                  </div>
                </button>
              </div>
            );
          })}
        </div>
        <div className="muted" style={{ marginTop: 8, fontSize: 12 }}>
          Flash &amp; ProMax are included in your 30 free credits. Plus &amp; Pro require additional credits.
        </div>
      </div>

      {!canDelete && (
        <div className="muted" style={{ marginTop: 4 }}>Keep at least one mood board.</div>
      )}
    </div>
  );
}
