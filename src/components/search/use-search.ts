"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getRecentSheets, globalSearch } from "@/actions/search";
import {
  SEARCH_DEBOUNCE_MS,
  SEARCH_MIN_QUERY_LENGTH,
  type RecentSheetItem,
  type SearchResult,
} from "@/lib/search/format";
import { readRecentSheetsFromStorage } from "@/lib/search/recent-sheets";

export function useSearch(open: boolean) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSheets, setRecentSheets] = useState<RecentSheetItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const loadRecentSheets = useCallback(async () => {
    try {
      const serverRecent = await getRecentSheets();
      if (serverRecent.length > 0) {
        setRecentSheets(serverRecent);
        return;
      }
    } catch {
      // Fall back to local storage below.
    }

    setRecentSheets(readRecentSheetsFromStorage());
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    void loadRecentSheets();
  }, [loadRecentSheets, open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const trimmed = query.trim();

    if (trimmed.length < SEARCH_MIN_QUERY_LENGTH) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    const timer = window.setTimeout(() => {
      const requestId = ++requestIdRef.current;
      setLoading(true);
      setError(null);

      void globalSearch(trimmed)
        .then((data) => {
          if (requestId !== requestIdRef.current) {
            return;
          }
          setResults(data);
        })
        .catch((fetchError: Error) => {
          if (requestId !== requestIdRef.current) {
            return;
          }
          setResults([]);
          setError(fetchError.message);
        })
        .finally(() => {
          if (requestId === requestIdRef.current) {
            setLoading(false);
          }
        });
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [open, query]);

  function reset() {
    requestIdRef.current += 1;
    setQuery("");
    setResults([]);
    setLoading(false);
    setError(null);
  }

  return {
    query,
    setQuery,
    results,
    recentSheets,
    loading,
    error,
    reset,
    hasQuery: query.trim().length >= SEARCH_MIN_QUERY_LENGTH,
  };
}
