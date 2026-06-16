"use client";

import { useActionState } from "react";
import { createProperty, updateProperty } from "@/actions/properties";
import type { ActionResult } from "@/lib/action-result";
import type { Property } from "@/types/domain";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initialState: ActionResult | null = null;

export function PropertyForm({ property }: { property?: Property }) {
  const action = property
    ? updateProperty.bind(null, property.id)
    : createProperty;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="max-w-xl space-y-4">
      {state && !state.success && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Name *</Label>
        <Input id="name" name="name" defaultValue={property?.name} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Input id="address" name="address" defaultValue={property?.address ?? ""} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input id="city" name="city" defaultValue={property?.city ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="state">State</Label>
          <Input id="state" name="state" defaultValue={property?.state ?? ""} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" rows={4} defaultValue={property?.description ?? ""} />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : property ? "Save changes" : "Create property"}
      </Button>
    </form>
  );
}
