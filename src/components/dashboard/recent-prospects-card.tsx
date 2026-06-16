import Link from "next/link";
import type { RecentProspect } from "@/actions/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function RecentProspectsCard({ prospects }: { prospects: RecentProspect[] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Recent prospects</CardTitle>
      </CardHeader>
      <CardContent>
        {prospects.length === 0 ? (
          <p className="text-sm text-muted-foreground">No prospects to show.</p>
        ) : (
          <ul className="space-y-2">
            {prospects.map((prospect) => (
              <li key={prospect.id}>
                <Link href={`/prospects/${prospect.id}`} className="text-sm font-medium hover:underline">
                  {prospect.company_name}
                </Link>
                {prospect.properties && (
                  <p className="text-xs text-muted-foreground">{prospect.properties.name}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
