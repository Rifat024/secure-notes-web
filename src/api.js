const BASE_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:4000').replace(/\/$/, '');
const TOKEN_KEY = 'secure-notes-token';
const REQUEST_TIMEOUT_MS = 15000;

export const SESSION_EXPIRED_EVENT = 'secure-notes:session-expired';

const storage = {
  get(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Ignored: without storage the session simply ends when the tab closes.
    }
  },
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch {
      // Nothing to remove.
    }
  },
};

export const tokenStore = {
  get: () => storage.get(TOKEN_KEY),
  set: (token) => storage.set(TOKEN_KEY, token),
  clear: () => storage.remove(TOKEN_KEY),
};

export class ApiError extends Error {
  constructor(message, status, retryAfter) {
    super(message);
    this.status = status;
    this.retryAfter = retryAfter;
  }
}

/** Seconds until the JWT expires, or null when the token cannot be read. */
export function tokenSecondsLeft(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return typeof payload.exp === 'number' ? payload.exp - Date.now() / 1000 : null;
  } catch {
    return null;
  }
}

export async function api(path, { method = 'GET', body, query } = {}) {
  const url = new URL(`${BASE_URL}/api${path}`);
  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== '') url.searchParams.set(key, value);
  });

  const headers = { 'Content-Type': 'application/json' };
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let res;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
    });
  } catch (err) {
    throw new ApiError(err.name === 'AbortError' ? 'The server took too long to respond' : 'Network error, please check your connection', 0);
  } finally {
    clearTimeout(timer);
  }

  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && token) {
      tokenStore.clear();
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }
    const retryAfter = Number(res.headers?.get?.('Retry-After')) || undefined;
    const details = data.details?.map((d) => `${d.path}: ${d.message}`).join('; ');
    throw new ApiError(details ? `${data.error} (${details})` : data.error ?? `Request failed (${res.status})`, res.status, retryAfter);
  }
  return data;
}
