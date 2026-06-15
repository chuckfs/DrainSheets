"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { signIn, type AuthFormState } from "@/actions/auth";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

const initialState: AuthFormState | null = null;

export function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";
  const message = searchParams.get("message");
  const error = searchParams.get("error");
  const [state, formAction, pending] = useActionState(signIn, initialState);

  const bannerMessage =
    message === "check_email"
      ? "Check your email to confirm your account, then sign in."
      : message === "password_updated"
        ? "Password updated. Sign in with your new password."
        : error === "account_disabled"
          ? "Your account has been disabled."
          : error === "auth_callback_failed"
            ? "Authentication failed. Try again."
            : null;

  const formError = state && !state.success ? state.error : null;

  return (
    <div className="space-y-4">
      {(bannerMessage || formError) && (
        <div
          className={`rounded-md border px-3 py-2 text-sm ${
            formError || error
              ? "border-destructive/30 bg-destructive/10 text-destructive"
              : "border-border bg-muted text-muted-foreground"
          }`}
        >
          {formError ?? bannerMessage}
        </div>
      )}

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="next" value={next} />

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href="/forgot-password" className="text-xs text-muted-foreground hover:underline">
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </div>

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">or</span>
        <Separator className="flex-1" />
      </div>

      <GoogleSignInButton label="Continue with Google" />

      <p className="text-center text-sm text-muted-foreground">
        Invited to DrainSheets?{" "}
        <Link href="/signup" className="font-medium text-foreground hover:underline">
          Create account
        </Link>
      </p>
    </div>
  );
}
