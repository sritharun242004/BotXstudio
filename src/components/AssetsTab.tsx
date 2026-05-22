import { useState, type ChangeEvent } from "react";
import { Shirt, Image as ImageIcon, User, Dumbbell } from "lucide-react";
import type { SavedImageRecord } from "../lib/indexeddb";

// ─── Types ───────────────────────────────────────────────────────────────────

type SavedImageView = SavedImageRecord & { url: string };

type RuntimeLite = {
  garmentDataUrls: string[];
  backgroundDataUrls: string[];
  modelDataUrls: string[];
  poseDataUrls: string[];
};

interface AssetsTabProps {
  activeStoryboardTitle: string;
  activeRuntime: RuntimeLite;
  savedImages: SavedImageView[];
  formatTimestamp: (ms: number) => string;
  mimeToExtension: (mime: string | null) => string;
  onGarmentFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onBackgroundFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onModelFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onPoseFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  removeGarmentImage: (idx: number) => void;
  removeBackgroundImage: (idx: number) => void;
  removeModelImage: (idx: number) => void;
  removePoseImage: (idx: number) => void;
  onOpenImage: (src: string, title: string, alt?: string) => void;
  onDeleteImage: (id: string) => void;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const LIBRARY_CATEGORIES = [
  { key: "all",        label: "All",         kinds: null },
  { key: "garment",    label: "Garments",    kinds: ["asset-garment"] },
  { key: "background", label: "Backgrounds", kinds: ["asset-background"] },
  { key: "model",      label: "Models",      kinds: ["asset-model"] },
  { key: "pose",       label: "Poses",       kinds: ["asset-pose"] },
] as const;

type CategoryKey = typeof LIBRARY_CATEGORIES[number]["key"];

type UploadSubTab = "garment" | "background" | "model" | "pose";

const UPLOAD_TABS: { key: UploadSubTab; label: string; Icon: React.ElementType; info: string }[] = [
  { key: "garment",    label: "Garments",    Icon: Shirt,     info: "Garment photos used as the base for generation." },
  { key: "background", label: "Backgrounds", Icon: ImageIcon, info: "Lock a scene or mood. Up to 4 images." },
  { key: "model",      label: "Models",      Icon: User,      info: "Model references to preserve identity. Up to 4." },
  { key: "pose",       label: "Poses",       Icon: Dumbbell,  info: "Pose reference to recreate a specific stance." },
];

function categoryLabel(kind: string): string {
  if (kind === "asset-garment") return "Garment";
  if (kind === "asset-background") return "Background";
  if (kind === "asset-model") return "Model";
  if (kind === "asset-pose") return "Pose";
  if (kind === "main") return "Look";
  if (kind === "side") return "Side view";
  if (kind === "back") return "Back view";
  if (kind === "prints") return "Print";
  return kind.replace(/_/g, " ");
}

// ─── Icons ───────────────────────────────────────────────────────────────────

const RemoveIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M18 6 6 18" /><path d="M6 6l12 12" />
  </svg>
);

const MaximizeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
  </svg>
);

const TrashIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </svg>
);

const ImagePlaceholderIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <path d="m21 15-5-5L5 21" />
    <circle cx="8.5" cy="8.5" r="1.5" />
  </svg>
);

// ─── Main component ───────────────────────────────────────────────────────────

