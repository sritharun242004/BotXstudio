import { apiGet, setAccessToken, getAccessToken } from "./api";

export type Session = {
  id: string;
  email: string;
  name: string;
};

const SESSION_KEY = "bsx_session_v1";
const TOKENS_KEY = "bsx_cognito_tokens";

const COGNITO_DOMAIN = import.meta.env.VITE_COGNITO_DOMAIN;
const CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID;
const REDIRECT_URI = import.meta.env.VITE_COGNITO_REDIRECT_URI;

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

export async function redirectToLogin(provider?: "Google" | "Apple") {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  sessionStorage.setItem("pkce_code_verifier", codeVerifier);

  let url =
    `${COGNITO_DOMAIN}/oauth2/authorize?` +
    `client_id=${CLIENT_ID}` +
    `&response_type=code` +
    `&scope=openid+email+phone` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&code_challenge=${codeChallenge}` +
    `&code_challenge_method=S256`;

  if (provider) {
    url += `&identity_provider=${provider}`;
  }

  window.location.href = url;
}

// ─── Exchange auth code for tokens ───────────────────────────────────────────

export async function handleCallback(code: string): Promise<Session> {
  const codeVerifier = sessionStorage.getItem("pkce_code_verifier");
  sessionStorage.removeItem("pkce_code_verifier");
  if (!codeVerifier) throw new Error("Missing PKCE code verifier");

  const resp = await fetch(`${COGNITO_DOMAIN}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: CLIENT_ID,
      code,
      redirect_uri: REDIRECT_URI,
      code_verifier: codeVerifier,
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Token exchange failed: ${err}`);
  }

  const tokens = await resp.json();
  setAccessToken(tokens.access_token);
  localStorage.setItem(TOKENS_KEY, JSON.stringify({
    accessToken: tokens.access_token,
    idToken: tokens.id_token,
    refreshToken: tokens.refresh_token,
    expiresAt: Date.now() + tokens.expires_in * 1000,
  }));

  // Fetch user profile from our backend (which does findOrCreate)
  const data = await apiGet<{ user: Session }>("/api/auth/me");
  localStorage.setItem(SESSION_KEY, JSON.stringify(data.user));
  return data.user;
}

// ─── Token refresh via Cognito ───────────────────────────────────────────────

export async function refreshCognitoToken(): Promise<string | null> {
  const raw = localStorage.getItem(TOKENS_KEY);
  if (!raw) return null;

  const stored = JSON.parse(raw);
  if (!stored.refreshToken) return null;

  const resp = await fetch(`${COGNITO_DOMAIN}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: CLIENT_ID,
      refresh_token: stored.refreshToken,
    }),
  });

  if (!resp.ok) return null;

  const tokens = await resp.json();
  setAccessToken(tokens.access_token);
  localStorage.setItem(TOKENS_KEY, JSON.stringify({
    ...stored,
    accessToken: tokens.access_token,
    idToken: tokens.id_token,
    expiresAt: Date.now() + tokens.expires_in * 1000,
  }));

  return tokens.access_token;
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
  // Try to use stored access token
  const raw = localStorage.getItem(TOKENS_KEY);
  if (raw) {
    const stored = JSON.parse(raw);

    // If token not expired, use it directly
    if (stored.accessToken && stored.expiresAt > Date.now()) {
      setAccessToken(stored.accessToken);
      try {
        const data = await apiGet<{ user: Session }>("/api/auth/me");
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
        const data = await apiGet<{ user: Session }>("/api/auth/me");
        localStorage.setItem(SESSION_KEY, JSON.stringify(data.user));
        return data.user;
      } catch {
        // Refresh token also invalid
      }
    }
  }

  clearLocalSession();
  return null;
}

export function logout(): void {
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
  setAccessToken(null);
}
