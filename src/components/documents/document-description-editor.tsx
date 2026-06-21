"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { updateDocumentDescription } from "@/actions/documents";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";

export function DocumentDescriptionEditor({
  documentId,
  value,
  canEdit,
  className,
  onSaved,
}: {
  documentId: string;
  value: string | null;
  canEdit: boolean;
  className?: string;
  onSaved?: (description: string | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");
  const [isPending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!editing) {
      setDraft(value ?? "");
    }
  }, [editing, value]);

  useEffect(() => {
    if (editing) {
      textareaRef.current?.focus();
      textareaRef.current?.select();
    }
  }, [editing]);

  function cancelEdit() {
    setDraft(value ?? "");
    setEditing(false);
  }

  function saveDescription() {
    const normalized = draft.trim() || null;
    const current = value?.trim() || null;

    if (normalized === current) {
      setEditing(false);
      return;
    }

    startTransition(async () => {
      const result = await updateDocumentDescription(documentId, normalized);
      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(normalized ? "Description updated" : "Description removed");
      setEditing(false);
      onSaved?.(normalized);
    });
  }

  if (!canEdit) {
    if (!value) {
      return null;
    }

    return (
      <p className={cn("text-xs text-muted-foreground", className)}>{value}</p>
    );
  }

  if (editing) {
    return (
      <Textarea
        ref={textareaRef}
        value={draft}
        disabled={isPending}
        rows={2}
        maxLength={1000}
        placeholder="What is this file?"
        className={cn("min-h-14 text-xs", className)}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => {
          if (!isPending) {
            saveDescription();
          }
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            cancelEdit();
            return;
          }

          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            saveDescription();
          }
        }}
      />
    );
  }

  return (
    <button
      type="button"
      className={cn(
        "mt-1 block w-full rounded-md px-1 py-0.5 text-left text-xs transition-colors hover:bg-muted/60",
        value ? "text-muted-foreground" : "text-muted-foreground/70 italic",
        className,
      )}
      onClick={() => setEditing(true)}
    >
      {value || "Add description…"}
    </button>
  );
}
