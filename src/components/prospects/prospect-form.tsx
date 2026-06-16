"use client";

import { useActionState } from "react";
import { createProspect, updateProspect } from "@/actions/prospects";
import type { ActionResult } from "@/lib/action-result";
import { PROSPECT_STATUSES } from "@/lib/validations/crm";
import type { Prospect } from "@/types/domain";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initialState: ActionResult | null = null;

export function ProspectForm({
  propertyId,
  prospect,
}: {
  propertyId: string;
  prospect?: Prospect;
}) {
  const action = prospect
    ? updateProspect.bind(null, prospect.id, propertyId)
    : createProspect.bind(null, propertyId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="max-w-xl space-y-4">
      {state && !state.success && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      <div className="space-y-2">
        <Label htmlFor="company_name">Company name *</Label>
        <Input
          id="company_name"
          name="company_name"
          defaultValue={prospect?.company_name}
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Input id="category" name="category" defaultValue={prospect?.category ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            name="status"
            defaultValue={prospect?.status ?? ""}
            className="flex h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
          >
            <option value="">No status</option>
            {PROSPECT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="website">Website</Label>
        <Input
          id="website"
          name="website"
          type="url"
          placeholder="https://"
          defaultValue={prospect?.website ?? ""}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="comments">Comments</Label>
        <Textarea id="comments" name="comments" rows={4} defaultValue={prospect?.comments ?? ""} />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : prospect ? "Save changes" : "Add prospect"}
      </Button>
    </form>
  );
}
