"use client";

import { useState, useTransition } from "react";
import { UploadIcon } from "lucide-react";
import { toast } from "sonner";
import { uploadDocument } from "@/actions/documents";
import type { AccessContext } from "@/lib/access/effective-role";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function UploadDropzone({
  sheetId,
  rowId,
  access,
  onUploaded,
}: {
  sheetId: string;
  rowId?: string | null;
  access: AccessContext;
  onUploaded: () => void;
}) {
  const [description, setDescription] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!access.canEdit) {
    return null;
  }

  function uploadFile(file: File) {
    const formData = new FormData();
    formData.set("file", file);
    formData.set("sheetId", sheetId);
    if (rowId) {
      formData.set("rowId", rowId);
    }
    if (description.trim()) {
      formData.set("description", description.trim());
    }

    startTransition(async () => {
      const result = await uploadDocument(formData);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Attachment uploaded");
      setDescription("");
      onUploaded();
    });
  }

  return (
    <div className="space-y-2 border-t p-3">
      <div
        className={cn(
          "flex flex-col items-center justify-center rounded-lg border border-dashed px-4 py-6 text-center transition-colors",
          dragOver && "border-primary bg-primary/5",
        )}
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragOver(false);
          const file = event.dataTransfer.files[0];
          if (file) {
            uploadFile(file);
          }
        }}
      >
        <UploadIcon className="mb-2 size-5 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Drop a file here or choose one</p>
        <label className="mt-2 inline-block">
          <input
            type="file"
            className="sr-only"
            disabled={isPending}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                uploadFile(file);
              }
              event.target.value = "";
            }}
          />
          <span className="inline-flex h-8 items-center rounded-md border px-3 text-xs font-medium">
            Choose file
          </span>
        </label>
      </div>
      <div className="space-y-1">
        <Label htmlFor="attachment-description">Description (optional)</Label>
        <Input
          id="attachment-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="What is this file?"
          disabled={isPending}
        />
      </div>
    </div>
  );
}
