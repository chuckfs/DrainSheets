import { requireProfile } from "@/lib/auth/guards";
import { SettingsNav } from "@/components/settings/settings-nav";
import { SheetHeader } from "@/components/layout/sheet-header";

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();

  return (
    <div className="-m-3 flex min-h-[calc(100vh-3rem)] flex-col">
      <SheetHeader title="Settings" subtitle="Manage your account and workspace" />
      <div className="border-b px-3 py-2">
        <SettingsNav profile={profile} />
      </div>
      <div className="flex-1 overflow-auto p-3">{children}</div>
    </div>
  );
}
