import Link from "next/link";
import { db } from "@/lib/db";
import { requireApproved } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { MATCH_TYPE_LABEL, type MatchType } from "@/lib/constants";
import { Badge, ButtonLink, EmptyState, PageHeader, statusTone } from "@/components/ui";

export default async function MatchesPage() {
  const me = await requireApproved();
  const now = new Date();

  const [upcoming, past] = await Promise.all([
    db.match.findMany({
      where: { startsAt: { gte: now }, status: { in: ["OPEN", "LOCKED"] } },
      orderBy: { startsAt: "asc" },
      include: { _count: { select: { signups: true } }, signups: { where: { userId: me.id } } },
    }),
    db.match.findMany({
      where: { OR: [{ startsAt: { lt: now } }, { status: { in: ["COMPLETED", "CANCELLED"] } }] },
      orderBy: { startsAt: "desc" },
      take: 8,
      include: { signups: { where: { userId: me.id } } },
    }),
  ]);

  return (
    <>
      <PageHeader title="Matches" text="Sign up for sieges, scrims, and training. Officers confirm the final roster." />

      {upcoming.length === 0 ? (
        <EmptyState title="Nothing scheduled" text="Check back after the next war council." />
      ) : (
        <ul className="space-y-3">
          {upcoming.map((m) => {
            const mine = m.signups[0];
            const full = !!m.maxPlayers && m._count.signups >= m.maxPlayers;
            return (
              <li key={m.id} className="panel cut grid gap-4 p-5 md:grid-cols-[1fr_auto] md:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="accent">{MATCH_TYPE_LABEL[m.type as MatchType] ?? m.type}</Badge>
                    <Badge tone={statusTone(m.status)}>{m.status}</Badge>
                    {!m.isPublic && <Badge tone="neutral">Members only</Badge>}
                    <span className="text-xs text-dim">{m.game}</span>
                  </div>
                  <Link href={`/dashboard/matches/${m.id}`} className="display mt-2 block text-3xl hover:text-accent">
                    {m.title}
                  </Link>
                  <p className="mt-1 text-sm text-muted">{formatDateTime(m.startsAt)}</p>
                  {m.description && <p className="mt-2 max-w-2xl text-sm text-muted">{m.description}</p>}
                </div>
                <div className="flex flex-col items-start gap-2 md:items-end">
                  <span className="text-sm text-muted">
                    <span className="text-text">{m._count.signups}</span>
                    {m.maxPlayers ? ` / ${m.maxPlayers}` : ""} signed up
                  </span>
                  {mine ? (
                    <div className="flex items-center gap-2">
                      <Badge tone={statusTone(mine.status)}>
                        {mine.position} · {mine.status}
                      </Badge>
                      <ButtonLink href={`/dashboard/matches/${m.id}`} size="sm" variant="secondary">
                        Manage
                      </ButtonLink>
                    </div>
                  ) : (
                    <ButtonLink href={`/dashboard/matches/${m.id}`} size="sm" variant={m.status === "OPEN" && !full ? "primary" : "secondary"}>
                      {m.status !== "OPEN" ? "View" : full ? "Full · view" : "Sign up"}
                    </ButtonLink>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {past.length > 0 && (
        <>
          <h2 className="display mb-3 mt-12 text-2xl">Past matches</h2>
          <ul className="panel divide-y divide-line">
            {past.map((m) => (
              <li key={m.id} className="grid gap-2 px-4 py-3 md:grid-cols-[160px_1fr_auto] md:items-center">
                <span className="text-sm text-muted">{formatDateTime(m.startsAt)}</span>
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/dashboard/matches/${m.id}`} className="display text-xl hover:text-accent">
                    {m.title}
                  </Link>
                  {m.signups[0] && <Badge tone="neutral">You: {m.signups[0].position}</Badge>}
                </div>
                <span className={`font-display text-sm font-bold uppercase tracking-wider md:text-right ${m.result?.toLowerCase().includes("victory") ? "text-success" : "text-muted"}`}>
                  {m.result ?? m.status}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
