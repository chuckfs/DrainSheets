"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type SheetSyncState = "idle" | "saving" | "saved" | "error";

export function useSheetSync() {
  const [syncState, setSyncState] = useState<SheetSyncState>("idle");
  const pendingRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const beginSave = useCallback(() => {
    pendingRef.current += 1;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setSyncState("saving");
  }, []);

  const endSave = useCallback((success: boolean) => {
    pendingRef.current = Math.max(0, pendingRef.current - 1);

    if (!success) {
      setSyncState("error");
      return;
    }

    if (pendingRef.current === 0) {
      setSyncState("saved");
      timeoutRef.current = setTimeout(() => {
        setSyncState("idle");
        timeoutRef.current = null;
      }, 2000);
    }
  }, []);

  const trackSave = useCallback(
    async <T,>(operation: () => Promise<T>): Promise<T> => {
      beginSave();
      try {
        const result = await operation();
        endSave(true);
        return result;
      } catch (error) {
        endSave(false);
        throw error;
      }
    },
    [beginSave, endSave],
  );

  return { syncState, beginSave, endSave, trackSave };
}
