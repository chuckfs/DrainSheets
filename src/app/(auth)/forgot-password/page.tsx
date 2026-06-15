import { AuthCard } from "@/components/layout/auth-card";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <AuthCard title="Reset password" description="We will email you a reset link.">
      <ForgotPasswordForm />
    </AuthCard>
  );
}
