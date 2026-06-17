"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isNavActive, mainNavItems } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function IconRail() {
  const pathname = usePathname();

  return (
    <aside
      className="hidden w-[52px] shrink-0 flex-col border-r border-rail-border bg-rail md:flex"
      aria-label="Main navigation"
    >
      <div className="flex h-12 items-center justify-center border-b border-rail-border">
        <Link
          href="/"
          className="flex size-8 items-center justify-center rounded-md text-sm font-bold text-rail-foreground"
          title="DrainSheets"
        >
          DS
        </Link>
      </div>
      <nav className="flex flex-1 flex-col items-center gap-0.5 py-2">
        {mainNavItems.map((item) => {
          const active = isNavActive(pathname, item);
          const Icon = item.icon;
          return (
            <Tooltip key={item.href}>
              <TooltipTrigger
                render={
                  <Link
                    href={item.href}
                    className={cn(
                      "relative flex size-10 items-center justify-center rounded-md text-rail-foreground/70 transition-colors",
                      "hover:bg-rail-accent hover:text-rail-foreground",
                      active && "bg-rail-accent text-rail-foreground",
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    {active && (
                      <span className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-rail-indicator" />
                    )}
                    <Icon className="size-[18px]" aria-hidden />
                    <span className="sr-only">{item.label}</span>
                  </Link>
                }
              />
              <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
          );
        })}
      </nav>
    </aside>
  );
}
