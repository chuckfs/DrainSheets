"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { SearchDialog } from "@/components/search/search-dialog";
import { SearchCommandTrigger } from "@/components/search/search-command";

type SearchCommandContextValue = {
  openSearch: () => void;
};

const SearchCommandContext = createContext<SearchCommandContextValue | null>(null);

export function useSearchCommand() {
  const context = useContext(SearchCommandContext);
  if (!context) {
    throw new Error("useSearchCommand must be used within SearchCommandProvider");
  }
  return context;
}

export function SearchCommandProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const openSearch = useCallback(() => setOpen(true), []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
        return;
      }

      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <SearchCommandContext.Provider value={{ openSearch }}>
      {children}
      <SearchDialog open={open} onOpenChange={setOpen} />
    </SearchCommandContext.Provider>
  );
}

export function HeaderSearchCommand() {
  const { openSearch } = useSearchCommand();
  return <SearchCommandTrigger onOpen={openSearch} />;
}
