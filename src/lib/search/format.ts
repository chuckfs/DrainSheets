export type SearchEntityType = "property" | "prospect" | "contact" | "document" | "note";

export type SearchResult = {
  entity_type: SearchEntityType;
  entity_id: string;
  title: string;
  property_id: string | null;
  prospect_id: string | null;
  rank: number;
};

export const SEARCH_ENTITY_ORDER: SearchEntityType[] = [
  "property",
  "prospect",
  "contact",
  "document",
  "note",
];

export const SEARCH_ENTITY_LABELS: Record<SearchEntityType, string> = {
  property: "Properties",
  prospect: "Prospects",
  contact: "Contacts",
  document: "Documents",
  note: "Notes",
};

export function searchResultHref(result: SearchResult): string {
  switch (result.entity_type) {
    case "property":
      return `/properties/${result.entity_id}`;
    case "prospect":
      return `/prospects/${result.entity_id}`;
    case "contact":
      return `/contacts/${result.entity_id}`;
    case "document":
      return `/documents/${result.entity_id}`;
    case "note":
      if (result.prospect_id) {
        return `/prospects/${result.prospect_id}`;
      }
      if (result.property_id) {
        return `/properties/${result.property_id}`;
      }
      return "/";
    default:
      return "/";
  }
}

export function groupSearchResults(results: SearchResult[]): Record<SearchEntityType, SearchResult[]> {
  const grouped: Record<SearchEntityType, SearchResult[]> = {
    property: [],
    prospect: [],
    contact: [],
    document: [],
    note: [],
  };

  for (const result of results) {
    grouped[result.entity_type].push(result);
  }

  return grouped;
}
