export type AppTabKey = "generate" | "tryon" | "saved" | "assets" | "dashboard" | "multiangle";

export type TabVisibilityMap = Record<AppTabKey, boolean>;

const TAB_VIS_KEY = "bsx_tab_vis_v1";

export const TAB_LABELS: Record<AppTabKey, string> = {
  generate:   "Generate Images",
  tryon:      "Try On",
  saved:      "Saved Images",
  assets:     "Uploaded Assets",
  dashboard:  "Dashboard",
  multiangle: "Multi-Angle",
};

export const DEFAULT_TAB_VISIBILITY: TabVisibilityMap = {
  generate:   true,
  tryon:      true,
  saved:      true,
  assets:     true,
  dashboard:  true,
  multiangle: true,
};

// Fired in the same tab after saveTabVisibility so App.tsx can react instantly.
export const TAB_VIS_CHANGE_EVENT = "bsx:tabVisChange";

export function loadTabVisibility(): TabVisibilityMap {
  try {
    const raw = localStorage.getItem(TAB_VIS_KEY);
    return raw ? { ...DEFAULT_TAB_VISIBILITY, ...JSON.parse(raw) } : { ...DEFAULT_TAB_VISIBILITY };
  } catch {
    return { ...DEFAULT_TAB_VISIBILITY };
  }
}

export function saveTabVisibility(map: TabVisibilityMap): void {
  localStorage.setItem(TAB_VIS_KEY, JSON.stringify(map));
  window.dispatchEvent(new CustomEvent<TabVisibilityMap>(TAB_VIS_CHANGE_EVENT, { detail: map }));
}
