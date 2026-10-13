import { requireUser } from "@/lib/auth";
import { site } from "@/lib/site";
import { parseSocials } from "@/lib/social";
import { discordConfigured } from "@/lib/discord";
import { Badge, Button, ButtonLink, Card, PageHeader } from "@/components/ui";
import { STATUS_LABEL, allianceRank, playedGamesOf } from "@/lib/constants";
import { ProfileForm, PasswordForm } from "@/components/forms/MemberForms";
import { PlayerProfileForm } from "@/components/forms/PlayerProfileForm";
import { DiscordButton } from "@/components/site/DiscordButton";
import { ClearDraft } from "@/components/forms/DraftNotice";
import { ApexAccountForm } from "@/components/forms/ApexAccountForm";
import { AvatarForm } from "@/components/forms/AvatarForm";
import { BannerForm } from "@/components/forms/BannerForm";
import { avatarUrl, bannerUrl } from "@/lib/avatar";
import { unlinkSteamAction } from "@/lib/actions/accounts";
import { steamConfigured } from "@/lib/steam";
import { apexConfigured } from "@/lib/apex";

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ discord?: string; steam?: string; welcome?: string }> }) {
  const me = await requireUser();
  const { discord, steam, welcome } = await searchParams;
  const steamMsg =
    steam === "linked"
      ? "Steam connected."
      : steam === "unlinked"
        ? "Steam unlinked."
        : steam === "taken"
          ? "That Steam account is already linked to another member."
          : steam === "error"
            ? "Steam sign-in could not be verified. Try again."
            : steam === "off"
              ? "Steam linking is not set up yet."
              : undefined;
  const inLegion = me.status === "APPROVED";
  // The Aion guild only comes up for people it concerns: they play Aion, applied, or are in it.
  const showLegion = inLegion || !!me.appliedAt || playedGamesOf(me).includes(site.legionGame);
  const rank = allianceRank(me);
  const discordMsg =
    discord === "linked" ? "Discord connected." : discord === "taken" ? "That Discord account is already connected to another member." : undefined;
  return (
    <>
      <PageHeader
        title="Profile"
        text="What members see on your public profile: the games you play, how you play, and your links. Everything you type here is kept if the page refreshes."
        actions={<ButtonLink href={`/members/${encodeURIComponent(me.username)}`} variant="secondary">View public profile</ButtonLink>}
      />
      {welcome && (
        <>
          <ClearDraft names={["register"]} scope="anon" />
          <div className="panel mb-6 flex flex-col gap-3 border-accent/50 p-4 text-sm md:flex-row md:items-center md:justify-between">
            <p>
              <span className="font-semibold">Welcome to the alliance, {me.displayName}.</span> You start as a Recruit. Add a profile picture and a banner below, then tick the games you play. They show as tags on your profile and list you on each game&apos;s page.
            </p>
            <div className="flex shrink-0 flex-wrap gap-2">
              <ButtonLink href="#player-profile" size="sm">
                Pick your games
              </ButtonLink>
            </div>
          </div>
        </>
      )}
      <Card className="mb-6">
        <h2 id="profile-picture" className="display mb-1 scroll-mt-28 text-2xl">Profile picture</h2>
        <p className="mb-5 text-sm text-muted">Shown on your profile, the roster, and around the portal. You can change or remove it any time.</p>
        <AvatarForm name={me.displayName} current={avatarUrl(me)} />
      </Card>
      <Card className="mb-6">
        <h2 id="profile-banner" className="display mb-1 scroll-mt-28 text-2xl">Profile banner</h2>
        <p className="mb-5 text-sm text-muted">A wide image across the top of your public profile. Make it yours. You can change or remove it any time.</p>
        <BannerForm current={bannerUrl(me)} />
      </Card>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="display mb-5 text-2xl">Account & links</h2>
          <ProfileForm initial={{ displayName: me.displayName, email: me.email, discord: me.discord, socials: parseSocials(me.socials) }} />
        </Card>
        <div className="space-y-6">
          <Card>
            <p className="eyebrow">Discord</p>
            {discordMsg && <p className={`mt-2 text-sm ${discord === "linked" ? "text-success" : "text-danger"}`}>{discordMsg}</p>}
            {me.discordId ? (
              <p className="mt-2 text-sm">
                Connected as <span className="text-text">@{me.discordUsername ?? me.discord}</span>.{" "}
                <span className="text-muted">Leaving the Discord server removes you from the legion and hides your profile until you rejoin.</span>
              </p>
            ) : discordConfigured() ? (
              <>
                <p className="mt-2 text-sm text-muted">
                  Connect your Discord so the site knows you are in the server. Required before you can apply to the {site.legionName}.
                </p>
                <div className="mt-4">
                  <DiscordButton href="/api/discord/login?link=1">Connect Discord</DiscordButton>
                </div>
              </>
            ) : (
              <p className="mt-2 text-sm text-muted">Discord sign-in is not set up yet. Your Discord username above is shown on your profile.</p>
            )}
          </Card>
          <Card>
            <p className="eyebrow">Game accounts</p>
            <p className="mt-1 text-sm text-muted">Linked accounts show live stats on your public profile.</p>
            {steamMsg && <p className={`mt-2 text-sm ${steam === "linked" ? "text-success" : steam === "unlinked" ? "text-muted" : "text-danger"}`}>{steamMsg}</p>}
            <div className="mt-4 border-t border-line pt-4">
              <p className="label">Steam</p>
              {me.steamId ? (
                <div className="mt-2 flex flex-wrap items-center justify-between gap-3 text-sm">
                  <span>
                    Connected{me.steamName ? ` as ${me.steamName}` : ""}. Shows your Apex playtime (Steam privacy → Game details must be Public).
                  </span>
                  <form action={unlinkSteamAction}>
                    <Button type="submit" size="sm" variant="ghost">
                      Unlink
                    </Button>
                  </form>
                </div>
              ) : steamConfigured() ? (
                <div className="mt-2">
                  <ButtonLink href="/api/steam/login" variant="secondary" size="sm">
                    Connect Steam
                  </ButtonLink>
                </div>
              ) : (
                <p className="mt-2 text-sm text-dim">Steam linking is not set up yet.</p>
              )}
            </div>
            <div className="mt-4 border-t border-line pt-4">
              <p className="label mb-3">Apex Legends</p>
              {!apexConfigured() && <p className="mb-3 text-xs text-dim">Live Apex stats switch on once the stats key is set up. You can save your name now.</p>}
              {me.apexError && me.apexName && <p className="mb-3 text-xs text-warning">Last check: {me.apexError}</p>}
              <ApexAccountForm initial={{ platform: me.apexPlatform, name: me.apexName }} />
            </div>
          </Card>
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
                <dt className="label">Alliance rank</dt>
                <dd className="mt-1">
                  <Badge tone={rank.tone}>{rank.full}</Badge>
                </dd>
              </div>
              {showLegion && (
              <div>
                <dt className="label">{site.legionName}</dt>
                <dd className="mt-1">
                  <Badge tone={inLegion ? "success" : me.status === "DENIED" ? "danger" : me.appliedAt ? "warning" : "neutral"}>
                    {inLegion ? "In the legion" : me.appliedAt ? (STATUS_LABEL[me.status] ?? me.status) : "Not applied"}
                  </Badge>
                </dd>
              </div>
              )}
            </dl>
            {showLegion && !inLegion && (
              <div className="mt-4">
                <ButtonLink href="/dashboard/legion" size="sm" variant="secondary">
                  {me.appliedAt ? "Your legion application" : "Apply to the legion"}
                </ButtonLink>
              </div>
            )}
          </Card>
        </div>
      </div>
      <div id="player-profile" className="scroll-mt-8">
      <Card className="mt-6">
        <h2 className="display mb-1 text-2xl">Player profile</h2>
        <p className="mb-6 text-sm text-muted">The games you tick show as tags on your public profile and list you on each game&apos;s page. Officers use the rest to get to know you and build rosters.</p>
        <PlayerProfileForm
          mode="profile"
          initial={{
            game: me.game,
            gameAnswers: me.gameAnswers,
            playedGames: me.playedGames,
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
      </div>
    </>
  );
}
