import type { ReactNode } from "react";

export function ListPageShell({
  header,
  toolbar,
  children,
}: {
  header: ReactNode;
  toolbar?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="-m-3 flex min-h-[calc(100vh-3rem)] flex-col">
      {header}
      {toolbar}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
    </div>
  );
}
