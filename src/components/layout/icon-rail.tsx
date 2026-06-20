"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { workspacePaletteIndex } from "@/lib/workspaces/avatar";
import {
  isRailItemActive,
  parseHomeTab,
  railFooterItems,
  railNavItems,
  type RailNavItem,
} from "@/lib/navigation";
import { useSearchCommand } from "@/components/layout/search-command-provider";
import { RailCreateMenu } from "@/components/layout/rail-create-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { WorkspaceRailContext } from "./workspace-rail-context";

export type RailWorkspace = { id: string; name: string };

const ACCENT_OVERRIDES: Record<string, (i: number) => string> = {
  "--primary": (i) => `var(--ws-${i}-accent)`,
  "--primary-foreground": () => "var(--ws-on-accent)",
  "--ring": (i) => `var(--ws-${i}-accent)`,
  "--rail-indicator": (i) => `var(--ws-${i}-accent)`,
  "--sidebar-primary": (i) => `var(--ws-${i}-accent)`,
  "--sidebar-ring": (i) => `var(--ws-${i}-accent)`,
  "--link": (i) => `var(--ws-${i}-accent)`,
  "--sheet-icon": (i) => `var(--ws-${i}-accent)`,
  "--chart-1": (i) => `var(--ws-${i}-accent)`,
  "--row-selected": (i) => `var(--ws-${i}-bg)`,
};

function RailNavButton({
  item,
  active,
  onClick,
}: {
  item: RailNavItem;
  active: boolean;
  onClick?: () => void;
}) {
  const Icon = item.icon;
  const content = (
    <>
      <Icon className="size-[18px] shrink-0" aria-hidden />
      <span className="text-[10px] font-medium leading-none">{item.label}</span>
    </>
  );

  const className = cn(
    "relative flex w-full flex-col items-center gap-1 rounded-lg px-1 py-2 transition-colors",
    active
      ? "bg-rail-accent text-primary"
      : "text-rail-foreground/70 hover:bg-rail-accent hover:text-rail-foreground",
  );

  if (onClick) {
    return (
      <button type="button" className={className} onClick={onClick} aria-current={active ? "page" : undefined}>
        {content}
      </button>
    );
  }

  return (
    <Link href={item.href!} className={className} aria-current={active ? "page" : undefined}>
      {active ? (
        <span className="absolute inset-y-1 -left-0.5 w-[2.5px] rounded-r-full bg-rail-indicator" />
      ) : null}
      {content}
    </Link>
  );
}

function IconRail({
  workspaces,
  activeWorkspaceId,
  canCreateWorkspace,
}: {
  workspaces: RailWorkspace[];
  activeWorkspaceId: string | null;
  canCreateWorkspace: boolean;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const homeTab = pathname === "/" ? parseHomeTab(searchParams.get("tab") ?? undefined) : null;
  const { openSearch } = useSearchCommand();

  useEffect(() => {
    const root = document.documentElement;
    const keys = Object.keys(ACCENT_OVERRIDES);

    if (activeWorkspaceId) {
      const index = workspacePaletteIndex(activeWorkspaceId);
      for (const key of keys) {
        root.style.setProperty(key, ACCENT_OVERRIDES[key]!(index));
      }
    } else {
      for (const key of keys) root.style.removeProperty(key);
    }

    return () => {
      for (const key of keys) root.style.removeProperty(key);
    };
  }, [activeWorkspaceId]);

  const navItems = useMemo(
    () =>
      railNavItems.map((item) => ({
        item,
        active: isRailItemActive(pathname, homeTab, item),
      })),
    [homeTab, pathname],
  );

  return (
    <aside
      className="hidden w-[72px] shrink-0 flex-col border-r border-rail-border bg-rail md:flex"
      aria-label="Main navigation"
    >
      <div className="flex h-12 items-center justify-center border-b border-rail-border">
        <Link
          href="/"
          className="flex size-9 items-center justify-center rounded-lg bg-primary text-[13px] font-semibold tracking-tight text-primary-foreground transition-transform hover:scale-105"
          aria-label="DrainSheets home"
        >
          DS
        </Link>
      </div>

      <nav className="flex flex-1 flex-col items-stretch gap-0.5 overflow-y-auto px-1 py-2">
        {navItems.map(({ item, active }) => {
          if (item.action === "search") {
            return (
              <Tooltip key={item.id}>
                <TooltipTrigger
                  render={
                    <div>
                      <RailNavButton item={item} active={false} onClick={openSearch} />
                    </div>
                  }
                />
                <TooltipContent side="right">Search (⌘K)</TooltipContent>
              </Tooltip>
            );
          }

          if (item.action === "create") {
            return (
              <div key={item.id} className="pt-1">
                <RailCreateMenu workspaces={workspaces} canCreateWorkspace={canCreateWorkspace} />
              </div>
            );
          }

          return (
            <Tooltip key={item.id}>
              <TooltipTrigger render={<div><RailNavButton item={item} active={active} /></div>} />
              <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
          );
        })}
      </nav>

      <div className="border-t border-rail-border px-1 py-2">
        {railFooterItems.map((item) => {
          const active = isRailItemActive(pathname, homeTab, item);
          return (
            <Tooltip key={item.id}>
              <TooltipTrigger render={<div><RailNavButton item={item} active={active} /></div>} />
              <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </aside>
  );
}

export function WorkspaceRailShell({
  workspaces,
  canCreateWorkspace,
  children,
}: {
  workspaces: RailWorkspace[];
  canCreateWorkspace: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sheetWorkspaceId, setSheetWorkspaceId] = useState<string | null>(null);
  const routeWorkspaceId = pathname.match(/^\/workspaces\/([^/]+)/)?.[1] ?? null;
  const activeWorkspaceId = routeWorkspaceId ?? sheetWorkspaceId;

  useEffect(() => {
    if (routeWorkspaceId) {
      setSheetWorkspaceId(null);
    }
  }, [routeWorkspaceId]);

  return (
    <WorkspaceRailContext.Provider value={{ setSheetWorkspaceId }}>
      <div className="flex min-h-screen">
        <IconRail
          workspaces={workspaces}
          activeWorkspaceId={activeWorkspaceId}
          canCreateWorkspace={canCreateWorkspace}
        />
        {children}
      </div>
    </WorkspaceRailContext.Provider>
  );
}
