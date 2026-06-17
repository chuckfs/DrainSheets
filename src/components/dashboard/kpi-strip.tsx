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
    <div className="flex flex-wrap items-stretch divide-x border-b bg-muted/20">
      {statItems.map((item) => {
        const content = (
          <>
            <span className="text-xs font-medium text-muted-foreground">{item.label}</span>
            <span className="text-xl font-semibold tabular-nums">{stats[item.key]}</span>
          </>
        );

        return item.href ? (
          <Link
            key={item.key}
            href={item.href}
            className="flex min-w-[100px] flex-1 flex-col px-3 py-2 transition-colors hover:bg-muted/40"
          >
            {content}
          </Link>
        ) : (
          <div key={item.key} className="flex min-w-[100px] flex-1 flex-col px-3 py-2">
            {content}
          </div>
        );
      })}
    </div>
  );
}
