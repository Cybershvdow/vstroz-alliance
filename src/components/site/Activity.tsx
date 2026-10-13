import Link from "next/link";
import type { ReactNode } from "react";
import { db } from "@/lib/db";
import { site } from "@/lib/site";
import { RANK_PLAIN, TIER_LABEL, type Tier } from "@/lib/constants";
import { clipOfTheWeek } from "@/lib/feed";
import { folderHref, thumbnailFor } from "@/lib/media";
import { formatDate } from "@/lib/format";
import { Badge, ButtonLink, SectionHeading } from "@/components/ui";
import { LocalTime } from "@/components/forms/PlayForm";

type Item = { key: string; at: Date; href: string; tag: string; text: ReactNode };

const tierName = (t: string) => {
  const latin = TIER_LABEL[t as Tier] ?? t;
  return RANK_PLAIN[latin] ?? latin;
};

/** Home page: what has been happening (new members, clips, promotions, open votes), the clip of the week, and who is playing. */
export async function Activity() {
  const visible = { discordLeftAt: null };
  const [members, clips, promos, votes, sessions, winner] = await Promise.all([
    db.user.findMany({ where: visible, orderBy: { createdAt: "desc" }, take: 5, select: { id: true, displayName: true, username: true, createdAt: true } }),
    db.mediaPost.findMany({ where: { approved: true, OR: [{ official: true }, { postedBy: visible }] }, orderBy: { createdAt: "desc" }, take: 5, include: { postedBy: { select: { displayName: true, username: true } } } }),
    db.nomination.findMany({ where: { status: "PASSED", user: visible }, orderBy: { decidedAt: "desc" }, take: 4, include: { user: { select: { displayName: true, username: true } } } }),
    db.nomination.findMany({ where: { status: "OPEN", user: visible }, orderBy: { createdAt: "desc" }, take: 3, include: { user: { select: { displayName: true } } } }),
    db.playSession.findMany({ where: { startsAt: { gte: new Date(Date.now() - 2 * 3_600_000) }, host: visible }, orderBy: { startsAt: "asc" }, take: 3, include: { host: { select: { displayName: true } }, _count: { select: { joins: true } } } }),
    clipOfTheWeek(),
  ]);

  const items: Item[] = [
    ...members.map((m) => ({ key: `m${m.id}`, at: m.createdAt, href: `/members/${encodeURIComponent(m.username)}`, tag: "Joined", text: <>{m.displayName} joined the alliance</> })),
    ...clips.map((c) => ({ key: `c${c.id}`, at: c.createdAt, href: folderHref(c, c.id), tag: "Clip", text: <>{c.official ? site.name : c.postedBy.displayName} posted &ldquo;{c.title}&rdquo;</> })),
    ...promos.map((n) => ({ key: `p${n.id}`, at: n.decidedAt ?? n.createdAt, href: `/members/${encodeURIComponent(n.user.username)}`, tag: "Promoted", text: <>{n.user.displayName} was voted in as {tierName(n.tier)}</> })),
    ...votes.map((n) => ({ key: `v${n.id}`, at: n.createdAt, href: "/dashboard/votes", tag: "Vote open", text: <>{n.user.displayName} is up for {tierName(n.tier)}. Cast your vote</> })),
  ]
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, 7);

  if (items.length === 0 && sessions.length === 0 && !winner) return null;
  const thumb = winner ? thumbnailFor(winner.post) : null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-20 md:px-6">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <SectionHeading eyebrow="Happening now" title="Inside the alliance." />
        <ButtonLink href="/dashboard/play" variant="secondary">
          Who is playing
        </ButtonLink>
      </div>

      <div className="mt-10 grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-4">
          {winner && (
            <Link href={folderHref(winner.post, winner.post.id)} className="panel cut group block overflow-hidden transition hover:-translate-y-0.5">
              <span className="relative block aspect-video w-full bg-black">
                {thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={thumb} alt="" className="h-full w-full object-cover transition group-hover:scale-[1.03]" loading="lazy" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center font-display text-sm uppercase tracking-widest text-[#c9a8ff]">Twitch</span>
                )}
                <Badge tone="gold" className="absolute left-3 top-3">
                  Clip of the week
                </Badge>
              </span>
              <span className="block p-5">
                <span className="display block text-xl">{winner.post.title}</span>
                <span className="mt-1 block text-xs text-muted">
                  {winner.post.official ? site.name : winner.post.postedBy.displayName} · {winner.likes} {winner.likes === 1 ? "like" : "likes"} this week
                </span>
              </span>
            </Link>
          )}

          <div className="panel cut p-5">
            <p className="eyebrow">Who is playing</p>
            {sessions.length === 0 ? (
              <p className="mt-3 text-sm text-muted">
                Nobody has posted a session yet.{" "}
                <Link href="/dashboard/play" className="text-text underline underline-offset-4 hover:text-gold">
                  Post yours
                </Link>
                .
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-line">
                {sessions.map((s) => (
                  <li key={s.id}>
                    <Link href="/dashboard/play" className="flex flex-wrap items-baseline justify-between gap-x-3 py-2.5 text-sm transition hover:text-gold">
                      <span>
                        <span className="font-semibold">{s.host.displayName}</span> · {s.game}
                      </span>
                      <span className="text-xs text-muted">
                        <LocalTime iso={s.startsAt.toISOString()} /> · {s._count.joins} in
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="panel cut p-5">
          <p className="eyebrow">Latest</p>
          {items.length === 0 ? (
            <p className="mt-3 text-sm text-muted">Nothing yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {items.map((it) => (
                <li key={it.key}>
                  <Link href={it.href} className="flex items-baseline gap-3 py-3 text-sm transition hover:text-gold">
                    <span className="w-20 shrink-0 font-display text-[0.65rem] font-bold uppercase tracking-[0.16em] text-gold">{it.tag}</span>
                    <span className="min-w-0 flex-1 [overflow-wrap:anywhere]">{it.text}</span>
                    <span className="shrink-0 text-xs text-dim">{formatDate(it.at)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
