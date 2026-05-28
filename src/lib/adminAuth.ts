const ADMIN_KEY = "bsx_admin_v1";
export const ADMIN_EMAIL = "mohanraj@thebotcompany.in";
const ADMIN_PASSWORD = "Bot@2026";
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

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
    if (!raw) return null;
    const session: AdminSession = JSON.parse(raw);
    if (Date.now() - session.at > SESSION_TTL_MS) {
      localStorage.removeItem(ADMIN_KEY);
      return null;
    }
    return session;
  } catch { return null; }
}

export function adminLogout() {
  localStorage.removeItem(ADMIN_KEY);
}
