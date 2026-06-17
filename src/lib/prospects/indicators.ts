import type { DocumentWithRelations } from "@/actions/documents";
import type { NoteWithAuthor } from "@/actions/notes";

export type ProspectIndicatorCounts = {
  documentCount: number;
  noteCount: number;
};

export function buildProspectIndicators(
  documents: DocumentWithRelations[],
  notes: NoteWithAuthor[],
): Map<string, ProspectIndicatorCounts> {
  const counts = new Map<string, ProspectIndicatorCounts>();

  function ensure(prospectId: string): ProspectIndicatorCounts {
    const existing = counts.get(prospectId);
    if (existing) return existing;
    const next = { documentCount: 0, noteCount: 0 };
    counts.set(prospectId, next);
    return next;
  }

  for (const document of documents) {
    if (!document.prospect_id) continue;
    ensure(document.prospect_id).documentCount += 1;
  }

  for (const note of notes) {
    if (!note.prospect_id) continue;
    ensure(note.prospect_id).noteCount += 1;
  }

  return counts;
}
