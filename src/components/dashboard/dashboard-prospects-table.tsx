import Link from "next/link";
import { StoreIcon } from "lucide-react";
import type { RecentProspect } from "@/actions/dashboard";
import { formatRelativeTime } from "@/lib/format-relative-time";
import {
  SmartsheetGrid,
  SmartsheetGridBody,
  SmartsheetGridCell,
  SmartsheetGridEmpty,
  SmartsheetGridHead,
  SmartsheetGridHeader,
  SmartsheetGridRow,
} from "@/components/data/smartsheet-grid";

export function DashboardProspectsTable({ prospects }: { prospects: RecentProspect[] }) {
  return (
    <section className="min-w-0 flex-1">
      <div className="flex items-center justify-between border-x border-t bg-muted/40 px-2 py-1">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Recent prospects
        </h2>
        <Link href="/prospects" className="text-xs text-link hover:underline">
          View all
        </Link>
      </div>
      {prospects.length === 0 ? (
        <SmartsheetGridEmpty message="No prospects to show." />
      ) : (
        <SmartsheetGrid className="border-t-0">
          <SmartsheetGridHeader>
            <SmartsheetGridRow className="hover:bg-transparent even:bg-transparent">
              <SmartsheetGridHead className="w-8"> </SmartsheetGridHead>
              <SmartsheetGridHead>Company</SmartsheetGridHead>
              <SmartsheetGridHead>Property</SmartsheetGridHead>
              <SmartsheetGridHead className="w-28">Added</SmartsheetGridHead>
            </SmartsheetGridRow>
          </SmartsheetGridHeader>
          <SmartsheetGridBody>
            {prospects.map((prospect) => (
              <SmartsheetGridRow key={prospect.id}>
                <SmartsheetGridCell className="text-center">
                  <StoreIcon className="mx-auto size-3 text-sheet-icon" aria-hidden />
                </SmartsheetGridCell>
                <SmartsheetGridCell>
                  <Link
                    href={`/prospects/${prospect.id}`}
                    className="font-medium text-link hover:underline"
                  >
                    {prospect.company_name}
                  </Link>
                </SmartsheetGridCell>
                <SmartsheetGridCell className="max-w-[140px] truncate text-muted-foreground">
                  {prospect.properties ? (
                    <Link
                      href={`/properties/${prospect.properties.id}`}
                      className="text-link hover:underline"
                    >
                      {prospect.properties.name}
                    </Link>
                  ) : (
                    "—"
                  )}
                </SmartsheetGridCell>
                <SmartsheetGridCell className="text-muted-foreground">
                  {formatRelativeTime(prospect.created_at)}
                </SmartsheetGridCell>
              </SmartsheetGridRow>
            ))}
          </SmartsheetGridBody>
        </SmartsheetGrid>
      )}
    </section>
  );
}
