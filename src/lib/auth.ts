import { apiGet, apiPost, setAccessToken, getAccessToken } from "./api";

export type Session = {
  id: string;
  email: string;
  name: string;
};

const SESSION_KEY = "bsx_session_v1";
const TOKENS_KEY = "bsx_cognito_tokens";

const COGNITO_DOMAIN = import.meta.env.VITE_COGNITO_DOMAIN;
const CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID;

// Derive redirect_uri from the current origin so the auth flow works on both
// botzudio.com (main app) and admin.botzudio.com (admin subdomain) — each
// returns the user to whichever domain they signed in from. Cognito must
// have BOTH callback URLs in its allowed list.
function getRedirectUri(): string {
  return window.location.origin + "/auth/callback";
}

// ─── PKCE helpers ────────────────────────────────────────────────────────────

function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(new Uint8Array(digest));
}

function base64UrlEncode(buffer: Uint8Array): string {
  let binary = "";
  for (const byte of buffer) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// ─── Cognito Hosted UI redirect ──────────────────────────────────────────────

export async function redirectToLogin(provider?: "Google" | "Apple", signup?: boolean) {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  localStorage.setItem("pkce_code_verifier", codeVerifier);

  const scope = provider ? "openid+email" : "openid+email+phone";

  let url =
    `${COGNITO_DOMAIN}/oauth2/authorize?` +
    `client_id=${CLIENT_ID}` +
    `&response_type=code` +
    `&scope=${scope}` +
    `&redirect_uri=${encodeURIComponent(getRedirectUri())}` +
    `&code_challenge=${codeChallenge}` +
    `&code_challenge_method=S256`;

  if (provider) {
    url += `&identity_provider=${provider}`;
  }

  // Direct new users to Cognito's sign-up form
  if (signup) {
    url = `${COGNITO_DOMAIN}/signup?` +
      `client_id=${CLIENT_ID}` +
      `&response_type=code` +
      `&scope=${scope}` +
      `&redirect_uri=${encodeURIComponent(getRedirectUri())}` +
      `&code_challenge=${codeChallenge}` +
      `&code_challenge_method=S256`;
  }

  window.location.href = url;
}

// ─── JWT payload decoder (no verification — token came directly from Cognito) ─

function decodeJwtPayload(token: string): Record<string, any> {
  const parts = token.split(".");
  if (parts.length !== 3) return {};
  const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
  const padded = payload + "=".repeat((4 - payload.length % 4) % 4);
  return JSON.parse(atob(padded));
}

// ─── Exchange auth code for tokens ───────────────────────────────────────────

// Code exchange and refresh both go through our server, which holds the
// refresh token in an HttpOnly cookie (not localStorage). Only the access
// and id tokens come back to the client, so XSS can no longer exfiltrate a
// long-lived refresh credential.
export async function handleCallback(code: string): Promise<Session> {
  const codeVerifier = localStorage.getItem("pkce_code_verifier");
  localStorage.removeItem("pkce_code_verifier");
  if (!codeVerifier) throw new Error("Missing PKCE code verifier");

  const resp = await fetch("/api/auth/cognito/exchange", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ code, codeVerifier, redirectUri: getRedirectUri() }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Token exchange failed: ${err}`);
  }

  const tokens = await resp.json() as { accessToken: string; idToken: string; expiresIn: number };
  setAccessToken(tokens.accessToken);
  localStorage.setItem(TOKENS_KEY, JSON.stringify({
    accessToken: tokens.accessToken,
    idToken: tokens.idToken,
    expiresAt: Date.now() + tokens.expiresIn * 1000,
  }));

  // Decode the ID token to get email/name (access token doesn't include them)
  const idPayload = decodeJwtPayload(tokens.idToken);
  let email = idPayload.email || "";
  let name = idPayload.name || "";

  // Fallback: for federated users (Google), ID token may lack email —
  // call the Cognito userInfo endpoint which always returns it
  if (!email && tokens.accessToken) {
    try {
      const uiResp = await fetch(`${COGNITO_DOMAIN}/oauth2/userInfo`, {
        headers: { Authorization: `Bearer ${tokens.accessToken}` },
      });
      if (uiResp.ok) {
        const userInfo = await uiResp.json();
        email = userInfo.email || "";
        name = name || userInfo.name || "";
      }
    } catch { /* userInfo fallback failed, continue with what we have */ }
  }

  name = name || email.split("@")[0] || "";

  // Sync user profile with our backend (findOrCreate with proper email/name)
  const data = await apiPost<{ user?: Session; needsEmail?: boolean }>("/api/auth/me", { email, name });

  // Google SSO: Cognito may not provide email due to attribute mapping config.
  // Signal the callback page to collect email from the user.
  if (data.needsEmail) {
    throw new Error("NEEDS_EMAIL");
  }

  localStorage.setItem(SESSION_KEY, JSON.stringify(data.user));
  return data.user!;
}

// ─── Complete profile for Google SSO users who need to provide email ─────────

export async function completeProfile(email: string, name?: string): Promise<Session> {
  const data = await apiPost<{ user: Session }>("/api/auth/me", { email, name: name || email.split("@")[0] });
  localStorage.setItem(SESSION_KEY, JSON.stringify(data.user));
  return data.user;
}

// ─── Token refresh via server proxy ──────────────────────────────────────────

// Calls /api/auth/cognito/refresh, which reads the HttpOnly refresh cookie
// server-side and returns fresh access + id tokens. No refresh token ever
// touches JS or localStorage in the post-migration flow.
export async function refreshCognitoToken(): Promise<string | null> {
  try {
    const resp = await fetch("/api/auth/cognito/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    if (!resp.ok) return null;

    const tokens = await resp.json() as { accessToken: string; idToken: string; expiresIn: number };
    setAccessToken(tokens.accessToken);
    const existingRaw = localStorage.getItem(TOKENS_KEY);
    const existing = existingRaw ? JSON.parse(existingRaw) : {};
    localStorage.setItem(TOKENS_KEY, JSON.stringify({
      ...existing,
      accessToken: tokens.accessToken,
      idToken: tokens.idToken,
      expiresAt: Date.now() + tokens.expiresIn * 1000,
    }));
    return tokens.accessToken;
  } catch {
    return null;
  }
}

// ─── Session management ──────────────────────────────────────────────────────

export function getSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export async function restoreSession(): Promise<Session | null> {
  try {
    // Try to use stored access token
    const raw = localStorage.getItem(TOKENS_KEY);
    if (raw) {
      const stored = JSON.parse(raw);

      // Extract email/name from stored ID token (for profile sync)
      let email = "";
      let name = "";
      if (stored.idToken) {
        const idPayload = decodeJwtPayload(stored.idToken);
        email = idPayload.email || "";
        name = idPayload.name || "";
      }

      // Fallback: for federated users (Google), ID token may lack email
      if (!email && stored.accessToken) {
        try {
          const uiResp = await fetch(`${COGNITO_DOMAIN}/oauth2/userInfo`, {
            headers: { Authorization: `Bearer ${stored.accessToken}` },
          });
          if (uiResp.ok) {
            const userInfo = await uiResp.json();
            email = userInfo.email || "";
            name = name || userInfo.name || "";
          }
        } catch { /* continue without email */ }
      }
      name = name || email.split("@")[0] || "";

      // If token not expired, use it directly
      if (stored.accessToken && stored.expiresAt > Date.now()) {
        setAccessToken(stored.accessToken);
        try {
          const data = await apiPost<{ user: Session }>("/api/auth/me", { email, name });
          localStorage.setItem(SESSION_KEY, JSON.stringify(data.user));
          return data.user;
        } catch {
          // Token might be invalid, try refresh
        }
      }

      // Try refreshing
      const newToken = await refreshCognitoToken();
      if (newToken) {
        try {
          const data = await apiPost<{ user: Session }>("/api/auth/me", { email, name });
          localStorage.setItem(SESSION_KEY, JSON.stringify(data.user));
          return data.user;
        } catch {
          // Refresh token also invalid
        }
      }
    }
  } catch {
    // Corrupt localStorage or network failure — fall through to clear
  }

  clearLocalSession();
  return null;
}

export function logout(): void {
  // Best-effort clear of the server-set HttpOnly refresh cookie. We don't
  // await this — even if the request fails (offline, server down) we still
  // continue with the local-session wipe and the Cognito hosted-UI logout,
  // both of which work without server contact.
  try {
    fetch("/api/auth/cognito/logout", { method: "POST", credentials: "include" })
      .catch(() => { /* ignore */ });
  } catch { /* ignore */ }

  clearLocalSession();
  const logoutUrl =
    `${COGNITO_DOMAIN}/logout?` +
    `client_id=${CLIENT_ID}` +
    `&logout_uri=${encodeURIComponent(window.location.origin + import.meta.env.BASE_URL + "login")}`;
  window.location.href = logoutUrl;
}

function clearLocalSession() {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(TOKENS_KEY);
  // Wipe per-user cached data (both legacy unprefixed keys and namespaced
  // variants) so the next user signing in on this browser sees a clean slate.
  const USER_DATA_PREFIXES = [
    "esg_storyboards_v1",
    "esg_active_storyboard_id_v1",
    "bsx_user_settings",
    // Admin team / templates: previously persisted after admin logout.
    "bsx_admin_v1",
    "bsx_admin_team_v1",
    "bsx_admin_templates",
  ];
  for (const k of Object.keys(localStorage)) {
    if (USER_DATA_PREFIXES.some((p) => k === p || k.startsWith(`${p}::`))) {
      localStorage.removeItem(k);
    }
  }
  // Garment-cutout IndexedDB cache — was leaking across users on shared
  // browsers. Inlined here (not imported from garment-cache.ts) to avoid a
  // circular dependency; keep the DB name in sync with src/lib/garment-cache.ts.
  try {
    indexedDB.deleteDatabase("botx_garment_cache_v1");
  } catch {
    /* best effort */
  }
  setAccessToken(null);
}
