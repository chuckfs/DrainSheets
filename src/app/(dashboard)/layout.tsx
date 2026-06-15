import { AppSidebar } from "@/components/layout/app-sidebar";
import { SiteHeader } from "@/components/layout/site-header";
import { Separator } from "@/components/ui/separator";

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/properties", label: "Properties" },
  { href: "/prospects", label: "Prospects" },
  { href: "/contacts", label: "Contacts" },
  { href: "/documents", label: "Documents" },
  { href: "/settings", label: "Settings" },
] as const;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <AppSidebar items={navItems} />
      <div className="flex flex-1 flex-col">
        <SiteHeader />
        <Separator />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
