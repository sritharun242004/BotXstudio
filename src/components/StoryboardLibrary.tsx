import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import type { StoryboardRecord } from "../lib/storyboards";
import { startTour } from "./GuidedTour";

type RuntimeLite = { resultDataUrl: string | null; garmentDataUrls: string[] };

interface StoryboardLibraryProps {
  storyboards: StoryboardRecord[];
  activeId: string;
  runtimeById: Record<string, RuntimeLite | undefined>;
  savedPreviewByStoryboardId: Record<string, string>;
  isGenerating: boolean;
  subtitleFor: (sb: StoryboardRecord) => string;
  formatTimestamp: (iso: string) => string;
  onCreate: () => void;
  onOpen: (id: string) => void;
}

export default function StoryboardLibrary({
  storyboards,
  activeId,
  runtimeById,
  savedPreviewByStoryboardId,
  isGenerating,
  subtitleFor,
  formatTimestamp,
  onCreate,
  onOpen,
}: StoryboardLibraryProps) {
  const [activeFilter, setActiveFilter] = useState<string>(""); // "" = All

  // Build filter list from garment types actually used + "All"
  const filterOptions = useMemo(() => {
    const seen = new Set<string>();
    for (const sb of storyboards) {
      if (sb.garmentType?.trim()) seen.add(sb.garmentType.trim());
    }
    return Array.from(seen).sort();
  }, [storyboards]);

  const filtered = useMemo(() => {
    const base = activeFilter
      ? storyboards.filter((sb) => sb.garmentType?.trim() === activeFilter)
      : storyboards;

    return [...base].sort((a, b) => {
      const hasPreviewA = !!(
        runtimeById[a.id]?.resultDataUrl ||
        savedPreviewByStoryboardId[a.id] ||
        runtimeById[a.id]?.garmentDataUrls?.length
      );
      const hasPreviewB = !!(
        runtimeById[b.id]?.resultDataUrl ||
        savedPreviewByStoryboardId[b.id] ||
        runtimeById[b.id]?.garmentDataUrls?.length
      );
      if (hasPreviewA === hasPreviewB) return 0;
      return hasPreviewA ? -1 : 1;
    });
  }, [storyboards, activeFilter, runtimeById, savedPreviewByStoryboardId]);

  function handleOpen(id: string) {
    if (isGenerating) return;
    onOpen(id);
  }

  return (
    <div className="storyboardLibrary">
      <div className="storyboardLibraryHeader" data-tour="generate-moodboard-header">
        <div>
          <div className="sectionTitle" style={{ margin: "0 0 6px" }}>Mood Boards</div>
          <div className="title" style={{ fontSize: 18, margin: 0 }}>Pick an idea to continue</div>
          <div className="muted" style={{ marginTop: 6 }}>Mood boards are stored locally in this browser.</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button type="button" className="tourBannerBtn" onClick={() => startTour("generate")} style={{ whiteSpace: "nowrap" }}>
            ▶ Quick Tour
          </button>
          <button type="button" className="btnSecondary" onClick={onCreate} disabled={isGenerating} data-tour="generate-new-board">
            New mood board
          </button>
        </div>
      </div>

      {/* ── Garment Type Filter ──────────────────────────────────── */}
      {filterOptions.length > 0 && (
        <div className="garmentFilterBar">
          <span className="garmentFilterLabel">Filter by garment:</span>
          <div className="garmentFilterPills">
            <button
              type="button"
              className={["garmentFilterPill", !activeFilter ? "garmentFilterPillActive" : ""].filter(Boolean).join(" ")}
              onClick={() => setActiveFilter("")}
            >
              All
            </button>
            {filterOptions.map((type) => (
              <button
                key={type}
                type="button"
                className={["garmentFilterPill", activeFilter === type ? "garmentFilterPillActive" : ""].filter(Boolean).join(" ")}
                onClick={() => setActiveFilter(activeFilter === type ? "" : type)}
              >
                {type}
                <span className="garmentFilterCount">
                  {storyboards.filter((sb) => sb.garmentType?.trim() === type).length}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Floating create button ──────────────────────────────── */}
      <button
        type="button"
        onClick={onCreate}
        disabled={isGenerating}
        title="New mood board"
        style={{
          position: "fixed",
          bottom: 32,
          right: 32,
          zIndex: 999,
          width: 56,
          height: 56,
          borderRadius: "9999px",
          border: "2px solid #1E293B",
          background: isGenerating
            ? "#E2E8F0"
            : "linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)",
          color: isGenerating ? "#94A3B8" : "#fff",
          boxShadow: isGenerating ? "none" : "4px 4px 0 #1E293B",
          cursor: isGenerating ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "transform .2s cubic-bezier(.34,1.56,.64,1), box-shadow .2s",
        }}
        onMouseEnter={e => {
          if (!isGenerating) {
            e.currentTarget.style.transform = "translate(-2px,-2px) scale(1.08)";
            e.currentTarget.style.boxShadow = "6px 6px 0 #1E293B";
          }
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = "";
          e.currentTarget.style.boxShadow = isGenerating ? "none" : "4px 4px 0 #1E293B";
        }}
      >
        <Plus size={26} strokeWidth={2.5} />
      </button>

      <div className="storyboardGallery" role="list" aria-label="Mood Boards" data-tour="generate-moodboard-cards">
        {filtered.length === 0 ? (
          <div className="muted" style={{ padding: "24px 0" }}>
            No mood boards match "{activeFilter}".
          </div>
        ) : (
          filtered.map((sb) => {
            const rt = runtimeById[sb.id];
            const isActive = sb.id === activeId;
            return (
              <div key={sb.id} className="storyboardCardWrapper" role="listitem">
                <div
                  className={[
                    "storyboardCard",
                    isActive ? "storyboardCardActive" : "",
                    isGenerating ? "storyboardCardDisabled" : "",
                  ].filter(Boolean).join(" ")}
                  role="button"
                  tabIndex={isGenerating ? -1 : 0}
                  aria-selected={isActive ? "true" : "false"}
                  aria-disabled={isGenerating ? "true" : "false"}
                  onClick={() => handleOpen(sb.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleOpen(sb.id);
                    }
                  }}
                >
                  <div className="storyboardCardPreview" aria-hidden="true">
                    {rt?.resultDataUrl ? (
                      <img src={rt.resultDataUrl} alt="" draggable={false} loading="lazy" decoding="async" />
                    ) : savedPreviewByStoryboardId[sb.id] ? (
                      <img src={savedPreviewByStoryboardId[sb.id]} alt="" draggable={false} loading="lazy" decoding="async" />
                    ) : rt?.garmentDataUrls?.length ? (
                      <img src={rt.garmentDataUrls[0]} alt="" draggable={false} loading="lazy" decoding="async" />
                    ) : (
                      <div className="storyboardCardPreviewPlaceholder">No preview yet</div>
                    )}
                  </div>
                  <div className="storyboardCardTop">
                    <div className="storyboardCardTitle">{sb.title}</div>
                    <div className="storyboardCardMeta">{formatTimestamp(sb.updatedAt)}</div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
