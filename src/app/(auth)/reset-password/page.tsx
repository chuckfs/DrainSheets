import Link from "next/link";
import { AuthCard } from "@/components/layout/auth-card";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <AuthCard title="Set new password" description="Choose a new password for your account.">
      <ResetPasswordForm />
      <Link href="/login" className="mt-4 block text-center text-sm text-muted-foreground hover:underline">
        Back to sign in
      </Link>
    </AuthCard>
  );
}
