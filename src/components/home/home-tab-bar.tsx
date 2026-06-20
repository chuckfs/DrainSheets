"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { HOME_TABS, type HomeTab } from "@/lib/navigation";

export function HomeTabBar({ activeTab }: { activeTab: HomeTab }) {
  return (
    <nav className="flex items-center gap-6 border-b px-3" aria-label="Home sections">
      {HOME_TABS.map((tab) => {
        const href = tab.id === "recents" ? "/" : `/?tab=${tab.id}`;
        const active = activeTab === tab.id;

        return (
          <Link
            key={tab.id}
            href={href}
            className={cn(
              "-mb-px border-b-2 pb-2.5 text-sm font-medium transition-colors",
              active
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
            aria-current={active ? "page" : undefined}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
