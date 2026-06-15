import Link from "next/link";
import { cn } from "@/lib/utils";
import { isOwner } from "@/lib/permissions/roles";
import type { Profile } from "@/types/domain";

const settingsLinks = [
  { href: "/settings", label: "Profile" },
  { href: "/settings/users", label: "Users", ownerOnly: true },
] as const;

export function SettingsNav({ profile }: { profile: Profile }) {
  return (
    <nav className="mb-6 flex gap-2 border-b pb-2">
      {settingsLinks
        .filter((link) => {
          if ("ownerOnly" in link && link.ownerOnly) {
            return isOwner(profile.role);
          }
          return true;
        })
        .map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {link.label}
          </Link>
        ))}
    </nav>
  );
}
