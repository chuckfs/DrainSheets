"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { createNote } from "@/actions/notes";
import type { ActionResult } from "@/lib/action-result";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const initialState: ActionResult | null = null;

export function QuickNoteForm({
  propertyId,
  prospectId = null,
  expandRequest = 0,
}: {
  propertyId: string;
  prospectId?: string | null;
  expandRequest?: number;
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const action = createNote.bind(null, propertyId, prospectId);
  const [state, formAction, pending] = useActionState(action, initialState);

  useEffect(() => {
    if (expandRequest > 0) {
      setExpanded(true);
    }
  }, [expandRequest]);

  useEffect(() => {
    if (state?.success) {
      setExpanded(false);
      router.refresh();
    }
  }, [state, router]);

  if (!expanded) {
    return (
      <button
        type="button"
        className="w-full rounded-md border border-dashed px-2 py-1.5 text-left text-xs text-muted-foreground hover:border-border hover:bg-muted/30"
        onClick={() => setExpanded(true)}
      >
        Add a note...
      </button>
    );
  }

  return (
    <form action={formAction} className="space-y-2">
      {state && !state.success && <p className="text-xs text-destructive">{state.error}</p>}
      <Textarea
        name="content"
        rows={2}
        autoFocus
        placeholder="Add a note..."
        required
        maxLength={5000}
        className="min-h-[56px] resize-none text-xs"
      />
      <div className="flex justify-end gap-1.5">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={() => setExpanded(false)}
        >
          Cancel
        </Button>
        <Button type="submit" size="sm" className="h-7 text-xs" disabled={pending}>
          {pending ? "Saving..." : "Add note"}
        </Button>
      </div>
    </form>
  );
}
