import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Node 22+ exposes an experimental global localStorage that shadows jsdom's and is unusable
// without --localstorage-file, so tests get a plain in-memory Storage instead.
class MemoryStorage implements Storage {
  #data = new Map<string, string>();
  get length(): number { return this.#data.size; }
  key(index: number): string | null { return [...this.#data.keys()][index] ?? null; }
  getItem(key: string): string | null { return this.#data.get(key) ?? null; }
  setItem(key: string, value: string): void { this.#data.set(key, String(value)); }
  removeItem(key: string): void { this.#data.delete(key); }
  clear(): void { this.#data.clear(); }
}

Object.defineProperty(globalThis, 'localStorage', { value: new MemoryStorage(), configurable: true, writable: true });

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.restoreAllMocks();
});
