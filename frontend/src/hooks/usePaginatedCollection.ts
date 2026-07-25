import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Offset-paginated list backed by an API fetcher `(limit, offset) => rows`.
 * Replaces the old Firestore cursor pagination.
 */
export function usePaginated<T>(
  fetcher: (limit: number, offset: number) => Promise<T[]>,
  pageSize = 12
) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const offset = useRef(0);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const run = useCallback(async (append: boolean) => {
    append ? setLoadingMore(true) : setLoading(true);
    setError(null);
    try {
      const off = append ? offset.current : 0;
      const rows = await fetcherRef.current(pageSize, off);
      offset.current = off + rows.length;
      setHasMore(rows.length === pageSize);
      setItems((prev) => (append ? [...prev, ...rows] : rows));
    } catch (err) {
      console.error('List fetch failed:', err);
      setError('Could not load content. Please check your connection.');
      setHasMore(false);
    } finally {
      append ? setLoadingMore(false) : setLoading(false);
    }
  }, [pageSize]);

  useEffect(() => {
    offset.current = 0;
    setHasMore(true);
    run(false);
  }, [run]);

  const loadMore = useCallback(() => { if (!loadingMore && hasMore) run(true); }, [run, loadingMore, hasMore]);
  const refresh = useCallback(() => { offset.current = 0; setHasMore(true); run(false); }, [run]);
  const prepend = useCallback((item: T) => setItems((prev) => [item, ...prev]), []);

  return { items, loading, loadingMore, hasMore, error, loadMore, refresh, prepend };
}
