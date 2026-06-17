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

/** Smartsheet-style recents label: "5 minutes ago", "Yesterday", etc. */
export function formatRecentOpened(isoDate: string): string {
  const date = new Date(isoDate);
  const seconds = Math.round((Date.now() - date.getTime()) / 1000);

  if (seconds < MINUTE) return "Just now";
  if (seconds < HOUR) {
    const m = Math.floor(seconds / MINUTE);
    return `${m} minute${m === 1 ? "" : "s"} ago`;
  }

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);

  if (date >= startOfToday) {
    const h = Math.floor(seconds / HOUR);
    return `${h} hour${h === 1 ? "" : "s"} ago`;
  }

  if (date >= startOfYesterday) {
    return "Yesterday";
  }

  if (seconds < WEEK) {
    const d = Math.floor(seconds / DAY);
    return `${d} day${d === 1 ? "" : "s"} ago`;
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  });
}

/** Compact note timestamp: "2h ago", "Yesterday" */
export function formatCompactTime(isoDate: string): string {
  const date = new Date(isoDate);
  const seconds = Math.round((Date.now() - date.getTime()) / 1000);

  if (seconds < MINUTE) return "Just now";
  if (seconds < HOUR) {
    const m = Math.floor(seconds / MINUTE);
    return `${m}m ago`;
  }
  if (seconds < DAY) {
    const h = Math.floor(seconds / HOUR);
    return `${h}h ago`;
  }

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);

  if (date >= startOfYesterday) {
    return "Yesterday";
  }

  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
