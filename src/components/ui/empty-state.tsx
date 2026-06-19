import type { ReactNode } from "react";
import Link from "next/link";

export function EmptyState({
  title,
  description,
  action,
  href,
  actionLabel,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  href?: string;
  actionLabel?: string;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center"
      role="status"
    >
      <h3 className="text-base font-medium">{title}</h3>
      <p className="max-w-md text-sm text-muted-foreground">{description}</p>
      {action}
      {!action && href && actionLabel && (
        <Link
          href={href}
          className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
