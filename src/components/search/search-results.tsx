import Link from "next/link";
import {
  groupSearchResults,
  SEARCH_ENTITY_LABELS,
  SEARCH_ENTITY_ORDER,
  searchResultHref,
  type SearchResult,
} from "@/lib/search/format";
import {
  SmartsheetGrid,
  SmartsheetGridBody,
  SmartsheetGridCell,
  SmartsheetGridEmpty,
  SmartsheetGridHead,
  SmartsheetGridHeader,
  SmartsheetGridRow,
} from "@/components/data/smartsheet-grid";

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

  if (!hasResults) {
    return <SmartsheetGridEmpty message={`No results found for “${query}”`} />;
  }

  return (
    <div className="space-y-4">
      {SEARCH_ENTITY_ORDER.map((entityType) => {
        const items = grouped[entityType];
        if (items.length === 0) return null;

        return (
          <section key={entityType}>
            <h2 className="border-x border-t bg-muted/40 px-2 py-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {SEARCH_ENTITY_LABELS[entityType]} ({items.length})
            </h2>
            <SmartsheetGrid className="border-t-0">
              <SmartsheetGridHeader>
                <SmartsheetGridRow className="hover:bg-transparent even:bg-transparent">
                  <SmartsheetGridHead>Name</SmartsheetGridHead>
                </SmartsheetGridRow>
              </SmartsheetGridHeader>
              <SmartsheetGridBody>
                {items.map((result) => (
                  <SmartsheetGridRow key={`${result.entity_type}-${result.entity_id}`}>
                    <SmartsheetGridCell>
                      <Link
                        href={searchResultHref(result)}
                        className="font-medium text-link hover:underline"
                      >
                        {result.title}
                      </Link>
                    </SmartsheetGridCell>
                  </SmartsheetGridRow>
                ))}
              </SmartsheetGridBody>
            </SmartsheetGrid>
          </section>
        );
      })}
    </div>
  );
}
