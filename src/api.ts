const BASE_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:4000').replace(/\/$/, '');
const TOKEN_KEY = 'secure-notes-token';
const REQUEST_TIMEOUT_MS = 15000;

export const SESSION_EXPIRED_EVENT = 'secure-notes:session-expired';

type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE';
type QueryValue = string | number | undefined;

export interface ApiOptions {
  method?: Method;
  body?: unknown;
  query?: Record<string, QueryValue>;
}

interface ErrorBody {
  error?: string;
  details?: { path: string; message: string }[];
}

const storage = {
  get(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Ignored: without storage the session simply ends when the tab closes.
    }
  },
  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      // Nothing to remove.
    }
  },
};

export const tokenStore = {
  get: (): string | null => storage.get(TOKEN_KEY),
  set: (token: string): void => storage.set(TOKEN_KEY, token),
  clear: (): void => storage.remove(TOKEN_KEY),
};

export class ApiError extends Error {
  readonly status: number;
  readonly retryAfter?: number;

  constructor(message: string, status: number, retryAfter?: number) {
    super(message);
    this.status = status;
    this.retryAfter = retryAfter;
  }
}

/** Seconds until the JWT expires, or null when the token cannot be read. */
export function tokenSecondsLeft(token: string): number | null {
  try {
    const payload: unknown = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    const exp = (payload as { exp?: unknown })?.exp;
    return typeof exp === 'number' ? exp - Date.now() / 1000 : null;
  } catch {
    return null;
  }
}

/** Calls the API and returns the parsed JSON body; 204 responses resolve to null. */
export async function api<T = unknown>(path: string, { method = 'GET', body, query }: ApiOptions = {}): Promise<T> {
  const url = new URL(`${BASE_URL}/api${path}`);
  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== '') url.searchParams.set(key, String(value));
  });

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let res: Response;
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
    const aborted = err instanceof Error && err.name === 'AbortError';
    throw new ApiError(aborted ? 'The server took too long to respond' : 'Network error, please check your connection', 0);
  } finally {
    clearTimeout(timer);
  }

  if (res.status === 204) return null as T;
  const data: unknown = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && token) {
      tokenStore.clear();
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }
    const { error, details } = (data ?? {}) as ErrorBody;
    const retryAfter = Number(res.headers?.get?.('Retry-After')) || undefined;
    const detailText = details?.map((d) => `${d.path}: ${d.message}`).join('; ');
    throw new ApiError(detailText ? `${error} (${detailText})` : error ?? `Request failed (${res.status})`, res.status, retryAfter);
  }
  return data as T;
}

export const errorMessage = (err: unknown): string => (err instanceof Error ? err.message : String(err));
