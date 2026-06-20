"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { workspacePaletteIndex } from "@/lib/workspaces/avatar";
import { WorkspaceAvatar } from "@/components/workspaces/workspace-avatar";
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

function IconRail({
  workspaces,
  activeWorkspaceId,
}: {
  workspaces: RailWorkspace[];
  activeWorkspaceId: string | null;
}) {
  const pathname = usePathname();
  const onHome = pathname === "/";
  const activeWorkspace = useMemo(
    () => workspaces.find((workspace) => workspace.id === activeWorkspaceId) ?? null,
    [activeWorkspaceId, workspaces],
  );
  const railWorkspaces = useMemo(
    () =>
      activeWorkspace
        ? workspaces.filter((workspace) => workspace.id !== activeWorkspace.id)
        : workspaces,
    [activeWorkspace, workspaces],
  );

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

  return (
    <aside
      className="hidden w-[52px] shrink-0 flex-col border-r border-rail-border bg-rail md:flex"
      aria-label="Main navigation"
    >
      <div className="flex h-12 items-center justify-center border-b border-rail-border">
        <Tooltip>
          <TooltipTrigger
            render={
              <Link
                href="/"
                className={cn(
                  "flex size-8 items-center justify-center rounded-lg transition-transform hover:scale-105",
                  onHome && !activeWorkspace
                    ? "bg-primary text-primary-foreground"
                    : "hover:opacity-90",
                )}
                aria-current={onHome ? "page" : undefined}
              >
                {activeWorkspace ? (
                  <WorkspaceAvatar
                    id={activeWorkspace.id}
                    name={activeWorkspace.name}
                    className="size-8"
                    active={!onHome}
                  />
                ) : (
                  <span className="text-[13px] font-semibold tracking-tight">DS</span>
                )}
                <span className="sr-only">{activeWorkspace ? "Home" : "DrainSheets home"}</span>
              </Link>
            }
          />
          <TooltipContent side="right">
            {activeWorkspace ? "Home" : "DrainSheets home"}
          </TooltipContent>
        </Tooltip>
      </div>

      <nav className="flex flex-1 flex-col items-center gap-1.5 overflow-y-auto py-3">
        {railWorkspaces.map((workspace) => {
          const active = workspace.id === activeWorkspaceId;
          return (
            <Tooltip key={workspace.id}>
              <TooltipTrigger
                render={
                  <Link
                    href={`/workspaces/${workspace.id}`}
                    className="relative flex items-center justify-center rounded-lg transition-transform hover:scale-105"
                    aria-current={active ? "page" : undefined}
                  >
                    {active && (
                      <span className="absolute inset-y-1 -left-2 w-[2.5px] rounded-r-full bg-rail-indicator" />
                    )}
                    <WorkspaceAvatar
                      id={workspace.id}
                      name={workspace.name}
                      active={active}
                      className="size-9"
                    />
                    <span className="sr-only">{workspace.name}</span>
                  </Link>
                }
              />
              <TooltipContent side="right">{workspace.name}</TooltipContent>
            </Tooltip>
          );
        })}
      </nav>

      <div className="flex flex-col items-center gap-1 border-t border-rail-border py-3">
        <Tooltip>
          <TooltipTrigger
            render={
              <Link
                href="/settings"
                className={cn(
                  "flex size-10 items-center justify-center rounded-lg text-rail-foreground/60 transition-colors duration-150 hover:bg-rail-accent hover:text-rail-foreground",
                  pathname.startsWith("/settings") && "bg-rail-accent text-primary",
                )}
                aria-current={pathname.startsWith("/settings") ? "page" : undefined}
              >
                <Settings className="size-[18px]" aria-hidden />
                <span className="sr-only">Settings</span>
              </Link>
            }
          />
          <TooltipContent side="right">Settings</TooltipContent>
        </Tooltip>
      </div>
    </aside>
  );
}

export function WorkspaceRailShell({
  workspaces,
  children,
}: {
  workspaces: RailWorkspace[];
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
        <IconRail workspaces={workspaces} activeWorkspaceId={activeWorkspaceId} />
        {children}
      </div>
    </WorkspaceRailContext.Provider>
  );
}
