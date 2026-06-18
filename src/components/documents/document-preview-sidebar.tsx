"use client";

import Link from "next/link";
import { useTransition } from "react";
import type { DocumentWithRelations } from "@/actions/documents";
import { generateDownloadUrl } from "@/actions/documents";
import { formatFileSize, mimeTypeLabel } from "@/lib/documents/format";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function DocumentPreviewSidebar({
  document,
  documents,
  onSelectDocument,
  collapsible = false,
  className,
}: {
  document: DocumentWithRelations;
  documents: DocumentWithRelations[];
  onSelectDocument: (document: DocumentWithRelations) => void;
  collapsible?: boolean;
  className?: string;
}) {
  const [downloadPending, startDownload] = useTransition();
  const currentIndex = documents.findIndex((item) => item.id === document.id);
  const hasNavigation = documents.length > 1 && currentIndex >= 0;

  function handleDownload() {
    startDownload(async () => {
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

  const metadata = (
    <dl className="space-y-3 text-sm">
      <div>
        <dt className="text-xs text-muted-foreground">File type</dt>
        <dd>{mimeTypeLabel(document.mime_type)}</dd>
      </div>
      <div>
        <dt className="text-xs text-muted-foreground">File size</dt>
        <dd>{formatFileSize(document.file_size)}</dd>
      </div>
      <div>
        <dt className="text-xs text-muted-foreground">Uploaded by</dt>
        <dd>{document.profiles?.name ?? "—"}</dd>
      </div>
      <div>
        <dt className="text-xs text-muted-foreground">Uploaded date</dt>
        <dd>{new Date(document.created_at).toLocaleString()}</dd>
      </div>
      <div>
        <dt className="text-xs text-muted-foreground">Property</dt>
        <dd>
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
        </dd>
      </div>
      <div>
        <dt className="text-xs text-muted-foreground">Prospect</dt>
        <dd>
          {document.prospects ? (
            <Link
              href={`/prospects/${document.prospects.id}`}
              className="text-link hover:underline"
            >
              {document.prospects.company_name}
            </Link>
          ) : (
            "Property level"
          )}
        </dd>
      </div>
      <div>
        <dt className="text-xs text-muted-foreground">Description</dt>
        <dd className="text-muted-foreground">—</dd>
      </div>
    </dl>
  );

  const filmstrip = hasNavigation ? (
    <div className="border-t pt-3">
      <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Attachments
      </h3>
      <ul className="space-y-1">
        {documents.map((item) => {
          const active = item.id === document.id;
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onSelectDocument(item)}
                className={cn(
                  "flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-muted/60",
                  active && "bg-muted font-medium",
                )}
              >
                <span className="mt-0.5 shrink-0 text-muted-foreground" aria-hidden>
                  {active ? "●" : "○"}
                </span>
                <span className="min-w-0 truncate">{item.file_name}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  ) : null;

  const actions = (
    <div className="flex flex-col gap-2 border-t pt-3">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={downloadPending}
        onClick={handleDownload}
      >
        {downloadPending ? "Preparing..." : "Download"}
      </Button>
      <Link
        href={`/documents/${document.id}`}
        className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full")}
      >
        Open details
      </Link>
    </div>
  );

  if (collapsible) {
    return (
      <div className={cn("border-t bg-background", className)}>
        <details className="group">
          <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium marker:content-none [&::-webkit-details-marker]:hidden">
            <span className="flex items-center justify-between">
              Metadata
              <span className="text-xs font-normal text-muted-foreground group-open:hidden">
                Show
              </span>
              <span className="hidden text-xs font-normal text-muted-foreground group-open:inline">
                Hide
              </span>
            </span>
          </summary>
          <div className="space-y-3 px-4 pb-4">
            {metadata}
            {filmstrip}
            {actions}
          </div>
        </details>
      </div>
    );
  }

  return (
    <aside
      className={cn(
        "flex min-h-0 w-72 shrink-0 flex-col overflow-hidden border-l bg-background",
        className,
      )}
    >
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
        <h3 className="text-sm font-medium">Metadata</h3>
        {metadata}
        {filmstrip}
      </div>
      <div className="shrink-0 p-4 pt-0">{actions}</div>
    </aside>
  );
}
