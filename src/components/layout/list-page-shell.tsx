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
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}