export default function AssetsTab({
  activeStoryboardTitle,
  activeRuntime,
  savedImages,
  formatTimestamp,
  onGarmentFileChange,
  onBackgroundFileChange,
  onModelFileChange,
  onPoseFileChange,
  removeGarmentImage,
  removeBackgroundImage,
  removeModelImage,
  removePoseImage,
  onOpenImage,
  onDeleteImage,
}: AssetsTabProps) {
  const [uploadTab, setUploadTab] = useState<UploadSubTab>("garment");
  const [libCategory, setLibCategory] = useState<CategoryKey>("all");
  const [isDragging, setIsDragging] = useState(false);

  const activeTabDef = UPLOAD_TABS.find((t) => t.key === uploadTab)!;

  const dataUrls =
    uploadTab === "garment" ? activeRuntime.garmentDataUrls
    : uploadTab === "background" ? activeRuntime.backgroundDataUrls
    : uploadTab === "model" ? activeRuntime.modelDataUrls
    : activeRuntime.poseDataUrls;

  const fileChangeHandler =
    uploadTab === "garment" ? onGarmentFileChange
    : uploadTab === "background" ? onBackgroundFileChange
    : uploadTab === "model" ? onModelFileChange
    : onPoseFileChange;

  const removeHandler =
    uploadTab === "garment" ? removeGarmentImage
    : uploadTab === "background" ? removeBackgroundImage
    : uploadTab === "model" ? removeModelImage
    : removePoseImage;

  const inputId = `assetsUpload_${uploadTab}`;

  const countFor = (key: UploadSubTab) =>
    key === "garment" ? activeRuntime.garmentDataUrls.length
    : key === "background" ? activeRuntime.backgroundDataUrls.length
    : key === "model" ? activeRuntime.modelDataUrls.length
    : activeRuntime.poseDataUrls.length;

  const libCountFor = (key: CategoryKey) => {
    if (key === "all") return savedImages.length;
    const cat = LIBRARY_CATEGORIES.find((c) => c.key === key);
    return cat?.kinds ? savedImages.filter((img) => (cat.kinds as readonly string[]).includes(img.kind)).length : 0;
  };

  const filteredImages =
    libCategory === "all"
      ? savedImages
      : savedImages.filter((img) => {
          const cat = LIBRARY_CATEGORIES.find((c) => c.key === libCategory);
          return cat?.kinds ? (cat.kinds as readonly string[]).includes(img.kind) : false;
        });

  return (
    <div className="atRoot">

      {/* ── Info banner ──────────────────────────────────────────── */}
      <div className="atInfoBanner">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.7 }}>
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        Assets for <strong>{activeStoryboardTitle}</strong> — uploaded references used by the AI during image generation.
      </div>

      {/* ── Upload (left) + Image holder (right) ─────────────────── */}
      <div className="atTopSection">

        {/* Left: Compact upload panel */}
        <div className="atUploadPane">
          <div className="atPaneLabel">Upload</div>

          {/* Category selector */}
          <div className="atSubTabs">
            {UPLOAD_TABS.map((t) => {
              const count = countFor(t.key);
              return (
                <button
                  key={t.key}
                  type="button"
                  className={["atSubTab", uploadTab === t.key ? "atSubTabActive" : ""].filter(Boolean).join(" ")}
                  onClick={() => setUploadTab(t.key)}
                >
                  <t.Icon size={15} strokeWidth={2} className="atSubTabEmoji" />
                  {t.label}
                  {count > 0 && <span className="atSubTabCount">{count}</span>}
                </button>
              );
            })}
          </div>

          <p className="atUploadInfo">{activeTabDef.info}</p>

          {/* Compact horizontal drop zone */}
          <label
            className="atDropZoneCompact"
            htmlFor={inputId}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); fileChangeHandler({ target: { files: e.dataTransfer.files } } as ChangeEvent<HTMLInputElement>); }}
            style={isDragging ? { borderColor: "#8B5CF6", background: "rgba(139,92,246,0.06)" } : undefined}
          >
            <div className="atDropZoneCompactIcon" style={isDragging ? { color: "#8B5CF6" } : undefined}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <div className="atDropZoneCompactBody">
              <span className="atDropZoneCompactText" style={isDragging ? { color: "#7C3AED" } : undefined}>
                {isDragging ? "Drop to upload" : "Click or drop to upload"}
              </span>
              <span className="atDropZoneCompactSub">PNG · JPG · WEBP</span>
            </div>
            <input id={inputId} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={fileChangeHandler} />
          </label>
        </div>

        {/* Right: Image holder */}
        <div className="atImageHolder">
          <div className="atPaneLabel">
            <activeTabDef.Icon size={14} strokeWidth={2} style={{ flexShrink: 0 }} /> {activeTabDef.label}
            {dataUrls.length > 0 && <span className="atPaneLabelCount">{dataUrls.length}</span>}
          </div>

          {dataUrls.length > 0 ? (
            <div className="atPreviewGrid">
              {dataUrls.map((src, idx) => (
                <div key={`${uploadTab}-${idx}`} className="atPreviewItem">
                  <img
                    src={src}
                    alt={`${activeTabDef.label} ${idx + 1}`}
                    draggable={false}
                    onClick={() => onOpenImage(src, `${activeTabDef.label} ${idx + 1}`)}
                  />
                  <button
                    type="button"
                    className="atPreviewRemove"
                    onClick={() => removeHandler(idx)}
                    aria-label={`Remove ${activeTabDef.label.toLowerCase()} ${idx + 1}`}
                    title="Remove"
                  >
                    <RemoveIcon />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="atImageHolderEmpty">
              <ImagePlaceholderIcon />
              <span>No {activeTabDef.label.toLowerCase()} added yet</span>
              <span className="atImageHolderEmptySub">Upload from the left panel</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Library ──────────────────────────────────────────────── */}
      <div className="atLibrarySection">
        <div className="atLibrarySectionHeader">
          <span className="atLibrarySectionTitle">Library</span>
          {savedImages.length > 0 && <span className="atLibrarySectionCount">{savedImages.length}</span>}
        </div>

        {/* Category filter */}
        <div className="atCategoryBar">
          {LIBRARY_CATEGORIES.map((cat) => {
            const count = libCountFor(cat.key);
            if (cat.key !== "all" && count === 0) return null;
            return (
              <button
                key={cat.key}
                type="button"
                className={["atCategoryPill", libCategory === cat.key ? "atCategoryPillActive" : ""].filter(Boolean).join(" ")}
                onClick={() => setLibCategory(cat.key)}
              >
                {cat.label}
                <span className="atCategoryCount">{count}</span>
              </button>
            );
          })}
        </div>

        {/* Grid */}
        {filteredImages.length === 0 ? (
          <div className="atLibraryEmpty">
            <ImagePlaceholderIcon />
            <p>No images in this category yet.</p>
          </div>
        ) : (
          <div className="atLibraryGrid">
            {filteredImages.map((image) => (
              <div key={image.id} className="atLibraryCard">
                <div className="atLibraryCardPreviewWrap">
                  <button
                    type="button"
                    className="atLibraryCardPreview"
                    onClick={() => onOpenImage(image.url, image.title)}
                    aria-label={`Open ${image.title}`}
                  >
                    <img src={image.url} alt={image.title} draggable={false} />
                  </button>
                  <div className="atLibraryCardOverlay">
                    <button type="button" className="atLibraryOverlayBtn" onClick={() => onOpenImage(image.url, image.title)} title="View">
                      <MaximizeIcon />
                    </button>
                    <button type="button" className="atLibraryOverlayBtn atLibraryOverlayBtnDanger" onClick={() => onDeleteImage(image.id)} title="Delete">
                      <TrashIcon />
                    </button>
                  </div>
                  <span className="atLibraryKindBadge">{categoryLabel(image.kind)}</span>
                </div>
                <div className="atLibraryCardMeta">
                  <div className="atLibraryCardTitle" title={image.title}>{image.title}</div>
                  {image.storyboardTitle && <div className="atLibraryCardSub">{image.storyboardTitle}</div>}
                  <div className="atLibraryCardDate">{formatTimestamp(image.createdAt)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
