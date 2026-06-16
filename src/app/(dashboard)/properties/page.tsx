import Link from "next/link";
import { Suspense } from "react";
import { listProperties } from "@/actions/properties";
import { PropertiesTable } from "@/components/properties/properties-table";
import { PropertyFilters } from "@/components/properties/property-filters";
import { requireProfile } from "@/lib/auth/guards";
import { canCreateProperty } from "@/lib/permissions/property";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PropertyStatus } from "@/types/domain";

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    sort?: string;
    page?: string;
  }>;
}) {
  const profile = await requireProfile();
  const params = await searchParams;

  const status = (params.status as PropertyStatus | "all") || "active";
  const sort = (params.sort as "name" | "created_at" | "city") || "name";
  const page = Number(params.page ?? 1);

  const { properties, totalPages, page: currentPage, total } = await listProperties({
    q: params.q,
    status,
    sort,
    page,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Properties</h1>
          <p className="text-muted-foreground">{total} total</p>
        </div>
        {canCreateProperty(profile) && (
          <Link href="/properties/new" className={cn(buttonVariants())}>
            Create property
          </Link>
        )}
      </div>

      <Suspense>
        <PropertyFilters totalPages={totalPages} currentPage={currentPage} />
      </Suspense>

      <PropertiesTable properties={properties} />
    </div>
  );
}
