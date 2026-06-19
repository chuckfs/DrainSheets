import type { RecentSheetItem } from "@/lib/search/format";

const STORAGE_KEY = "drainsheets:recent-sheets";
const MAX_RECENT = 10;

export function readRecentSheetsFromStorage(): RecentSheetItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as RecentSheetItem[];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.slice(0, MAX_RECENT);
  } catch {
    return [];
  }
}

export function writeRecentSheetToStorage(item: RecentSheetItem): void {
  if (typeof window === "undefined") {
    return;
  }

  const existing = readRecentSheetsFromStorage().filter((entry) => entry.sheet_id !== item.sheet_id);
  const next = [item, ...existing].slice(0, MAX_RECENT);

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}
