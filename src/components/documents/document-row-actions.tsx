"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { MoreHorizontalIcon } from "lucide-react";
import { generateDownloadUrl, deleteDocument } from "@/actions/documents";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export function DocumentRowActions({
  documentId,
  fileName,
  canDelete,
  showView = false,
}: {
  documentId: string;
  fileName: string;
  canDelete: boolean;
  showView?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleDownload() {
    startTransition(async () => {
      const result = await generateDownloadUrl(documentId);
      if (!result.success) {
        toast.error(result.error ?? "Download failed");
        return;
      }
      if (!result.data?.url) {
        toast.error("Download failed");
        return;
      }
      const link = document.createElement("a");
      link.href = result.data.url;
      link.download = fileName;
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      link.remove();
    });
  }

  function handleDelete() {
    const confirmed = window.confirm(`Delete "${fileName}"? This cannot be undone.`);
    if (!confirmed) return;

    startTransition(async () => {
      const result = await deleteDocument(documentId);
      if (result.success) {
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={pending}
            aria-label={`Actions for ${fileName}`}
          >
            <MoreHorizontalIcon className="size-3.5" />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-40">
        {showView && (
          <DropdownMenuItem render={<Link href={`/documents/${documentId}`} />}>
            View
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={handleDownload}>Download</DropdownMenuItem>
        {canDelete && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={handleDelete}>
              Delete
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
