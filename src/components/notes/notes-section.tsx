"use client";

import { useState } from "react";
import type { NoteWithAuthor } from "@/actions/notes";
import { NoteForm } from "@/components/notes/note-form";
import { NotesList } from "@/components/notes/notes-list";
import { Button } from "@/components/ui/button";
import type { Profile } from "@/types/domain";
import { canCreateNote } from "@/lib/permissions/note";

export function NotesSection({
  notes,
  profile,
  propertyId,
  prospectId = null,
}: {
  notes: NoteWithAuthor[];
  profile: Profile;
  propertyId: string;
  prospectId?: string | null;
}) {
  const [showForm, setShowForm] = useState(false);
  const canCreate = canCreateNote(profile);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Notes</h2>
        {canCreate && (
          <Button type="button" size="sm" onClick={() => setShowForm((value) => !value)}>
            {showForm ? "Hide form" : "Add note"}
          </Button>
        )}
      </div>

      {canCreate && showForm && (
        <div className="rounded-lg border p-4">
          <NoteForm
            propertyId={propertyId}
            prospectId={prospectId}
            onSuccess={() => setShowForm(false)}
          />
        </div>
      )}

      <NotesList
        notes={notes}
        profile={profile}
        propertyId={propertyId}
        prospectId={prospectId}
      />
    </div>
  );
}
