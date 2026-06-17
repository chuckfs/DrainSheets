import Link from "next/link";
import { LayoutGridIcon } from "lucide-react";
import type { AssignedProperty } from "@/actions/dashboard";
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

export function DashboardPropertiesTable({
  title,
  properties,
}: {
  title: string;
  properties: AssignedProperty[];
}) {
  return (
    <section className="min-w-0 flex-1">
      <div className="flex items-center justify-between border-x border-t bg-muted/40 px-2 py-1">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {title}
        </h2>
        <Link href="/properties" className="text-xs text-link hover:underline">
          View all
        </Link>
      </div>
      {properties.length === 0 ? (
        <SmartsheetGridEmpty message="No properties to show." />
      ) : (
        <SmartsheetGrid className="border-t-0">
          <SmartsheetGridHeader>
            <SmartsheetGridRow className="hover:bg-transparent even:bg-transparent">
              <SmartsheetGridHead className="w-8"> </SmartsheetGridHead>
              <SmartsheetGridHead>Name</SmartsheetGridHead>
              <SmartsheetGridHead>Location</SmartsheetGridHead>
              <SmartsheetGridHead className="w-28">Last updated</SmartsheetGridHead>
            </SmartsheetGridRow>
          </SmartsheetGridHeader>
          <SmartsheetGridBody>
            {properties.map((property) => (
              <SmartsheetGridRow key={property.id}>
                <SmartsheetGridCell className="text-center">
                  <LayoutGridIcon className="mx-auto size-3 text-sheet-icon" aria-hidden />
                </SmartsheetGridCell>
                <SmartsheetGridCell>
                  <Link
                    href={`/properties/${property.id}`}
                    className="font-medium text-link hover:underline"
                  >
                    {property.name}
                  </Link>
                </SmartsheetGridCell>
                <SmartsheetGridCell className="text-muted-foreground">
                  {[property.city, property.state].filter(Boolean).join(", ") || "—"}
                </SmartsheetGridCell>
                <SmartsheetGridCell className="text-muted-foreground">
                  {formatRelativeTime(property.updated_at)}
                </SmartsheetGridCell>
              </SmartsheetGridRow>
            ))}
          </SmartsheetGridBody>
        </SmartsheetGrid>
      )}
    </section>
  );
}
