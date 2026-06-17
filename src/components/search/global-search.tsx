"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function GlobalSearch({ defaultQuery = "" }: { defaultQuery?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState(defaultQuery);
  const [error, setError] = useState<string | null>(null);

  function navigateSearch(value: string) {
    const trimmed = value.trim();
    if (!trimmed) {
      setError("Enter a search term");
      return;
    }
    setError(null);
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    navigateSearch(query);
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl flex-1">
      <div className="relative">
        <SearchIcon
          className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          type="search"
          name="q"
          data-global-search="true"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            if (error) setError(null);
          }}
          placeholder="Search properties, prospects, contacts…"
          aria-label="Global search"
          className={cn("h-8 pl-8 text-sm", error && "border-destructive")}
        />
      </div>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </form>
  );
}
