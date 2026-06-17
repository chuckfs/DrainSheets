export const PROPERTY_SORT_STORAGE_KEY = "drainsheets:property-sort";

export type PropertySortValue = "name" | "created_at" | "city";

const VALID_SORTS = new Set<PropertySortValue>(["name", "created_at", "city"]);

export function parsePropertySort(value: string | null): PropertySortValue | null {
  if (!value || !VALID_SORTS.has(value as PropertySortValue)) {
    return null;
  }

  return value as PropertySortValue;
}

export function readStoredPropertySort(): PropertySortValue | null {
  if (typeof window === "undefined") return null;
  return parsePropertySort(localStorage.getItem(PROPERTY_SORT_STORAGE_KEY));
}

export function storePropertySort(sort: PropertySortValue): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PROPERTY_SORT_STORAGE_KEY, sort);
}
