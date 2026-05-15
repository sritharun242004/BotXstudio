const ADMIN_KEY = "bsx_admin_v1";
export const ADMIN_EMAIL = "mohanraj@thebotcompany.in";
const ADMIN_PASSWORD = "Bot@2026";

export interface AdminSession { email: string; at: number }

export function adminLogin(email: string, password: string): boolean {
  if (email.trim().toLowerCase() === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    localStorage.setItem(ADMIN_KEY, JSON.stringify({ email: ADMIN_EMAIL, at: Date.now() }));
    return true;
  }
  return false;
}

export function getAdminSession(): AdminSession | null {
  try {
    const raw = localStorage.getItem(ADMIN_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function adminLogout() {
  localStorage.removeItem(ADMIN_KEY);
}
