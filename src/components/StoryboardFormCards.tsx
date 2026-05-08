import { useState, useMemo, useEffect } from "react";
import FieldLabel from "./FieldLabel";
import LogoLoader from "./LogoLoader";
import PillRadioGroup from "./PillRadioGroup";
import type { StoryboardConfig } from "../lib/storyboards";
import { modelTemplates, type ModelTemplate } from "../lib/modelLibrary";
import { backgroundTemplates, type BackgroundTemplate } from "../lib/backgroundLibrary";
import { poseTemplates, type PoseTemplate } from "../lib/poseLibrary";
import { apiGet } from "../lib/api";
import {
  backgroundThemeOptions,
  footwearPresetOptions,
  modelAgeRangeOptions,
  modelEthnicityOptions,
  modelGenderOptions,
  modelPosePresetOptions,
  modelStylingPresetOptions,
  occasionPresetOptions,
} from "../lib/presets";

// Extended types that allow backend proxy URLs for admin-uploaded templates
type ModelTemplateExt = ModelTemplate & { imageProxyUrl?: string };
type PoseTemplateExt = PoseTemplate & { imageProxyUrl?: string };
type BackgroundTemplateExt = BackgroundTemplate & { imageProxyUrl?: string };

type RuntimeLite = {
  garmentDataUrls: string[];
  garmentFileNames: string[];
  backgroundDataUrls: string[];
  modelDataUrls: string[];
  poseDataUrls: string[];
  generateError: string | null;
};

type SavedPrint = { id: string; url: string; title: string; fileName?: string; storyboardId?: string; storyboardTitle?: string; createdAt: number };

type PrintBundle = { id: string; storyboardTitle?: string; storyboardId?: string; images: SavedPrint[]; earliestCreatedAt: number };

function groupPrintsByStoryboard(prints: SavedPrint[]): PrintBundle[] {
  // Group ALL prints from the same storyboard together (no time limit).
  // This ensures front+back+side prints always appear as one selectable bundle.
  const sorted = [...prints].sort((a, b) => b.createdAt - a.createdAt);
  const bundles: PrintBundle[] = [];
  for (const p of sorted) {
    const match = bundles.find((b) => {
      if (p.storyboardId && b.storyboardId) return p.storyboardId === b.storyboardId;
      if (!p.storyboardId && !b.storyboardId && p.storyboardTitle && b.storyboardTitle)
        return p.storyboardTitle === b.storyboardTitle;
      return false;
    });
    if (match) {
      match.images.push(p);
      if (p.createdAt < match.earliestCreatedAt) match.earliestCreatedAt = p.createdAt;
    } else {
      bundles.push({ id: p.id, storyboardId: p.storyboardId, storyboardTitle: p.storyboardTitle, images: [p], earliestCreatedAt: p.createdAt });
    }
  }
  return bundles;
}

function PrintBundleCard({
  bundle,
  addGarmentFromDataUrl,
  addGarmentBundle,
}: {
  bundle: PrintBundle;
  addGarmentFromDataUrl: (url: string, fileName: string) => void;
  addGarmentBundle: (items: { url: string; fileName: string }[]) => Promise<void>;
}) {
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");

  const handleUseAll = async () => {
    setStatus("loading");
    try {
      // Sort images so front comes before back comes before side
      const viewOrder = (img: SavedPrint): number => {
        const s = ((img.fileName || "") + " " + (img.title || "")).toLowerCase();
        if (s.includes("front")) return 0;
        if (s.includes("back")) return 1;
        if (s.includes("side")) return 2;
        return 3;
      };
      const sorted = [...bundle.images].sort((a, b) => viewOrder(a) - viewOrder(b));
      await addGarmentBundle(
        sorted.map((img) => ({ url: img.url, fileName: img.fileName || `print-${img.id}.png` }))
      );
      setStatus("done");
      setTimeout(() => setStatus("idle"), 2000);
    } catch (err) {
      console.error("Failed to add bundle images", err);
      setStatus("idle");
    }
  };

  const count = bundle.images.length;
  const gridCount = Math.min(count, 4) as 1 | 2 | 3 | 4;

  return (
    <div className="printBundleCard">
      {/* Thumbnail grid — matches Saved Images card layout */}
      <div className="printBundlePreview">
        {count > 1 && <span className="printBundleBadge">&times;{count}</span>}
        <div className="printBundleGrid" data-count={gridCount}>
          {bundle.images.slice(0, 4).map((img, i) => (
            <button
              key={img.id}
              type="button"
              className="printBundleThumb"
              onClick={() => addGarmentFromDataUrl(img.url, img.fileName || `print-${img.id}.png`)}
              title="Click to add this image only"
            >
              <img src={img.url} alt={img.title} draggable={false} />
              {i === 3 && count > 4 && <span className="printBundleMore">+{count - 3}</span>}
            </button>
          ))}
        </div>
      </div>
      {/* Meta + action */}
      <div className="printBundleMeta">
        <div className="printBundleTitle">{bundle.storyboardTitle || "Untitled"}</div>
        <div className="printBundleCount">{count} {count === 1 ? "print" : "prints"}</div>
      </div>
      <button
        type="button"
        className={`printBundleBtn ${status === "done" ? "printBundleBtnDone" : ""}`}
        onClick={handleUseAll}
        disabled={status === "loading"}
      >
        {status === "loading" ? "Adding..." : status === "done" ? "Added!" : "Use Bundle"}
      </button>
    </div>
  );
}

const bottomWearPresetOptions = [
  { value: "", label: "Auto" },
  { value: "bell bottom", label: "Bell bottom" },
  { value: "pleated pants", label: "Pleated pants" },
  { value: "skirts", label: "Skirts" },
  { value: "shorts", label: "Shorts" },
  { value: "skorts", label: "Skorts" },
  { value: "denim jeans wide", label: "Denim jeans wide" },
  { value: "custom", label: "Custom" },
];

const accessoriesPresetOptions = [
  { value: "none", label: "Nil" },
  { value: "studs", label: "Studs" },
  { value: "resin bracelets", label: "Resin bracelets" },
  { value: "earrings", label: "Earrings" },
  { value: "chunky gold earrings", label: "Chunky gold earrings" },
  { value: "chunky silver earrings", label: "Chunky silver earrings" },
  { value: "handbag clutch", label: "Handbag clutch" },
  { value: "sunglasses", label: "Sunglasses" },
];

function normalizeToken(v: string) {
  return (v || "").trim().replace(/\s+/g, " ").toLowerCase();
}
function parseTokenList(raw: string): string[] {
  return (raw || "").split(/[;,]/g).map((p) => p.trim()).filter(Boolean);
}

