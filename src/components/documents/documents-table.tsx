"use client";

import Link from "next/link";
import { PaperclipIcon } from "lucide-react";
import type { DocumentWithRelations } from "@/actions/documents";
import { formatFileSize, mimeTypeLabel } from "@/lib/documents/format";
import { formatRelativeTime } from "@/lib/format-relative-time";
import type { Profile } from "@/types/domain";
import { canDeleteDocument } from "@/lib/permissions/document";
import { DocumentRowActions } from "@/components/documents/document-row-actions";
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

export function DocumentsTable({
  documents,
  profile,
  showProperty = false,
  showProspect = false,
  onOpenPreview,
}: {
  documents: DocumentWithRelations[];
  profile: Profile;
  showProperty?: boolean;
  showProspect?: boolean;
  onOpenPreview?: (document: DocumentWithRelations) => void;
}) {
  if (documents.length === 0) {
    return <SmartsheetGridEmpty message="No documents found." />;
  }

  return (
    <SmartsheetGrid>
      <SmartsheetGridHeader>
        <SmartsheetGridRow className="hover:bg-transparent even:bg-transparent">
          <SmartsheetGridHead className="w-10 text-center"> </SmartsheetGridHead>
          <SmartsheetGridHead>File name</SmartsheetGridHead>
          <SmartsheetGridHead className="w-24">Type</SmartsheetGridHead>
          <SmartsheetGridHead className="w-20">Size</SmartsheetGridHead>
          {showProperty && <SmartsheetGridHead>Property</SmartsheetGridHead>}
          {showProspect && <SmartsheetGridHead>Prospect</SmartsheetGridHead>}
          <SmartsheetGridHead className="w-32">Uploaded by</SmartsheetGridHead>
          <SmartsheetGridHead className="w-28">Uploaded</SmartsheetGridHead>
          <SmartsheetGridHead className="w-12 text-center"> </SmartsheetGridHead>
        </SmartsheetGridRow>
      </SmartsheetGridHeader>
      <SmartsheetGridBody>
        {documents.map((document) => (
          <SmartsheetGridRow key={document.id}>
            <SmartsheetGridCell className="text-center">
              <PaperclipIcon className="mx-auto size-3.5 text-sheet-icon" aria-hidden />
            </SmartsheetGridCell>
            <SmartsheetGridCell className="max-w-[240px] truncate font-medium">
              {onOpenPreview ? (
                <button
                  type="button"
                  onClick={() => onOpenPreview(document)}
                  className={cn(
                    "max-w-full truncate text-left text-link hover:underline",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  )}
                >
                  {document.file_name}
                </button>
              ) : (
                <Link href={`/documents/${document.id}`} className="text-link hover:underline">
                  {document.file_name}
                </Link>
              )}
            </SmartsheetGridCell>
            <SmartsheetGridCell className="text-muted-foreground">
              {mimeTypeLabel(document.mime_type)}
            </SmartsheetGridCell>
            <SmartsheetGridCell className="text-muted-foreground">
              {formatFileSize(document.file_size)}
            </SmartsheetGridCell>
            {showProperty && (
              <SmartsheetGridCell className="max-w-[140px] truncate text-muted-foreground">
                {document.properties ? (
                  <Link
                    href={`/properties/${document.properties.id}`}
                    className="text-link hover:underline"
                  >
                    {document.properties.name}
                  </Link>
                ) : (
                  "—"
                )}
              </SmartsheetGridCell>
            )}
            {showProspect && (
              <SmartsheetGridCell className="max-w-[140px] truncate text-muted-foreground">
                {document.prospects ? (
                  <Link
                    href={`/prospects/${document.prospects.id}`}
                    className="text-link hover:underline"
                  >
                    {document.prospects.company_name}
                  </Link>
                ) : (
                  "—"
                )}
              </SmartsheetGridCell>
            )}
            <SmartsheetGridCell className="max-w-[120px] truncate text-muted-foreground">
              {document.profiles?.name ?? "—"}
            </SmartsheetGridCell>
            <SmartsheetGridCell className="text-muted-foreground">
              {formatRelativeTime(document.created_at)}
            </SmartsheetGridCell>
            <SmartsheetGridCell className="text-center">
              <DocumentRowActions
                documentId={document.id}
                fileName={document.file_name}
                canDelete={canDeleteDocument(profile, document)}
                onOpenPreview={onOpenPreview ? () => onOpenPreview(document) : undefined}
              />
            </SmartsheetGridCell>
          </SmartsheetGridRow>
        ))}
      </SmartsheetGridBody>
    </SmartsheetGrid>
  );
}
