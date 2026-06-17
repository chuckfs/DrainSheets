import Link from "next/link";
import { Suspense } from "react";
import { PlusIcon } from "lucide-react";
import { listProperties } from "@/actions/properties";
import { PropertiesTable } from "@/components/properties/properties-table";
import { PropertiesGridToolbar } from "@/components/properties/properties-grid-toolbar";
import { SheetHeader } from "@/components/layout/sheet-header";
import { ListPageShell } from "@/components/layout/list-page-shell";
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
    <ListPageShell
      header={
        <SheetHeader
          title="Properties"
          subtitle={`${total} ${status === "all" ? "total" : status}`}
          actions={
            canCreateProperty(profile) ? (
              <Link
                href="/properties/new"
                className={cn(buttonVariants({ size: "sm" }), "btn-share gap-1.5")}
              >
                <PlusIcon className="size-3.5" />
                Create
              </Link>
            ) : undefined
          }
        />
      }
      toolbar={
        <Suspense fallback={<div className="h-9 border-b bg-muted/30" />}>
          <PropertiesGridToolbar totalPages={totalPages} currentPage={currentPage} />
        </Suspense>
      }
    >
      <PropertiesTable properties={properties} />
    </ListPageShell>
  );
}
