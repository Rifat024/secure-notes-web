import { describe, expect, test, vi, beforeEach } from 'vitest';
import { api, tokenStore } from '../api.js';

const respond = (status, body) =>
  vi.fn().mockResolvedValue({ ok: status >= 200 && status < 300, status, json: async () => body });

describe('api client', () => {
  beforeEach(() => {
    globalThis.fetch = respond(200, { ok: true });
  });

  test('prefixes /api and sends JSON bodies', async () => {
    await api('/notes', { method: 'POST', body: { title: 'x' } });
    const [url, init] = fetch.mock.calls[0];
    expect(String(url)).toBe('http://api.test/api/notes');
    expect(init.method).toBe('POST');
    expect(init.body).toBe('{"title":"x"}');
    expect(init.headers['Content-Type']).toBe('application/json');
  });

  test('attaches the bearer token when logged in', async () => {
    tokenStore.set('abc.def.ghi');
    await api('/auth/me');
    expect(fetch.mock.calls[0][1].headers.Authorization).toBe('Bearer abc.def.ghi');
  });

  test('omits the Authorization header when logged out', async () => {
    await api('/auth/me');
    expect(fetch.mock.calls[0][1].headers).not.toHaveProperty('Authorization');
  });

  test('serialises query params and skips empty values', async () => {
    await api('/admin/notes', { query: { page: 2, limit: 10, owner: '', missing: undefined } });
    expect(String(fetch.mock.calls[0][0])).toBe('http://api.test/api/admin/notes?page=2&limit=10');
  });

  test('returns null for 204 responses', async () => {
    globalThis.fetch = respond(204);
    await expect(api('/notes/1', { method: 'DELETE' })).resolves.toBeNull();
  });

  test('throws the server message with validation details', async () => {
    globalThis.fetch = respond(400, { error: 'Validation failed', details: [{ path: 'password', message: 'Too short' }] });
    await expect(api('/auth/register', { method: 'POST', body: {} })).rejects.toThrow('Validation failed (password: Too short)');
  });

  test('clears the stored token on 401', async () => {
    tokenStore.set('expired');
    globalThis.fetch = respond(401, { error: 'Invalid or expired token' });
    await expect(api('/notes')).rejects.toThrow('Invalid or expired token');
    expect(tokenStore.get()).toBeNull();
  });
});
