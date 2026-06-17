export function UserInitials({ name, className }: { name: string; className?: string }) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const initials =
    parts.length >= 2
      ? `${parts[0]?.[0] ?? ""}${parts[parts.length - 1]?.[0] ?? ""}`
      : (parts[0]?.slice(0, 2) ?? "?");

  return (
    <span
      className={className}
      aria-hidden
    >
      {initials.toUpperCase()}
    </span>
  );
}

export function UserAvatar({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-medium text-muted-foreground ${className ?? ""}`}
    >
      <UserInitials name={name} />
    </span>
  );
}
