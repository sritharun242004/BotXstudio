// ─── In-memory token store (never persisted to localStorage) ─────────────────

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

// ─── Core fetch helpers ──────────────────────────────────────────────────────

async function refreshAccessToken(): Promise<string | null> {
  try {
    const resp = await fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include", // sends httpOnly cookie
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    accessToken = data.accessToken;
    return accessToken;
  } catch {
    return null;
  }
}

async function apiFetch<T = any>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  let resp = await fetch(path, {
    ...options,
    headers,
    credentials: "include",
  });

  // Auto-refresh on 401
  if (resp.status === 401 && accessToken) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers["Authorization"] = `Bearer ${newToken}`;
      resp = await fetch(path, {
        ...options,
        headers,
        credentials: "include",
      });
    }
  }

  const text = await resp.text();
  let data: any = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = {};
    }
  }

  if (!resp.ok) {
    const msg = data?.error || `Request failed (${resp.status})`;
    throw new Error(msg);
  }

  return data as T;
}

// ─── HTTP method helpers ─────────────────────────────────────────────────────

export async function apiGet<T = any>(path: string): Promise<T> {
  return apiFetch<T>(path, { method: "GET" });
}

export async function apiPost<T = any>(path: string, payload?: unknown): Promise<T> {
  return apiFetch<T>(path, {
    method: "POST",
    body: JSON.stringify(payload ?? {}),
  });
}

export async function apiPatch<T = any>(path: string, payload?: unknown): Promise<T> {
  return apiFetch<T>(path, {
    method: "PATCH",
    body: JSON.stringify(payload ?? {}),
  });
}

export async function apiDelete<T = any>(path: string): Promise<T> {
  return apiFetch<T>(path, { method: "DELETE" });
}
