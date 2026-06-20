"use server";

import { revalidatePath } from "next/cache";
import { actionError, actionSuccess, type ActionResult } from "@/lib/action-result";
import { getSheetActivityContext, logActivityEvent } from "@/lib/activity/log-event";
import { requireProfile } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { createNoteSchema, deleteNoteSchema, updateNoteSchema } from "@/lib/validations/note";
import type { Note, Profile } from "@/types/domain";

export type NoteWithAuthor = Note & {
  author: Pick<Profile, "id" | "name" | "email">;
};

export async function listNotes(
  sheetId: string,
  rowId?: string | null,
  options?: { limit?: number; offset?: number },
): Promise<NoteWithAuthor[]> {
  await requireProfile();
  const supabase = await createClient();
  const limit = Math.min(Math.max(options?.limit ?? 25, 1), 100);
  const offset = Math.max(options?.offset ?? 0, 0);

  let query = supabase
    .from("notes")
    .select(
      `
      *,
      author:profiles!notes_user_id_fkey (
        id,
        name,
        email
      )
    `,
    )
    .eq("sheet_id", sheetId)
    .order("created_at", { ascending: false });

  if (rowId) {
    query = query.eq("row_id", rowId);
  } else {
    query = query.is("row_id", null);
  }

  query = query.range(offset, offset + limit - 1);

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((note) => ({
    ...note,
    author: note.author as NoteWithAuthor["author"],
  }));
}

export async function createNote(
  sheetId: string,
  content: string,
  rowId?: string | null,
): Promise<ActionResult<NoteWithAuthor>> {
  const profile = await requireProfile();
  const parsed = createNoteSchema.safeParse({ sheetId, content, rowId });

  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Invalid note");
  }

  const supabase = await createClient();
  const { data: note, error } = await supabase
    .from("notes")
    .insert({
      org_id: profile.org_id,
      sheet_id: sheetId,
      row_id: parsed.data.rowId ?? null,
      user_id: profile.id,
      content: parsed.data.content,
    })
    .select(
      `
      *,
      author:profiles!notes_user_id_fkey (
        id,
        name,
        email
      )
    `,
    )
    .single();

  if (error) {
    return actionError(error.message);
  }

  const context = await getSheetActivityContext(sheetId);
  if (context) {
    await logActivityEvent({
      entityType: "note",
      entityId: note.id,
      action: "created",
      workspaceId: context.workspaceId,
      sheetId,
      rowId: parsed.data.rowId ?? null,
    });
  }

  revalidatePath(`/sheets/${sheetId}`);
  return actionSuccess({
    ...note,
    author: note.author as NoteWithAuthor["author"],
  });
}

export async function updateNote(noteId: string, content: string): Promise<ActionResult<NoteWithAuthor>> {
  await requireProfile();
  const parsed = updateNoteSchema.safeParse({ noteId, content });

  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Invalid note");
  }

  const supabase = await createClient();
  const { data: note, error } = await supabase
    .from("notes")
    .update({ content: parsed.data.content })
    .eq("id", noteId)
    .select(
      `
      *,
      author:profiles!notes_user_id_fkey (
        id,
        name,
        email
      )
    `,
    )
    .single();

  if (error) {
    return actionError(error.message);
  }

  const context = await getSheetActivityContext(note.sheet_id);
  if (context) {
    await logActivityEvent({
      entityType: "note",
      entityId: note.id,
      action: "updated",
      workspaceId: context.workspaceId,
      sheetId: note.sheet_id,
      rowId: note.row_id,
    });
  }

  revalidatePath(`/sheets/${note.sheet_id}`);
  return actionSuccess({
    ...note,
    author: note.author as NoteWithAuthor["author"],
  });
}

export async function deleteNote(noteId: string): Promise<ActionResult<{ sheetId: string }>> {
  await requireProfile();
  const parsed = deleteNoteSchema.safeParse({ noteId });

  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Invalid note");
  }

  const supabase = await createClient();
  const { data: existing, error: fetchError } = await supabase
    .from("notes")
    .select("sheet_id, row_id")
    .eq("id", noteId)
    .single();

  if (fetchError) {
    return actionError(fetchError.message);
  }

  const { error } = await supabase.from("notes").delete().eq("id", noteId);

  if (error) {
    return actionError(error.message);
  }

  const context = await getSheetActivityContext(existing.sheet_id);
  if (context) {
    await logActivityEvent({
      entityType: "note",
      entityId: noteId,
      action: "deleted",
      workspaceId: context.workspaceId,
      sheetId: existing.sheet_id,
      rowId: existing.row_id,
    });
  }

  revalidatePath(`/sheets/${existing.sheet_id}`);
  return actionSuccess({ sheetId: existing.sheet_id });
}
