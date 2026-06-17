"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { StarIcon } from "lucide-react";
import type { Property } from "@/types/domain";
import { getFavoritePropertyIds, getFavoritePropertyNames } from "@/lib/favorites";
import { formatRecentOpened } from "@/lib/format-relative-time";
import { getRecentProperties, type RecentProperty } from "@/lib/recent-properties";
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

function FavoritesTable({ properties }: { properties: Property[] }) {
  const router = useRouter();

  if (properties.length === 0) return null;

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
          {properties.map((property) => (
            <SmartsheetGridRow
              key={property.id}
              className="cursor-pointer"
              onClick={() => router.push(`/properties/${property.id}`)}
            >
              <SmartsheetGridCell className="text-center">
                <StarIcon className="mx-auto size-3.5 fill-amber-400 text-amber-400" aria-hidden />
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
                {[property.city, property.state].filter(Boolean).join(", ") || "—"}
              </SmartsheetGridCell>
            </SmartsheetGridRow>
          ))}
        </SmartsheetGridBody>
      </SmartsheetGrid>
    </section>
  );
}

function RecentPropertiesTable({ recents }: { recents: RecentProperty[] }) {
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
                key={entry.id}
                className="cursor-pointer"
                onClick={() => router.push(`/properties/${entry.id}`)}
              >
                <SmartsheetGridCell>
                  <Link
                    href={`/properties/${entry.id}`}
                    className="font-medium text-link hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {entry.name}
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

export function RecentsPageContent({ properties }: { properties: Property[] }) {
  const [recents, setRecents] = useState<RecentProperty[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setRecents(getRecentProperties());
    setFavorites(getFavoritePropertyIds());
    setHydrated(true);
  }, []);

  const favoriteProperties = useMemo(() => {
    const byId = new Map(properties.map((property) => [property.id, property]));
    const names = getFavoritePropertyNames();
    const recentNames = new Map(recents.map((entry) => [entry.id, entry.name]));

    return [...favorites]
      .map((id) => {
        const property = byId.get(id);
        if (property) return property;
        const name = names[id] ?? recentNames.get(id);
        if (!name) return null;
        return {
          id,
          name,
          address: null,
          city: null,
          state: null,
          description: null,
          status: "active" as const,
          created_at: "",
          updated_at: "",
          org_id: "",
          search_vector: null,
          created_by: null,
        } satisfies Property;
      })
      .filter((property): property is Property => property !== null)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [favorites, properties, recents]);

  if (!hydrated) {
    return <div className="min-h-[200px] animate-pulse bg-muted/20" />;
  }

  return (
    <div className={cn("pb-3")}>
      {favoriteProperties.length > 0 && <FavoritesTable properties={favoriteProperties} />}
      <RecentPropertiesTable recents={recents} />
    </div>
  );
}
