import Link from "next/link";
import {
  groupSearchResults,
  SEARCH_ENTITY_LABELS,
  SEARCH_ENTITY_ORDER,
  searchResultHref,
  type SearchResult,
} from "@/lib/search/format";

export function SearchResults({
  query,
  results,
  total,
}: {
  query: string;
  results: SearchResult[];
  total: number;
}) {
  const grouped = groupSearchResults(results);
  const hasResults = total > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Search</h1>
        <p className="text-muted-foreground">
          {hasResults
            ? `${total} result${total === 1 ? "" : "s"} for “${query}”`
            : `No results found for “${query}”`}
        </p>
      </div>

      {!hasResults ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No results found.
        </p>
      ) : (
        <div className="space-y-8">
          {SEARCH_ENTITY_ORDER.map((entityType) => {
            const items = grouped[entityType];
            if (items.length === 0) {
              return null;
            }

            return (
              <section key={entityType} className="space-y-3">
                <h2 className="text-lg font-medium">{SEARCH_ENTITY_LABELS[entityType]}</h2>
                <ul className="overflow-hidden rounded-lg border">
                  {items.map((result) => (
                    <li key={`${result.entity_type}-${result.entity_id}`} className="border-b last:border-b-0">
                      <Link
                        href={searchResultHref(result)}
                        className="block px-4 py-3 text-sm hover:bg-muted/30"
                      >
                        <span className="font-medium">{result.title}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
