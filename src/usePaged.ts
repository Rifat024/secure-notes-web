import { useCallback, useEffect, useState } from 'react';
import { api, errorMessage } from './api';
import type { Page } from './types';

type ExtraQuery = Record<string, string | number | undefined>;

/** Loads one page of a paginated endpoint and refetches when the page or filters change. */
export function usePaged<T, R extends Page<T> = Page<T>>(path: string, extraQuery: ExtraQuery = {}, limit = 10) {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<R | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const queryKey = JSON.stringify(extraQuery);

  const reload = useCallback(async () => {
    setError('');
    try {
      setData(await api<R>(path, { query: { page, limit, ...(JSON.parse(queryKey) as ExtraQuery) } }));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [path, page, limit, queryKey]);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    setPage(1);
  }, [path, queryKey]);

  return { data, error, loading, page, setPage, reload };
}
