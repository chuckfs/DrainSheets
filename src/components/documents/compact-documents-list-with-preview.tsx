"use client";

import type { DocumentWithRelations } from "@/actions/documents";
import { DocumentPreviewDialog } from "@/components/documents/document-preview-dialog";
import { CompactDocumentsList } from "@/components/documents/compact-documents-list";
import { useDocumentPreview } from "@/hooks/use-document-preview";
import type { Profile } from "@/types/domain";

export function CompactDocumentsListWithPreview({
  documents,
  profile,
  emptyMessage,
  showDetailsAction = true,
}: {
  documents: DocumentWithRelations[];
  profile: Profile;
  emptyMessage?: string;
  showDetailsAction?: boolean;
}) {
  const { openPreview, previewProps } = useDocumentPreview(documents);

  return (
    <>
      <DocumentPreviewDialog {...previewProps} />
      <CompactDocumentsList
        documents={documents}
        profile={profile}
        emptyMessage={emptyMessage}
        onOpenPreview={openPreview}
        showDetailsAction={showDetailsAction}
      />
    </>
  );
}
