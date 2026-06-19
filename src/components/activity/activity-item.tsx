import { UserAvatar } from "@/components/ui/user-avatar";

export function ActivityItem({
  message,
  timestamp,
}: {
  message: string;
  timestamp: string;
}) {
  const actorName = message.split(" ")[0] ?? "Someone";

  return (
    <div className="flex gap-2 rounded-lg border bg-card p-3">
      <UserAvatar name={actorName} className="size-7 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-sm">{message}</p>
        <p className="mt-1 text-[11px] text-muted-foreground">{timestamp}</p>
      </div>
    </div>
  );
}
