"use client";

import { useActionState } from "react";
import { createInvitation } from "@/actions/users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function InviteUserForm() {
  const [state, formAction, pending] = useActionState(createInvitation, null);
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
          <select
            id="role"
            name="role"
            defaultValue="editor"
            className="flex h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm md:w-36"
          >
            <option value="editor">Editor</option>
            <option value="admin">Admin</option>
          </select>
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
