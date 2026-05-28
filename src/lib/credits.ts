import { apiGet, apiPost, apiPut, apiDelete } from "./api";

// ─── User API ─────────────────────────────────────────────────────────────────

export interface CreditConfig {
  perImageCostInr: number;
}

export interface CreditBalance {
  balance: number;
  freeImagesUsed: number;
  freeImagesRemaining: number;
  creditsSpent: number;
  isDeveloper: boolean;
}

export interface CreditTransaction {
  id: string;
  amountInr: number;
  type: string;
  description: string | null;
  balanceAfter: number;
  createdAt: string;
}

export async function fetchCreditConfig(): Promise<CreditConfig> {
  return apiGet<CreditConfig>("/api/credits/config");
}

export async function fetchCreditBalance(): Promise<CreditBalance> {
  return apiGet<CreditBalance>("/api/credits/balance");
}

export async function fetchCreditTransactions(): Promise<CreditTransaction[]> {
  return apiGet<CreditTransaction[]>("/api/credits/transactions");
}

export async function selfTopUpCredits(): Promise<{ balance: number; message: string }> {
  return apiPost<{ balance: number; message: string }>("/api/credits/self-topup", {});
}

// ─── Admin API ────────────────────────────────────────────────────────────────
// Admin endpoints are gated server-side by Cognito JWT + ADMIN_EMAILS allowlist.
// The frontend uses the same Bearer-auth helpers as any other authed call.

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  creditsBalance: number;
  imagesGenerated: number;
  joinedAt: string;
  isDeveloper: boolean;
}

export async function adminFetchConfig(): Promise<CreditConfig> {
  return apiGet<CreditConfig>("/api/credits/admin/config");
}

export async function adminUpdateConfig(perImageCostInr: number): Promise<CreditConfig> {
  return apiPut<CreditConfig>("/api/credits/admin/config", { perImageCostInr });
}

export async function adminFetchUsers(): Promise<AdminUser[]> {
  return apiGet<AdminUser[]>("/api/credits/admin/users");
}

export async function adminTopUpUser(userId: string, amountInr: number, description?: string): Promise<AdminUser> {
  return apiPost<AdminUser>(`/api/credits/admin/users/${userId}/topup`, { amountInr, description });
}

export async function adminDeleteUser(userId: string): Promise<void> {
  return apiDelete<void>(`/api/credits/admin/users/${userId}`);
}

export interface ModelPricingRow {
  modelKey: string;
  credits: number;
  apiCostInr: number;
  defaultCredits: number;
}

export async function adminFetchModelPricing(): Promise<ModelPricingRow[]> {
  return apiGet<ModelPricingRow[]>("/api/credits/admin/model-pricing");
}

export async function adminSaveModelPricing(updates: { modelKey: string; credits: number }[]): Promise<ModelPricingRow[]> {
  return apiPut<ModelPricingRow[]>("/api/credits/admin/model-pricing", updates);
}

export async function fetchModelPricing(): Promise<Record<string, number>> {
  const resp = await fetch("/api/credits/model-pricing");
  if (!resp.ok) throw new Error("Failed to fetch model pricing");
  return resp.json() as Promise<Record<string, number>>;
}
