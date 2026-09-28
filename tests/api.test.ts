import { describe, expect, test, vi, beforeEach } from 'vitest';
import { api, tokenStore, tokenSecondsLeft, ApiError, SESSION_EXPIRED_EVENT } from '../src/api';

const respond = (status: number, body?: unknown, headers: Record<string, string> = {}) =>
  vi.fn<typeof fetch>().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    headers: { get: (name: string) => headers[name] ?? null },
  } as unknown as Response);

const fetchMock = () => vi.mocked(globalThis.fetch);

/** The options passed to the first fetch call, with headers as the plain object the client sends. */
const sentInit = () => fetchMock().mock.calls[0][1] as RequestInit & { headers: Record<string, string> };

describe('api client', () => {
  beforeEach(() => {
    globalThis.fetch = respond(200, { ok: true });
  });

  test('prefixes /api and sends JSON bodies', async () => {
    await api('/notes', { method: 'POST', body: { title: 'x' } });
    const [url] = fetchMock().mock.calls[0];
    const init = sentInit();
    expect(String(url)).toBe('http://api.test/api/notes');
    expect(init.method).toBe('POST');
    expect(init.body).toBe('{"title":"x"}');
    expect(init.headers['Content-Type']).toBe('application/json');
  });

  test('attaches the bearer token when logged in', async () => {
    tokenStore.set('abc.def.ghi');
    await api('/auth/me');
    expect(sentInit().headers.Authorization).toBe('Bearer abc.def.ghi');
  });

  test('omits the Authorization header when logged out', async () => {
    await api('/auth/me');
    expect(sentInit().headers).not.toHaveProperty('Authorization');
  });

  test('serialises query params and skips empty values', async () => {
    await api('/admin/notes', { query: { page: 2, limit: 10, owner: '', missing: undefined } });
    expect(String(fetchMock().mock.calls[0][0])).toBe('http://api.test/api/admin/notes?page=2&limit=10');
  });

  test('returns null for 204 responses', async () => {
    globalThis.fetch = respond(204);
    await expect(api('/notes/1', { method: 'DELETE' })).resolves.toBeNull();
  });

  test('throws the server message with validation details', async () => {
    globalThis.fetch = respond(400, { error: 'Validation failed', details: [{ path: 'password', message: 'Too short' }] });
    await expect(api('/auth/register', { method: 'POST', body: {} })).rejects.toThrow('Validation failed (password: Too short)');
  });

  test('clears the stored token on 401 and announces the expired session', async () => {
    tokenStore.set('expired');
    const listener = vi.fn();
    window.addEventListener(SESSION_EXPIRED_EVENT, listener);
    globalThis.fetch = respond(401, { error: 'Invalid or expired token' });
    await expect(api('/notes')).rejects.toThrow('Invalid or expired token');
    expect(tokenStore.get()).toBeNull();
    expect(listener).toHaveBeenCalledOnce();
    window.removeEventListener(SESSION_EXPIRED_EVENT, listener);
  });

  test('exposes status and Retry-After on rate-limit errors', async () => {
    globalThis.fetch = respond(429, { error: 'Too many failed sign-in attempts.' }, { 'Retry-After': '120' });
    const err = (await api('/auth/login', { method: 'POST', body: {} }).catch((e: unknown) => e)) as ApiError;
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(429);
    expect(err.retryAfter).toBe(120);
  });

  test('never sends cookies or a referrer', async () => {
    await api('/notes');
    expect(sentInit()).toMatchObject({ credentials: 'omit', referrerPolicy: 'no-referrer' });
  });

  test('reports network failures clearly', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(api('/notes')).rejects.toThrow('Network error, please check your connection');
  });

  test('tokenSecondsLeft reads the JWT expiry', () => {
    const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 600 }));
    expect(tokenSecondsLeft(`h.${payload}.s`)).toBeGreaterThan(590);
    expect(tokenSecondsLeft('garbage')).toBeNull();
  });
});
