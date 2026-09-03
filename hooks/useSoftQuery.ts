'use client';

/* eslint-disable */
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Soft data loader: keeps previous data visible while refetching.
 * Shows a blocking loading state only on the first load (empty cache).
 */
export function useSoftQuery<T>(
  key: string | null | undefined,
  fetcher: () => Promise<T>,
  options?: { enabled?: boolean }
) {
  const enabled = options?.enabled ?? true;
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const requestIdRef = useRef(0);
  const keyRef = useRef<string | null>(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (!key || !enabled) return;

    const requestId = ++requestIdRef.current;
    const isFirstForKey = keyRef.current !== key || data === null;
    keyRef.current = key;

    if (isFirstForKey && !opts?.silent) {
      setIsInitialLoading(true);
    } else {
      setIsRefreshing(true);
    }

    try {
      const result = await fetcherRef.current();
      if (requestId !== requestIdRef.current) return;
      setData(result);
      setError(null);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setError(err);
    } finally {
      if (requestId === requestIdRef.current) {
        setIsInitialLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [key, enabled, data]);

  useEffect(() => {
    if (!key || !enabled) {
      if (!key) {
        setData(null);
        setIsInitialLoading(false);
        setIsRefreshing(false);
      }
      return;
    }

    const requestId = ++requestIdRef.current;
    const isFirst = keyRef.current !== key;
    keyRef.current = key;

    if (isFirst) setIsInitialLoading(true);
    else setIsRefreshing(true);

    void fetcherRef.current()
      .then((result) => {
        if (requestId !== requestIdRef.current) return;
        setData(result);
        setError(null);
      })
      .catch((err) => {
        if (requestId !== requestIdRef.current) return;
        setError(err);
      })
      .finally(() => {
        if (requestId === requestIdRef.current) {
          setIsInitialLoading(false);
          setIsRefreshing(false);
        }
      });

    return () => {
      requestIdRef.current += 1;
    };
     
  }, [key, enabled]);

  return {
    data,
    setData,
    error,
    /** True only while waiting for the first result for this key. */
    isLoading: isInitialLoading,
    /** True while a background refresh is in flight. */
    isRefreshing,
    reload: load,
  };
}
