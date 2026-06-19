"use client";

import { Badge } from "@/components/ui/badge";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { SearchCommand } from "@/components/search/search-command";
import { MobileNavSheet } from "@/components/layout/mobile-nav-sheet";
import type { Profile } from "@/types/domain";

export function SiteHeader({ profile }: { profile: Profile }) {
  return (
    <header className="flex h-12 shrink-0 items-center gap-3 border-b px-3">
      <MobileNavSheet />
      <div className="min-w-0 flex-1 px-1">
        <SearchCommand />
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="hidden max-w-[120px] truncate text-xs font-medium sm:inline">
          {profile.name}
        </span>
        <Badge variant="secondary" className="h-5 px-1.5 text-[10px] capitalize">
          {profile.role}
        </Badge>
        <SignOutButton />
      </div>
    </header>
  );
}
