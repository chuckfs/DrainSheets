import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { Property } from "@/types/domain";
import { propertyStatusLabel } from "@/lib/permissions/property";

export function PropertiesTable({ properties }: { properties: Property[] }) {
  if (properties.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        No properties found.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/50">
          <tr>
            <th className="px-4 py-3 text-left font-medium">Name</th>
            <th className="px-4 py-3 text-left font-medium">Location</th>
            <th className="px-4 py-3 text-left font-medium">Status</th>
            <th className="px-4 py-3 text-left font-medium">Created</th>
          </tr>
        </thead>
        <tbody>
          {properties.map((property) => (
            <tr key={property.id} className="border-b last:border-b-0 hover:bg-muted/30">
              <td className="px-4 py-3">
                <Link href={`/properties/${property.id}`} className="font-medium hover:underline">
                  {property.name}
                </Link>
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {[property.city, property.state].filter(Boolean).join(", ") || "—"}
              </td>
              <td className="px-4 py-3">
                <Badge variant={property.status === "archived" ? "secondary" : "default"}>
                  {propertyStatusLabel(property.status)}
                </Badge>
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {new Date(property.created_at).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
