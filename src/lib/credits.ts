import { apiGet, apiPost } from "./api";

const ADMIN_SECRET = "bsx-admin-2026";

// ─── User API ─────────────────────────────────────────────────────────────────

export interface CreditConfig {
  perImageCostInr: number;
}

export interface CreditBalance {
  balance: number;
  freeImagesUsed: number;
  freeImagesRemaining: number;
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

async function adminFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const resp = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-admin-secret": ADMIN_SECRET,
      ...(options.headers as Record<string, string> || {}),
    },
  });
  const text = await resp.text();
  const data = text ? JSON.parse(text) : {};
  if (!resp.ok) throw new Error(data?.error || `Request failed (${resp.status})`);
  return data as T;
}

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
  return adminFetch<CreditConfig>("/api/credits/admin/config");
}

export async function adminUpdateConfig(perImageCostInr: number): Promise<CreditConfig> {
  return adminFetch<CreditConfig>("/api/credits/admin/config", {
    method: "PUT",
    body: JSON.stringify({ perImageCostInr }),
  });
}

export async function adminFetchUsers(): Promise<AdminUser[]> {
  return adminFetch<AdminUser[]>("/api/credits/admin/users");
}

export async function adminTopUpUser(userId: string, amountInr: number, description?: string): Promise<AdminUser> {
  return adminFetch<AdminUser>(`/api/credits/admin/users/${userId}/topup`, {
    method: "POST",
    body: JSON.stringify({ amountInr, description }),
  });
}

export interface ModelPricingRow {
  modelKey: string;
  credits: number;
  apiCostInr: number;
  defaultCredits: number;
}

export async function adminFetchModelPricing(): Promise<ModelPricingRow[]> {
  return adminFetch<ModelPricingRow[]>("/api/credits/admin/model-pricing");
}

export async function adminSaveModelPricing(updates: { modelKey: string; credits: number }[]): Promise<ModelPricingRow[]> {
  return adminFetch<ModelPricingRow[]>("/api/credits/admin/model-pricing", {
    method: "PUT",
    body: JSON.stringify(updates),
  });
}

export async function fetchModelPricing(): Promise<Record<string, number>> {
  const resp = await fetch("/api/credits/model-pricing");
  if (!resp.ok) throw new Error("Failed to fetch model pricing");
  return resp.json() as Promise<Record<string, number>>;
}
