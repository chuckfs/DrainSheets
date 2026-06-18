"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FavoriteProperty } from "@/actions/favorites";
import type { RecentPropertyView } from "@/actions/recents";
import { formatRecentOpened } from "@/lib/format-relative-time";
import {
  SmartsheetGrid,
  SmartsheetGridBody,
  SmartsheetGridCell,
  SmartsheetGridEmpty,
  SmartsheetGridHead,
  SmartsheetGridHeader,
  SmartsheetGridRow,
} from "@/components/data/smartsheet-grid";
import { StarIcon } from "lucide-react";

function FavoritesTable({ favorites }: { favorites: FavoriteProperty[] }) {
  const router = useRouter();

  if (favorites.length === 0) return null;

  return (
    <section className="mb-4">
      <h2 className="mb-1 px-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Favorites
      </h2>
      <SmartsheetGrid>
        <SmartsheetGridHeader>
          <SmartsheetGridRow className="hover:bg-transparent even:bg-transparent">
            <SmartsheetGridHead className="w-10 text-center">★</SmartsheetGridHead>
            <SmartsheetGridHead>Property</SmartsheetGridHead>
            <SmartsheetGridHead className="w-40">Location</SmartsheetGridHead>
          </SmartsheetGridRow>
        </SmartsheetGridHeader>
        <SmartsheetGridBody>
          {favorites.map((favorite) => (
            <SmartsheetGridRow
              key={favorite.propertyId}
              className="cursor-pointer"
              onClick={() => router.push(`/properties/${favorite.propertyId}`)}
            >
              <SmartsheetGridCell className="text-center">
                <StarIcon className="mx-auto size-3.5 fill-amber-400 text-amber-400" aria-hidden />
              </SmartsheetGridCell>
              <SmartsheetGridCell>
                <Link
                  href={`/properties/${favorite.propertyId}`}
                  className="font-medium text-link hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {favorite.property.name}
                </Link>
              </SmartsheetGridCell>
              <SmartsheetGridCell className="text-muted-foreground">
                {[favorite.property.city, favorite.property.state].filter(Boolean).join(", ") ||
                  "—"}
              </SmartsheetGridCell>
            </SmartsheetGridRow>
          ))}
        </SmartsheetGridBody>
      </SmartsheetGrid>
    </section>
  );
}

function RecentPropertiesTable({ recents }: { recents: RecentPropertyView[] }) {
  const router = useRouter();

  return (
    <section>
      <h2 className="mb-1 px-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Recent Properties
      </h2>
      {recents.length === 0 ? (
        <SmartsheetGridEmpty message="No recent properties yet. Open a property to begin." />
      ) : (
        <SmartsheetGrid>
          <SmartsheetGridHeader>
            <SmartsheetGridRow className="hover:bg-transparent even:bg-transparent">
              <SmartsheetGridHead>Property</SmartsheetGridHead>
              <SmartsheetGridHead className="w-40">Last Opened</SmartsheetGridHead>
            </SmartsheetGridRow>
          </SmartsheetGridHeader>
          <SmartsheetGridBody>
            {recents.map((entry) => (
              <SmartsheetGridRow
                key={entry.propertyId}
                className="cursor-pointer"
                onClick={() => router.push(`/properties/${entry.propertyId}`)}
              >
                <SmartsheetGridCell>
                  <Link
                    href={`/properties/${entry.propertyId}`}
                    className="font-medium text-link hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {entry.property.name}
                  </Link>
                </SmartsheetGridCell>
                <SmartsheetGridCell className="text-muted-foreground">
                  {formatRecentOpened(entry.viewedAt)}
                </SmartsheetGridCell>
              </SmartsheetGridRow>
            ))}
          </SmartsheetGridBody>
        </SmartsheetGrid>
      )}
    </section>
  );
}

export function RecentsPageContent({
  favorites,
  recents,
}: {
  favorites: FavoriteProperty[];
  recents: RecentPropertyView[];
}) {
  return (
    <div className="pb-3">
      <FavoritesTable favorites={favorites} />
      <RecentPropertiesTable recents={recents} />
    </div>
  );
}
