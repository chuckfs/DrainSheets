import { Suspense } from "react";
import { listProspects } from "@/actions/prospects";
import { ProspectFilters } from "@/components/prospects/prospect-filters";
import { ProspectsTable } from "@/components/prospects/prospects-table";
import { requireProfile } from "@/lib/auth/guards";
import type { ProspectStatus } from "@/types/domain";

export default async function ProspectsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    sort?: string;
    page?: string;
  }>;
}) {
  await requireProfile();
  const params = await searchParams;

  const status = (params.status as ProspectStatus | "all") || "all";
  const sort = (params.sort as "company_name" | "created_at" | "status") || "company_name";
  const page = Number(params.page ?? 1);

  const { prospects, totalPages, page: currentPage, total } = await listProspects({
    q: params.q,
    status,
    sort,
    page,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Prospects</h1>
        <p className="text-muted-foreground">{total} total across all properties</p>
      </div>

      <Suspense>
        <ProspectFilters totalPages={totalPages} currentPage={currentPage} />
      </Suspense>

      <ProspectsTable prospects={prospects} />
    </div>
  );
}
