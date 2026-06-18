"use client";

import type { DocumentWithRelations } from "@/actions/documents";
import { DocumentPreviewDialog } from "@/components/documents/document-preview-dialog";
import { DocumentsTable } from "@/components/documents/documents-table";
import { useDocumentPreview } from "@/hooks/use-document-preview";
import type { Profile } from "@/types/domain";

export function DocumentsListWithPreview({
  documents,
  profile,
  showProperty = false,
  showProspect = false,
}: {
  documents: DocumentWithRelations[];
  profile: Profile;
  showProperty?: boolean;
  showProspect?: boolean;
}) {
  const { openPreview, previewProps } = useDocumentPreview(documents);

  return (
    <>
      <DocumentPreviewDialog {...previewProps} />
      <DocumentsTable
        documents={documents}
        profile={profile}
        showProperty={showProperty}
        showProspect={showProspect}
        onOpenPreview={openPreview}
      />
    </>
  );
}
