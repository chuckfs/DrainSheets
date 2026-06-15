import { requireProfile } from "@/lib/auth/guards";
import { ProfileForm } from "@/components/settings/profile-form";

export default async function SettingsPage() {
  const profile = await requireProfile();

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium">Profile</h2>
      <ProfileForm profile={profile} />
    </div>
  );
}
