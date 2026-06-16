import type { Note, Profile } from "@/types/domain";
import { hasRole } from "@/lib/permissions/roles";

export function canCreateNote(profile: Profile): boolean {
  return hasRole(profile.role, "editor");
}

export function canEditNote(profile: Profile, note: Pick<Note, "user_id">): boolean {
  if (hasRole(profile.role, "admin")) {
    return true;
  }

  return note.user_id === profile.id;
}

export function canDeleteNote(profile: Profile, note: Pick<Note, "user_id">): boolean {
  if (hasRole(profile.role, "admin")) {
    return true;
  }

  return note.user_id === profile.id;
}
