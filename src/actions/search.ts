"use server";

import { requireProfile } from "@/lib/auth/guards";
import {
  isSearchEntityType,
  SEARCH_RESULT_LIMIT,
  type RecentSheetItem,
  type SearchEntityType,
  type SearchResult,
} from "@/lib/search/format";
import { createClient } from "@/lib/supabase/server";

type RawSearchRow = {
  entity_type: string;
  entity_id: string;
  title: string;
  sheet_id: string | null;
  workspace_id: string | null;
  rank: number;
};

async function enrichSearchResults(rows: RawSearchRow[]): Promise<SearchResult[]> {
  if (rows.length === 0) {
    return [];
  }

  const supabase = await createClient();

  const sheetIds = [
    ...new Set(
      rows
        .flatMap((row) => [row.sheet_id, row.entity_type === "sheet" ? row.entity_id : null])
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  const workspaceIds = [
    ...new Set(rows.map((row) => row.workspace_id).filter((id): id is string => Boolean(id))),
  ];

  const [sheetsResult, workspacesResult] = await Promise.all([
    sheetIds.length > 0
      ? supabase.from("sheets").select("id, name").in("id", sheetIds)
      : Promise.resolve({ data: [], error: null }),
    workspaceIds.length > 0
      ? supabase.from("workspaces").select("id, name").in("id", workspaceIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (sheetsResult.error) {
    throw new Error(sheetsResult.error.message);
  }

  if (workspacesResult.error) {
    throw new Error(workspacesResult.error.message);
  }

  const sheetNames = new Map((sheetsResult.data ?? []).map((sheet) => [sheet.id, sheet.name]));
  const workspaceNames = new Map(
    (workspacesResult.data ?? []).map((workspace) => [workspace.id, workspace.name]),
  );

  return rows
    .filter((row): row is RawSearchRow & { entity_type: SearchEntityType } =>
      isSearchEntityType(row.entity_type),
    )
    .map((row) => {
      const sheetId = row.sheet_id ?? (row.entity_type === "sheet" ? row.entity_id : null);

      return {
        entity_type: row.entity_type,
        entity_id: row.entity_id,
        title: row.title,
        sheet_id: sheetId,
        workspace_id: row.workspace_id,
        rank: row.rank,
        sheet_name: sheetId ? (sheetNames.get(sheetId) ?? null) : null,
        workspace_name: row.workspace_id ? (workspaceNames.get(row.workspace_id) ?? null) : null,
      };
    });
}

async function runGlobalSearch(query: string, limit = SEARCH_RESULT_LIMIT): Promise<SearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return [];
  }

  await requireProfile();
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("search_global", {
    search_query: trimmed,
    result_limit: limit,
    result_offset: 0,
  });

  if (error) {
    throw new Error(error.message);
  }

  return enrichSearchResults((data ?? []) as RawSearchRow[]);
}

export async function globalSearch(query: string): Promise<SearchResult[]> {
  return runGlobalSearch(query);
}

export async function searchSheets(query: string): Promise<SearchResult[]> {
  const results = await runGlobalSearch(query);
  return results.filter((result) => result.entity_type === "sheet");
}

export async function searchRows(query: string): Promise<SearchResult[]> {
  const results = await runGlobalSearch(query);
  return results.filter((result) => result.entity_type === "row");
}

export async function searchContacts(query: string): Promise<SearchResult[]> {
  const results = await runGlobalSearch(query);
  return results.filter((result) => result.entity_type === "contact");
}

export async function getRecentSheets(): Promise<RecentSheetItem[]> {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("recent_views")
    .select(
      `
      sheet_id,
      viewed_at,
      sheets (
        id,
        name,
        workspace_id,
        workspaces (
          name
        )
      )
    `,
    )
    .eq("user_id", profile.id)
    .order("viewed_at", { ascending: false })
    .limit(10);

  if (error) {
    throw new Error(error.message);
  }

  const items: RecentSheetItem[] = [];

  for (const entry of data ?? []) {
    const sheet = entry.sheets as
      | {
          id: string;
          name: string;
          workspace_id: string;
          workspaces: { name: string } | null;
        }
      | null
      | undefined;

    if (!sheet) {
      continue;
    }

    items.push({
      sheet_id: entry.sheet_id,
      sheet_name: sheet.name,
      workspace_id: sheet.workspace_id,
      workspace_name: sheet.workspaces?.name ?? null,
      viewed_at: entry.viewed_at,
    });
  }

  return items;
}

export async function trackRecentSheetView(sheetId: string): Promise<void> {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { error } = await supabase.from("recent_views").upsert(
    {
      user_id: profile.id,
      org_id: profile.org_id,
      sheet_id: sheetId,
      viewed_at: new Date().toISOString(),
    },
    { onConflict: "user_id,sheet_id" },
  );

  if (error) {
    throw new Error(error.message);
  }
}
