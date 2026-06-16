import Link from "next/link";
import { notFound } from "next/navigation";
import { getDocument } from "@/actions/documents";
import { DeleteDocumentButton } from "@/components/documents/delete-document-button";
import { DownloadDocumentButton } from "@/components/documents/download-document-button";
import { formatFileSize, mimeTypeLabel } from "@/lib/documents/format";
import { requireProfile } from "@/lib/auth/guards";
import { canDeleteDocument } from "@/lib/permissions/document";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await requireProfile();
  const { id } = await params;
  const document = await getDocument(id);

  if (!document) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{document.file_name}</h1>
          <p className="mt-1 text-muted-foreground">
            {mimeTypeLabel(document.mime_type)} · {formatFileSize(document.file_size)}
          </p>
        </div>
        <div className="flex gap-2">
          <DownloadDocumentButton documentId={document.id} fileName={document.file_name} />
          {canDeleteDocument(profile, document) && (
            <DeleteDocumentButton documentId={document.id} fileName={document.file_name} />
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border p-4">
          <h2 className="mb-3 text-sm font-medium">Upload details</h2>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-muted-foreground">Uploaded by</dt>
              <dd>{document.profiles?.name ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Uploaded at</dt>
              <dd>{new Date(document.created_at).toLocaleString()}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-lg border p-4">
          <h2 className="mb-3 text-sm font-medium">Related records</h2>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-muted-foreground">Property</dt>
              <dd>
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
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Prospect</dt>
              <dd>
                {document.prospects ? (
                  <Link href={`/prospects/${document.prospects.id}`} className="hover:underline">
                    {document.prospects.company_name}
                  </Link>
                ) : (
                  "Property level"
                )}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <Link href="/documents" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2")}>
        ← Back to documents
      </Link>
    </div>
  );
}