interface StoryboardFormCardsProps {
  config: StoryboardConfig;
  onConfigUpdate: (updates: Partial<StoryboardConfig>) => void;
  runtime: RuntimeLite;
  activeStoryboardId: string;
  garmentType: string;
  isGenerating: boolean;
  onGarmentFrontFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onGarmentBackFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBackgroundFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onModelFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPoseFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeGarmentImage: (idx: number) => void;
  removeBackgroundImage: (idx: number) => void;
  removeModelImage: (idx: number) => void;
  removePoseImage: (idx: number) => void;
  savedPrints: SavedPrint[];
  backgroundAssetImages: SavedPrint[];
  modelAssetImages: SavedPrint[];
  poseAssetImages: SavedPrint[];
  garmentAssetImages: SavedPrint[];
  addGarmentFromDataUrl: (url: string, fileName: string) => void;
  addGarmentBundle: (items: { url: string; fileName: string }[]) => Promise<void>;
  addBackgroundFromDataUrl: (url: string, fileName: string) => void;
  addModelFromDataUrl: (url: string, fileName: string) => void;
  addPoseFromDataUrl: (url: string, fileName: string) => void;
  onSubmit: () => void;
  onOpenImage: (src: string, title: string, alt?: string) => void;
}

export default function StoryboardFormCards({
  config,
  onConfigUpdate,
  runtime,
  activeStoryboardId,
  garmentType,
  isGenerating,
  onGarmentFrontFileChange,
  onGarmentBackFileChange,
  onBackgroundFileChange,
  onModelFileChange,
  onPoseFileChange,
  removeGarmentImage,
  removeBackgroundImage,
  removeModelImage,
  removePoseImage,
  savedPrints,
  backgroundAssetImages,
  modelAssetImages,
  poseAssetImages,
  garmentAssetImages,
  addGarmentFromDataUrl,
  addGarmentBundle,
  addBackgroundFromDataUrl,
  addModelFromDataUrl,
  addPoseFromDataUrl,
  onSubmit,
  onOpenImage,
}: StoryboardFormCardsProps) {
  const isFlashModel = (config.imageModel || "").toLowerCase().includes("flash");

  const [showSavedPrints, setShowSavedPrints] = useState(false);
  const [showSavedGarments, setShowSavedGarments] = useState(false);
  const [showSavedBackgrounds, setShowSavedBackgrounds] = useState(false);
  const [showSavedModels, setShowSavedModels] = useState(false);
  const [showSavedPoses, setShowSavedPoses] = useState(false);
  const [modelTab, setModelTab] = useState<"template" | "custom">("template");
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);
  const [bgTab, setBgTab] = useState<"template" | "custom">("template");
  const [isLoadingBgTemplate, setIsLoadingBgTemplate] = useState(false);
  const [poseTab, setPoseTab] = useState<"template" | "custom">("template");
  const [isLoadingPoseTemplate, setIsLoadingPoseTemplate] = useState(false);
  const [poseCategoryFilter, setPoseCategoryFilter] = useState<string>("");
  const [bgCategoryFilter, setBgCategoryFilter] = useState<string>("");
  const [modelEthnicityFilter, setModelEthnicityFilter] = useState<string>("");
  const [autoConfigEnabled, setAutoConfigEnabled] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ id: string; label: string; hint: string; sectionId: string }[]>([]);
  const [showValidationPopup, setShowValidationPopup] = useState(false);

  // DB templates (admin-uploaded) merged with static libraries
  const [dbTemplates, setDbTemplates] = useState<any[]>([]);
  const [disabledStaticIds, setDisabledStaticIds] = useState<Set<string>>(new Set());
  useEffect(() => {
    apiGet("/api/templates")
      .then((d: any) => {
        setDbTemplates(d.templates ?? []);
        setDisabledStaticIds(new Set((d.disabledIds ?? []) as string[]));
      })
      .catch(() => { });
  }, []);

  const allModelTemplates = useMemo<ModelTemplateExt[]>(() => [
    ...modelTemplates.filter((t) => !disabledStaticIds.has(t.id)),
    ...dbTemplates
      .filter((t) => t.category === "model" && t.imageProxyUrl)
      .map((t): ModelTemplateExt => ({
        id: t.id,
        category: (t.metadata as any)?.subCategory ?? "Other",
        label: t.title,
        ethnicityLabel: (t.metadata as any)?.ethnicityLabel ?? "",
        url: "",
        ethnicityKeyword: (t.metadata as any)?.ethnicityKeyword ?? t.title,
        imageProxyUrl: t.imageProxyUrl,
      })),
  ], [dbTemplates, disabledStaticIds]);

  const allPoseTemplates = useMemo<PoseTemplateExt[]>(() => [
    ...poseTemplates.filter((t) => !disabledStaticIds.has(t.id)),
    ...dbTemplates
      .filter((t) => t.category === "pose" && t.imageProxyUrl)
      .map((t): PoseTemplateExt => ({
        id: t.id,
        category: (t.metadata as any)?.garmentCategory ?? "Other",
        label: (t.metadata as any)?.poseLabel ?? t.title,
        url: "",
        poseKeyword: (t.metadata as any)?.poseKeyword ?? t.title,
        imageProxyUrl: t.imageProxyUrl,
      })),
  ], [dbTemplates, disabledStaticIds]);

  const allBgTemplates = useMemo<BackgroundTemplateExt[]>(() => [
    ...backgroundTemplates.filter((t) => !disabledStaticIds.has(t.id)),
    ...dbTemplates
      .filter((t) => t.category === "background" && t.imageProxyUrl)
      .map((t): BackgroundTemplateExt => ({
        id: t.id,
        category: (t.metadata as any)?.bgCategory ?? "Environments",
        label: t.title,
        url: "",
        themePreset: (t.metadata as any)?.themePreset ?? "custom",
        themeDetails: (t.metadata as any)?.themeDetails ?? "",
        imageProxyUrl: t.imageProxyUrl,
      })),
  ], [dbTemplates, disabledStaticIds]);

  const bgCategories = useMemo(() => {
    const seen = new Set<string>();
    for (const t of allBgTemplates) seen.add(t.category);
    return Array.from(seen);
  }, [allBgTemplates]);

  const filteredBgTemplates = useMemo(() => {
    if (!bgCategoryFilter) return allBgTemplates;
    return allBgTemplates.filter((t) => t.category === bgCategoryFilter);
  }, [bgCategoryFilter, allBgTemplates]);

  const modelEthnicities = useMemo(() => {
    const seen = new Set<string>();
    for (const t of allModelTemplates) seen.add(t.ethnicityLabel);
    return Array.from(seen);
  }, [allModelTemplates]);

  const filteredModelsByCategory = useMemo(() => {
    const filtered = modelEthnicityFilter
      ? allModelTemplates.filter((t) => t.ethnicityLabel === modelEthnicityFilter)
      : allModelTemplates;
    const map = new Map<string, ModelTemplateExt[]>();
    for (const t of filtered) {
      if (!map.has(t.category)) map.set(t.category, []);
      map.get(t.category)!.push(t);
    }
    return map;
  }, [modelEthnicityFilter, allModelTemplates]);

  // imageProxyUrl = same-origin backend proxy (works for both <img> and fetch())
  // url = static bundled asset path for built-in templates
  function getTemplateImageUrl(tmpl: { url: string; imageProxyUrl?: string }): string {
    if ((tmpl as any).imageProxyUrl) return (tmpl as any).imageProxyUrl as string;
    return (import.meta.env.BASE_URL || "/").replace(/\/$/, "") + tmpl.url;
  }

  const handleSelectBgTemplate = async (tmpl: BackgroundTemplateExt) => {
    const imageUrl = getTemplateImageUrl(tmpl);
    if (!imageUrl) {
      alert("This template is currently a placeholder and pending generation due to API limits. It will be available later!");
      return;
    }
    setIsLoadingBgTemplate(true);
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        const b64 = reader.result as string;
        addBackgroundFromDataUrl(b64, `bg_template_${tmpl.id}.png`);
        onConfigUpdate({
          backgroundThemePreset: tmpl.themePreset,
          backgroundThemeDetails: tmpl.themeDetails,
        });
      };
      reader.readAsDataURL(blob);
    } catch (e) {
      console.error("Failed to load background template", e);
      alert("Failed to load template background. Please try again.");
    } finally {
      setIsLoadingBgTemplate(false);
    }
  };

  const handleSelectTemplate = async (tmpl: ModelTemplateExt) => {
    setIsLoadingTemplate(true);
    try {
      const imageUrl = getTemplateImageUrl(tmpl);
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        const b64 = reader.result as string;
        addModelFromDataUrl(b64, `template_${tmpl.id}.png`);
        onConfigUpdate({
          modelPreset: "",
          modelDetails: tmpl.ethnicityKeyword,
        });
      };
      reader.readAsDataURL(blob);
    } catch (e) {
      console.error("Failed to load template", e);
      alert("Failed to load template model. Please try again.");
    } finally {
      setIsLoadingTemplate(false);
    }
  };

  const poseCategories = useMemo(() => {
    const seen = new Set<string>();
    for (const t of allPoseTemplates) seen.add(t.category);
    return Array.from(seen);
  }, [allPoseTemplates]);

  const filteredPosesByCategory = useMemo(() => {
    const filtered = poseCategoryFilter
      ? allPoseTemplates.filter((t) => t.category === poseCategoryFilter)
      : allPoseTemplates;
    const outer = new Map<string, Map<string, PoseTemplateExt[]>>();
    for (const t of filtered) {
      if (!outer.has(t.category)) outer.set(t.category, new Map());
      const inner = outer.get(t.category)!;
      if (!inner.has(t.label)) inner.set(t.label, []);
      inner.get(t.label)!.push(t);
    }
    return outer;
  }, [poseCategoryFilter, allPoseTemplates]);

  const handleSelectPoseTemplate = async (tmpl: PoseTemplateExt) => {
    setIsLoadingPoseTemplate(true);
    try {
      const imageUrl = getTemplateImageUrl(tmpl);
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        const b64 = reader.result as string;
        addPoseFromDataUrl(b64, `pose_template_${tmpl.id}.jpg`);
        onConfigUpdate({
          modelPosePreset: "",
          modelPoseDetails: tmpl.poseKeyword,
        });
      };
      reader.readAsDataURL(blob);
    } catch (e) {
      console.error("Failed to load pose template", e);
      alert("Failed to load template pose. Please try again.");
    } finally {
      setIsLoadingPoseTemplate(false);
    }
  };

  // Accessories checkbox logic
  const accessoriesSelected = useMemo<string[]>(() => {
    const rawTokens = parseTokenList(config.accessories);
    const canonicalByNorm = new Map(accessoriesPresetOptions.map((o) => [normalizeToken(o.value), o.value]));
    const out: string[] = [];
    const seen = new Set<string>();
    for (const t of rawTokens) {
      const norm = normalizeToken(t);
      const canonical = canonicalByNorm.get(norm) ?? t.trim();
      const key = normalizeToken(canonical);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(canonical);
    }
    return out;
  }, [config.accessories]);

  function handleAccessoryToggle(value: string, checked: boolean) {
    const current = new Map(accessoriesSelected.map((v) => [normalizeToken(v), v]));
    if (checked) {
      current.set(normalizeToken(value), value);
    } else {
      current.delete(normalizeToken(value));
    }
    onConfigUpdate({ accessories: Array.from(current.values()).join(", ") });
  }

  function getValidationErrors() {
    const errors: { id: string; label: string; hint: string; sectionId: string }[] = [];

    if (!garmentType?.trim()) {
      errors.push({ id: "garment", label: "Garment type", hint: "Select a type (T-shirt, Shirt…) or type a custom one", sectionId: "section-garment-type" });
    }

    if (!isFlashModel && runtime.modelDataUrls.length === 0) {
      errors.push({ id: "model", label: "Model selection", hint: "Select a template model or upload a model photo", sectionId: "section-model-person" });
    }

    const hasPose = (runtime.poseDataUrls?.length ?? 0) > 0 || !!config.modelPosePreset || !!config.modelPoseDetails;
    if (!hasPose) {
      errors.push({ id: "pose", label: "Model pose", hint: "Select a pose template or choose a pose preset", sectionId: "section-model-pose" });
    }

    const hasBg = runtime.backgroundDataUrls.length > 0 || !!config.backgroundThemePreset;
    if (!hasBg) {
      errors.push({ id: "background", label: "Background", hint: "Select a background template or choose a theme", sectionId: "section-background" });
    }

    return errors;
  }

  function scrollToSection(sectionId: string) {
    setShowValidationPopup(false);
    setTimeout(() => {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  }

  function handleAutoConfigToggle(enabled: boolean) {
    setAutoConfigEnabled(enabled);
    if (!enabled) return;

    // Pick a random pose keyword (text only) from the garment's template category
    const normalizedGarment = (garmentType || "").trim().toLowerCase();
    const poseKeywords = allPoseTemplates
      .filter((t) => t.category.toLowerCase() === normalizedGarment)
      .map((t) => t.poseKeyword);
    const poseKeyword = poseKeywords.length > 0
      ? poseKeywords[Math.floor(Math.random() * poseKeywords.length)]
      : "";

    onConfigUpdate({
      accessories: "none",
      footwearPreset: "",
      footwearDetails: "",
      bottomWearPreset: "",
      bottomWearDetails: "",
      modelStylingPreset: "",
      modelStylingNotes: "",
      occasionPreset: "",
      occasionDetails: "",
      backgroundThemePreset: "studio — bright modern ecommerce studio set; seamless backdrop or clean wall; soft diffused daylight; neutral tones; minimal props",
      backgroundThemeDetails: "",
      modelPosePreset: "",
      modelPoseDetails: poseKeyword,
    });
    setBgTab("custom");

    setTimeout(() => {
      document.getElementById("flash-generate-section")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 150);
  }

  return (
    <form className="storyboardForm" onSubmit={(e) => {
      e.preventDefault();
      const errors = getValidationErrors();
      if (errors.length > 0) {
        setValidationErrors(errors);
        setShowValidationPopup(true);
        setTimeout(() => {
          document.getElementById(errors[0].sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 80);
        return;
      }
      onSubmit();
    }}>
      <fieldset className="formFieldset" disabled={isGenerating}>
        <div className="storyboardCards">
          {/* ── Garment Photos ── */}
          <div className="parameterSection">
            <div className="sectionTitle" style={{ marginTop: 0 }}>Garment photos</div>
            <div className="uploadNote">Upload only garment or clothing photos — flat lay, on hanger, or worn on a mannequin. Do not include models or backgrounds.</div>

            <div className="garmentSlotGrid">
              {/* Front slot — required */}
              <div className="garmentSlotWrapper">
                <div className="garmentSlotLabel">
                  Front view
                  <span className="garmentSlotRequired">required</span>
                </div>
                {runtime.garmentDataUrls[0] ? (
                  <div className="previewItem garmentSlotPreview">
                    <img src={runtime.garmentDataUrls[0]} alt="Garment front" draggable={false} onClick={() => onOpenImage(runtime.garmentDataUrls[0]!, "Garment — front view")} />
                    <button type="button" className="removePreviewButton" onClick={() => removeGarmentImage(0)} aria-label="Remove front garment" title="Remove">
                      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18" /><path d="M6 6l12 12" /></svg>
                    </button>
                  </div>
                ) : (
                  <label htmlFor={`garmentFront-${activeStoryboardId}`} className="garmentUploadSlot">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 22, height: 22 }}>
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    <span>Upload front</span>
                  </label>
                )}
                <input id={`garmentFront-${activeStoryboardId}`} type="file" accept="image/*" onChange={onGarmentFrontFileChange} style={{ display: "none" }} />
              </div>

              {/* Back slot — optional */}
              <div className="garmentSlotWrapper">
                <div className="garmentSlotLabel">
                  Back view
                  <span className="garmentSlotOptional">optional</span>
                </div>
                {runtime.garmentDataUrls[1] ? (
                  <div className="previewItem garmentSlotPreview">
                    <img src={runtime.garmentDataUrls[1]} alt="Garment back" draggable={false} onClick={() => onOpenImage(runtime.garmentDataUrls[1]!, "Garment — back view")} />
                    <button type="button" className="removePreviewButton" onClick={() => removeGarmentImage(1)} aria-label="Remove back garment" title="Remove">
                      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18" /><path d="M6 6l12 12" /></svg>
                    </button>
                  </div>
                ) : (
                  <label
                    htmlFor={`garmentBack-${activeStoryboardId}`}
                    className={`garmentUploadSlot${!runtime.garmentDataUrls[0] ? " garmentUploadSlotDisabled" : ""}`}
                    title={!runtime.garmentDataUrls[0] ? "Upload front view first" : ""}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 22, height: 22 }}>
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    <span>Upload back</span>
                  </label>
                )}
                <input id={`garmentBack-${activeStoryboardId}`} type="file" accept="image/*" disabled={!runtime.garmentDataUrls[0]} onChange={onGarmentBackFileChange} style={{ display: "none" }} />
              </div>
            </div>

            {runtime.garmentDataUrls[0] && !runtime.garmentDataUrls[1] && (
              <div className="muted" style={{ marginTop: 8, fontSize: 12 }}>
                Tip: adding a back view improves garment accuracy in generated images.
              </div>
            )}

            <div className="chooseFromPrints" style={{ marginTop: 16 }}>
              <button type="button" className="toggle-assets-btn" onClick={() => setShowSavedPrints((v) => !v)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  style={{ transform: showSavedPrints ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
                <span>Choose from Printed Garments</span>
              </button>
              {showSavedPrints && savedPrints.length > 0 && (
                <div className="printBundlesWrap">
                  <label>Saved Prints</label>
                  <div className="printBundlesScroll">
                    {groupPrintsByStoryboard(savedPrints).map((bundle) => (
                      <PrintBundleCard
                        key={bundle.id}
                        bundle={bundle}
                        addGarmentFromDataUrl={addGarmentFromDataUrl}
                        addGarmentBundle={addGarmentBundle}
                      />
                    ))}
                  </div>
                </div>
              )}
              {showSavedPrints && !savedPrints.length && (
                <div className="muted" style={{ marginTop: 8 }}>No saved prints found. Go to "Add Prints" to generate some.</div>
              )}
            </div>

            <div className="chooseFromAssets" style={{ marginTop: 8 }}>
              <button type="button" className="toggle-assets-btn" onClick={() => setShowSavedGarments((v) => !v)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  style={{ transform: showSavedGarments ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
                <span>Choose from Uploaded Garments</span>
              </button>
              {showSavedGarments && garmentAssetImages.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <label>Saved Garments</label>
                  <div className="preview previewGarments">
                    {garmentAssetImages.map((asset, idx) => (
                      <div key={asset.id} className="previewItem" onClick={() => addGarmentFromDataUrl(asset.url, asset.fileName || `garment-asset-${idx}.png`)} title="Click to add as garment">
                        <img src={asset.url} alt={asset.title} draggable={false} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {showSavedGarments && !garmentAssetImages.length && (
                <div className="muted" style={{ marginTop: 8 }}>No uploaded garments in library yet. Upload a garment photo above to save it.</div>
              )}
            </div>
          </div>

          {/* ── Flash Auto Configure ── */}
          {isFlashModel && (
            <div
              className="parameterSection"
              style={{
                background: autoConfigEnabled
                  ? "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)"
                  : "var(--surface, #f8f8f8)",
                border: `1.5px solid ${autoConfigEnabled ? "#c4b5fd" : "var(--border, #e2e8f0)"}`,
                borderRadius: 12,
                transition: "background 0.3s, border-color 0.3s",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                {/* Icon */}
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 10,
                    background: autoConfigEnabled ? "#7c3aed" : "#ede9fe",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    transition: "background 0.3s",
                    boxShadow: autoConfigEnabled ? "0 2px 8px rgba(124,58,237,0.35)" : "none",
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                    stroke={autoConfigEnabled ? "#ffffff" : "#7c3aed"}
                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    style={{ transition: "stroke 0.3s" }}>
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                    <path d="M4.93 4.93a10 10 0 0 0 0 14.14" />
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                    <path d="M8.46 8.46a5 5 0 0 0 0 7.07" />
                  </svg>
                </div>

                {/* Label */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
                    <span style={{
                      fontWeight: 700,
                      fontSize: "0.9rem",
                      color: autoConfigEnabled ? "#5b21b6" : "var(--text, #1e293b)",
                      transition: "color 0.3s",
                      fontFamily: "var(--font-body)",
                    }}>
                      Auto Configure
                    </span>
                    <span style={{
                      fontSize: "0.6rem",
                      fontWeight: 800,
                      background: "#7c3aed",
                      color: "#fff",
                      padding: "2px 7px",
                      borderRadius: 6,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase" as const,
                    }}>
                      Flash
                    </span>
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted, #64748b)", lineHeight: 1.4 }}>
                    Sets footwear · bottomwear · pose · background · occasion automatically
                  </div>
                </div>

                {/* Toggle switch */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={autoConfigEnabled}
                  onClick={() => handleAutoConfigToggle(!autoConfigEnabled)}
                  style={{
                    width: 46,
                    height: 26,
                    borderRadius: 999,
                    border: `1.5px solid ${autoConfigEnabled ? "#7c3aed" : "#d1d5db"}`,
                    cursor: "pointer",
                    background: autoConfigEnabled ? "#7c3aed" : "#e5e7eb",
                    position: "relative",
                    transition: "background 0.25s, border-color 0.25s",
                    flexShrink: 0,
                    padding: 0,
                    outline: "none",
                    boxShadow: autoConfigEnabled ? "0 0 0 3px rgba(124,58,237,0.2)" : "none",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      top: 2,
                      left: autoConfigEnabled ? 20 : 2,
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      background: "white",
                      transition: "left 0.25s cubic-bezier(0.4,0,0.2,1)",
                      display: "block",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
                    }}
                  />
                </button>
              </div>
            </div>
          )}

          {/* ── Models ── */}
          <div id="section-model-person" className="parameterSection">
            <div className="sectionTitle" style={{ marginTop: 0 }}>Model Person</div>

            <>
                <div className="pillGroup" role="group" aria-label="Model Reference Type" style={{ marginBottom: 16 }}>
                  <label className="pill">
                    <input type="radio" value="template" checked={modelTab === "template"} onChange={() => setModelTab("template")} />
                    <span>Template Models</span>
                  </label>
                  <label className="pill">
                    <input type="radio" value="custom" checked={modelTab === "custom"} onChange={() => setModelTab("custom")} />
                    <span>Custom</span>
                  </label>
                </div>

                {modelTab === "template" && (
                  <div className="templateModelsSection" style={{ marginBottom: 24, padding: "12px", background: "rgba(255,255,255,0.03)", borderRadius: "8px" }}>
                    <div style={{ marginBottom: 12 }} className="muted">Choose a pre-built character. We will generate the look on this exact person.</div>
                    <div className="pillGroup" role="group" aria-label="Model ethnicity filter" style={{ marginBottom: 14 }}>
                      <button
                        type="button"
                        className={["garmentFilterPill", !modelEthnicityFilter ? "garmentFilterPillActive" : ""].filter(Boolean).join(" ")}
                        onClick={() => setModelEthnicityFilter("")}
                      >All</button>
                      {modelEthnicities.map((eth) => (
                        <button
                          key={eth}
                          type="button"
                          className={["garmentFilterPill", modelEthnicityFilter === eth ? "garmentFilterPillActive" : ""].filter(Boolean).join(" ")}
                          onClick={() => setModelEthnicityFilter(modelEthnicityFilter === eth ? "" : eth)}
                        >{eth}</button>
                      ))}
                    </div>
                    <div style={{ maxHeight: 260, overflowY: "auto", paddingRight: 4 }}>
                      {Array.from(filteredModelsByCategory.entries()).map(([cat, templates]) => (
                        <div key={cat} style={{ marginBottom: 16 }}>
                          <div style={{ fontWeight: 600, marginBottom: 8, fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "rgba(255,255,255,0.6)" }}>{cat}</div>
                          <div className="preview previewAssets">
                            {templates.map((tmpl) => (
                              <div key={tmpl.id} className="previewItem" style={{ cursor: "pointer" }} onClick={() => handleSelectTemplate(tmpl)} title={`${tmpl.label} — ${tmpl.ethnicityLabel}`}>
                                <img src={getTemplateImageUrl(tmpl)} alt={tmpl.label} draggable={false} />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    {isLoadingTemplate && <div style={{ marginTop: 16, display: "flex", justifyContent: "center" }}><LogoLoader size={52} color="var(--text)" label="Loading template..." /></div>}
                  </div>
                )}

                {modelTab === "custom" && (
                  <div className="customModelSection" style={{ marginBottom: 24, padding: "12px", background: "rgba(255,255,255,0.03)", borderRadius: "8px" }}>
                    {isFlashModel ? (
                      <>
                        <FieldLabel label="Gender" info="Select the model's gender." />
                        <PillRadioGroup name="modelGender" value={config.modelGender} options={modelGenderOptions} onChange={(v) => onConfigUpdate({ modelGender: v })} />
                        <div style={{ height: 14 }} />
                        <FieldLabel label="Age Range" info="Select the model's age range." />
                        <PillRadioGroup name="modelAgeRange" value={config.modelAgeRange} options={modelAgeRangeOptions} onChange={(v) => onConfigUpdate({ modelAgeRange: v })} />
                        <div style={{ height: 14 }} />
                        <FieldLabel label="Ethnicity" info="Use this to bias the generated model's ethnicity." />
                        <PillRadioGroup name="modelPreference" value={config.modelPreset} options={modelEthnicityOptions} onChange={(v) => onConfigUpdate({ modelPreset: v })} />
                        <div style={{ height: 14 }} />
                        <FieldLabel label="Custom notes" info="Optional extra description — e.g. curly hair, athletic build." />
                        <input className="control" type="text" value={config.modelCustomPrompt} onChange={(e) => onConfigUpdate({ modelCustomPrompt: e.target.value })} placeholder="e.g. curly hair, athletic build, confident expression" />
                        <div style={{ height: 14 }} />
                      </>
                    ) : (
                      <div>
                        <FieldLabel label="Model Preference" info="Use this to bias the generated model (ethnicity / vibe)." />
                        <PillRadioGroup name="modelPreference" value={config.modelPreset} options={modelEthnicityOptions} onChange={(v) => onConfigUpdate({ modelPreset: v })} />
                        <div style={{ height: 14 }} />
                        <input className="control" type="text" value={config.modelDetails} onChange={(e) => onConfigUpdate({ modelDetails: e.target.value })} placeholder="Optional: add model description (ethnicity, vibe, etc.)" />
                      </div>
                    )}

                    <div className="chooseFromAssets" style={{ marginTop: 16 }}>
                      <div style={{ marginBottom: 12 }}>
                        <FieldLabel label="Upload Custom Model" info="Upload an image to serve as the model directly." />
                        <label htmlFor={`upload-model-${activeStoryboardId}`} className="btnSecondary" style={{ display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer", marginTop: 4 }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15 }}>
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                          </svg>
                          Upload image
                        </label>
                        <input id={`upload-model-${activeStoryboardId}`} type="file" accept="image/*" style={{ display: "none" }} onChange={onModelFileChange} />
                      </div>

                      <button type="button" className="toggle-assets-btn" onClick={() => setShowSavedModels((v) => !v)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                          style={{ transform: showSavedModels ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                        <span>Choose from Uploaded Models</span>
                      </button>
                      {showSavedModels && modelAssetImages.length > 0 && (
                        <div style={{ marginTop: 12 }}>
                          <label>Saved Models</label>
                          <div className="preview previewAssets">
                            {modelAssetImages.map((asset, idx) => (
                              <div key={asset.id} className="previewItem" onClick={() => addModelFromDataUrl(asset.url, asset.fileName || `model-asset-${idx}.png`)} title="Click to add as model">
                                <img src={asset.url} alt={asset.title} draggable={false} />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {showSavedModels && !modelAssetImages.length && (
                        <div className="muted" style={{ marginTop: 8 }}>No uploaded models found. Go to "Uploaded Assets" to add some.</div>
                      )}
                    </div>
                  </div>
                )}
            </>

            {runtime.modelDataUrls.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <label>Selected Model Reference</label>
                <div className="preview previewAssets">
                  {runtime.modelDataUrls.map((src, idx) => (
                    <div key={`${activeStoryboardId}-model-ref-${idx}`} className="previewItem">
                      <img src={src} alt={`Model reference ${idx + 1}`} draggable={false} onClick={() => onOpenImage(src, "Model reference", "Model reference")} />
                      <button type="button" className="removePreviewButton" onClick={() => removeModelImage(idx)} aria-label={`Remove model image ${idx + 1}`} title="Remove image">
                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18" /><path d="M6 6l12 12" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Accessories ── */}
          <div className="parameterSection">
            <div className="sectionTitle" style={{ marginTop: 0 }}>Accessories</div>
            <div>
              <FieldLabel label="Accessories" info="Optional add-ons." />
              <div className="pillGroup" role="group" aria-label="Accessories presets" style={{ marginTop: 8 }}>
                {accessoriesPresetOptions.map((opt) => (
                  <label key={opt.value} className="pill">
                    <input type="checkbox" value={opt.value} checked={accessoriesSelected.some((s) => normalizeToken(s) === normalizeToken(opt.value))} onChange={(e) => handleAccessoryToggle(opt.value, e.target.checked)} />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
              <div style={{ height: 14 }} />
              <input className="control" type="text" value={config.accessories} onChange={(e) => onConfigUpdate({ accessories: e.target.value })} placeholder="Optional: add custom accessories (comma separated)" />
            </div>
          </div>

          {/* ── Footwear ── */}
          <div className="parameterSection">
            <div className="sectionTitle" style={{ marginTop: 0 }}>Footwear</div>
            <div>
              <FieldLabel label="Footwear" info="Choose footwear and optionally add details." />
              <PillRadioGroup name="footwear" value={config.footwearPreset} options={footwearPresetOptions} onChange={(v) => onConfigUpdate({ footwearPreset: v })} />
              <div style={{ height: 14 }} />
              <input className="control" type="text" value={config.footwearDetails} onChange={(e) => onConfigUpdate({ footwearDetails: e.target.value })} placeholder="Optional: add details (e.g., white sneakers, nude heels)" />
            </div>
          </div>

          {/* ── Bottom Wear ── */}
          <div className="parameterSection">
            <div className="sectionTitle" style={{ marginTop: 0 }}>Bottom Wear</div>
            <div>
              <FieldLabel label="Bottom Wear" info="Choose a bottom-wear pairing." />
              <PillRadioGroup name="bottomWear" value={config.bottomWearPreset} options={bottomWearPresetOptions} onChange={(v) => onConfigUpdate({ bottomWearPreset: v })} />
              <div style={{ height: 14 }} />
              <input className="control" type="text" value={config.bottomWearDetails} onChange={(e) => onConfigUpdate({ bottomWearDetails: e.target.value })} placeholder="Optional: add details or type a custom bottom wear" />
            </div>
          </div>

          {/* ── Model Styling ── */}
          <div className="parameterSection">
            <div className="sectionTitle" style={{ marginTop: 0 }}>Model Styling</div>
            <div>
              <FieldLabel label="Model styling notes" info="Pick a preset for hair/makeup/jewelry." />
              <PillRadioGroup name="modelStyling" value={config.modelStylingPreset} options={modelStylingPresetOptions} onChange={(v) => onConfigUpdate({ modelStylingPreset: v })} />
              <div style={{ height: 14 }} />
              <input className="control" type="text" value={config.modelStylingNotes} onChange={(e) => onConfigUpdate({ modelStylingNotes: e.target.value })} placeholder="Optional: add your own notes (hair/makeup/jewelry, vibe)" />
            </div>
          </div>

          {/* ── Pose ── */}
          <div id="section-model-pose" className="parameterSection">
            <div className="sectionTitle" style={{ marginTop: 0 }}>Model Pose</div>

            <div className="pillGroup" role="group" aria-label="Pose Reference Type" style={{ marginBottom: 16 }}>
              <label className="pill">
                <input type="radio" value="template" checked={poseTab === "template"} onChange={() => setPoseTab("template")} />
                <span>Template Poses</span>
              </label>
              <label className="pill">
                <input type="radio" value="custom" checked={poseTab === "custom"} onChange={() => setPoseTab("custom")} />
                <span>Custom Pose</span>
              </label>
            </div>

            {poseTab === "template" && (
              <div className="templateModelsSection" style={{ marginBottom: 24, padding: "12px", background: "rgba(255,255,255,0.03)", borderRadius: "8px" }}>
                <div style={{ marginBottom: 10 }} className="muted">Choose a pose template to guide the generation.</div>
                <div className="pillGroup" role="group" aria-label="Pose category filter" style={{ marginBottom: 14, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className={["garmentFilterPill", !poseCategoryFilter ? "garmentFilterPillActive" : ""].filter(Boolean).join(" ")}
                    onClick={() => setPoseCategoryFilter("")}
                  >All</button>
                  {poseCategories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      className={["garmentFilterPill", poseCategoryFilter === cat ? "garmentFilterPillActive" : ""].filter(Boolean).join(" ")}
                      onClick={() => setPoseCategoryFilter(poseCategoryFilter === cat ? "" : cat)}
                    >{cat}</button>
                  ))}
                </div>
                <div style={{ maxHeight: 340, overflowY: "auto", paddingRight: 4 }}>
                  {Array.from(filteredPosesByCategory.entries()).map(([garment, poseMap]) => (
                    <div key={garment} style={{ marginBottom: 20 }}>
                      {/* Garment header */}
                      <div style={{ fontWeight: 700, marginBottom: 10, fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--accent)", borderBottom: "1px solid rgba(0,0,0,0.05)", paddingBottom: 4 }}>
                        {garment}
                      </div>
                      {/* Pose sub-groups */}
                      {Array.from(poseMap.entries()).map(([poseName, templates]) => (
                        <div key={poseName} style={{ marginBottom: 12 }}>
                          <div style={{ fontWeight: 600, marginBottom: 6, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "rgba(255,255,255,0.5)" }}>
                            {poseName}
                          </div>
                          <div className="preview previewAssets">
                            {templates.map((tmpl) => (
                              <div key={tmpl.id} className="previewItem" style={{ cursor: "pointer" }} onClick={() => handleSelectPoseTemplate(tmpl)} title={`${garment} — ${poseName}`}>
                                <img
                                  src={getTemplateImageUrl(tmpl)}
                                  alt={poseName}
                                  draggable={false}
                                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                {isLoadingPoseTemplate && <div style={{ marginTop: 16, display: "flex", justifyContent: "center" }}><LogoLoader size={52} color="var(--text)" label="Loading template..." /></div>}
              </div>
            )}

            {poseTab === "custom" && (
              <div className="customModelSection" style={{ marginBottom: 24, padding: "12px", background: "rgba(255,255,255,0.03)", borderRadius: "8px" }}>
                <div>
                  <FieldLabel label="Model pose fallback" info="Text pose instruction in case visual reference isn't enough." />
                  <PillRadioGroup name="modelPose" value={config.modelPosePreset} options={modelPosePresetOptions} onChange={(v) => onConfigUpdate({ modelPosePreset: v })} />
                  <div style={{ height: 14 }} />
                  <input className="control" type="text" value={config.modelPoseDetails} onChange={(e) => onConfigUpdate({ modelPoseDetails: e.target.value })} placeholder="Optional: add pose details manually" />
                </div>

                {!isFlashModel && (
                  <div className="chooseFromAssets" style={{ marginTop: 16 }}>
                    <div style={{ marginBottom: 12 }}>
                      <FieldLabel label="Upload Custom Pose" info="Upload an image to serve as the exact pose reference." />
                      <label htmlFor={`upload-pose-${activeStoryboardId}`} className="btnSecondary" style={{ display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer", marginTop: 4 }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15 }}>
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                        Upload image
                      </label>
                      <input id={`upload-pose-${activeStoryboardId}`} type="file" accept="image/*" style={{ display: "none" }} onChange={onPoseFileChange} />
                    </div>

                    <button type="button" className="toggle-assets-btn" onClick={() => setShowSavedPoses((v) => !v)}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        style={{ transform: showSavedPoses ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                      <span>Choose from Uploaded Poses</span>
                    </button>
                    {showSavedPoses && poseAssetImages.length > 0 && (
                      <div style={{ marginTop: 12 }}>
                        <label>Saved Poses</label>
                        <div className="preview previewAssets">
                          {poseAssetImages.map((asset, idx) => (
                            <div key={asset.id} className="previewItem" onClick={() => addPoseFromDataUrl(asset.url, asset.fileName || `pose-asset-${idx}.png`)} title="Click to add as pose">
                              <img src={asset.url} alt={asset.title} draggable={false} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {showSavedPoses && !poseAssetImages.length && (
                      <div className="muted" style={{ marginTop: 8 }}>No uploaded poses found. Go to "Uploaded Assets" to add some.</div>
                    )}
                  </div>
                )}
              </div>
            )}

            {runtime.poseDataUrls && runtime.poseDataUrls.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <label>Selected Pose Reference</label>
                <div className="preview previewAssets">
                  {runtime.poseDataUrls.map((src, idx) => (
                    <div key={`${activeStoryboardId}-pose-ref-${idx}`} className="previewItem">
                      <img src={src} alt={`Pose reference ${idx + 1}`} draggable={false} onClick={() => onOpenImage(src, "Pose reference", "Pose reference")} />
                      <button type="button" className="removePreviewButton" onClick={() => removePoseImage(idx)} aria-label={`Remove pose image ${idx + 1}`} title="Remove image">
                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18" /><path d="M6 6l12 12" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Background ── */}
          <div id="section-background" className="parameterSection">
            <div className="sectionTitle" style={{ marginTop: 0 }}>Background</div>

            <div className="pillGroup" role="group" aria-label="Background Reference Type" style={{ marginBottom: 16 }}>
              <label className="pill">
                <input type="radio" value="template" checked={bgTab === "template"} onChange={() => setBgTab("template")} />
                <span>Template Backgrounds</span>
              </label>
              <label className="pill">
                <input type="radio" value="custom" checked={bgTab === "custom"} onChange={() => setBgTab("custom")} />
                <span>Custom Backgrounds</span>
              </label>
            </div>

            {bgTab === "template" && (
              <div className="templateModelsSection" style={{ marginBottom: 24, padding: "12px", background: "rgba(255,255,255,0.03)", borderRadius: "8px" }}>
                <div style={{ marginBottom: 12 }} className="muted">Choose a pre-built background. It will automatically set your scene environment.</div>
                <div className="pillGroup" role="group" aria-label="Background category" style={{ marginBottom: 14 }}>
                  <button
                    type="button"
                    className={["garmentFilterPill", !bgCategoryFilter ? "garmentFilterPillActive" : ""].filter(Boolean).join(" ")}
                    onClick={() => setBgCategoryFilter("")}
                  >All</button>
                  {bgCategories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      className={["garmentFilterPill", bgCategoryFilter === cat ? "garmentFilterPillActive" : ""].filter(Boolean).join(" ")}
                      onClick={() => setBgCategoryFilter(bgCategoryFilter === cat ? "" : cat)}
                    >{cat}</button>
                  ))}
                </div>
                <div style={{ maxHeight: 260, overflowY: "auto", paddingRight: 4 }}>
                  <div className="preview previewAssets">
                    {filteredBgTemplates.map((tmpl) => {
                      const hasImage = !!(tmpl as any).imageProxyUrl || !!tmpl.url;
                      return (
                        <div key={tmpl.id} className="previewItem" style={{ cursor: hasImage ? "pointer" : "not-allowed", opacity: hasImage ? 1 : 0.4 }} onClick={() => handleSelectBgTemplate(tmpl)} title={tmpl.label}>
                          {hasImage ? (
                            <img src={getTemplateImageUrl(tmpl)} alt={tmpl.label} draggable={false} />
                          ) : (
                            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", background: "#333", color: "#888", textAlign: "center" }}>
                              {tmpl.label}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                {isLoadingBgTemplate && <div style={{ marginTop: 16, display: "flex", justifyContent: "center" }}><LogoLoader size={52} color="var(--text)" label="Loading template..." /></div>}
              </div>
            )}

            {bgTab === "custom" && (
              <div className="customModelSection" style={{ marginBottom: 24, padding: "12px", background: "rgba(255,255,255,0.03)", borderRadius: "8px" }}>
                <div>
                  <FieldLabel label="Background theme" info="Describes the environment you want." />
                  <PillRadioGroup name="backgroundTheme" value={config.backgroundThemePreset} options={backgroundThemeOptions} onChange={(v) => onConfigUpdate({ backgroundThemePreset: v })} />
                  <div style={{ height: 14 }} />
                  <input className="control" type="text" value={config.backgroundThemeDetails} onChange={(e) => onConfigUpdate({ backgroundThemeDetails: e.target.value })} placeholder="Optional: add details (lighting, location, props)" />
                </div>

                {!isFlashModel && (
                  <div className="chooseFromAssets" style={{ marginTop: 16 }}>
                    <div style={{ marginBottom: 12 }}>
                      <FieldLabel label="Upload Custom Background" info="Upload an image to serve as the background directly." />
                      <div className="uploadNote" style={{ marginBottom: 8 }}>Upload only background images — studio scenes, outdoor settings, or plain surfaces. No garments or models.</div>
                      <label htmlFor={`upload-bg-${activeStoryboardId}`} className="btnSecondary" style={{ display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer", marginTop: 4 }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15 }}>
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                        Upload image
                      </label>
                      <input id={`upload-bg-${activeStoryboardId}`} type="file" accept="image/*" style={{ display: "none" }} onChange={onBackgroundFileChange} />
                    </div>

                    <button type="button" className="toggle-assets-btn" onClick={() => setShowSavedBackgrounds((v) => !v)}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        style={{ transform: showSavedBackgrounds ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                      <span>Choose from Uploaded Backgrounds</span>
                    </button>
                    {showSavedBackgrounds && backgroundAssetImages.length > 0 && (
                      <div style={{ marginTop: 12 }}>
                        <label>Saved Backgrounds</label>
                        <div className="preview previewAssets">
                          {backgroundAssetImages.map((asset, idx) => (
                            <div key={asset.id} className="previewItem" onClick={() => addBackgroundFromDataUrl(asset.url, asset.fileName || `bg-asset-${idx}.png`)} title="Click to add as background">
                              <img src={asset.url} alt={asset.title} draggable={false} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {showSavedBackgrounds && !backgroundAssetImages.length && (
                      <div className="muted" style={{ marginTop: 8 }}>No uploaded backgrounds found. Go to "Uploaded Assets" to add some.</div>
                    )}
                  </div>
                )}
              </div>
            )}

            {runtime.backgroundDataUrls.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <label>Selected Background Reference</label>
                <div className="preview previewAssets">
                  {runtime.backgroundDataUrls.map((src, idx) => (
                    <div key={`${activeStoryboardId}-bg-ref-${idx}`} className="previewItem">
                      <img src={src} alt={`Background reference ${idx + 1}`} draggable={false} onClick={() => onOpenImage(src, "Background reference", "Background reference")} />
                      <button type="button" className="removePreviewButton" onClick={() => removeBackgroundImage(idx)} aria-label={`Remove background image ${idx + 1}`} title="Remove image">
                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18" /><path d="M6 6l12 12" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Occasion ── */}
          <div className="parameterSection">
            <div className="sectionTitle" style={{ marginTop: 0 }}>Occasion</div>
            <div>
              <FieldLabel label="Occasion" info="Sets the vibe for styling and scene." />
              <PillRadioGroup name="occasion" value={config.occasionPreset} options={occasionPresetOptions} onChange={(v) => onConfigUpdate({ occasionPreset: v })} />
              <div style={{ height: 14 }} />
              <input className="control" type="text" value={config.occasionDetails} onChange={(e) => onConfigUpdate({ occasionDetails: e.target.value })} placeholder="Optional: add details or type a custom occasion" />
            </div>
          </div>

          {/* ── Generate ── */}
          <div id="flash-generate-section" className="parameterSection">
            <div className="sectionTitle" style={{ marginTop: 0 }}>Generate</div>
            <div className="actions">
              <button type="submit" className="btnPrimary" disabled={isGenerating}>
                {isGenerating ? "Generating..." : "Generate look"}
              </button>
            </div>

            {runtime.generateError && <div className="error">{runtime.generateError}</div>}
          </div>
        </div>
      </fieldset>

      {/* ── Validation popup ── */}
      {showValidationPopup && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
          }}
          onClick={() => setShowValidationPopup(false)}
        >
          <div
            style={{
              background: "#14121f",
              border: "1px solid rgba(239,68,68,0.25)",
              borderRadius: 14,
              padding: "24px 24px 20px",
              maxWidth: 370,
              width: "90%",
              boxShadow: "0 12px 40px rgba(0,0,0,0.6)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 18 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 8,
                background: "rgba(239,68,68,0.12)",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.92rem", color: "rgba(255,255,255,0.95)", marginBottom: 3 }}>
                  Configure required settings
                </div>
                <div style={{ fontSize: "0.76rem", color: "rgba(255,255,255,0.4)" }}>
                  Complete these before generating
                </div>
              </div>
            </div>

            {/* Error list */}
            <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 18 }}>
              {validationErrors.map((err) => (
                <button
                  key={err.id}
                  type="button"
                  onClick={() => scrollToSection(err.sectionId)}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "10px 12px",
                    background: "rgba(239,68,68,0.07)",
                    border: "1px solid rgba(239,68,68,0.18)",
                    borderRadius: 8,
                    cursor: "pointer",
                    textAlign: "left",
                    width: "100%",
                  }}
                >
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#f87171", flexShrink: 0, display: "block" }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.83rem", fontWeight: 600, color: "rgba(255,255,255,0.88)" }}>{err.label}</div>
                    <div style={{ fontSize: "0.71rem", color: "rgba(255,255,255,0.38)", marginTop: 2 }}>{err.hint}</div>
                  </div>
                  <span style={{ fontSize: "0.73rem", color: "#000000", fontWeight: 600, flexShrink: 0 }}>Go →</span>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowValidationPopup(false)}
              style={{
                width: "100%", padding: "9px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 8, cursor: "pointer",
                color: "rgba(255,255,255,0.5)", fontSize: "0.82rem",
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
