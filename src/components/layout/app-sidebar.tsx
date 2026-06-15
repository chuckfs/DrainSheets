import Link from "next/link";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
};

export function AppSidebar({ items }: { items: readonly NavItem[] }) {
  return (
    <aside className="hidden w-64 shrink-0 border-r bg-sidebar text-sidebar-foreground md:block">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          DrainSheets
        </Link>
      </div>
      <nav className="flex flex-col gap-1 p-2">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/80",
              "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
