import { requireUser } from "@/lib/auth";
import { site } from "@/lib/site";
import { parseSocials } from "@/lib/social";
import { Badge, ButtonLink, Card, PageHeader } from "@/components/ui";
import { ROLE_LABEL, STATUS_LABEL, type UserRole } from "@/lib/constants";
import { ProfileForm, PasswordForm } from "@/components/forms/MemberForms";
import { PlayerProfileForm } from "@/components/forms/PlayerProfileForm";

export default async function ProfilePage() {
  const me = await requireUser();
  const inLegion = me.status === "APPROVED";
  return (
    <>
      <PageHeader
        title="Profile"
        text="What members see on your public profile: your game, in-game name, how you play, and your links."
        actions={<ButtonLink href={`/members/${encodeURIComponent(me.username)}`} variant="secondary">View public profile</ButtonLink>}
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="display mb-5 text-2xl">Account & links</h2>
          <ProfileForm initial={{ displayName: me.displayName, email: me.email, discord: me.discord, socials: parseSocials(me.socials) }} />
        </Card>
        <div className="space-y-6">
          <Card>
            <h2 className="display mb-5 text-2xl">Password</h2>
            <PasswordForm />
          </Card>
          <Card>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="label">Username</dt>
                <dd className="mt-1">{me.username}</dd>
              </div>
              <div>
                <dt className="label">{site.legionName}</dt>
                <dd className="mt-1 flex flex-wrap items-center gap-1.5">
                  <Badge tone={inLegion ? "success" : me.status === "DENIED" ? "danger" : me.appliedAt ? "warning" : "neutral"}>
                    {inLegion ? "In the legion" : me.appliedAt ? (STATUS_LABEL[me.status] ?? me.status) : "Not applied"}
                  </Badge>
                  {inLegion && me.role !== "MEMBER" && <Badge tone="gold">{ROLE_LABEL[me.role as UserRole]}</Badge>}
                </dd>
              </div>
            </dl>
            {!inLegion && (
              <div className="mt-4">
                <ButtonLink href="/dashboard/legion" size="sm" variant="secondary">
                  {me.appliedAt ? "Your legion application" : "Apply to the legion"}
                </ButtonLink>
              </div>
            )}
          </Card>
        </div>
      </div>
      <Card className="mt-6">
        <h2 className="display mb-1 text-2xl">Player profile</h2>
        <p className="mb-6 text-sm text-muted">Which game you play, your in-game name, your class, and how you play. Shown on your public profile and used by officers for rosters.</p>
        <PlayerProfileForm
          mode="profile"
          initial={{
            game: me.game,
            gameAnswers: me.gameAnswers,
            ign: me.ign,
            gameClass: me.gameClass,
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
