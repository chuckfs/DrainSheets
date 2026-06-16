import Link from "next/link";
import { notFound } from "next/navigation";
import { getProperty } from "@/actions/properties";
import { PropertyForm } from "@/components/properties/property-form";
import { requireProfile } from "@/lib/auth/guards";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function EditPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireProfile();
  const { id } = await params;
  const property = await getProperty(id);

  if (!property) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/properties/${id}`}
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mb-2 -ml-2")}
        >
          ← Back to property
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Edit property</h1>
        <p className="text-muted-foreground">{property.name}</p>
      </div>
      <PropertyForm property={property} />
    </div>
  );
}
