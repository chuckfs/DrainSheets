"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { listActivity, type ActivityWithActor } from "@/actions/activity";
import { formatActivityMessage, formatRelativeTime } from "@/lib/activity/format";
import { EmptyState } from "@/components/ui/empty-state";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ActivityItem } from "./activity-item";

export function ActivityFeed({
  sheetId,
  rowId,
}: {
  sheetId: string;
  rowId?: string | null;
}) {
  const [items, setItems] = useState<ActivityWithActor[]>([]);
  const [loading, setLoading] = useState(true);

  async function reload() {
    setLoading(true);
    try {
      const data = await listActivity(sheetId, rowId ?? null);
      setItems(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load activity");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, [sheetId, rowId]);

  return (
    <ScrollArea className="h-full min-h-0 flex-1">
      <div className="space-y-2 p-3">
        {loading ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Loading activity…</p>
        ) : items.length === 0 ? (
          <EmptyState
            title="No activity yet"
            description="Edits, imports, and collaboration events will appear here as your team works."
          />
        ) : (
          items.map((item) => (
            <ActivityItem
              key={item.id}
              message={formatActivityMessage(item, item.actor)}
              timestamp={formatRelativeTime(item.created_at)}
            />
          ))
        )}
      </div>
    </ScrollArea>
  );
}
