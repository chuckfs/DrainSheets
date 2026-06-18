"use client";

import { useEffect } from "react";
import { trackRecentView } from "@/actions/recents";

export function RecentPropertyTracker({
  propertyId,
}: {
  propertyId: string;
  propertyName?: string;
}) {
  useEffect(() => {
    void trackRecentView(propertyId);
  }, [propertyId]);

  return null;
}
