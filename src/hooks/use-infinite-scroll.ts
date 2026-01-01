"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface UseInfiniteScrollOptions<T> {
  fetchFn: (page: number, pageSize: number) => Promise<{ data: T[]; hasMore: boolean }>;
  pageSize?: number;
  initialData?: T[];
}

interface UseInfiniteScrollResult<T> {
  data: T[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: Error | null;
  loadMore: () => void;
  reset: () => void;
  sentinelRef: (node: HTMLElement | null) => void;
}

export function useInfiniteScroll<T>({
  fetchFn,
  pageSize = 12,
  initialData = [],
}: UseInfiniteScrollOptions<T>): UseInfiniteScrollResult<T> {
  const [data, setData] = useState<T[]>(initialData);
  const [page, setPage] = useState(initialData.length > 0 ? 1 : 0);
  const [isLoading, setIsLoading] = useState(initialData.length === 0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelNodeRef = useRef<HTMLElement | null>(null);
  const isLoadingRef = useRef(false);

  const fetchData = useCallback(
    async (pageNum: number, isInitial = false) => {
      if (isLoadingRef.current) return;

      isLoadingRef.current = true;
      if (isInitial) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      setError(null);

      try {
        const result = await fetchFn(pageNum, pageSize);

        if (isInitial) {
          setData(result.data);
        } else {
          setData((prev) => [...prev, ...result.data]);
        }

        setHasMore(result.hasMore);
        setPage(pageNum);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to fetch data"));
      } finally {
        isLoadingRef.current = false;
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [fetchFn, pageSize]
  );

  // Initial fetch
  useEffect(() => {
    if (initialData.length === 0) {
      fetchData(0, true);
    }
  }, []);

  const loadMore = useCallback(() => {
    if (!hasMore || isLoadingRef.current) return;
    fetchData(page + 1);
  }, [fetchData, page, hasMore]);

  const reset = useCallback(() => {
    setData([]);
    setPage(0);
    setHasMore(true);
    fetchData(0, true);
  }, [fetchData]);

  // Intersection Observer for infinite scroll
  const sentinelRef = useCallback(
    (node: HTMLElement | null) => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      if (!node) return;

      sentinelNodeRef.current = node;

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore && !isLoadingRef.current) {
            loadMore();
          }
        },
        {
          rootMargin: "100px",
          threshold: 0,
        }
      );

      observerRef.current.observe(node);
    },
    [hasMore, loadMore]
  );

  // Cleanup
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return {
    data,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    loadMore,
    reset,
    sentinelRef,
  };
}
