"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SearchIcon } from "lucide-react";
import {
  flattenGroupedResults,
  groupSearchResults,
  SEARCH_MIN_QUERY_LENGTH,
  searchResultHref,
  type SearchResult,
} from "@/lib/search/format";
import { writeRecentSheetToStorage } from "@/lib/search/recent-sheets";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { SearchResults } from "./search-results";
import { useSearch } from "./use-search";

export function SearchDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { query, setQuery, results, recentSheets, loading, error, reset, hasQuery } = useSearch(open);
  const [activeIndex, setActiveIndex] = useState(0);

  const selectableCount = useMemo(() => {
    if (!hasQuery) {
      return recentSheets.length;
    }

    return flattenGroupedResults(groupSearchResults(results)).length;
  }, [hasQuery, recentSheets.length, results]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, open]);

  function closeAndNavigate(href: string) {
    reset();
    onOpenChange(false);
    router.push(href);
  }

  function handleSelectResult(result: SearchResult) {
    if (result.entity_type === "sheet" && result.sheet_id) {
      writeRecentSheetToStorage({
        sheet_id: result.sheet_id,
        sheet_name: result.sheet_name ?? result.title,
        workspace_id: result.workspace_id,
        workspace_name: result.workspace_name,
        viewed_at: new Date().toISOString(),
      });
    }

    closeAndNavigate(searchResultHref(result));
  }

  function handleSelectRecent(sheetId: string) {
    const recent = recentSheets.find((entry) => entry.sheet_id === sheetId);
    if (recent) {
      writeRecentSheetToStorage(recent);
    }

    closeAndNavigate(`/sheets/${sheetId}`);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (selectableCount === 0) {
        return;
      }
      setActiveIndex((index) => (index + 1) % selectableCount);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (selectableCount === 0) {
        return;
      }
      setActiveIndex((index) => (index - 1 + selectableCount) % selectableCount);
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      if (selectableCount === 0) {
        return;
      }

      if (!hasQuery) {
        const recent = recentSheets[activeIndex];
        if (recent) {
          handleSelectRecent(recent.sheet_id);
        }
        return;
      }

      const flat = flattenGroupedResults(groupSearchResults(results));
      const selected = flat[activeIndex];
      if (selected) {
        handleSelectResult(selected);
      }
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          reset();
        }
        onOpenChange(next);
      }}
    >
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-xl">
        <DialogHeader className="border-b px-3 py-3">
          <DialogTitle className="sr-only">Search</DialogTitle>
          <div className="relative">
            <SearchIcon
              className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              value={query}
              autoFocus
              placeholder="Search sheets, rows, contacts…"
              className="h-10 border-0 pl-9 shadow-none focus-visible:ring-0"
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            {query.trim().length > 0 && query.trim().length < SEARCH_MIN_QUERY_LENGTH
              ? `Type ${SEARCH_MIN_QUERY_LENGTH - query.trim().length} more character(s)…`
              : "↑↓ navigate · Enter open · Esc close"}
          </p>
        </DialogHeader>

        <div className="max-h-[min(60vh,420px)] overflow-auto">
          <SearchResults
            query={query}
            results={results}
            recentSheets={recentSheets}
            loading={loading}
            error={error}
            activeIndex={activeIndex}
            onSelectResult={handleSelectResult}
            onSelectRecent={handleSelectRecent}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
