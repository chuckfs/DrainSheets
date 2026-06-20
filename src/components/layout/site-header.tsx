"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { MobileNavSheet } from "@/components/layout/mobile-nav-sheet";
import { UserAvatar } from "@/components/ui/user-avatar";
import type { Profile } from "@/types/domain";

export function SiteHeader({
  profile,
  workspaces = [],
  canCreateWorkspace = false,
}: {
  profile: Profile;
  workspaces?: Array<{ id: string; name: string }>;
  canCreateWorkspace?: boolean;
}) {
  return (
    <header className="flex h-12 shrink-0 items-center gap-3 border-b bg-background px-3">
      <MobileNavSheet
        workspaces={workspaces}
        canCreateWorkspace={canCreateWorkspace}
      />
      <div className="min-w-0 flex-1 px-1">
        <Link
          href="/"
          className="truncate text-lg font-semibold tracking-tight text-foreground hover:opacity-80"
        >
          DrainSheets
        </Link>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <div className="hidden items-center gap-2 rounded-full border bg-card py-0.5 pl-0.5 pr-2.5 sm:flex">
          <UserAvatar
            name={profile.name}
            className="size-6 bg-primary/10 text-[10px] text-primary"
          />
          <span className="max-w-[120px] truncate text-xs font-medium">{profile.name}</span>
          <Badge
            variant="secondary"
            className="h-4 rounded-sm px-1 text-[9px] uppercase tracking-wide"
          >
            {profile.role}
          </Badge>
        </div>
        <SignOutButton />
      </div>
    </header>
  );
}
