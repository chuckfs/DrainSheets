import Link from "next/link";
import { notFound } from "next/navigation";
import { getProspect } from "@/actions/prospects";
import { ContactForm } from "@/components/contacts/contact-form";
import { requireProfile } from "@/lib/auth/guards";
import { canEditContact } from "@/lib/permissions/contact";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function NewContactPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await requireProfile();
  const { id } = await params;

  if (!canEditContact(profile)) {
    notFound();
  }

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
          ← Back to {prospect.company_name}
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Add contact</h1>
        <p className="text-muted-foreground">
          Add a contact for {prospect.company_name}
          {prospect.properties ? ` at ${prospect.properties.name}` : ""}.
        </p>
      </div>
      <ContactForm prospectId={id} />
    </div>
  );
}
