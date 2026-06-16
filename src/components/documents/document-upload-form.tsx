"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { prepareDocumentUpload, uploadDocument } from "@/actions/documents";
import { DOCUMENT_ACCEPT } from "@/lib/documents/constants";
import { inferMimeType } from "@/lib/documents/mime";
import { uploadFileWithProgress } from "@/lib/documents/upload-client";
import { validateDocumentFile } from "@/lib/validations/documents";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ProspectWithProperty } from "@/actions/prospects";

type DocumentUploadFormProps = {
  propertyId: string;
  prospectId?: string | null;
  prospects?: ProspectWithProperty[];
  onSuccess?: () => void;
};

export function DocumentUploadForm({
  propertyId,
  prospectId: fixedProspectId,
  prospects = [],
  onSuccess,
}: DocumentUploadFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();
  const [selectedProspectId, setSelectedProspectId] = useState(fixedProspectId ?? "");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setProgress(null);

    const formData = new FormData(event.currentTarget);
    const file = formData.get("file");

    if (!(file instanceof File) || file.size === 0) {
      setError("Choose a file to upload");
      return;
    }

    const validationError = validateDocumentFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    const prospectId = fixedProspectId ?? (selectedProspectId || null);
    const mimeType = inferMimeType(file);

    startTransition(async () => {
      try {
        const prepared = await prepareDocumentUpload({
          propertyId,
          prospectId,
          fileName: file.name,
          mimeType,
          fileSize: file.size,
        });

        if (!prepared.success) {
          setError(prepared.error ?? "Failed to prepare upload");
          return;
        }

        if (!prepared.data?.documentId || !prepared.data.storagePath) {
          setError("Failed to prepare upload");
          return;
        }

        const { documentId, storagePath } = prepared.data;

        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
          setError("You must be signed in to upload");
          return;
        }

        setProgress(0);
        await uploadFileWithProgress(
          session.access_token,
          storagePath,
          file,
          setProgress,
        );

        const finalized = await uploadDocument({
          documentId,
          propertyId,
          prospectId,
          fileName: file.name,
          mimeType,
          fileSize: file.size,
          storagePath,
        });

        if (!finalized.success) {
          setError(finalized.error ?? "Failed to save document");
          return;
        }

        setProgress(100);
        onSuccess?.();
        router.refresh();
        event.currentTarget.reset();
        setSelectedProspectId(fixedProspectId ?? "");
        setProgress(null);
      } catch (uploadError) {
        setError(uploadError instanceof Error ? uploadError.message : "Upload failed");
        setProgress(null);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-4 rounded-lg border p-4">
      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="space-y-2">
        <Label htmlFor="file">File *</Label>
        <Input id="file" name="file" type="file" accept={DOCUMENT_ACCEPT} required />
        <p className="text-xs text-muted-foreground">
          PDF, Word, Excel, PNG, or JPEG up to 25 MB.
        </p>
      </div>

      {!fixedProspectId && prospects.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="prospect_id">Attach to prospect (optional)</Label>
          <select
            id="prospect_id"
            value={selectedProspectId}
            onChange={(event) => setSelectedProspectId(event.target.value)}
            className="flex h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
          >
            <option value="">Property only</option>
            {prospects.map((prospect) => (
              <option key={prospect.id} value={prospect.id}>
                {prospect.company_name}
              </option>
            ))}
          </select>
        </div>
      )}

      {progress !== null && (
        <div className="space-y-1">
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">Uploading… {progress}%</p>
        </div>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Uploading..." : "Upload document"}
      </Button>
    </form>
  );
}
