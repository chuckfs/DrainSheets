import { Badge } from "@/components/ui/badge";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { GlobalSearch } from "@/components/search/global-search";
import type { Profile } from "@/types/domain";

export function SiteHeader({ profile }: { profile: Profile }) {
  return (
    <header className="flex h-auto min-h-14 flex-wrap items-center justify-between gap-4 px-6 py-3">
      <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
        <p className="shrink-0 text-sm text-muted-foreground">Commercial real estate CRM</p>
        <GlobalSearch />
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-medium">{profile.name}</p>
          <Badge variant="secondary" className="capitalize">
            {profile.role}
          </Badge>
        </div>
        <SignOutButton />
      </div>
    </header>
  );
}
