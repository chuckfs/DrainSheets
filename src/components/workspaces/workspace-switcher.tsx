"use client";

import Link from "next/link";

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
    <div className="flex flex-wrap gap-1">
      {workspaces.map((item) => (
        <Link
          key={item.id}
          href={`/workspaces/${item.id}`}
          className={
            item.id === activeWorkspaceId
              ? "rounded-md bg-primary px-2 py-0.5 text-[11px] text-primary-foreground"
              : "rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground hover:text-foreground"
          }
        >
          {item.name}
        </Link>
      ))}
    </div>
  );
}
