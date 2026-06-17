import Link from "next/link";
import { LayoutGridIcon } from "lucide-react";
import type { Property } from "@/types/domain";
import { propertyStatusLabel } from "@/lib/permissions/property";
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

export function PropertiesTable({ properties }: { properties: Property[] }) {
  if (properties.length === 0) {
    return <SmartsheetGridEmpty message="No properties found." />;
  }

  return (
    <SmartsheetGrid>
      <SmartsheetGridHeader>
        <SmartsheetGridRow className="hover:bg-transparent even:bg-transparent">
          <SmartsheetGridHead className="w-10 text-center"> </SmartsheetGridHead>
          <SmartsheetGridHead>Name</SmartsheetGridHead>
          <SmartsheetGridHead>Location</SmartsheetGridHead>
          <SmartsheetGridHead className="w-24">Status</SmartsheetGridHead>
          <SmartsheetGridHead className="w-32">Last updated</SmartsheetGridHead>
        </SmartsheetGridRow>
      </SmartsheetGridHeader>
      <SmartsheetGridBody>
        {properties.map((property) => (
          <SmartsheetGridRow key={property.id}>
            <SmartsheetGridCell className="text-center">
              <LayoutGridIcon
                className="mx-auto size-3.5 text-sheet-icon"
                aria-hidden
              />
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
            <SmartsheetGridCell>
              <span
                className={
                  property.status === "archived"
                    ? "text-muted-foreground"
                    : "text-foreground"
                }
              >
                {propertyStatusLabel(property.status)}
              </span>
            </SmartsheetGridCell>
            <SmartsheetGridCell className="text-muted-foreground">
              {formatRelativeTime(property.updated_at ?? property.created_at)}
            </SmartsheetGridCell>
          </SmartsheetGridRow>
        ))}
      </SmartsheetGridBody>
    </SmartsheetGrid>
  );
}
