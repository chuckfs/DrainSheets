import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { ProspectWithProperty } from "@/actions/prospects";

export function ProspectsTable({ prospects }: { prospects: ProspectWithProperty[] }) {
  if (prospects.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        No prospects found.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/50">
          <tr>
            <th className="px-4 py-3 text-left font-medium">Company</th>
            <th className="px-4 py-3 text-left font-medium">Property</th>
            <th className="px-4 py-3 text-left font-medium">Category</th>
            <th className="px-4 py-3 text-left font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {prospects.map((prospect) => (
            <tr key={prospect.id} className="border-b last:border-b-0 hover:bg-muted/30">
              <td className="px-4 py-3">
                <Link href={`/prospects/${prospect.id}`} className="font-medium hover:underline">
                  {prospect.company_name}
                </Link>
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {prospect.properties ? (
                  <Link href={`/properties/${prospect.properties.id}`} className="hover:underline">
                    {prospect.properties.name}
                  </Link>
                ) : (
                  "—"
                )}
              </td>
              <td className="px-4 py-3 text-muted-foreground">{prospect.category ?? "—"}</td>
              <td className="px-4 py-3">
                {prospect.status ? (
                  <Badge variant="secondary" className="capitalize">
                    {prospect.status}
                  </Badge>
                ) : (
                  "—"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
