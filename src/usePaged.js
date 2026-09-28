import { useCallback, useEffect, useState } from 'react';
import { api } from './api.js';

export function usePaged(path, extraQuery = {}, limit = 10) {
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const queryKey = JSON.stringify(extraQuery);

  const reload = useCallback(async () => {
    setError('');
    try {
      setData(await api(path, { query: { page, limit, ...JSON.parse(queryKey) } }));
    } catch (err) {
      setError(err.message);
    }
  }, [path, page, limit, queryKey]);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    setPage(1);
  }, [path, queryKey]);

  return { data, error, page, setPage, reload };
}
