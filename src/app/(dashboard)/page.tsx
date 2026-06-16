import { getPropertyCount } from "@/actions/properties";
import { getProspectCount } from "@/actions/prospects";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { requireProfile } from "@/lib/auth/guards";
import { canCreateProperty } from "@/lib/permissions/property";

export default async function DashboardPage() {
  const profile = await requireProfile();
  const [propertyCount, prospectCount] = await Promise.all([
    getPropertyCount("active"),
    getProspectCount(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {profile.name}.</p>
        </div>
        {canCreateProperty(profile) && (
          <Link href="/properties/new" className={cn(buttonVariants())}>
            Create property
          </Link>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active properties</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{propertyCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Prospects</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{prospectCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Contacts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-muted-foreground">—</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-muted-foreground">—</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
