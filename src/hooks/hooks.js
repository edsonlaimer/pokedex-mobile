import { useState, useEffect, useRef, useCallback } from 'react';

// ─── useDebounce ──────────────────────────────────────────────────────────────
export function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// ─── usePaginatedList ─────────────────────────────────────────────────────────
// Handles paginated fetch with infinite scroll.
// fetchFn must match signature: (limit, offset) => Promise<{ items, hasMore }>
export function usePaginatedList(fetchFn, pageSize = 20) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const offsetRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        const result = await fetchFn(pageSize, 0);
        if (cancelled) return;
        setItems(result.items);
        setHasMore(result.hasMore);
        offsetRef.current = pageSize;
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    init();
    return () => { cancelled = true; };
  }, []);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const result = await fetchFn(pageSize, offsetRef.current);
      setItems((prev) => [...prev, ...result.items]);
      setHasMore(result.hasMore);
      offsetRef.current += pageSize;
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore]);

  return { items, loading, loadingMore, loadMore };
}

// ─── useLocalSearch ───────────────────────────────────────────────────────────
// Filters a list locally by query string against a set of keys.
export function useLocalSearch(items, query, keys = ['name']) {
  const debounced = useDebounce(query.trim().toLowerCase());
  if (!debounced) return items;
  return items.filter((item) =>
    keys.some((key) => String(item[key] ?? '').toLowerCase().includes(debounced))
  );
}