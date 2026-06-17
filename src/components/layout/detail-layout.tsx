import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function DetailLayout({
  main,
  panel,
  rail,
  className,
  mobileToolbar = false,
}: {
  main: ReactNode;
  panel?: ReactNode;
  rail: ReactNode;
  className?: string;
  mobileToolbar?: boolean;
}) {
  return (
    <div
      className={cn(
        "-m-3 flex min-h-[calc(100vh-3rem)]",
        mobileToolbar && "pb-14 md:pb-0",
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col">{main}</div>
      {panel}
      {rail}
    </div>
  );
}
