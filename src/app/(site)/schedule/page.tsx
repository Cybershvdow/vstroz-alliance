import type { Metadata } from "next";
import { db } from "@/lib/db";
import { weeklySchedule } from "@/lib/site";
import { formatDateTime } from "@/lib/format";
import { MATCH_TYPE_LABEL, type MatchType } from "@/lib/constants";
import { Badge, ButtonLink, SectionHeading, statusTone } from "@/components/ui";
import { Countdown } from "@/components/site/Countdown";

export const metadata: Metadata = { title: "Schedule" };
export const dynamic = "force-dynamic";

export default async function SchedulePage() {
  const now = new Date();
  const [upcoming, results] = await Promise.all([
    db.match.findMany({
      where: { isPublic: true, startsAt: { gte: now }, status: { in: ["OPEN", "LOCKED"] } },
      orderBy: { startsAt: "asc" },
      include: { _count: { select: { signups: { where: { status: { not: "DECLINED" } } } } } },
    }),
    db.match.findMany({
      where: { isPublic: true, status: "COMPLETED" },
      orderBy: { startsAt: "desc" },
      take: 10,
    }),
  ]);
  const next = upcoming[0];

  return (
    <section className="mx-auto max-w-7xl px-4 pb-24 pt-32 md:px-6 md:pt-40">
      <SectionHeading eyebrow="Schedule" title="Operations calendar" text="All times in UTC. Members sign up for matches from the portal." />

      {next && (
        <div className="panel panel-accent cut mt-10 grid gap-6 p-6 md:grid-cols-[1fr_auto] md:items-center md:p-8">
          <div>
            <p className="eyebrow">Next up</p>
            <h2 className="display mt-2 text-4xl">{next.title}</h2>
            <p className="mt-1 text-sm text-muted">
              {next.game} · {formatDateTime(next.startsAt)}
            </p>
          </div>
          <Countdown iso={next.startsAt.toISOString()} compact />
        </div>
      )}

      <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_320px]">
        <div>
          <h3 className="display text-2xl">Upcoming</h3>
          <ol className="mt-4 divide-y divide-line border-y border-line">
            {upcoming.length === 0 && <li className="py-8 text-center text-muted">Nothing scheduled yet.</li>}
            {upcoming.map((m) => (
              <li key={m.id} className="grid gap-3 py-5 md:grid-cols-[150px_1fr_auto] md:items-center">
                <p className="text-sm text-muted">{formatDateTime(m.startsAt)}</p>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="accent">{MATCH_TYPE_LABEL[m.type as MatchType] ?? m.type}</Badge>
                    <Badge tone={statusTone(m.status)}>{m.status}</Badge>
                    <span className="text-xs text-dim">{m.game}</span>
                  </div>
                  <p className="display mt-1.5 text-2xl">{m.title}</p>
                  {m.description && <p className="mt-1 text-sm text-muted">{m.description}</p>}
                </div>
                <p className="text-sm text-muted md:text-right">
                  <span className="text-text">{m._count.signups}</span>
                  {m.maxPlayers ? ` / ${m.maxPlayers}` : ""} signed up
                </p>
              </li>
            ))}
          </ol>

          <h3 className="display mt-14 text-2xl">Recent results</h3>
          <ol className="mt-4 divide-y divide-line border-y border-line">
            {results.length === 0 && <li className="py-8 text-center text-muted">No results posted yet.</li>}
            {results.map((m) => (
              <li key={m.id} className="grid gap-2 py-4 md:grid-cols-[150px_1fr_auto] md:items-center">
                <p className="text-sm text-muted">{formatDateTime(m.startsAt)}</p>
                <div>
                  <Badge tone="neutral">{MATCH_TYPE_LABEL[m.type as MatchType] ?? m.type}</Badge>
                  <p className="display mt-1.5 text-xl">{m.title}</p>
                </div>
                <p className={`font-display text-lg font-bold uppercase tracking-wider md:text-right ${m.result?.toLowerCase().includes("victory") ? "text-success" : "text-muted"}`}>
                  {m.result ?? "Completed"}
                </p>
              </li>
            ))}
          </ol>
        </div>

        <aside>
          <h3 className="display text-2xl">Weekly rhythm</h3>
          <ul className="panel mt-4 divide-y divide-line">
            {weeklySchedule.map((d) => (
              <li key={d.day} className="flex gap-4 px-4 py-3">
                <span className="display w-10 text-lg text-accent">{d.day}</span>
                <span className="text-sm text-muted">{d.activity}</span>
              </li>
            ))}
          </ul>
          <ButtonLink href="/register" className="mt-6 w-full">
            Join the alliance
          </ButtonLink>
        </aside>
      </div>
    </section>
  );
}
