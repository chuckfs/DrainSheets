import Link from "next/link";
import { notFound } from "next/navigation";
import { getProspect } from "@/actions/prospects";
import { ProspectForm } from "@/components/prospects/prospect-form";
import { requireProfile } from "@/lib/auth/guards";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function EditProspectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireProfile();
  const { id } = await params;
  const prospect = await getProspect(id);

  if (!prospect) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/prospects/${id}`}
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mb-2 -ml-2")}
        >
          ← Back to prospect
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Edit prospect</h1>
        <p className="text-muted-foreground">{prospect.company_name}</p>
      </div>
      <ProspectForm propertyId={prospect.property_id} prospect={prospect} />
    </div>
  );
}
