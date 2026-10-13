import { guildRankOf } from "@/lib/constants";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { site } from "@/lib/site";
import { formatDate } from "@/lib/format";
import { Badge, ButtonLink, Card, PageHeader } from "@/components/ui";
import { DiscordIcon } from "@/components/site/Icons";
import { PlayerProfileForm } from "@/components/forms/PlayerProfileForm";
import { ClearDraft } from "@/components/forms/DraftNotice";
import { DiscordButton } from "@/components/site/DiscordButton";
import { discordConfigured } from "@/lib/discord";

/**
 * The Vstroz Legion page. An account makes you part of the alliance; the legion is the Aion guild you apply to.
 * Four states: not applied, under review, in the legion, declined.
 */
export default async function LegionPage({ searchParams }: { searchParams: Promise<{ submitted?: string }> }) {
  const me = await requireUser();
  const { submitted } = await searchParams;
  const inLegion = me.status === "APPROVED";
  const denied = me.status === "DENIED";
  const applied = !!me.appliedAt;
  const needsDiscord = discordConfigured() && !me.discordId && !inLegion;

  const initial = {
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
  };

  const title = inLegion
    ? `You're in the ${site.legionName}`
    : denied
      ? "Legion application declined"
      : applied
        ? "Legion application under review"
        : `Join the ${site.legionName}`;
  const text = inLegion
    ? "Match signups and guild roles are open to you. Keep your player profile current so officers can build rosters."
    : denied
      ? "An officer reviewed your application and did not approve it for the legion. You are still part of the Vstroz Alliance and you keep your rank. Discord, media, and The Round Table stay open to you."
      : applied
        ? "Your application is in the officer queue. Most reviews happen within 48 hours. You can update your answers below until it is reviewed."
        : `You are already in the alliance and you hold your rank there. The ${site.legionName} is our guild in ${site.legionGame}: join it in-game, fill in the application, and an officer reviews it within 48 hours. It unlocks match signups and guild roles. Don't play ${site.legionGame}? Skip this. Your rank does not depend on it.`;

  return (
    <>
      <PageHeader
        title={title}
        text={text}
        actions={inLegion ? <ButtonLink href="/dashboard/matches">Match signups</ButtonLink> : <ButtonLink href="/dashboard/profile" variant="secondary">Pick your games</ButtonLink>}
      />

      {submitted && (
        <>
          <ClearDraft names={["player-apply", "player-profile"]} scope={me.username} />
          <div className="panel mb-6 border-success/50 p-4 text-sm">
            <span className="font-semibold text-success">Application submitted.</span> An officer reviews it within 48 hours. Join the Discord so they can reach you.
          </div>
        </>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {inLegion ? (
            <Card accent>
              <Badge tone="success">In the legion · {guildRankOf(me)?.label}</Badge>
              <p className="mt-4 text-sm text-muted">
                {me.ign ? `In-game name: ${me.ign}` : "No in-game name set yet"}
                {me.gameClass ? ` · ${me.gameClass}` : ""}
                {me.game ? ` · ${me.game}` : ""}
              </p>
              <p className="mt-1 text-sm text-muted">
                Update these on your{" "}
                <Link href="/dashboard/profile" className="text-gold hover:underline">
                  profile
                </Link>
                .
              </p>
            </Card>
          ) : denied ? (
            <Card>
              <Badge tone="danger">Declined</Badge>
              {me.reviewNote && (
                <div className="mt-4 border border-line bg-bg-2 p-4 text-sm">
                  <p className="label mb-1">Officer note</p>
                  <p>{me.reviewNote}</p>
                </div>
              )}
              <p className="mt-4 text-sm text-muted">If you think this was a mistake, reach out to an officer in Discord.</p>
            </Card>
          ) : needsDiscord ? (
            <Card accent>
              <Badge tone="accent">Step 1 · Discord</Badge>
              <h2 className="display mt-4 text-2xl">Connect your Discord first</h2>
              <p className="mb-6 mt-2 text-sm text-muted">
                Being in the Vstroz Alliance Discord is what makes you part of the alliance, so the legion application needs your Discord
                connected to this account. Join the server if you have not, then connect.
              </p>
              <div className="flex flex-wrap gap-3">
                <DiscordButton href="/api/discord/login?link=1">Connect Discord</DiscordButton>
                <ButtonLink href={site.discordInvite} variant="secondary">
                  Join the Discord
                </ButtonLink>
              </div>
            </Card>
          ) : (
            <Card accent>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={applied ? "warning" : "accent"}>{applied ? "Under review" : "Not applied yet"}</Badge>
                {applied && me.appliedAt && <span className="text-xs text-muted">Applied {formatDate(me.appliedAt)}</span>}
              </div>
              <h2 className="display mt-4 text-2xl">{applied ? "Your application" : `${site.legionName} application`}</h2>
              <p className="mb-6 mt-1 text-sm text-muted">
                {applied
                  ? "Officers see exactly this. Edit anything and save."
                  : `What the officers review: your ${site.legionGame} character, class, and how you play. Your answers are saved as you type, so a refresh will not lose them.`}
              </p>
              <PlayerProfileForm mode="apply" submitLabel={applied ? "Update application" : undefined} initial={initial} />
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <p className="eyebrow">Discord</p>
            <p className="mt-2 text-sm text-muted">
              {inLegion ? "Voice, call-outs, and the schedule live in Discord." : "Join so an officer can reach you about your application."}
            </p>
            <a
              href={site.discordInvite}
              target="_blank"
              rel="noreferrer"
              className="cut-sm mt-4 inline-flex items-center gap-2 bg-[#5865F2] px-5 py-2.5 font-display text-sm font-bold uppercase tracking-[0.14em] text-white"
            >
              <DiscordIcon className="h-4 w-4" /> Join the Discord
            </a>
          </Card>
          <Card>
            <p className="eyebrow">Alliance vs legion</p>
            <ul className="mt-2 space-y-2 text-sm text-muted">
              <li>
                <span className="text-text">Alliance</span>: everyone with a Vstroz Alliance account, whatever they play. Everyone with an account is a Member and earns rank from there. Pick your games, post content, vote, bring disputes.
              </li>
              <li>
                <span className="text-text">{site.legionName}</span>: our guild in {site.legionGame} only. Join it in-game, then apply here; officers approve. Unlocks match signups and guild roles. It does not change your rank.
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
