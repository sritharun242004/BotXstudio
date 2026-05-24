const ADMIN_SECRET = "bsx-admin-2026";

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

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Affiliate {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  profileImageUrl: string | null;
  instagram: string | null;
  youtube: string | null;
  linkedin: string | null;
  location: string | null;
  bio: string | null;
  affiliateCode: string;
  referralLink: string;
  qrCodeUrl: string | null;
  commissionPercentage: number;
  bonusCredits: number;
  promoBonusCredits: number;
  promoValidUntil: string | null;
  status: "active" | "suspended" | "inactive";
  bankName: string | null;
  accountNumber: string | null;
  upiId: string | null;
  totalClicks: number;
  totalUsers: number;
  totalRevenue: number;
  totalCommission: number;
  joinedDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface AffiliateListResult {
  affiliates: Affiliate[];
  total: number;
}

export interface OverviewStats {
  totalAffiliates: number;
  totalClicks: number;
  totalSignups: number;
  totalRevenue: number;
  totalCommission: number;
  pendingPayouts: number;
}

export interface DailySignup {
  date: string;
  signups: number;
}

export interface OverviewResult {
  stats: OverviewStats;
  daily: DailySignup[];
}

export interface AffiliateUser {
  userId: string;
  name: string;
  email: string;
  signupDate: string;
  purchaseAmount: number;
  commissionGenerated: number;
}

export interface AffiliateClick {
  id: string;
  affiliateId: string;
  device: string | null;
  browser: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  timestamp: string;
}

export interface CreateAffiliateInput {
  name: string;
  email: string;
  phone?: string;
  instagram?: string;
  youtube?: string;
  linkedin?: string;
  location?: string;
  bio?: string;
  commissionPercentage?: number;
  bonusCredits?: number;
  promoBonusCredits?: number;
  promoValidUntil?: string | null;
  bankName?: string;
  accountNumber?: string;
  upiId?: string;
  profileImageUrl?: string;
}

// ─── API calls ────────────────────────────────────────────────────────────────

export async function affiliateAdminGetOverview(): Promise<OverviewResult> {
  return adminFetch<OverviewResult>("/api/affiliates/admin/overview");
}

export async function affiliateAdminList(params?: {
  search?: string;
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<AffiliateListResult> {
  const qs = new URLSearchParams();
  if (params?.search) qs.set("search", params.search);
  if (params?.status) qs.set("status", params.status);
  if (params?.limit)  qs.set("limit",  String(params.limit));
  if (params?.offset) qs.set("offset", String(params.offset));
  return adminFetch<AffiliateListResult>(`/api/affiliates/admin?${qs}`);
}

export async function affiliateAdminGet(id: string): Promise<Affiliate> {
  return adminFetch<Affiliate>(`/api/affiliates/admin/${id}`);
}

export async function affiliateAdminCreate(input: CreateAffiliateInput): Promise<Affiliate> {
  return adminFetch<Affiliate>("/api/affiliates/admin", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function affiliateAdminUpdate(id: string, input: Partial<CreateAffiliateInput> & { status?: string }): Promise<Affiliate> {
  return adminFetch<Affiliate>(`/api/affiliates/admin/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function affiliateAdminDelete(id: string): Promise<void> {
  await adminFetch<void>(`/api/affiliates/admin/${id}`, { method: "DELETE" });
}

export async function affiliateAdminSuspend(id: string): Promise<Affiliate> {
  return adminFetch<Affiliate>(`/api/affiliates/admin/${id}/suspend`, { method: "POST" });
}

export async function affiliateAdminGetActivity(id: string): Promise<AffiliateClick[]> {
  return adminFetch<AffiliateClick[]>(`/api/affiliates/admin/${id}/activity`);
}

export async function affiliateAdminGetUsers(id: string): Promise<AffiliateUser[]> {
  return adminFetch<AffiliateUser[]>(`/api/affiliates/admin/${id}/users`);
}

export async function affiliateAdminGetProfileUploadUrl(
  id: string,
  contentType: string
): Promise<{ uploadUrl: string; publicUrl: string; key: string }> {
  return adminFetch(`/api/affiliates/admin/${id}/profile-upload-url`, {
    method: "POST",
    body: JSON.stringify({ contentType }),
  });
}

// ─── Upload image to S3 via presigned URL ─────────────────────────────────────

export async function uploadImageToS3(uploadUrl: string, file: File): Promise<void> {
  const resp = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!resp.ok) throw new Error("Failed to upload image to S3");
}

// ─── Public: attribute user to affiliate ─────────────────────────────────────

export async function attributeUserToAffiliate(
  affiliateCode: string,
  accessToken: string
): Promise<{ attributed: boolean }> {
  const resp = await fetch("/api/affiliates/attribute", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ affiliateCode }),
  });
  if (!resp.ok) return { attributed: false };
  return resp.json();
}
