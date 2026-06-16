import { Suspense } from "react";
import { listDocuments } from "@/actions/documents";
import { DocumentFilters } from "@/components/documents/document-filters";
import { DocumentsTable } from "@/components/documents/documents-table";
import { requireProfile } from "@/lib/auth/guards";

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    sort?: string;
    page?: string;
  }>;
}) {
  const profile = await requireProfile();
  const params = await searchParams;

  const sort = (params.sort as "file_name" | "created_at" | "file_size") || "created_at";
  const page = Number(params.page ?? 1);

  const { documents, totalPages, page: currentPage, total } = await listDocuments({
    q: params.q,
    sort,
    page,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Documents</h1>
        <p className="text-muted-foreground">{total} total across all properties</p>
      </div>

      <Suspense>
        <DocumentFilters totalPages={totalPages} currentPage={currentPage} />
      </Suspense>

      <DocumentsTable
        documents={documents}
        profile={profile}
        showProperty
        showProspect
        showView
      />
    </div>
  );
}
