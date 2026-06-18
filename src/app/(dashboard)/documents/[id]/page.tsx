import Link from "next/link";
import { notFound } from "next/navigation";
import { getDocument } from "@/actions/documents";
import { DeleteDocumentButton } from "@/components/documents/delete-document-button";
import { DocumentPreview } from "@/components/documents/document-preview";
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
          <p className="mt-1 text-muted-foreground">Document preview</p>
        </div>
        {canDeleteDocument(profile, document) && (
          <DeleteDocumentButton documentId={document.id} fileName={document.file_name} />
        )}
      </div>

      <DocumentPreview document={document} />

      <Link href="/documents" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2")}>
        ← Back to documents
      </Link>
    </div>
  );
}
