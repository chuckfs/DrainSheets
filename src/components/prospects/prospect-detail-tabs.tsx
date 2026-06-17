"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

export type ProspectDetailTab = "grid" | "details" | "activity";

const TABS: { id: ProspectDetailTab; label: string }[] = [
  { id: "grid", label: "Grid" },
  { id: "details", label: "Details" },
  { id: "activity", label: "Activity" },
];

export function ProspectDetailTabs({ active }: { active: ProspectDetailTab }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setTab(tab: ProspectDetailTab) {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "grid") {
      params.delete("tab");
    } else {
      params.set("tab", tab);
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <div className="flex h-9 items-end gap-0 border-b bg-muted/30 px-2">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => setTab(tab.id)}
          className={cn(
            "relative px-3 py-1.5 text-xs font-medium transition-colors",
            active === tab.id
              ? "text-foreground after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function ProspectBreadcrumb({
  propertyId,
  propertyName,
  prospectName,
}: {
  propertyId: string;
  propertyName: string;
  prospectName: string;
}) {
  return (
    <nav className="flex items-center gap-1 px-3 py-1 text-xs text-muted-foreground">
      <Link href="/properties" className="hover:text-foreground hover:underline">
        Properties
      </Link>
      <span aria-hidden>/</span>
      <Link
        href={`/properties/${propertyId}`}
        className="truncate hover:text-foreground hover:underline"
      >
        {propertyName}
      </Link>
      <span aria-hidden>/</span>
      <span className="truncate text-foreground">{prospectName}</span>
    </nav>
  );
}
