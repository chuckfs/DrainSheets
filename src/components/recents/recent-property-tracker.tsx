"use client";

import { useEffect } from "react";
import { recordRecentProperty } from "@/lib/recent-properties";

export function RecentPropertyTracker({
  propertyId,
  propertyName,
}: {
  propertyId: string;
  propertyName: string;
}) {
  useEffect(() => {
    recordRecentProperty({ id: propertyId, name: propertyName });
  }, [propertyId, propertyName]);

  return null;
}
