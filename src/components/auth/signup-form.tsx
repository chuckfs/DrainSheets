"use client";

import { useActionState } from "react";
import { signUp, type AuthFormState } from "@/actions/auth";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import type { OrgRole } from "@/types/domain";

const initialState: AuthFormState | null = null;

export function SignupForm({
  email,
  role,
  readOnlyEmail = false,
}: {
  email?: string;
  role?: OrgRole;
  readOnlyEmail?: boolean;
}) {
  const [state, formAction, pending] = useActionState(signUp, initialState);
  const formError = state && !state.success ? state.error : null;

  return (
    <div className="space-y-4">
      {role && (
        <p className="rounded-md border bg-muted px-3 py-2 text-sm text-muted-foreground">
          You are joining as <span className="font-medium text-foreground">{role}</span>.
        </p>
      )}

      {formError && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {formError}
        </div>
      )}

      <form action={formAction} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" name="name" autoComplete="name" required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            defaultValue={email}
            readOnly={readOnlyEmail}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
          />
          <p className="text-xs text-muted-foreground">At least 8 characters.</p>
        </div>

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Creating account..." : "Create account"}
        </Button>
      </form>

      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">or</span>
        <Separator className="flex-1" />
      </div>

      <GoogleSignInButton label="Sign up with Google" />
    </div>
  );
}
