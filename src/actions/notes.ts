"use server";

import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/activity";
import { actionError, actionSuccess, type ActionResult } from "@/lib/action-result";
import { requireProfile } from "@/lib/auth/guards";
import { canCreateNote, canDeleteNote, canEditNote } from "@/lib/permissions/note";
import { createClient } from "@/lib/supabase/server";
import { noteInputToRow, parseNoteForm } from "@/lib/validations/notes";
import type { Note } from "@/types/domain";

type ProfileRef = {
  id: string;
  name: string;
  email: string;
};

export type NoteWithAuthor = Note & {
  profiles: ProfileRef | null;
};

const noteSelect = "*, profiles:user_id(id, name, email)";

async function validateProspectForProperty(
  propertyId: string,
  prospectId: string | null | undefined,
): Promise<ActionResult | null> {
  if (!prospectId) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("prospects")
    .select("id")
    .eq("id", prospectId)
    .eq("property_id", propertyId)
    .maybeSingle();

  if (error) {
    return actionError(error.message);
  }

  if (!data) {
    return actionError("Prospect does not belong to this property");
  }

  return null;
}

function normalizeNoteRow(row: Record<string, unknown>): NoteWithAuthor {
  const profiles = row.profiles;

  return {
    ...(row as unknown as Note),
    profiles: Array.isArray(profiles) ? profiles[0] ?? null : (profiles as ProfileRef | null),
  };
}

function revalidateNotePaths(propertyId: string, prospectId?: string | null) {
  revalidatePath(`/properties/${propertyId}`);
  if (prospectId) {
    revalidatePath(`/prospects/${prospectId}`);
  }
  revalidatePath("/");
}

export async function getNotesForProperty(propertyId: string): Promise<NoteWithAuthor[]> {
  await requireProfile();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("notes")
    .select(noteSelect)
    .eq("property_id", propertyId)
    .is("prospect_id", null)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map(normalizeNoteRow);
}

export async function getNotesForProspect(prospectId: string): Promise<NoteWithAuthor[]> {
  await requireProfile();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("notes")
    .select(noteSelect)
    .eq("prospect_id", prospectId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map(normalizeNoteRow);
}

export async function createNote(
  propertyId: string,
  prospectId: string | null,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const profile = await requireProfile();

  if (!canCreateNote(profile)) {
    return actionError("You do not have permission to create notes");
  }

  const parsed = parseNoteForm(formData);
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Invalid note");
  }

  const prospectError = await validateProspectForProperty(propertyId, prospectId);
  if (prospectError) {
    return prospectError;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notes")
    .insert({
      ...noteInputToRow(parsed.data),
      org_id: profile.org_id,
      property_id: propertyId,
      prospect_id: prospectId,
      user_id: profile.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    return actionError(error?.message ?? "Failed to create note");
  }

  await logActivity({
    orgId: profile.org_id,
    userId: profile.id,
    entityType: "note",
    entityId: data.id,
    propertyId,
    action: "created",
    metadata: {
      prospect_id: prospectId,
      preview: parsed.data.content.slice(0, 120),
    },
  });

  revalidateNotePaths(propertyId, prospectId);
  return actionSuccess();
}

export async function updateNote(
  noteId: string,
  propertyId: string,
  prospectId: string | null,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: existing, error: existingError } = await supabase
    .from("notes")
    .select("user_id")
    .eq("id", noteId)
    .maybeSingle();

  if (existingError) {
    return actionError(existingError.message);
  }

  if (!existing) {
    return actionError("Note not found");
  }

  if (!canEditNote(profile, existing)) {
    return actionError("You do not have permission to edit this note");
  }

  const parsed = parseNoteForm(formData);
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Invalid note");
  }

  const prospectError = await validateProspectForProperty(propertyId, prospectId);
  if (prospectError) {
    return prospectError;
  }

  const { error } = await supabase
    .from("notes")
    .update(noteInputToRow(parsed.data))
    .eq("id", noteId);

  if (error) {
    return actionError(error.message);
  }

  await logActivity({
    orgId: profile.org_id,
    userId: profile.id,
    entityType: "note",
    entityId: noteId,
    propertyId,
    action: "updated",
    metadata: {
      prospect_id: prospectId,
      preview: parsed.data.content.slice(0, 120),
    },
  });

  revalidateNotePaths(propertyId, prospectId);
  return actionSuccess();
}

export async function deleteNote(
  noteId: string,
  propertyId: string,
  prospectId: string | null,
): Promise<ActionResult> {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: existing, error: existingError } = await supabase
    .from("notes")
    .select("user_id, content")
    .eq("id", noteId)
    .maybeSingle();

  if (existingError) {
    return actionError(existingError.message);
  }

  if (!existing) {
    return actionError("Note not found");
  }

  if (!canDeleteNote(profile, existing)) {
    return actionError("You do not have permission to delete this note");
  }

  const { error } = await supabase.from("notes").delete().eq("id", noteId);

  if (error) {
    return actionError(error.message);
  }

  await logActivity({
    orgId: profile.org_id,
    userId: profile.id,
    entityType: "note",
    entityId: noteId,
    propertyId,
    action: "deleted",
    metadata: {
      prospect_id: prospectId,
      preview: existing.content.slice(0, 120),
    },
  });

  revalidateNotePaths(propertyId, prospectId);
  return actionSuccess();
}

export async function getNoteCount() {
  await requireProfile();
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("notes")
    .select("*", { count: "exact", head: true });

  if (error) {
    return 0;
  }

  return count ?? 0;
}
