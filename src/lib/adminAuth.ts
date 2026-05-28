import { getSession, logout, type Session } from "./auth";

// Admin allowlist (frontend mirror of the server-side ADMIN_EMAILS env var).
// The server is the authoritative gate — this list only controls UI rendering.
// Knowing an email here does not grant access; you must also log in as that user.
const ADMIN_EMAIL_LIST: string[] = [
  "mohanraj@thebotcompany.in",
];

// Primary super-admin (used by Users page to flag the top-level admin row).
export const ADMIN_EMAIL = ADMIN_EMAIL_LIST[0]!;

const ADMIN_EMAIL_SET = new Set(ADMIN_EMAIL_LIST.map(e => e.toLowerCase()));

export function isAdminEmail(email: string | null | undefined): boolean {
  return !!email && ADMIN_EMAIL_SET.has(email.toLowerCase());
}

// Returns the current session if the logged-in user is an admin, else null.
// The shape matches Session so existing call sites (session?.email …) keep working.
export function getAdminSession(): Session | null {
  const session = getSession();
  if (session && isAdminEmail(session.email)) return session;
  return null;
}

// Logging out of the admin panel is the same as logging out of the app.
export function adminLogout(): void {
  logout();
}
