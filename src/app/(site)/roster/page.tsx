import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { site } from "@/lib/site";
import { ALL_RANKS, allianceRank, playedGamesOf, specialtiesOf } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { avatarUrl } from "@/lib/avatar";
import { Avatar, Badge, SectionHeading } from "@/components/ui";
import { GameTag } from "@/components/site/GameTag";

export const metadata: Metadata = {
  title: "Roster",
  description: `Everyone in the ${site.name}, grouped by rank. Game tags show what each member plays.`,
};
export const dynamic = "force-dynamic";

/** The ranks in roster order: the key under the heading, and one section each. */
const RANKS = ALL_RANKS;

/**
 * The whole alliance on one page, broken up by rank, highest first. Nothing is split by game: each card carries
 * the member's game tags, and their profile has the detail. Every account is listed, in the legion or not;
 * only accounts hidden because they left the Discord stay off.
 */
export default async function RosterPage() {
  const [members, mediaCounts] = await Promise.all([
    db.user.findMany({
      where: { discordLeftAt: null },
      select: { id: true, username: true, displayName: true, game: true, playedGames: true, role: true, tier: true, title: true, specialties: true, createdAt: true, avatarAt: true },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    }),
    db.mediaPost.groupBy({ by: ["postedById"], where: { approved: true, official: false }, _count: { _all: true } }),
  ]);

  // One group per rank that has members. Within a rank, whoever joined earliest comes first (the query order).
  const ranked = members.map((m) => ({ ...m, rank: allianceRank(m) }));
  const groups = RANKS.map((rank) => ({ rank, heading: rank.full, members: ranked.filter((m) => m.rank.order === rank.order) })).filter((g) => g.members.length > 0);
  const videos = new Map(mediaCounts.map((x) => [x.postedById, x._count._all]));
  const total = ranked.length;

  return (
    <section className="mx-auto max-w-7xl px-4 pb-24 pt-32 md:px-6 md:pt-40">
      <SectionHeading
        eyebrow="Roster"
        title={site.name}
        text={`${total} in the alliance, grouped by rank. Command is appointed, the ranks are earned, and new sign-ups start as a Recruit (Tiro). The tags show the games each one plays. Open a profile for the full picture.`}
      />

      <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2">
        <p id="rank-key" className="label">
          Ranks, highest first
        </p>
        <ol aria-labelledby="rank-key" className="flex flex-wrap items-center gap-1.5">
          {RANKS.map((r) => (
            <li key={r.label}>
              <Badge tone={r.tone}>{r.full}</Badge>
            </li>
          ))}
        </ol>
      </div>

      {groups.map((g) => (
        <div key={g.rank.label} className="mt-12">
          <h2 id={`rank-${g.rank.order}`} className="display flex items-baseline gap-3 border-b border-line pb-3 text-2xl">
            {g.heading}
            <span className="font-sans text-sm font-normal normal-case tracking-normal text-muted">{g.members.length}</span>
          </h2>
          <ul aria-labelledby={`rank-${g.rank.order}`} className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {g.members.map((m) => {
              const tags = playedGamesOf(m);
              const clips = videos.get(m.id) ?? 0;
              return (
                <li key={m.id} className="min-w-0">
                  <Link
                    href={`/members/${encodeURIComponent(m.username)}`}
                    className={`panel cut flex h-full min-w-0 items-center gap-4 p-4 transition hover:-translate-y-0.5 ${m.rank.tone === "gold" ? "border-gold/50" : m.rank.tone === "accent" ? "border-accent/40" : ""}`}
                  >
                    <Avatar name={m.displayName} tone={m.rank.tone} src={avatarUrl(m)} />
                    <div className="min-w-0 flex-1">
                      <p className="display min-w-0 text-xl [overflow-wrap:anywhere]">{m.displayName}</p>
                      {m.title && <p className="truncate text-xs text-muted">{m.title}</p>}
                      {specialtiesOf(m).length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {specialtiesOf(m).map((s) => (
                            <Badge key={s.key} tone="cyan">
                              {s.plain} ({s.label})
                            </Badge>
                          ))}
                        </div>
                      )}
                      {tags.length > 0 ? (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {tags.map((t) => (
                            <GameTag key={t} game={t} compact />
                          ))}
                        </div>
                      ) : (
                        <p className="mt-1 text-xs text-muted">No games picked yet</p>
                      )}
                      <p className="mt-1 text-[0.7rem] text-dim">
                        Since {formatDate(m.createdAt)}
                        {clips > 0 && (
                          <span className="text-gold">
                            {" · "}
                            {clips} {clips === 1 ? "video" : "videos"}
                          </span>
                        )}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      {total === 0 && <p className="py-10 text-center text-muted">No members yet.</p>}

      <p className="mt-10 text-sm text-muted">
        On the roster?{" "}
        <Link href="/dashboard/profile#profile-picture" className="text-text underline underline-offset-4 hover:text-gold">
          Sign in to add or change your profile picture
        </Link>
        . It shows here and on your profile.
      </p>
    </section>
  );
}
