import type { ReactNode } from "react";
import { InboxIcon, type LucideIcon } from "lucide-react";
import Link from "next/link";

export function EmptyState({
  title,
  description,
  action,
  href,
  actionLabel,
  icon: Icon = InboxIcon,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  href?: string;
  actionLabel?: string;
  icon?: LucideIcon;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center"
      role="status"
    >
      <span className="mb-1 flex size-11 items-center justify-center rounded-xl border bg-muted/60 text-muted-foreground">
        <Icon className="size-5" aria-hidden />
      </span>
      <h3 className="text-[15px] font-medium">{title}</h3>
      <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      {action && <div className="mt-2">{action}</div>}
      {!action && href && actionLabel && (
        <Link
          href={href}
          className="mt-2 inline-flex h-8 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
