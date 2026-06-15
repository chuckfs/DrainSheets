import Link from "next/link";
import { canBootstrapFirstUser, getInvitationByToken } from "@/actions/users";
import { AuthCard } from "@/components/layout/auth-card";
import { SignupForm } from "@/components/auth/signup-form";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const invitation = await getInvitationByToken(token ?? null);
  const bootstrap = !token ? await canBootstrapFirstUser() : false;

  if (!invitation && !bootstrap) {
    return (
      <AuthCard
        title="Invitation required"
        description="DrainSheets is invite-only. Ask your workspace owner for an invitation link."
      >
        <Link href="/login" className="text-sm font-medium hover:underline">
          Back to sign in
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title={bootstrap ? "Create owner account" : "Accept invitation"}
      description={
        bootstrap
          ? "Set up the first workspace owner account."
          : "Create your account to join the workspace."
      }
    >
      <SignupForm
        email={invitation?.email}
        role={invitation?.role ?? (bootstrap ? "owner" : undefined)}
        readOnlyEmail={Boolean(invitation?.email)}
      />
    </AuthCard>
  );
}
