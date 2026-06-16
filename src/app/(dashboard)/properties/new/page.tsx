import { PropertyForm } from "@/components/properties/property-form";
import { requireProfile } from "@/lib/auth/guards";
import { canCreateProperty } from "@/lib/permissions/property";
import { redirect } from "next/navigation";

export default async function NewPropertyPage() {
  const profile = await requireProfile();

  if (!canCreateProperty(profile)) {
    redirect("/properties");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Create property</h1>
        <p className="text-muted-foreground">Add a new property or prospecting initiative.</p>
      </div>
      <PropertyForm />
    </div>
  );
}
