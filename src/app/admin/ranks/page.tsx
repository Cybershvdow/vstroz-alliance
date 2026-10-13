import { db } from "@/lib/db";
import { requireOfficer } from "@/lib/auth";
import { closeExpiredNominations } from "@/lib/ranks";
import { setTierAction } from "@/lib/actions/ranks";
import { site } from "@/lib/site";
import { TIERS, TIER_LABEL, VOTED_TIERS, VOTE_RULES, allianceRank, canVoteOn, playedGamesOf, type Tier } from "@/lib/constants";
import { Avatar, Badge, Button, Card, EmptyState, PageHeader } from "@/components/ui";
import { avatarUrl } from "@/lib/avatar";
import { VoteCard } from "@/components/portal/VoteCard";
import { NominateForm } from "@/components/forms/RankForms";

export default async function AdminRanksPage() {
  const me = await requireOfficer();
  await closeExpiredNominations();
  const isLeader = me.role === "LEADER";

  const include = {
    // discordLeftAt lets avatarUrl skip the picture of a nominee who has since left the Discord.
    user: { select: { id: true, displayName: true, tier: true, gameClass: true, role: true, avatarAt: true, discordLeftAt: true } },
    nominatedBy: { select: { displayName: true } },
    votes: { include: { voter: { select: { displayName: true } } }, orderBy: { createdAt: "asc" as const } },
  };
  const [members, open, recent] = await Promise.all([
    // Every alliance member holds a rank, in the legion or not. Accounts hidden after leaving the Discord are left out.
    db.user.findMany({ where: { discordLeftAt: null }, orderBy: { displayName: "asc" }, select: { id: true, displayName: true, tier: true, role: true, status: true, game: true, playedGames: true, avatarAt: true } }),
    db.nomination.findMany({ where: { status: "OPEN" }, orderBy: { closesAt: "asc" }, include }),
    db.nomination.findMany({ where: { status: { not: "OPEN" } }, orderBy: { decidedAt: "desc" }, take: 10, include }),
  ]);
  // Same order as the public roster: General, Captain, then the ladder from Elite down.
  const sorted = members
    .map((m) => ({ ...m, rank: allianceRank(m) }))
    .sort((a, b) => a.rank.order - b.rank.order || a.displayName.localeCompare(b.displayName));
  // The tiles count the ladder only. Generals and Captains sit above it, so their tier is not counted.
  const counts = TIERS.map((t) => [t, members.filter((m) => m.role === "MEMBER" && m.tier === t).length] as const);

  return (
    <>
      <PageHeader
        title="Ranks & votes"
        text={`Recruit → Member is an officer call. Veteran and Elite are decided by vote: ${VOTE_RULES.windowHours}h window, quorum ${VOTE_RULES.quorum}, ${Math.round(VOTE_RULES.passRatio * 100)}% yes to pass. ${isLeader ? "As a General you can close early, veto, or override a rank." : ""}`}
      />

      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {counts.map(([t, n]) => (
          <div key={t} className="panel p-4">
            <p className="label">{TIER_LABEL[t]}</p>
            <p className={`display mt-1 text-3xl ${t === "ELITE" ? "display-gold" : ""}`}>{n}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div>
          <h2 className="display mb-3 text-2xl">
            Open votes <span className="text-muted">({open.length})</span>
          </h2>
          {open.length === 0 ? (
            <EmptyState title="No open votes" text="Open a nomination on the right." />
          ) : (
            <div className="space-y-4">
              {open.map((n) => (
                <VoteCard key={n.id} nom={n} viewer={me} canVote={canVoteOn(me, n.tier)} officerControls isLeader={isLeader} />
              ))}
            </div>
          )}

          <h2 className="display mb-3 mt-12 text-2xl">Roster by rank</h2>
          <ul className="panel divide-y divide-line">
            {sorted.map((m) => (
              <li key={m.id} className="grid gap-3 px-4 py-3 md:grid-cols-[1fr_auto] md:items-center">
                <div className="flex items-center gap-3">
                  <Avatar name={m.displayName} size="sm" tone={m.rank.tone} src={avatarUrl(m)} />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="display text-lg">{m.displayName}</p>
                      <Badge tone={m.rank.tone}>{m.rank.full}</Badge>
                      {/* Command sits above the ladder, but the buttons on this page edit the tier, so it is shown here. */}
                      {m.role !== "MEMBER" && <Badge tone="neutral">Ladder: {TIER_LABEL[m.tier as Tier] ?? m.tier}</Badge>}
                      {m.status === "APPROVED" && <Badge tone="success">{site.legionName}</Badge>}
                    </div>
                    <p className="text-xs text-muted">{playedGamesOf(m).join(" · ") || "No games picked yet"}</p>
                  </div>
                </div>
                <form action={setTierAction} className="flex flex-wrap gap-1.5 md:justify-end">
                  <input type="hidden" name="userId" value={m.id} />
                  {TIERS.filter((t) => t !== m.tier && (isLeader ? m.role !== "LEADER" || m.id === me.id : m.role === "MEMBER" && !(VOTED_TIERS as readonly string[]).includes(t) && !(VOTED_TIERS as readonly string[]).includes(m.tier))).map((t) => (
                    <Button key={t} type="submit" name="tier" value={t} size="sm" variant={(VOTED_TIERS as readonly string[]).includes(t) ? "gold" : "secondary"}>
                      {(VOTED_TIERS as readonly string[]).includes(t) ? `Override → ${TIER_LABEL[t]}` : `Set ${TIER_LABEL[t]}`}
                    </Button>
                  ))}
                </form>
              </li>
            ))}
          </ul>

          {recent.length > 0 && (
            <>
              <h2 className="display mb-3 mt-12 text-2xl">Recent results</h2>
              <div className="space-y-4">
                {recent.map((n) => (
                  <VoteCard key={n.id} nom={n} viewer={me} canVote={false} />
                ))}
              </div>
            </>
          )}
        </div>

        <Card accent className="h-fit">
          <h2 className="display mb-1 text-2xl">Open a vote</h2>
          <p className="mb-4 text-xs text-muted">Nominate a member for Veteran or Elite. Eligible voters see it in their portal immediately.</p>
          <NominateForm members={members.filter((m) => m.tier !== "ELITE")} />
        </Card>
      </div>
    </>
  );
}
