import Link from "next/link";
import type { DashboardStats } from "@/actions/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const statItems: Array<{
  key: keyof DashboardStats;
  label: string;
  href: string;
}> = [
  { key: "properties", label: "Properties", href: "/properties" },
  { key: "prospects", label: "Prospects", href: "/prospects" },
  { key: "contacts", label: "Contacts", href: "/contacts" },
  { key: "documents", label: "Documents", href: "/documents" },
];

export function DashboardStats({ stats }: { stats: DashboardStats }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {statItems.map((item) => (
        <Card key={item.key}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              <Link href={item.href} className="hover:underline">
                {item.label}
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats[item.key]}</p>
          </CardContent>
        </Card>
      ))}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{stats.notes}</p>
        </CardContent>
      </Card>
    </div>
  );
}
