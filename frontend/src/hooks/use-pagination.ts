'use client';

import { useState, useMemo, useCallback } from 'react';

interface PaginationOptions {
  initialPage?: number;
  initialPageSize?: number;
  total?: number;
}

interface PaginationResult {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  offset: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setTotal: (total: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  firstPage: () => void;
  lastPage: () => void;
  reset: () => void;
}

export function usePagination({
  initialPage = 1,
  initialPageSize = 10,
  total: initialTotal = 0,
}: PaginationOptions = {}): PaginationResult {
  const [page, setPageState] = useState(initialPage);
  const [pageSize, setPageSizeState] = useState(initialPageSize);
  const [total, setTotalState] = useState(initialTotal);

  const totalPages = useMemo(
    () => Math.ceil(total / pageSize) || 1,
    [total, pageSize]
  );

  const offset = useMemo(() => (page - 1) * pageSize, [page, pageSize]);

  const hasNextPage = useMemo(() => page < totalPages, [page, totalPages]);
  const hasPrevPage = useMemo(() => page > 1, [page]);

  const setPage = useCallback(
    (newPage: number) => {
      const validPage = Math.max(1, Math.min(newPage, totalPages));
      setPageState(validPage);
    },
    [totalPages]
  );

  const setPageSize = useCallback(
    (newSize: number) => {
      setPageSizeState(newSize);
      // Reset to first page when page size changes
      setPageState(1);
    },
    []
  );

  const setTotal = useCallback((newTotal: number) => {
    setTotalState(newTotal);
  }, []);

  const nextPage = useCallback(() => {
    if (hasNextPage) {
      setPageState((prev) => prev + 1);
    }
  }, [hasNextPage]);

  const prevPage = useCallback(() => {
    if (hasPrevPage) {
      setPageState((prev) => prev - 1);
    }
  }, [hasPrevPage]);

  const firstPage = useCallback(() => {
    setPageState(1);
  }, []);

  const lastPage = useCallback(() => {
    setPageState(totalPages);
  }, [totalPages]);

  const reset = useCallback(() => {
    setPageState(initialPage);
    setPageSizeState(initialPageSize);
    setTotalState(initialTotal);
  }, [initialPage, initialPageSize, initialTotal]);

  return {
    page,
    pageSize,
    total,
    totalPages,
    offset,
    hasNextPage,
    hasPrevPage,
    setPage,
    setPageSize,
    setTotal,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    reset,
  };
}
