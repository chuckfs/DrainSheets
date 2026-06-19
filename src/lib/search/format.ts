export type SearchEntityType = "sheet" | "row" | "contact" | "document" | "note";

export type SearchResult = {
  entity_type: SearchEntityType;
  entity_id: string;
  title: string;
  sheet_id: string | null;
  workspace_id: string | null;
  rank: number;
  sheet_name: string | null;
  workspace_name: string | null;
};

export type RecentSheetItem = {
  sheet_id: string;
  sheet_name: string;
  workspace_id: string | null;
  workspace_name: string | null;
  viewed_at: string;
};

export const SEARCH_ENTITY_ORDER: SearchEntityType[] = [
  "sheet",
  "row",
  "contact",
  "document",
  "note",
];

export const SEARCH_ENTITY_LABELS: Record<SearchEntityType, string> = {
  sheet: "Sheets",
  row: "Rows",
  contact: "Contacts",
  document: "Documents",
  note: "Notes",
};

export const SEARCH_MIN_QUERY_LENGTH = 2;
export const SEARCH_RESULT_LIMIT = 25;
export const SEARCH_DEBOUNCE_MS = 250;

export function isSearchEntityType(value: string): value is SearchEntityType {
  return (
    value === "sheet" ||
    value === "row" ||
    value === "contact" ||
    value === "document" ||
    value === "note"
  );
}

export function searchResultHref(result: Pick<SearchResult, "entity_type" | "entity_id" | "sheet_id">): string {
  switch (result.entity_type) {
    case "sheet":
      return `/sheets/${result.entity_id}`;
    case "row":
      return result.sheet_id
        ? `/sheets/${result.sheet_id}?row=${result.entity_id}`
        : `/sheets/${result.entity_id}`;
    case "contact":
      return `/contacts/${result.entity_id}`;
    case "document":
      return `/documents/${result.entity_id}`;
    case "note":
      return result.sheet_id
        ? `/sheets/${result.sheet_id}?note=${result.entity_id}`
        : `/sheets/${result.entity_id}`;
    default:
      return "/";
  }
}

export function groupSearchResults(results: SearchResult[]): Record<SearchEntityType, SearchResult[]> {
  const grouped: Record<SearchEntityType, SearchResult[]> = {
    sheet: [],
    row: [],
    contact: [],
    document: [],
    note: [],
  };

  for (const result of results) {
    if (isSearchEntityType(result.entity_type)) {
      grouped[result.entity_type].push(result);
    }
  }

  return grouped;
}

export function flattenGroupedResults(grouped: Record<SearchEntityType, SearchResult[]>): SearchResult[] {
  const flat: SearchResult[] = [];
  for (const entityType of SEARCH_ENTITY_ORDER) {
    flat.push(...grouped[entityType]);
  }
  return flat;
}
