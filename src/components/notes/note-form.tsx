"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { createNote, updateNote } from "@/actions/notes";
import type { ActionResult } from "@/lib/action-result";
import type { Note } from "@/types/domain";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initialState: ActionResult | null = null;

export function NoteForm({
  propertyId,
  prospectId = null,
  note,
  onSuccess,
  submitLabel,
}: {
  propertyId: string;
  prospectId?: string | null;
  note?: Note;
  onSuccess?: () => void;
  submitLabel?: string;
}) {
  const router = useRouter();
  const action = note
    ? updateNote.bind(null, note.id, propertyId, prospectId)
    : createNote.bind(null, propertyId, prospectId);
  const [state, formAction, pending] = useActionState(action, initialState);

  useEffect(() => {
    if (state?.success) {
      onSuccess?.();
      router.refresh();
    }
  }, [state, onSuccess, router]);

  return (
    <form action={formAction} className="space-y-3">
      {state && !state.success && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      <div className="space-y-2">
        <Label htmlFor={note ? `content-${note.id}` : "content"}>Note</Label>
        <Textarea
          id={note ? `content-${note.id}` : "content"}
          name="content"
          rows={4}
          defaultValue={note?.content}
          placeholder="Write a plain-text note..."
          required
          maxLength={5000}
        />
      </div>

      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Saving..." : submitLabel ?? (note ? "Save changes" : "Add note")}
      </Button>
    </form>
  );
}
