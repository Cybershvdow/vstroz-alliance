import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { site } from "@/lib/site";
import { GAME_CLASSES, ROLE_LABEL, playedGamesOf, type UserRole } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { Avatar, Badge, SectionHeading, roleTone } from "@/components/ui";
import { GameTag } from "@/components/site/GameTag";

export const metadata: Metadata = { title: "Roster" };
export const dynamic = "force-dynamic";

const ROLE_ORDER: Record<string, number> = { LEADER: 0, OFFICER: 1, MEMBER: 2 };
const TIER_ORDER: Record<string, number> = { ELITE: 0, VETERAN: 1, MEMBER: 2, RECRUIT: 3 };

/** Everyone in the alliance. The Vstroz Legion (the Aion guild) is listed first; every other member follows with their game tags. */
export default async function RosterPage({ searchParams }: { searchParams: Promise<{ cls?: string }> }) {
  const { cls } = await searchParams;
  const filter = cls && (GAME_CLASSES as readonly string[]).includes(cls) ? cls : undefined;

  const [legion, legionTotal, counts, alliance, mediaCounts] = await Promise.all([
    db.user.findMany({
      where: { status: "APPROVED", ...(filter ? { gameClass: filter } : {}) },
      select: { id: true, username: true, displayName: true, ign: true, game: true, playedGames: true, gameClass: true, role: true, tier: true, title: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    db.user.count({ where: { status: "APPROVED" } }),
    db.user.groupBy({ by: ["gameClass"], where: { status: "APPROVED" }, _count: { _all: true } }),
    db.user.findMany({
      where: { status: { not: "APPROVED" }, discordLeftAt: null },
      select: { id: true, username: true, displayName: true, game: true, playedGames: true },
      orderBy: { createdAt: "desc" },
    }),
    db.mediaPost.groupBy({ by: ["postedById"], where: { approved: true, official: false }, _count: { _all: true } }),
  ]);
  legion.sort((a, b) => ROLE_ORDER[a.role] - ROLE_ORDER[b.role] || TIER_ORDER[a.tier] - TIER_ORDER[b.tier]);
  const countFor = (c: string) => counts.find((x) => x.gameClass === c)?._count._all ?? 0;
  const videosBy = (id: string) => mediaCounts.find((x) => x.postedById === id)?._count._all ?? 0;
  const total = legionTotal + alliance.length;

  return (
    <section className="mx-auto max-w-7xl px-4 pb-24 pt-32 md:px-6 md:pt-40">
      <SectionHeading
        eyebrow="Roster"
        title="The alliance"
        text={`${total} ${total === 1 ? "member" : "members"}. ${legionTotal} in the ${site.legionName}, our ${site.legionGame} guild. Game tags show what everyone plays.`}
      />

      {/* ---------- The legion (Aion) ---------- */}
      <h2 className="display mt-12 text-2xl">
        {site.legionName} <span className="text-muted">· {site.legionGame}</span>
      </h2>
      <p className="label mb-2 mt-5">Filter by {site.legionGame} class</p>
      <div className="flex flex-wrap gap-2">
        <Link href="/roster" className={`cut-sm border px-3 py-1.5 font-display text-sm font-bold uppercase tracking-[0.12em] ${!filter ? "border-accent bg-accent text-white" : "border-line-strong text-muted hover:text-text"}`}>
          All
        </Link>
        {GAME_CLASSES.filter((c) => c !== "Undecided").map((c) => (
          <Link
            key={c}
            href={`/roster?cls=${encodeURIComponent(c)}`}
            className={`cut-sm border px-3 py-1.5 font-display text-sm font-bold uppercase tracking-[0.12em] ${filter === c ? "border-accent bg-accent text-white" : "border-line-strong text-muted hover:text-text"}`}
          >
            {c} <span className="opacity-60">{countFor(c)}</span>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {legion.map((m) => {
          const tags = playedGamesOf(m);
          return (
            <Link
              key={m.id}
              href={`/members/${encodeURIComponent(m.username)}`}
              className={`panel cut flex min-w-0 items-center gap-4 p-4 transition hover:-translate-y-0.5 ${m.role === "LEADER" ? "border-gold/50" : m.role === "OFFICER" ? "border-accent/40" : ""}`}
            >
              <Avatar name={m.displayName} tone={roleTone(m.role)} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <p className="display min-w-0 text-xl [overflow-wrap:anywhere]">{m.displayName}</p>
                  {m.role !== "MEMBER" && <Badge tone={roleTone(m.role)}>{ROLE_LABEL[m.role as UserRole]}</Badge>}
                  {m.tier === "ELITE" && <Badge tone="gold">Elite</Badge>}
                  {m.tier === "VETERAN" && <Badge tone="accent">Veteran</Badge>}
                </div>
                <p className="truncate text-xs text-muted">{[tags.includes(site.legionGame) ? m.gameClass : null, m.title].filter(Boolean).join(" · ") || "Legion member"}</p>
                {tags.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {tags.map((t) => (
                      <GameTag key={t} game={t} compact />
                    ))}
                  </div>
                )}
                <p className="mt-1 text-[0.7rem] text-dim">
                  Since {formatDate(m.createdAt)}
                  {videosBy(m.id) > 0 && (
                    <span className="text-gold">
                      {" · "}
                      {videosBy(m.id)} {videosBy(m.id) === 1 ? "video" : "videos"}
                    </span>
                  )}
                </p>
              </div>
            </Link>
          );
        })}
        {legion.length === 0 && <p className="col-span-full py-10 text-center text-muted">No legion members match that filter.</p>}
      </div>

      {/* ---------- Everyone else in the alliance ---------- */}
      {alliance.length > 0 && (
        <>
          <h2 className="display mt-16 text-2xl">
            Alliance members <span className="text-muted">· {alliance.length}</span>
          </h2>
          <p className="mt-1 text-sm text-muted">In the alliance, not in the legion. Click a name to see their profile and content.</p>
          <ul className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {alliance.map((c) => {
              const tags = playedGamesOf(c);
              return (
                <li key={c.id} className="min-w-0">
                  <Link
                    href={`/members/${encodeURIComponent(c.username)}`}
                    className="cut-sm flex min-w-0 items-center gap-3 border border-line-strong bg-white/[0.02] px-3 py-2 text-sm transition hover:border-text"
                  >
                    <Avatar name={c.displayName} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-display font-bold uppercase tracking-wider">{c.displayName}</span>
                      {tags.length > 0 ? (
                        <span className="mt-1 flex flex-wrap gap-1">
                          {tags.map((t) => (
                            <GameTag key={t} game={t} compact />
                          ))}
                        </span>
                      ) : (
                        <span className="block truncate text-xs text-muted">No games picked yet</span>
                      )}
                    </span>
                    {videosBy(c.id) > 0 && <span className="shrink-0 text-xs text-gold">{videosBy(c.id)} ▶</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}
