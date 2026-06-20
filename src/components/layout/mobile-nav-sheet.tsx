"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { MenuIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  isRailItemActive,
  parseHomeTab,
  railFooterItems,
  railNavItems,
} from "@/lib/navigation";
import { useSearchCommand } from "@/components/layout/search-command-provider";
import { RailCreateMenu } from "@/components/layout/rail-create-menu";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type NavWorkspace = { id: string; name: string };

export function MobileNavSheet({
  workspaces,
  canCreateWorkspace = false,
}: {
  workspaces: NavWorkspace[];
  canCreateWorkspace?: boolean;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const homeTab = pathname === "/" ? parseHomeTab(searchParams.get("tab") ?? undefined) : null;
  const { openSearch } = useSearchCommand();

  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button variant="ghost" size="icon-sm" className="md:hidden" aria-label="Open menu">
            <MenuIcon className="size-4" />
          </Button>
        }
      />
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="border-b px-4 py-3">
          <SheetTitle className="text-left text-base">DrainSheets</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-0.5 p-2">
          {railNavItems.map((item) => {
            if (item.action === "search") {
              return (
                <button
                  key={item.id}
                  type="button"
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                  onClick={openSearch}
                >
                  <item.icon className="size-4 shrink-0" aria-hidden />
                  {item.label}
                </button>
              );
            }

            if (item.action === "create") {
              return (
                <div key={item.id} className="px-1 py-1">
                  <RailCreateMenu workspaces={workspaces} canCreateWorkspace={canCreateWorkspace} />
                </div>
              );
            }

            const active = isRailItemActive(pathname, homeTab, item);
            const Icon = item.icon;

            return (
              <Link
                key={item.id}
                href={item.href!}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
                  active
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="size-4 shrink-0" aria-hidden />
                {item.label}
              </Link>
            );
          })}

          <div className="my-2 border-t" />

          {railFooterItems.map((item) => {
            const active = isRailItemActive(pathname, homeTab, item);
            const Icon = item.icon;

            return (
              <Link
                key={item.id}
                href={item.href!}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
                  active
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="size-4 shrink-0" aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
