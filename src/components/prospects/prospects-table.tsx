import Link from "next/link";
import { StoreIcon } from "lucide-react";
import type { ProspectWithProperty } from "@/actions/prospects";
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

export function ProspectsTable({ prospects }: { prospects: ProspectWithProperty[] }) {
  if (prospects.length === 0) {
    return <SmartsheetGridEmpty message="No prospects found." />;
  }

  return (
    <SmartsheetGrid>
      <SmartsheetGridHeader>
        <SmartsheetGridRow className="hover:bg-transparent even:bg-transparent">
          <SmartsheetGridHead className="w-10 text-center"> </SmartsheetGridHead>
          <SmartsheetGridHead>Company</SmartsheetGridHead>
          <SmartsheetGridHead>Property</SmartsheetGridHead>
          <SmartsheetGridHead className="w-28">Use</SmartsheetGridHead>
          <SmartsheetGridHead className="w-28">Status</SmartsheetGridHead>
          <SmartsheetGridHead className="w-32">Last updated</SmartsheetGridHead>
        </SmartsheetGridRow>
      </SmartsheetGridHeader>
      <SmartsheetGridBody>
        {prospects.map((prospect) => (
          <SmartsheetGridRow key={prospect.id}>
            <SmartsheetGridCell className="text-center">
              <StoreIcon className="mx-auto size-3.5 text-sheet-icon" aria-hidden />
            </SmartsheetGridCell>
            <SmartsheetGridCell>
              <Link
                href={`/prospects/${prospect.id}`}
                className="font-medium text-link hover:underline"
              >
                {prospect.company_name}
              </Link>
            </SmartsheetGridCell>
            <SmartsheetGridCell className="text-muted-foreground">
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
              {prospect.category ?? "—"}
            </SmartsheetGridCell>
            <SmartsheetGridCell className="capitalize text-muted-foreground">
              {prospect.status ?? "—"}
            </SmartsheetGridCell>
            <SmartsheetGridCell className="text-muted-foreground">
              {formatRelativeTime(prospect.updated_at ?? prospect.created_at)}
            </SmartsheetGridCell>
          </SmartsheetGridRow>
        ))}
      </SmartsheetGridBody>
    </SmartsheetGrid>
  );
}
