const STORAGE_KEY = "drainsheets-favorite-properties";

export function getFavoritePropertyIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id): id is string => typeof id === "string"));
  } catch {
    return new Set();
  }
}

export function setFavoritePropertyIds(ids: Set<string>): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
}

export function toggleFavoritePropertyId(id: string, name?: string): Set<string> {
  const favorites = getFavoritePropertyIds();
  if (favorites.has(id)) {
    favorites.delete(id);
    removeFavoritePropertyName(id);
  } else {
    favorites.add(id);
    if (name) recordFavoritePropertyName(id, name);
  }
  setFavoritePropertyIds(favorites);
  return favorites;
}

const NAMES_KEY = "drainsheets-favorite-property-names";

export function recordFavoritePropertyName(id: string, name: string): void {
  if (typeof window === "undefined") return;
  const names = getFavoritePropertyNames();
  names[id] = name;
  localStorage.setItem(NAMES_KEY, JSON.stringify(names));
}

function removeFavoritePropertyName(id: string): void {
  if (typeof window === "undefined") return;
  const names = getFavoritePropertyNames();
  delete names[id];
  localStorage.setItem(NAMES_KEY, JSON.stringify(names));
}

export function getFavoritePropertyNames(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(NAMES_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== "object" || parsed === null) return {};
    return parsed as Record<string, string>;
  } catch {
    return {};
  }
}
