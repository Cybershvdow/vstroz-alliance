import { db } from "@/lib/db";
import { requireApproved } from "@/lib/auth";
import { closeExpiredNominations } from "@/lib/ranks";
import { TIERS, TIER_LABEL, TIER_BLURB, VOTED_TIERS, VOTE_RULES, canVoteOn, type Tier } from "@/lib/constants";
import { Badge, EmptyState, PageHeader } from "@/components/ui";
import { VoteCard } from "@/components/portal/VoteCard";

export default async function VotesPage() {
  const me = await requireApproved();
  await closeExpiredNominations();

  const meFull = await db.user.findUnique({ where: { id: me.id }, select: { role: true, tier: true } });
  const include = {
    user: { select: { id: true, displayName: true, tier: true, gameClass: true, role: true } },
    nominatedBy: { select: { displayName: true } },
    votes: { include: { voter: { select: { displayName: true } } }, orderBy: { createdAt: "asc" as const } },
  };
  const [open, recent] = await Promise.all([
    db.nomination.findMany({ where: { status: "OPEN" }, orderBy: { closesAt: "asc" }, include }),
    db.nomination.findMany({ where: { status: { not: "OPEN" } }, orderBy: { decidedAt: "desc" }, take: 8, include }),
  ]);

  const myTier = meFull?.tier ?? "RECRUIT";

  return (
    <>
      <PageHeader
        title="Rank votes"
        text={`You are ${TIER_LABEL[myTier as Tier] ?? myTier}. Promotions into Veteran and Elite are decided by the players already at that rank, plus officers.`}
      />

      <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {TIERS.map((t, i) => (
          <div key={t} className={`panel p-4 ${t === myTier ? "border-gold/50" : ""}`}>
            <div className="flex items-center justify-between">
              <span className="display text-xl">{TIER_LABEL[t]}</span>
              <span className="flex items-center gap-2">
                {(VOTED_TIERS as readonly string[]).includes(t) && <Badge tone="gold">Voted</Badge>}
                {t === myTier && <Badge tone="accent">You</Badge>}
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
            <VoteCard key={n.id} nom={n} viewer={me} canVote={!!meFull && canVoteOn(meFull, n.tier)} />
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
