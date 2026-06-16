import Link from "next/link";
import { notFound } from "next/navigation";
import {
  listEditors,
  listPropertyAssignments,
} from "@/actions/assignments";
import { getProperty } from "@/actions/properties";
import { listProspects } from "@/actions/prospects";
import { ArchivePropertyButton } from "@/components/properties/archive-property-button";
import { PropertyAssignmentsPanel } from "@/components/properties/property-assignments-panel";
import { ProspectsTable } from "@/components/prospects/prospects-table";
import { requireProfile } from "@/lib/auth/guards";
import {
  canArchiveProperty,
  canManageAssignments,
  propertyStatusLabel,
} from "@/lib/permissions/property";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await requireProfile();
  const { id } = await params;
  const property = await getProperty(id);

  if (!property) {
    notFound();
  }

  const { prospects } = await listProspects({ propertyId: id, page: 1 });
  const assignments = canManageAssignments(profile)
    ? await listPropertyAssignments(id)
    : [];
  const editors = canManageAssignments(profile) ? await listEditors() : [];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{property.name}</h1>
            <Badge variant={property.status === "archived" ? "secondary" : "default"}>
              {propertyStatusLabel(property.status)}
            </Badge>
          </div>
          {(property.address || property.city || property.state) && (
            <p className="mt-1 text-muted-foreground">
              {[property.address, property.city, property.state].filter(Boolean).join(", ")}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Link href={`/properties/${id}/edit`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            Edit
          </Link>
          {canArchiveProperty(profile) && property.status === "active" && (
            <ArchivePropertyButton propertyId={id} propertyName={property.name} />
          )}
        </div>
      </div>

      {property.description && (
        <div className="rounded-lg border p-4">
          <h2 className="mb-2 text-sm font-medium">Description</h2>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{property.description}</p>
        </div>
      )}

      {canManageAssignments(profile) && (
        <PropertyAssignmentsPanel
          propertyId={id}
          editors={editors}
          assignments={assignments}
        />
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Prospects</h2>
          {property.status === "active" && (
            <Link
              href={`/properties/${id}/prospects/new`}
              className={cn(buttonVariants({ size: "sm" }))}
            >
              Add prospect
            </Link>
          )}
        </div>
        <ProspectsTable prospects={prospects} />
      </div>
    </div>
  );
}
