"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MoreHorizontalIcon, StarIcon } from "lucide-react";
import type { Property } from "@/types/domain";
import { propertyStatusLabel } from "@/lib/permissions/property";
import { formatRelativeTime } from "@/lib/format-relative-time";
import { getFavoritePropertyIds, toggleFavoritePropertyId } from "@/lib/favorites";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SmartsheetGrid,
  SmartsheetGridBody,
  SmartsheetGridCell,
  SmartsheetGridEmpty,
  SmartsheetGridHead,
  SmartsheetGridHeader,
  SmartsheetGridRow,
} from "@/components/data/smartsheet-grid";
import { cn } from "@/lib/utils";

export function PropertiesTable({
  properties,
  canEdit,
}: {
  properties: Property[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    setFavorites(getFavoritePropertyIds());
  }, []);

  function handleToggleFavorite(event: React.MouseEvent, propertyId: string) {
    event.stopPropagation();
    setFavorites(toggleFavoritePropertyId(propertyId));
  }

  if (properties.length === 0) {
    return <SmartsheetGridEmpty message="No properties found." />;
  }

  const sorted = [...properties].sort((a, b) => {
    const aFav = favorites.has(a.id) ? 1 : 0;
    const bFav = favorites.has(b.id) ? 1 : 0;
    if (aFav !== bFav) return bFav - aFav;
    return a.name.localeCompare(b.name);
  });

  return (
    <SmartsheetGrid>
      <SmartsheetGridHeader>
        <SmartsheetGridRow className="hover:bg-transparent even:bg-transparent">
          <SmartsheetGridHead className="w-10 text-center">★</SmartsheetGridHead>
          <SmartsheetGridHead>Name</SmartsheetGridHead>
          <SmartsheetGridHead>Location</SmartsheetGridHead>
          <SmartsheetGridHead className="w-24">Status</SmartsheetGridHead>
          <SmartsheetGridHead className="w-28">Updated</SmartsheetGridHead>
          <SmartsheetGridHead className="w-12 text-center"> </SmartsheetGridHead>
        </SmartsheetGridRow>
      </SmartsheetGridHeader>
      <SmartsheetGridBody>
        {sorted.map((property) => {
          const isFavorite = favorites.has(property.id);

          return (
            <SmartsheetGridRow
              key={property.id}
              className="cursor-pointer"
              onClick={() => router.push(`/properties/${property.id}`)}
            >
              <SmartsheetGridCell className="text-center">
                <button
                  type="button"
                  className="inline-flex size-6 items-center justify-center rounded-sm hover:bg-muted"
                  aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
                  onClick={(event) => handleToggleFavorite(event, property.id)}
                >
                  <StarIcon
                    className={cn(
                      "size-3.5",
                      isFavorite ? "fill-amber-400 text-amber-400" : "text-muted-foreground/50",
                    )}
                  />
                </button>
              </SmartsheetGridCell>
              <SmartsheetGridCell>
                <Link
                  href={`/properties/${property.id}`}
                  className="font-medium text-link hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {property.name}
                </Link>
              </SmartsheetGridCell>
              <SmartsheetGridCell className="text-muted-foreground">
                {[property.address, property.city, property.state].filter(Boolean).join(", ") ||
                  "—"}
              </SmartsheetGridCell>
              <SmartsheetGridCell>
                <span
                  className={
                    property.status === "archived" ? "text-muted-foreground" : "text-foreground"
                  }
                >
                  {propertyStatusLabel(property.status)}
                </span>
              </SmartsheetGridCell>
              <SmartsheetGridCell className="text-muted-foreground">
                {formatRelativeTime(property.updated_at ?? property.created_at)}
              </SmartsheetGridCell>
              <SmartsheetGridCell className="text-center" onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Actions for ${property.name}`}
                      >
                        <MoreHorizontalIcon className="size-3.5" />
                      </Button>
                    }
                  />
                  <DropdownMenuContent align="end" className="w-36">
                    <DropdownMenuItem
                      render={<Link href={`/properties/${property.id}`} />}
                    >
                      Open
                    </DropdownMenuItem>
                    {canEdit && (
                      <DropdownMenuItem
                        render={<Link href={`/properties/${property.id}/edit`} />}
                      >
                        Edit
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </SmartsheetGridCell>
            </SmartsheetGridRow>
          );
        })}
      </SmartsheetGridBody>
    </SmartsheetGrid>
  );
}
