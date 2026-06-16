import Link from "next/link";
import { notFound } from "next/navigation";
import { getContact } from "@/actions/contacts";
import { ContactForm } from "@/components/contacts/contact-form";
import { contactDisplayName } from "@/lib/contacts/display";
import { requireProfile } from "@/lib/auth/guards";
import { canEditContact } from "@/lib/permissions/contact";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function EditContactPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await requireProfile();
  const { id } = await params;
  const contact = await getContact(id);

  if (!contact || !canEditContact(profile)) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/contacts/${id}`}
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mb-2 -ml-2")}
        >
          ← Back to contact
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Edit contact</h1>
        <p className="text-muted-foreground">{contactDisplayName(contact)}</p>
      </div>
      <ContactForm prospectId={contact.prospect_id} contact={contact} />
    </div>
  );
}
