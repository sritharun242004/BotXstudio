// ── Unified Credit Pricing Service ───────────────────────────────────────────
// 1 credit = ₹1 INR. Credits stored in model_pricing table, editable by admin.
// Raw SQL used because prisma generate is blocked while the server is running.

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Actual API costs paid to providers (INR) — shown only in admin panel
export const API_COSTS_INR: Record<string, number> = {
  "gemini-2.5-flash-image":        3.25,
  "gemini-3-pro-image-preview":   13.30,
  "fal-ai/flux-pro/kontext/multi":  3.83,
  "gpt-medium-1024x768":            4.11,
  "gpt-medium-1024x1024":           5.83,
  "gpt-high-1024x768":             14.42,
  "gpt-high-1024x1024":            20.92,
};

// Immutable seed / fallback credit prices (with profit margins applied)
export const CREDIT_PRICES_DEFAULT: Record<string, number> = {
  "gemini-2.5-flash-image":        5,
  "gemini-3-pro-image-preview":   20,
  "fal-ai/flux-pro/kontext/multi":  5,
  "gpt-medium-1024x768":           6,
  "gpt-medium-1024x1024":          9,
  "gpt-high-1024x768":            17,
  "gpt-high-1024x1024":           25,
};

export const FREE_IMAGE_QUOTA = 6;
export const FREE_ELIGIBLE_MODELS = new Set([
  "gemini-2.5-flash-image",
  "gemini-3-pro-image-preview",
]);

export function getGptPricingKey(quality: string, size: string): string {
  const q = quality === "high" ? "high" : "medium";
  const s = (size || "").includes("1024x1024") ? "1024x1024" : "1024x768";
  return `gpt-${q}-${s}`;
}

// ── Raw SQL helpers ───────────────────────────────────────────────────────────

type PricingRow = { model_key: string; credits: number };

async function dbGetAll(): Promise<PricingRow[]> {
  return prisma.$queryRaw<PricingRow[]>`SELECT model_key, credits FROM model_pricing`;
}

async function dbUpsert(modelKey: string, credits: number): Promise<void> {
  await prisma.$executeRaw`
    INSERT INTO model_pricing (model_key, credits, updated_at)
    VALUES (${modelKey}, ${credits}, NOW())
    ON CONFLICT (model_key) DO UPDATE
      SET credits = EXCLUDED.credits, updated_at = NOW()
  `;
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function seedModelPricing(): Promise<void> {
  await Promise.all(
    Object.entries(CREDIT_PRICES_DEFAULT).map(([k, v]) => dbUpsert(k, v)),
  );
}

// Returns the full pricing map (DB values override defaults)
export async function getAllModelPricing(): Promise<Record<string, number>> {
  let rows: PricingRow[] = [];
  try {
    rows = await dbGetAll();
  } catch {
    // table may not exist yet — seed it
  }
  if (rows.length === 0) {
    await seedModelPricing();
    try { rows = await dbGetAll(); } catch { /* ignore */ }
  }
  const map: Record<string, number> = { ...CREDIT_PRICES_DEFAULT };
  for (const row of rows) map[row.model_key] = row.credits;
  return map;
}

// Get credit cost for a single model (DB-backed with fallback)
export async function getCreditsForModel(
  model: string,
  quality?: string,
  size?: string,
): Promise<number> {
  const key = model === "gpt-image-2"
    ? getGptPricingKey(quality ?? "medium", size ?? "1024x1024")
    : model;
  try {
    const rows = await prisma.$queryRaw<PricingRow[]>`
      SELECT credits FROM model_pricing WHERE model_key = ${key}
    `;
    if (rows.length > 0) return rows[0].credits;
  } catch { /* fallback */ }
  return CREDIT_PRICES_DEFAULT[key] ?? 5;
}

// Update a single model's credit price
export async function setModelCredits(modelKey: string, credits: number): Promise<void> {
  await dbUpsert(modelKey, credits);
}
