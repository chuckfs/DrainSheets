import Link from "next/link";
import type { DocumentWithRelations } from "@/actions/documents";
import { DeleteDocumentButton } from "@/components/documents/delete-document-button";
import { DownloadDocumentButton } from "@/components/documents/download-document-button";
import { formatFileSize, mimeTypeLabel } from "@/lib/documents/format";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Profile } from "@/types/domain";
import { canDeleteDocument } from "@/lib/permissions/document";

export function DocumentsTable({
  documents,
  profile,
  showProperty = false,
  showProspect = false,
  showView = false,
}: {
  documents: DocumentWithRelations[];
  profile: Profile;
  showProperty?: boolean;
  showProspect?: boolean;
  showView?: boolean;
}) {
  if (documents.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        No documents found.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/50">
          <tr>
            <th className="px-4 py-3 text-left font-medium">File name</th>
            <th className="px-4 py-3 text-left font-medium">Type</th>
            <th className="px-4 py-3 text-left font-medium">Size</th>
            {showProperty && <th className="px-4 py-3 text-left font-medium">Property</th>}
            {showProspect && <th className="px-4 py-3 text-left font-medium">Prospect</th>}
            <th className="px-4 py-3 text-left font-medium">Uploaded by</th>
            <th className="px-4 py-3 text-left font-medium">Uploaded at</th>
            <th className="px-4 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {documents.map((document) => (
            <tr key={document.id} className="border-b last:border-b-0 hover:bg-muted/30">
              <td className="px-4 py-3 font-medium">{document.file_name}</td>
              <td className="px-4 py-3 text-muted-foreground">
                {mimeTypeLabel(document.mime_type)}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {formatFileSize(document.file_size)}
              </td>
              {showProperty && (
                <td className="px-4 py-3 text-muted-foreground">
                  {document.properties ? (
                    <Link
                      href={`/properties/${document.properties.id}`}
                      className="hover:underline"
                    >
                      {document.properties.name}
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
              )}
              {showProspect && (
                <td className="px-4 py-3 text-muted-foreground">
                  {document.prospects ? (
                    <Link
                      href={`/prospects/${document.prospects.id}`}
                      className="hover:underline"
                    >
                      {document.prospects.company_name}
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
              )}
              <td className="px-4 py-3 text-muted-foreground">
                {document.profiles?.name ?? "—"}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {new Date(document.created_at).toLocaleString()}
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                  {showView && (
                    <Link
                      href={`/documents/${document.id}`}
                      className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
                    >
                      View
                    </Link>
                  )}
                  <DownloadDocumentButton
                    documentId={document.id}
                    fileName={document.file_name}
                  />
                  {canDeleteDocument(profile, document) && (
                    <DeleteDocumentButton
                      documentId={document.id}
                      fileName={document.file_name}
                    />
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
