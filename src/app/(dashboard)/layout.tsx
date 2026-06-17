import { requireProfile } from "@/lib/auth/guards";
import { IconRail } from "@/components/layout/icon-rail";
import { SiteHeader } from "@/components/layout/site-header";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();

  return (
    <div className="flex min-h-screen">
      <IconRail />
      <div className="flex min-w-0 flex-1 flex-col">
        <SiteHeader profile={profile} />
        <main className="flex-1 overflow-auto p-3">{children}</main>
      </div>
    </div>
  );
}
