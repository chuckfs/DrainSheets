import type { LucideIcon } from "lucide-react";
import { LayoutGrid, Settings } from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Match exact path only (e.g. dashboard root) */
  exact?: boolean;
};

export const mainNavItems: NavItem[] = [
  { href: "/", label: "Workspaces", icon: LayoutGrid, exact: true },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function isNavActive(pathname: string, item: NavItem): boolean {
  if (item.href === "/") {
    return (
      pathname === "/" ||
      pathname.startsWith("/workspaces/") ||
      pathname.startsWith("/sheets/")
    );
  }

  if (item.exact) {
    return pathname === item.href;
  }

  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
