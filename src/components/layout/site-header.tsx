import { Badge } from "@/components/ui/badge";
import { SignOutButton } from "@/components/auth/sign-out-button";
import type { Profile } from "@/types/domain";

export function SiteHeader({ profile }: { profile: Profile }) {
  return (
    <header className="flex h-14 items-center justify-between px-6">
      <p className="text-sm text-muted-foreground">Commercial real estate CRM</p>
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
