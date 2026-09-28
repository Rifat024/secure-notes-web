import { describe, expect, test, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

vi.mock('../src/api', async (importOriginal) => ({ ...(await importOriginal<typeof import('../src/api')>()), api: vi.fn() }));

const api = vi.mocked((await import('../src/api')).api);
const { usePaged } = await import('../src/usePaged');

describe('usePaged', () => {
  test('loads the first page with the given limit and extra query', async () => {
    api.mockResolvedValue({ items: [1], page: 1, limit: 5, total: 1, totalPages: 1 });
    const { result } = renderHook(() => usePaged('/notes', { owner: 'abc' }, 5));
    await waitFor(() => expect(result.current.data?.items).toEqual([1]));
    expect(api).toHaveBeenCalledWith('/notes', { query: { page: 1, limit: 5, owner: 'abc' } });
    expect(result.current.loading).toBe(false);
  });

  test('refetches when the page changes', async () => {
    api.mockResolvedValue({ items: [], page: 1, limit: 10, total: 30, totalPages: 3 });
    const { result } = renderHook(() => usePaged('/posts'));
    await waitFor(() => expect(result.current.data).not.toBeNull());
    act(() => result.current.setPage(2));
    await waitFor(() => expect(api).toHaveBeenLastCalledWith('/posts', { query: { page: 2, limit: 10 } }));
  });

  test('exposes errors from the API', async () => {
    api.mockRejectedValue(new Error('Insufficient permissions'));
    const { result } = renderHook(() => usePaged('/admin/users'));
    await waitFor(() => expect(result.current.error).toBe('Insufficient permissions'));
  });
});
