import Link from "next/link";
import { notFound } from "next/navigation";
import { getProperty } from "@/actions/properties";
import { ProspectForm } from "@/components/prospects/prospect-form";
import { requireProfile } from "@/lib/auth/guards";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function NewProspectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireProfile();
  const { id } = await params;
  const property = await getProperty(id);

  if (!property || property.status === "archived") {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/properties/${id}`}
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mb-2 -ml-2")}
        >
          ← Back to {property.name}
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Add prospect</h1>
        <p className="text-muted-foreground">Add a business target to {property.name}.</p>
      </div>
      <ProspectForm propertyId={id} />
    </div>
  );
}
