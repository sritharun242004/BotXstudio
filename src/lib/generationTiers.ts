// ── Generation Quality Tier System ───────────────────────────────────────────
// Provider-agnostic tier definitions.  Each tier maps to native provider params:
//   Gemini  → width / height / temperature
//   FLUX    → aspectRatio / quality prompt boost
//   GPT-4o  → quality / size  (ready for future integration)

export type GenerationTierId = "fast_draft" | "standard_studio" | "premium_editorial";

export type TierBadge = {
  label: string;
  variant: "blue" | "green" | "purple" | "amber" | "indigo" | "rose";
};

export type GeminiTierSettings = {
  width: number;
  height: number;
  temperature?: number;
  qualityBoost: string;
};

export type FluxTierSettings = {
  aspectRatio: string;
  qualityBoost: string;
};

export type GptImagesTierSettings = {
  quality: "low" | "medium" | "high";
  size: string;
};

export type GenerationTier = {
  id: GenerationTierId;
  name: string;
  tagline: string;
  costInr: number;
  costLabel: string;
  speedLabel: string;
  purpose: string;
  badges: TierBadge[];
  isDefault?: boolean;
  gemini: GeminiTierSettings;
  flux: FluxTierSettings;
  gptImages: GptImagesTierSettings;
};

export const GENERATION_TIERS: Record<GenerationTierId, GenerationTier> = {
  fast_draft: {
    id: "fast_draft",
    name: "Fast Draft",
    tagline: "Quick previews · fast iterations",
    costInr: 0.5,
    costLabel: "~₹0.5",
    speedLabel: "~20s",
    purpose: "Fast previews, free users, draft generations",
    badges: [
      { label: "Fast", variant: "blue" },
      { label: "Budget Friendly", variant: "green" },
    ],
    gemini: {
      width: 1024,
      height: 768,
      temperature: 0.3,
      qualityBoost: "",
    },
    flux: {
      aspectRatio: "4:3",
      qualityBoost: "",
    },
    gptImages: {
      quality: "low",
      size: "1024x1024",
    },
  },

  standard_studio: {
    id: "standard_studio",
    name: "Standard Studio",
    tagline: "Ecommerce fashion · best balance",
    costInr: 4,
    costLabel: "~₹4",
    speedLabel: "~45s",
    purpose: "Ecommerce fashion, lookbooks, best quality/cost balance",
    badges: [
      { label: "Recommended", variant: "purple" },
      { label: "Ecommerce Ready", variant: "indigo" },
    ],
    isDefault: true,
    gemini: {
      width: 1024,
      height: 1536,
      temperature: 0.1,
      qualityBoost: "high quality ecommerce photography, sharp focus",
    },
    flux: {
      aspectRatio: "3:4",
      qualityBoost: "",
    },
    gptImages: {
      quality: "medium",
      size: "1024x1536",
    },
  },

  premium_editorial: {
    id: "premium_editorial",
    name: "Premium Editorial",
    tagline: "Luxury campaigns · maximum detail",
    costInr: 16,
    costLabel: "~₹16",
    speedLabel: "~90s",
    purpose: "Luxury campaigns, premium exports, editorial photography",
    badges: [
      { label: "Premium", variant: "amber" },
      { label: "Ultra Detailed", variant: "rose" },
    ],
    gemini: {
      width: 1024,
      height: 1536,
      temperature: 0,
      qualityBoost:
        "ultra high quality, maximum sharpness, professional editorial photography, pristine fabric detail",
    },
    flux: {
      aspectRatio: "3:4",
      qualityBoost:
        "ultra-sharp detail, pristine fabric texture, luxury editorial photography, flawless professional studio lighting, maximum photorealism",
    },
    gptImages: {
      quality: "high",
      size: "1024x1536",
    },
  },
};

export const TIER_ORDER: GenerationTierId[] = [
  "fast_draft",
  "standard_studio",
  "premium_editorial",
];

export const DEFAULT_TIER_ID: GenerationTierId = "standard_studio";

export function getTier(id?: GenerationTierId | string | null): GenerationTier {
  const tier = GENERATION_TIERS[id as GenerationTierId];
  return tier ?? GENERATION_TIERS[DEFAULT_TIER_ID];
}
