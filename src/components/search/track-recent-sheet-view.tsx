"use client";

import { useEffect } from "react";
import { writeRecentSheetToStorage } from "@/lib/search/recent-sheets";

export function TrackRecentSheetView({
  sheetId,
  sheetName,
  workspaceId,
  workspaceName,
}: {
  sheetId: string;
  sheetName: string;
  workspaceId: string;
  workspaceName: string | null;
}) {
  useEffect(() => {
    writeRecentSheetToStorage({
      sheet_id: sheetId,
      sheet_name: sheetName,
      workspace_id: workspaceId,
      workspace_name: workspaceName,
      viewed_at: new Date().toISOString(),
    });
  }, [sheetId, sheetName, workspaceId, workspaceName]);

  return null;
}
