import { requireApproved } from "@/lib/auth";
import { Card, PageHeader } from "@/components/ui";
import { ProfileForm, PasswordForm } from "@/components/forms/MemberForms";
import { PlayerProfileForm } from "@/components/forms/PlayerProfileForm";
import { ROLE_LABEL, type UserRole } from "@/lib/constants";

export default async function ProfilePage() {
  const me = await requireApproved();
  return (
    <>
      <PageHeader title="Profile" text="Keep your game, in-game name, and class current so officers can build rosters." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="display mb-5 text-2xl">Account</h2>
          <ProfileForm initial={{ displayName: me.displayName, email: me.email, discord: me.discord }} />
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
              <dt className="label">Role</dt>
              <dd className="mt-1">{ROLE_LABEL[me.role as UserRole] ?? me.role}</dd>
            </div>
          </dl>
        </Card>
      </div>
      <Card className="mt-6">
        <h2 className="display mb-1 text-2xl">Player profile</h2>
        <p className="mb-6 text-sm text-muted">Which game you play, your in-game name, your class, and how you play. Shown to officers and used for rosters.</p>
        <PlayerProfileForm
          mode="profile"
          initial={{
            game: me.game,
            gameAnswers: me.gameAnswers,
            playtime: me.playtime,
            playerType: me.playerType,
            interests: me.interests,
            games: me.games,
            applicationNote: me.applicationNote,
          }}
        />
      </Card>
    </>
  );
}
