"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function GlobalSearch({ defaultQuery = "" }: { defaultQuery?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState(defaultQuery);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();

    if (!trimmed) {
      setError("Enter a search term");
      return;
    }

    setError(null);
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-md items-center gap-2">
      <div className="flex-1">
        <Input
          type="search"
          name="q"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search properties, prospects, contacts..."
          aria-label="Global search"
        />
        {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
      </div>
      <Button type="submit" size="sm" variant="outline">
        Search
      </Button>
    </form>
  );
}
