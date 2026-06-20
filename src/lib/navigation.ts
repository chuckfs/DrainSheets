import type { LucideIcon } from "lucide-react";
import {
  Bell,
  Clock,
  Home,
  LayoutGrid,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  Star,
} from "lucide-react";

export type RailNavItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  href?: string;
  action?: "search" | "create" | "more";
};

export const railNavItems: RailNavItem[] = [
  { id: "home", href: "/", label: "Home", icon: Home },
  { id: "notifications", href: "/notifications", label: "Notifications", icon: Bell },
  { id: "search", label: "Search", icon: Search, action: "search" },
  { id: "browse", href: "/browse", label: "Browse", icon: LayoutGrid },
  { id: "recents", href: "/?tab=recents", label: "Recents", icon: Clock },
  { id: "favorites", href: "/?tab=favorites", label: "Favorites", icon: Star },
  { id: "create", label: "Create", icon: Plus, action: "create" },
  { id: "more", label: "More", icon: MoreHorizontal, action: "more" },
];

export const railFooterItems: RailNavItem[] = [
  { id: "settings", href: "/settings", label: "Settings", icon: Settings },
];

export type HomeTab = "recents" | "favorites" | "activity" | "workspaces";

export const HOME_TABS: Array<{ id: HomeTab; label: string }> = [
  { id: "recents", label: "Recents" },
  { id: "favorites", label: "Favorites" },
  { id: "activity", label: "Activity" },
  { id: "workspaces", label: "Workspaces" },
];

export function parseHomeTab(value: string | undefined): HomeTab {
  if (value === "favorites" || value === "activity" || value === "workspaces") {
    return value;
  }
  return "recents";
}

export function isRailItemActive(
  pathname: string,
  tab: HomeTab | null,
  item: RailNavItem,
): boolean {
  switch (item.id) {
    case "home":
      return pathname === "/";
    case "recents":
      return pathname === "/" && tab === "recents";
    case "favorites":
      return pathname === "/" && tab === "favorites";
    case "browse":
      return pathname === "/browse" || pathname.startsWith("/workspaces/");
    case "notifications":
      return pathname.startsWith("/notifications");
    case "settings":
      return pathname.startsWith("/settings");
    default:
      return false;
  }
}

/** @deprecated Mobile nav only */
export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
};

export const mainNavItems: NavItem[] = [
  { href: "/", label: "Home", icon: Home, exact: true },
  { href: "/browse", label: "Browse", icon: LayoutGrid },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function isNavActive(pathname: string, item: NavItem): boolean {
  if (item.exact) {
    return pathname === item.href;
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
