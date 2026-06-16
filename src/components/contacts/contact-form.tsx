"use client";

import { useActionState } from "react";
import { createContact, updateContact } from "@/actions/contacts";
import type { ActionResult } from "@/lib/action-result";
import type { Contact } from "@/types/domain";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initialState: ActionResult | null = null;

export function ContactForm({
  prospectId,
  contact,
}: {
  prospectId: string;
  contact?: Contact;
}) {
  const action = contact
    ? updateContact.bind(null, contact.id, prospectId)
    : createContact.bind(null, prospectId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="max-w-xl space-y-4">
      {state && !state.success && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="first_name">First name *</Label>
          <Input
            id="first_name"
            name="first_name"
            defaultValue={contact?.first_name}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="last_name">Last name</Label>
          <Input id="last_name" name="last_name" defaultValue={contact?.last_name ?? ""} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" defaultValue={contact?.title ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="company">Company</Label>
          <Input id="company" name="company" defaultValue={contact?.company ?? ""} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={contact?.email ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" type="tel" defaultValue={contact?.phone ?? ""} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" rows={4} defaultValue={contact?.notes ?? ""} />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : contact ? "Save changes" : "Add contact"}
      </Button>
    </form>
  );
}
