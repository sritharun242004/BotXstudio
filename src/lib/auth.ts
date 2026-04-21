import { apiPost, apiGet, setAccessToken, getAccessToken } from "./api";

export type Session = {
  id: string;
  email: string;
  name: string;
};

const SESSION_KEY = "bsx_session_v1";

export async function register(
  name: string,
  email: string,
  password: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const data = await apiPost<{ user: Session; accessToken: string }>(
      "/api/auth/register",
      { name, email, password },
    );
    setAccessToken(data.accessToken);
    localStorage.setItem(SESSION_KEY, JSON.stringify(data.user));
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message || "Registration failed." };
  }
}

export async function login(
  email: string,
  password: string,
): Promise<{ ok: boolean; error?: string; session?: Session }> {
  try {
    const data = await apiPost<{ user: Session; accessToken: string }>(
      "/api/auth/login",
      { email, password },
    );
    setAccessToken(data.accessToken);
    localStorage.setItem(SESSION_KEY, JSON.stringify(data.user));
    return { ok: true, session: data.user };
  } catch (err: any) {
    return { ok: false, error: err.message || "Login failed." };
  }
}

export function getSession(): Session | null {
  // Quick sync check from localStorage cache
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

/** Try to restore session from refresh token cookie on app load */
export async function restoreSession(): Promise<Session | null> {
  // If we already have an access token, just verify it
  if (getAccessToken()) {
    try {
      const data = await apiGet<{ user: Session }>("/api/auth/me");
      localStorage.setItem(SESSION_KEY, JSON.stringify(data.user));
      return data.user;
    } catch {
      // Token expired, try refresh below
    }
  }

  // Try refreshing via httpOnly cookie
  try {
    const resp = await fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include",
    });
    if (!resp.ok) {
      clearLocalSession();
      return null;
    }
    const data = await resp.json();
    setAccessToken(data.accessToken);
    localStorage.setItem(SESSION_KEY, JSON.stringify(data.user));
    return data.user;
  } catch {
    clearLocalSession();
    return null;
  }
}

export async function logout(): Promise<void> {
  try {
    await apiPost("/api/auth/logout");
  } catch {
    // Best-effort
  }
  setAccessToken(null);
  clearLocalSession();
}

function clearLocalSession() {
  localStorage.removeItem(SESSION_KEY);
  setAccessToken(null);
}
