import { redirect } from "next/navigation";
import { getDefaultWorkspace } from "@/actions/workspaces";
import { ListPageShell } from "@/components/layout/list-page-shell";
import { SheetHeader } from "@/components/layout/sheet-header";

export default async function HomePage() {
  const workspace = await getDefaultWorkspace();

  if (workspace) {
    redirect(`/workspaces/${workspace.id}`);
  }

  return (
    <ListPageShell
      header={<SheetHeader title="Welcome" subtitle="No workspace found for your organization." />}
    >
      <div className="px-3 py-8 text-sm text-muted-foreground">
        <p>Seed a dev workspace and sheet, then refresh:</p>
        <pre className="mt-3 rounded-md bg-muted px-3 py-2 text-xs">npm run db:seed-dev</pre>
      </div>
    </ListPageShell>
  );
}
