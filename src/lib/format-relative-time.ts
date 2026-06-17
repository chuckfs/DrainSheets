const MINUTE = 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;
const WEEK = DAY * 7;

export function formatRelativeTime(isoDate: string): string {
  const date = new Date(isoDate);
  const seconds = Math.round((Date.now() - date.getTime()) / 1000);

  if (seconds < MINUTE) return "Just now";
  if (seconds < HOUR) {
    const m = Math.floor(seconds / MINUTE);
    return `${m} min ago`;
  }
  if (seconds < DAY) {
    const h = Math.floor(seconds / HOUR);
    return `${h} h ago`;
  }
  if (seconds < WEEK) {
    const d = Math.floor(seconds / DAY);
    return `${d} d ago`;
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  });
}
