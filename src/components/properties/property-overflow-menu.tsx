"use client";

import Link from "next/link";
import { MoreHorizontalIcon } from "lucide-react";
import { ArchivePropertyMenuItem } from "@/components/properties/archive-property-button";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function PropertyOverflowMenu({
  propertyId,
  propertyName,
  canEdit,
  canArchive,
}: {
  propertyId: string;
  propertyName: string;
  canEdit: boolean;
  canArchive: boolean;
}) {
  if (!canEdit && !canArchive) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="Property actions"
          >
            <MoreHorizontalIcon className="size-3.5" />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-36">
        {canEdit && (
          <DropdownMenuItem render={<Link href={`/properties/${propertyId}/edit`} />}>
            Edit
          </DropdownMenuItem>
        )}
        {canEdit && canArchive && <DropdownMenuSeparator />}
        {canArchive && (
          <ArchivePropertyMenuItem propertyId={propertyId} propertyName={propertyName} />
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
