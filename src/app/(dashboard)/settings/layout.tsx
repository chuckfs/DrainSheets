import { requireProfile } from "@/lib/auth/guards";
import { SettingsNav } from "@/components/settings/settings-nav";

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account and workspace.</p>
      </div>
      <SettingsNav profile={profile} />
      {children}
    </div>
  );
}
