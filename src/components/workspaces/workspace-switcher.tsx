"use client";

import Link from "next/link";

import { WorkspaceAvatar } from "@/components/workspaces/workspace-avatar";
import { cn } from "@/lib/utils";

export function WorkspaceSwitcher({
  workspaces,
  activeWorkspaceId,
}: {
  workspaces: Array<{ id: string; name: string }>;
  activeWorkspaceId: string;
}) {
  if (workspaces.length <= 1) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {workspaces.map((item) => {
        const active = item.id === activeWorkspaceId;
        return (
          <Link
            key={item.id}
            href={`/workspaces/${item.id}`}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] transition-colors",
              active
                ? "border-primary/30 bg-primary/10 text-foreground"
                : "border-transparent bg-muted text-muted-foreground hover:text-foreground",
            )}
          >
            <WorkspaceAvatar id={item.id} name={item.name} className="size-5 text-[9px]" />
            <span className="max-w-[120px] truncate">{item.name}</span>
          </Link>
        );
      })}
    </div>
  );
}
