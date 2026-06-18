import { Suspense } from "react";
import { listDocuments } from "@/actions/documents";
import { DocumentsGridToolbar } from "@/components/documents/documents-grid-toolbar";
import { DocumentsListWithPreview } from "@/components/documents/documents-list-with-preview";
import { SheetHeader } from "@/components/layout/sheet-header";
import { ListPageShell } from "@/components/layout/list-page-shell";
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
    <ListPageShell
      header={
        <SheetHeader
          title="Documents"
          subtitle={`${total} across all properties`}
        />
      }
      toolbar={
        <Suspense fallback={<div className="h-9 border-b bg-muted/30" />}>
          <DocumentsGridToolbar totalPages={totalPages} currentPage={currentPage} />
        </Suspense>
      }
    >
      <DocumentsListWithPreview
        documents={documents}
        profile={profile}
        showProperty
        showProspect
      />
    </ListPageShell>
  );
}
