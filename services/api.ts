// API client with JWT token management
// In dev: Vite proxy forwards /api to localhost:4000
// In production: same origin (nginx proxies to backend)

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

async function refreshToken(): Promise<string | null> {
  try {
    const res = await fetch('/api/v1/auth/refresh', {
      method: 'POST',
      credentials: 'include', // sends httpOnly cookie
    });
    if (!res.ok) return null;
    const data = await res.json();
    accessToken = data.accessToken;
    return accessToken;
  } catch {
    return null;
  }
}

export async function apiFetch<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> ?? {}),
  };

  // Don't set Content-Type for FormData (multer needs multipart boundary)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  let res = await fetch(`/api/v1${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  // If 401, try refreshing the token once
  if (res.status === 401 && accessToken) {
    const newToken = await refreshToken();
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      res = await fetch(`/api/v1${path}`, {
        ...options,
        headers,
        credentials: 'include',
      });
    }
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new ApiError(res.status, error.error ?? 'Request failed', error);
  }

  // Handle empty responses (204, etc.)
  const text = await res.text();
  return text ? JSON.parse(text) : undefined;
}

export class ApiError extends Error {
  status: number;
  details: any;

  constructor(status: number, message: string, details?: any) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

// Convenience methods
export const api = {
  get: <T = any>(path: string) => apiFetch<T>(path),

  post: <T = any>(path: string, body?: any) =>
    apiFetch<T>(path, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  put: <T = any>(path: string, body?: any) =>
    apiFetch<T>(path, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  delete: <T = any>(path: string) =>
    apiFetch<T>(path, { method: 'DELETE' }),

  upload: <T = any>(path: string, formData: FormData) =>
    apiFetch<T>(path, {
      method: 'POST',
      body: formData,
    }),
};
