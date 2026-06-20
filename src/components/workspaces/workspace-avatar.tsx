import { cn } from "@/lib/utils";
import { workspaceAvatarTokens } from "@/lib/workspaces/avatar";

export function WorkspaceAvatar({
  id,
  name,
  className,
  active = false,
  preview = false,
}: {
  id: string;
  name: string;
  className?: string;
  /** Draws an accent ring (used for the selected workspace in the rail). */
  active?: boolean;
  /** Use name-based palette for create-dialog preview (before id exists). */
  preview?: boolean;
}) {
  const { initials, bg, fg, accent } = workspaceAvatarTokens(id, name, { preview });

  return (
    <span
      className={cn(
        "inline-flex size-8 shrink-0 select-none items-center justify-center rounded-lg text-[12px] font-semibold uppercase leading-none",
        className,
      )}
      style={{
        backgroundColor: bg,
        color: fg,
        boxShadow: active ? `0 0 0 2px var(--rail), 0 0 0 4px ${accent}` : undefined,
      }}
      aria-hidden
    >
      {initials}
    </span>
  );
}
