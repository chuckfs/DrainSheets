import { Suspense } from "react";
import { AuthCard } from "@/components/layout/auth-card";
import { LoginForm } from "@/components/auth/login-form";
import { Skeleton } from "@/components/ui/skeleton";

export default function LoginPage() {
  return (
    <AuthCard title="Sign in" description="Access your DrainSheets workspace.">
      <Suspense fallback={<Skeleton className="h-40 w-full" />}>
        <LoginForm />
      </Suspense>
    </AuthCard>
  );
}
