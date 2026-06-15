import { AuthCard } from "@/components/layout/auth-card";

export default function LoginPage() {
  return (
    <AuthCard title="Sign in" description="Authentication UI ships in Milestone 2.">
      <p className="text-sm text-muted-foreground">
        Login, Google OAuth, and password reset will be implemented next.
      </p>
    </AuthCard>
  );
}
