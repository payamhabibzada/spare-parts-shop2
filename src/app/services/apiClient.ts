const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

function getAccessToken(): string | null {
  return sessionStorage.getItem("access_token");
}

function setTokens(access: string, refresh: string): void {
  sessionStorage.setItem("access_token", access);
  localStorage.setItem("refresh_token", refresh);
}

function clearTokens(): void {
  sessionStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

async function refreshAccessToken(): Promise<string | null> {
  const refresh = localStorage.getItem("refresh_token");
  if (!refresh) return null;
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: refresh }),
    });
    if (!res.ok) { clearTokens(); return null; }
    const { accessToken, refreshToken } = await res.json();
    setTokens(accessToken, refreshToken);
    return accessToken;
  } catch { return null; }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let token = getAccessToken();
  const makeRequest = async (t: string | null) => fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(t ? { Authorization: `Bearer ${t}` } : {}),
      ...(options.headers as Record<string, string> ?? {}),
    },
  });

  let res = await makeRequest(token);

  // Auto-refresh on 401
  if (res.status === 401 && token) {
    token = await refreshAccessToken();
    if (token) {
      res = await makeRequest(token);
    } else {
      clearTokens();
      window.location.href = "/login";
      throw new ApiError(401, "Session expired");
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new ApiError(res.status, body.error ?? "Request failed");
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) => request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) => request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
  setTokens,
  clearTokens,
};
