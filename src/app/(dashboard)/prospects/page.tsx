import { Suspense } from "react";
import { listProspects } from "@/actions/prospects";
import { ProspectsGridToolbar } from "@/components/prospects/prospects-grid-toolbar";
import { ProspectsTable } from "@/components/prospects/prospects-table";
import { SheetHeader } from "@/components/layout/sheet-header";
import { ListPageShell } from "@/components/layout/list-page-shell";
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
    <ListPageShell
      header={
        <SheetHeader
          title="Prospects"
          subtitle={`${total} across all properties`}
        />
      }
      toolbar={
        <Suspense fallback={<div className="h-9 border-b bg-muted/30" />}>
          <ProspectsGridToolbar totalPages={totalPages} currentPage={currentPage} />
        </Suspense>
      }
    >
      <ProspectsTable prospects={prospects} />
    </ListPageShell>
  );
}
