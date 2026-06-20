"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MenuIcon, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { WorkspaceAvatar } from "@/components/workspaces/workspace-avatar";

type NavWorkspace = { id: string; name: string };

export function MobileNavSheet({ workspaces }: { workspaces: NavWorkspace[] }) {
  const pathname = usePathname();
  const onHome = pathname === "/";
  const activeWorkspaceId = pathname.match(/^\/workspaces\/([^/]+)/)?.[1] ?? null;

  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button variant="ghost" size="icon-sm" className="md:hidden" aria-label="Open menu">
            <MenuIcon className="size-4" />
          </Button>
        }
      />
      <SheetContent side="left" className="w-64 p-0">
        <SheetHeader className="border-b px-4 py-3">
          <SheetTitle className="text-left text-base">DrainSheets</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-0.5 p-2">
          <Link
            href="/"
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
              onHome
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <span className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-xs font-semibold text-primary">
              DS
            </span>
            Home
          </Link>

          {workspaces.map((workspace) => {
            const active = workspace.id === activeWorkspaceId;
            return (
              <Link
                key={workspace.id}
                href={`/workspaces/${workspace.id}`}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
                  active
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <WorkspaceAvatar id={workspace.id} name={workspace.name} className="size-7 text-[10px]" />
                <span className="truncate">{workspace.name}</span>
              </Link>
            );
          })}

          <Link
            href="/settings"
            className={cn(
              "mt-2 flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
              pathname.startsWith("/settings")
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Settings className="size-4 shrink-0" aria-hidden />
            Settings
          </Link>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
