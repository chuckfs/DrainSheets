import { AuthCard } from "@/components/layout/auth-card";

export default function ForgotPasswordPage() {
  return (
    <AuthCard title="Reset password" description="Password reset ships in Milestone 2.">
      <p className="text-sm text-muted-foreground">
        You will be able to request a reset link from this page.
      </p>
    </AuthCard>
  );
}
