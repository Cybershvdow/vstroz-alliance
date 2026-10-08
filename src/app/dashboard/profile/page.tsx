import { requireApproved } from "@/lib/auth";
import { Card, PageHeader } from "@/components/ui";
import { ProfileForm, PasswordForm } from "@/components/forms/MemberForms";

export default async function ProfilePage() {
  const me = await requireApproved();
  return (
    <>
      <PageHeader title="Profile" text="Keep your class and in-game name current so officers can build rosters." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="display mb-5 text-2xl">Details</h2>
          <ProfileForm initial={{ displayName: me.displayName, ign: me.ign, gameClass: me.gameClass, discord: me.discord }} />
        </Card>
        <Card>
          <h2 className="display mb-5 text-2xl">Password</h2>
          <PasswordForm />
          <dl className="mt-8 grid grid-cols-2 gap-3 border-t border-line pt-5 text-sm">
            <div>
              <dt className="label">Username</dt>
              <dd className="mt-1">{me.username}</dd>
            </div>
            <div>
              <dt className="label">Email</dt>
              <dd className="mt-1 truncate">{me.email}</dd>
            </div>
          </dl>
        </Card>
      </div>
    </>
  );
}
