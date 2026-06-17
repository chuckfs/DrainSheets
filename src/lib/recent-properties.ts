export const RECENT_PROPERTIES_STORAGE_KEY = "drainsheets:recent-properties";
const MAX_RECENT = 10;

export type RecentProperty = {
  id: string;
  name: string;
  viewedAt: string;
};

export function getRecentProperties(): RecentProperty[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(RECENT_PROPERTIES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(
        (entry): entry is RecentProperty =>
          typeof entry === "object" &&
          entry !== null &&
          typeof (entry as RecentProperty).id === "string" &&
          typeof (entry as RecentProperty).name === "string" &&
          typeof (entry as RecentProperty).viewedAt === "string",
      )
      .slice(0, MAX_RECENT);
  } catch {
    return [];
  }
}

export function recordRecentProperty(property: { id: string; name: string }): void {
  if (typeof window === "undefined") return;

  const now = new Date().toISOString();
  const existing = getRecentProperties().filter((entry) => entry.id !== property.id);
  const next: RecentProperty[] = [{ id: property.id, name: property.name, viewedAt: now }, ...existing].slice(
    0,
    MAX_RECENT,
  );

  localStorage.setItem(RECENT_PROPERTIES_STORAGE_KEY, JSON.stringify(next));
}

export function getRecentPropertyViewedAt(propertyId: string): string | null {
  return getRecentProperties().find((entry) => entry.id === propertyId)?.viewedAt ?? null;
}
