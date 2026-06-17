import type { LucideIcon } from "lucide-react";
import {
  Building2,
  Clock,
  Contact,
  Paperclip,
  Settings,
  Store,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Match exact path only (e.g. dashboard root) */
  exact?: boolean;
};

export const mainNavItems: NavItem[] = [
  { href: "/", label: "Recents", icon: Clock, exact: true },
  { href: "/properties", label: "Properties", icon: Building2 },
  { href: "/prospects", label: "Prospects", icon: Store },
  { href: "/contacts", label: "Contacts", icon: Contact },
  { href: "/documents", label: "Documents", icon: Paperclip },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function isNavActive(pathname: string, item: NavItem): boolean {
  if (item.exact) {
    return pathname === item.href;
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
