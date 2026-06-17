"use client";

import { signOut } from "@/actions/auth";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  return (
    <form action={signOut}>
      <Button type="submit" variant="ghost" size="xs" className="text-xs">
        Sign out
      </Button>
    </form>
  );
}
