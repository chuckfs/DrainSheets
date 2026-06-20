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
          className="flex size-8 items-center justify-center rounded-lg bg-primary text-[13px] font-semibold tracking-tight text-primary-foreground transition-transform hover:scale-105"
          title="DrainSheets"
        >
          DS
        </Link>
      </div>
      <nav className="flex flex-1 flex-col items-center gap-1 py-3">
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
                      "relative flex size-10 items-center justify-center rounded-lg text-rail-foreground/60 transition-colors duration-150",
                      "hover:bg-rail-accent hover:text-rail-foreground",
                      active && "bg-rail-accent text-primary",
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    {active && (
                      <span className="absolute inset-y-2 left-0 w-[2.5px] rounded-r-full bg-rail-indicator" />
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
