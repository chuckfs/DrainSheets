"use server";

import { requireProfile } from "@/lib/auth/guards";
import type { SearchResult } from "@/lib/search/format";
import { createClient } from "@/lib/supabase/server";

const SEARCH_LIMIT = 50;

type SearchGlobalRow = {
  entity_type: string;
  entity_id: string;
  title: string;
  property_id: string | null;
  rank: number;
};

export async function searchGlobal(query: string): Promise<{
  results: SearchResult[];
  total: number;
}> {
  await requireProfile();

  const trimmed = query.trim();
  if (!trimmed) {
    return { results: [], total: 0 };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("search_global", {
    search_query: trimmed,
    result_limit: SEARCH_LIMIT,
    result_offset: 0,
  });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as SearchGlobalRow[];
  const noteIds = rows.filter((row) => row.entity_type === "note").map((row) => row.entity_id);

  const prospectIdByNoteId = new Map<string, string | null>();
  if (noteIds.length > 0) {
    const { data: notes, error: notesError } = await supabase
      .from("notes")
      .select("id, prospect_id")
      .in("id", noteIds);

    if (notesError) {
      throw new Error(notesError.message);
    }

    for (const note of notes ?? []) {
      prospectIdByNoteId.set(note.id, note.prospect_id);
    }
  }

  const results: SearchResult[] = rows.map((row) => ({
    entity_type: row.entity_type as SearchResult["entity_type"],
    entity_id: row.entity_id,
    title: row.title,
    property_id: row.property_id,
    prospect_id:
      row.entity_type === "note" ? (prospectIdByNoteId.get(row.entity_id) ?? null) : null,
    rank: row.rank,
  }));

  return {
    results,
    total: results.length,
  };
}
