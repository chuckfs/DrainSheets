import { EmptyState } from "@/components/ui/empty-state";
import {
  SEARCH_ENTITY_LABELS,
  SEARCH_ENTITY_ORDER,
  SEARCH_MIN_QUERY_LENGTH,
  flattenGroupedResults,
  groupSearchResults,
  searchResultHref,
  type RecentSheetItem,
  type SearchResult,
} from "@/lib/search/format";
import { RecentSheetItemRow, SearchResultItem } from "./search-result-item";

export function SearchResults({
  query,
  results,
  recentSheets,
  loading,
  error,
  activeIndex,
  onSelectResult,
  onSelectRecent,
}: {
  query: string;
  results: SearchResult[];
  recentSheets: RecentSheetItem[];
  loading: boolean;
  error: string | null;
  activeIndex: number;
  onSelectResult: (result: SearchResult) => void;
  onSelectRecent: (sheetId: string) => void;
}) {
  const trimmed = query.trim();
  const hasQuery = trimmed.length >= SEARCH_MIN_QUERY_LENGTH;

  if (!hasQuery) {
    if (recentSheets.length === 0) {
      return (
        <div className="px-3 py-8 text-center text-sm text-muted-foreground">
          Type at least {SEARCH_MIN_QUERY_LENGTH} characters to search sheets, rows, contacts, and more.
        </div>
      );
    }

    return (
      <div className="p-2">
        <p className="px-2 pb-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          Recent sheets
        </p>
        <ul className="space-y-0.5">
          {recentSheets.map((sheet, index) => (
            <li key={sheet.sheet_id}>
              <RecentSheetItemRow
                title={sheet.sheet_name}
                workspaceName={sheet.workspace_name}
                active={activeIndex === index}
                onSelect={() => onSelectRecent(sheet.sheet_id)}
              />
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (loading) {
    return <div className="px-3 py-8 text-center text-sm text-muted-foreground">Searching…</div>;
  }

  if (error) {
    return <div className="px-3 py-8 text-center text-sm text-destructive">{error}</div>;
  }

  if (results.length === 0) {
    return (
      <EmptyState
        title="No search results"
        description={`Nothing matched “${trimmed}”. Try a different keyword or check spelling.`}
      />
    );
  }

  const grouped = groupSearchResults(results);
  const flat = flattenGroupedResults(grouped);
  let runningIndex = 0;

  return (
    <div className="space-y-3 p-2">
      {SEARCH_ENTITY_ORDER.map((entityType) => {
        const items = grouped[entityType];
        if (items.length === 0) {
          return null;
        }

        const section = (
          <section key={entityType}>
            <p className="px-2 pb-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              {SEARCH_ENTITY_LABELS[entityType]}
            </p>
            <ul className="space-y-0.5">
              {items.map((result) => {
                const itemIndex = runningIndex;
                runningIndex += 1;

                return (
                  <li key={`${result.entity_type}-${result.entity_id}`}>
                    <SearchResultItem
                      title={result.title}
                      entityType={result.entity_type}
                      workspaceName={result.workspace_name}
                      sheetName={result.sheet_name}
                      query={trimmed}
                      active={activeIndex === itemIndex}
                      onSelect={() => onSelectResult(result)}
                    />
                  </li>
                );
              })}
            </ul>
          </section>
        );

        return section;
      })}
      <p className="px-2 text-[11px] text-muted-foreground">
        {flat.length} result{flat.length === 1 ? "" : "s"}
      </p>
    </div>
  );
}

export { searchResultHref };
