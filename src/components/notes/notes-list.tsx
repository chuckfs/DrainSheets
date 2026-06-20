"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { createNote, deleteNote, updateNote, listNotes, type NoteWithAuthor } from "@/actions/notes";
import type { AccessContext } from "@/lib/access/effective-role";
import { canCreateNotes, canManageNote } from "@/lib/access/note-permissions";
import { MessageSquareIcon } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { NoteCard } from "./note-card";
import { NoteEditor } from "./note-editor";

export function NotesList({
  notes,
  access,
  currentUserId,
  onNotesChange,
}: {
  notes: NoteWithAuthor[];
  access: AccessContext;
  currentUserId: string;
  onNotesChange: () => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const canCreate = canCreateNotes(access);

  function handleDelete(noteId: string) {
    startTransition(async () => {
      const result = await deleteNote(noteId);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Note deleted");
      onNotesChange();
    });
  }

  function handleUpdate(noteId: string, content: string) {
    startTransition(async () => {
      const result = await updateNote(noteId, content);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Note updated");
      setEditingId(null);
      onNotesChange();
    });
  }

  if (notes.length === 0) {
    return (
      <EmptyState
        icon={MessageSquareIcon}
        title="No notes yet"
        description={
          canCreate
            ? "Capture context for this sheet or row. Add your first note below."
            : "Notes from your team will appear here."
        }
      />
    );
  }

  return (
    <ul className="space-y-3">
      {notes.map((note) => (
        <li key={note.id}>
          {editingId === note.id ? (
            <NoteEditor
              initialContent={note.content}
              submitLabel="Save"
              pending={isPending}
              onCancel={() => setEditingId(null)}
              onSubmit={(content) => handleUpdate(note.id, content)}
            />
          ) : (
            <NoteCard
              note={note}
              canEdit={canManageNote(access, note.user_id, currentUserId)}
              onEdit={() => setEditingId(note.id)}
              onDelete={() => handleDelete(note.id)}
            />
          )}
        </li>
      ))}
    </ul>
  );
}

export function NotesComposer({
  sheetId,
  rowId,
  access,
  onCreated,
}: {
  sheetId: string;
  rowId?: string | null;
  access: AccessContext;
  onCreated: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  if (!canCreateNotes(access)) {
    return null;
  }

  function handleSubmit(content: string) {
    startTransition(async () => {
      const result = await createNote(sheetId, content, rowId ?? null);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Note added");
      onCreated();
    });
  }

  return (
    <div className="border-t pt-3">
      <NoteEditor
        submitLabel="Add note"
        pending={isPending}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

const NOTES_PAGE_SIZE = 25;

export function useNotesLoader(sheetId: string, rowId?: string | null) {
  const [notes, setNotes] = useState<NoteWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  async function load(offset: number, append: boolean) {
    if (append) setLoadingMore(true);
    else setLoading(true);
    try {
      const data = await listNotes(sheetId, rowId ?? null, {
        limit: NOTES_PAGE_SIZE,
        offset,
      });
      setNotes((previous) => (append ? [...previous, ...data] : data));
      setHasMore(data.length === NOTES_PAGE_SIZE);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load notes");
      if (!append) setNotes([]);
    } finally {
      if (append) setLoadingMore(false);
      else setLoading(false);
    }
  }

  function reload() {
    void load(0, false);
  }

  function loadMore() {
    if (loadingMore || !hasMore) return;
    void load(notes.length, true);
  }

  useEffect(() => {
    void load(0, false);
  }, [sheetId, rowId]);

  return { notes, loading, loadingMore, hasMore, reload, loadMore };
}
