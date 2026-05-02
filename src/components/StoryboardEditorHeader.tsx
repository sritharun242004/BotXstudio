import { GARMENT_TYPES, IMAGE_GENERATION_MODELS, type ImageGenerationModelId } from "../lib/storyboards";

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
        <div className="sectionTitle" style={{ margin: "0 0 10px" }}>
          Image generation model
        </div>
        <div className="modelSelectorCards">
          {IMAGE_GENERATION_MODELS.map((m) => {
            const active = imageModel === m.id;
            return (
              <button
                key={m.id}
                type="button"
                disabled={disabled}
                onClick={() => onImageModelChange(m.id)}
                className={["modelCard", m.colorClass, active ? "modelCardActive" : ""].filter(Boolean).join(" ")}
                title={m.id}
              >
                <div className="modelCardHeader">
                  <span className="modelCardName">{m.label}</span>
                  <span className="modelCardModeBadge">{m.mode}</span>
                </div>
                <div className="modelCardDesc">{m.desc}</div>
                <div className="modelCardTokenBadge">
                  {m.colorClass === "modelCard--pro" ? "⚡ Turbo — full custom controls" : "🌿 Eco — template-based generation"}
                </div>
              </button>
            );
          })}
        </div>
        <div className="muted" style={{ marginTop: 8, fontSize: 12 }}>
          Model used for garment reference, composite, multi-angle, and prints generation.
        </div>
      </div>

      {!canDelete && (
        <div className="muted" style={{ marginTop: 4 }}>Keep at least one mood board.</div>
      )}
    </div>
  );
}
