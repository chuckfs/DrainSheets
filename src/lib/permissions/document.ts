import type { Document, Profile } from "@/types/domain";
import { hasOrgRole } from "@/lib/permissions/roles";

export function canUploadDocument(profile: Profile): boolean {
  return hasOrgRole(profile.role, "editor");
}

export function canDeleteDocument(profile: Profile, document: Pick<Document, "uploaded_by">): boolean {
  if (hasOrgRole(profile.role, "admin")) {
    return true;
  }

  return document.uploaded_by === profile.id;
}
