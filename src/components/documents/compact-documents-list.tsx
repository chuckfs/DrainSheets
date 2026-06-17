"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { FileTextIcon } from "lucide-react";
import type { DocumentWithRelations } from "@/actions/documents";
import { generateDownloadUrl, deleteDocument } from "@/actions/documents";
import { formatFileSize } from "@/lib/documents/format";
import { formatCompactTime } from "@/lib/format-relative-time";
import type { Profile } from "@/types/domain";
import { canDeleteDocument } from "@/lib/permissions/document";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function DocumentListItem({
  document,
  profile,
}: {
  document: DocumentWithRelations;
  profile: Profile;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const canDelete = canDeleteDocument(profile, document);
  const uploader = document.profiles?.name;
  const meta = uploader
    ? `${formatCompactTime(document.created_at)} • ${uploader}`
    : `${formatFileSize(document.file_size)} • ${formatCompactTime(document.created_at)}`;

  function handleDownload() {
    startTransition(async () => {
      const result = await generateDownloadUrl(document.id);
      if (!result.success) {
        toast.error("error" in result ? result.error : "Download failed");
        return;
      }
      if (!result.data?.url) {
        toast.error("Download failed");
        return;
      }
      const link = window.document.createElement("a");
      link.href = result.data.url;
      link.download = document.file_name;
      link.rel = "noopener noreferrer";
      window.document.body.appendChild(link);
      link.click();
      link.remove();
    });
  }

  function handleDelete() {
    const confirmed = window.confirm(`Delete "${document.file_name}"? This cannot be undone.`);
    if (!confirmed) return;

    startTransition(async () => {
      const result = await deleteDocument(document.id);
      if (result.success) {
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="group flex items-start gap-2 rounded-sm px-1 py-1.5 hover:bg-muted/50">
      <FileTextIcon className="mt-0.5 size-3.5 shrink-0 text-sheet-icon" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium">{document.file_name}</p>
        <p className="truncate text-[11px] text-muted-foreground">{meta}</p>
      </div>
      <div
        className={cn(
          "flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100",
          pending && "opacity-100",
        )}
      >
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-[11px]"
          disabled={pending}
          onClick={handleDownload}
        >
          Download
        </Button>
        {canDelete && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-[11px] text-destructive hover:text-destructive"
            disabled={pending}
            onClick={handleDelete}
          >
            Delete
          </Button>
        )}
      </div>
    </div>
  );
}

export function CompactDocumentsList({
  documents,
  profile,
  emptyMessage = "No documents.",
}: {
  documents: DocumentWithRelations[];
  profile: Profile;
  emptyMessage?: string;
}) {
  if (documents.length === 0) {
    return <p className="px-1 py-3 text-center text-xs text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <div className="divide-y divide-border/60">
      {documents.map((document) => (
        <DocumentListItem key={document.id} document={document} profile={profile} />
      ))}
    </div>
  );
}
