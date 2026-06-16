import Link from "next/link";
import type { AssignedProperty } from "@/actions/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AssignedPropertiesCard({
  title,
  properties,
}: {
  title: string;
  properties: AssignedProperty[];
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {properties.length === 0 ? (
          <p className="text-sm text-muted-foreground">No properties to show.</p>
        ) : (
          <ul className="space-y-2">
            {properties.map((property) => (
              <li key={property.id}>
                <Link href={`/properties/${property.id}`} className="text-sm font-medium hover:underline">
                  {property.name}
                </Link>
                {(property.city || property.state) && (
                  <p className="text-xs text-muted-foreground">
                    {[property.city, property.state].filter(Boolean).join(", ")}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
