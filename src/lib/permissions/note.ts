import type { Note, Profile } from "@/types/domain";
import { hasOrgRole } from "@/lib/permissions/roles";

export function canCreateNote(profile: Profile): boolean {
  return hasOrgRole(profile.role, "editor");
}

export function canEditNote(profile: Profile, note: Pick<Note, "user_id">): boolean {
  if (hasOrgRole(profile.role, "admin")) {
    return true;
  }

  return note.user_id === profile.id;
}

export function canDeleteNote(profile: Profile, note: Pick<Note, "user_id">): boolean {
  if (hasOrgRole(profile.role, "admin")) {
    return true;
  }

  return note.user_id === profile.id;
}
