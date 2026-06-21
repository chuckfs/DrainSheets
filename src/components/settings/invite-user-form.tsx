"use client";

import { useActionState, useState } from "react";
import { createInvitation } from "@/actions/users";
import { AppSelect } from "@/components/ui/app-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ROLE_OPTIONS = [
  { value: "editor", label: "Editor" },
  { value: "admin", label: "Admin" },
] as const;

export function InviteUserForm() {
  const [state, formAction, pending] = useActionState(createInvitation, null);
  const [role, setRole] = useState<(typeof ROLE_OPTIONS)[number]["value"]>("editor");
  const inviteUrl = state?.success ? state.data?.inviteUrl : null;
  const formError = state && !state.success ? state.error : null;

  return (
    <div className="space-y-4">
      <form action={formAction} className="grid gap-4 md:grid-cols-[1fr_auto_auto] md:items-end">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" placeholder="user@example.com" required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <input type="hidden" name="role" value={role} />
          <AppSelect
            id="role"
            value={role}
            options={[...ROLE_OPTIONS]}
            triggerClassName="md:w-36"
            onValueChange={setRole}
          />
        </div>

        <Button type="submit" disabled={pending}>
          {pending ? "Inviting..." : "Invite user"}
        </Button>
      </form>

      {formError && <p className="text-sm text-destructive">{formError}</p>}

      {inviteUrl && (
        <div className="rounded-md border bg-muted p-3">
          <p className="mb-2 text-sm font-medium">Invitation link (copy and send manually)</p>
          <code className="block break-all text-xs text-muted-foreground">{inviteUrl}</code>
        </div>
      )}
    </div>
  );
}
