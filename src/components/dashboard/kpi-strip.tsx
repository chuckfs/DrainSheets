import Link from "next/link";
import type { DashboardStats } from "@/actions/dashboard";

const statItems: Array<{
  key: keyof DashboardStats;
  label: string;
  href?: string;
}> = [
  { key: "properties", label: "Properties", href: "/properties" },
  { key: "prospects", label: "Prospects", href: "/prospects" },
  { key: "contacts", label: "Contacts", href: "/contacts" },
  { key: "documents", label: "Documents", href: "/documents" },
  { key: "notes", label: "Notes" },
];

export function KpiStrip({ stats }: { stats: DashboardStats }) {
  return (
    <div className="flex min-h-10 flex-wrap items-center gap-x-1 border-b px-3 py-2">
      <div className="inline-flex flex-wrap items-center rounded-md border bg-muted/20 px-3 py-1.5 text-sm">
        {statItems.map((item, index) => {
          const segment = (
            <>
              <span className="text-muted-foreground">{item.label}</span>{" "}
              <span className="font-semibold tabular-nums text-foreground">{stats[item.key]}</span>
            </>
          );

          return (
            <span key={item.key} className="inline-flex items-center">
              {index > 0 && (
                <span className="mx-2 text-muted-foreground/60" aria-hidden>
                  ·
                </span>
              )}
              {item.href ? (
                <Link href={item.href} className="transition-colors hover:text-link">
                  {segment}
                </Link>
              ) : (
                segment
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}
