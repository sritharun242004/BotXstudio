// ── Client-side credit pricing reference ─────────────────────────────────────
// Mirrors server/src/services/pricing.service.ts — keep in sync.

export const FREE_IMAGE_QUOTA = 6;
export const FREE_ELIGIBLE_MODELS = ["gemini-2.5-flash-image", "gemini-3-pro-image-preview"] as const;

// Actual API costs (shown only in admin panel, hidden from end-users)
export const API_COSTS_INR: Record<string, number> = {
  "gemini-2.5-flash-image":        3.25,
  "gemini-3-pro-image-preview":   13.30,
  "fal-ai/flux-pro/kontext/multi":  3.83,
  "gpt-medium-1024x768":            4.11,
  "gpt-medium-1024x1024":           5.83,
  "gpt-high-1024x768":             14.42,
  "gpt-high-1024x1024":            20.92,
};

// Customer-facing credit prices
export const CREDIT_PRICES: Record<string, number> = {
  "gemini-2.5-flash-image":        5,
  "gemini-3-pro-image-preview":   20,
  "fal-ai/flux-pro/kontext/multi":  5,
  "gpt-medium-1024x768":           6,
  "gpt-medium-1024x1024":          9,
  "gpt-high-1024x768":            17,
  "gpt-high-1024x1024":           25,
};

export function getGptCreditKey(quality: string, size: string): string {
  const q = quality === "high" ? "high" : "medium";
  const s = (size || "").includes("1024x1024") ? "1024x1024" : "1024x768";
  return `gpt-${q}-${s}`;
}

export function getModelCreditCost(model: string, quality?: string, size?: string): number {
  if (model === "gpt-image-2") {
    const key = getGptCreditKey(quality ?? "medium", size ?? "1024x1024");
    return CREDIT_PRICES[key] ?? 9;
  }
  return CREDIT_PRICES[model] ?? 5;
}

export function isFreeEligible(model: string): boolean {
  return (FREE_ELIGIBLE_MODELS as readonly string[]).includes(model);
}
