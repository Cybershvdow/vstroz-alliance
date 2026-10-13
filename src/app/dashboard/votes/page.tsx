import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { closeExpiredNominations } from "@/lib/ranks";
import { RANK_PLAIN, TIERS, TIER_LABEL, TIER_BLURB, VOTED_TIERS, VOTE_RULES, allianceRank, canVoteOn } from "@/lib/constants";
import { Badge, EmptyState, PageHeader } from "@/components/ui";
import { VoteCard } from "@/components/portal/VoteCard";

export default async function VotesPage() {
  const me = await requireUser();
  await closeExpiredNominations();

  const meFull = await db.user.findUnique({ where: { id: me.id }, select: { role: true, tier: true } });
  const include = {
    user: { select: { id: true, displayName: true, tier: true, gameClass: true, role: true, avatarAt: true } },
    nominatedBy: { select: { displayName: true } },
    votes: { include: { voter: { select: { displayName: true } } }, orderBy: { createdAt: "asc" as const } },
  };
  const [open, recent] = await Promise.all([
    // Votes for members who have since left the Discord (hidden accounts) are not shown to members.
    db.nomination.findMany({ where: { status: "OPEN", user: { discordLeftAt: null } }, orderBy: { closesAt: "asc" }, include }),
    db.nomination.findMany({ where: { status: { not: "OPEN" }, user: { discordLeftAt: null } }, orderBy: { decidedAt: "desc" }, take: 8, include }),
  ]);

  const mine = meFull ?? me;
  const myTier = mine.tier;
  const rank = allianceRank(mine);
  // Captains and Generals sit above the ladder, so no tile is theirs.
  const onLadder = mine.role === "MEMBER";
  // Accounts that left the Discord are hidden and do not vote. The legion application has no say here.
  const hidden = !!me.discordLeftAt;

  return (
    <>
      <PageHeader
        title="Rank votes"
        text={
          hidden
            ? "Rejoin the Discord to vote on promotions."
            : `Your rank is ${rank.full}. Every alliance member votes on promotions into Veteran and Elite. Officers vote too. A General has the last say.`
        }
      />

      <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {TIERS.map((t, i) => (
          <div key={t} className={`panel p-4 ${onLadder && t === myTier ? "border-gold/50" : ""}`}>
            <div className="flex items-center justify-between">
              <span className="display text-xl">
                {RANK_PLAIN[TIER_LABEL[t]]} <span className="font-sans text-xs font-normal normal-case tracking-normal text-muted">({TIER_LABEL[t]})</span>
              </span>
              <span className="flex items-center gap-2">
                {(VOTED_TIERS as readonly string[]).includes(t) && <Badge tone="gold">Voted</Badge>}
                {onLadder && t === myTier && <Badge tone="accent">You</Badge>}
              </span>
            </div>
            <p className="mt-2 text-xs text-muted">{TIER_BLURB[t]}</p>
            <p className="mt-2 label">Rank {i + 1} of {TIERS.length}</p>
          </div>
        ))}
      </div>

      <h2 className="display mb-3 text-2xl">
        Open votes <span className="text-muted">({open.length})</span>
      </h2>
      {open.length === 0 ? (
        <EmptyState title="No open votes" text={`Officers open nominations. Each vote runs ${VOTE_RULES.windowHours} hours.`} />
      ) : (
        <div className="space-y-4">
          {open.map((n) => (
            <VoteCard key={n.id} nom={n} viewer={me} canVote={!hidden && !!meFull && canVoteOn(meFull, n.tier)} />
          ))}
        </div>
      )}

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
    </>
  );
}
