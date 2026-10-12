import type { Metadata } from "next";
import Link from "next/link";
import { games, site } from "@/lib/site";
import { gameCounts } from "@/lib/games";
import { JoinCTA, gridCols } from "@/components/site/Sections";
import { GameIcon } from "@/components/site/GameTag";
import { Badge, SectionHeading } from "@/components/ui";

export const metadata: Metadata = {
  title: "Games",
  description: `The games the ${site.name} plays. Pick one to see its videos, the members who play it, and what is on the calendar.`,
};
export const dynamic = "force-dynamic";

const statusBadge = { active: "success", voting: "gold", upcoming: "neutral" } as const;
const statusLabel = { active: "Active", voting: "Member vote", upcoming: "Upcoming" } as const;

/** The game picker. Every listed game has its own page with everything the alliance does there. */
export default async function GamesPage() {
  const cards = await Promise.all(games.map(async (g) => ({ g, counts: await gameCounts(g.name) })));

  return (
    <>
      <section className="mx-auto max-w-7xl px-4 pb-8 pt-32 md:px-6 md:pt-40">
        <SectionHeading
          eyebrow="Games"
          title="Pick a game."
          text="Every game we play has its own page: the videos tagged with it, the members who play it, and anything on the calendar. Membership is about the people, not one game."
        />
      </section>

      <section className="relative border-y border-line bg-bg-2 py-16">
        <div className="bg-stripes absolute inset-0 opacity-40" />
        <ul className={`relative mx-auto grid max-w-7xl gap-4 px-4 md:px-6 ${gridCols(games.length)}`}>
          {cards.map(({ g, counts }) => (
            <li key={g.slug} className="min-w-0">
              <Link
                href={`/games/${g.slug}`}
                className={`panel cut group relative flex h-full flex-col p-6 transition hover:-translate-y-1 ${g.status === "active" ? "border-gold/40" : ""}`}
              >
                {g.status === "active" && <div className="bg-glow-accent absolute inset-0 opacity-60" />}
                <div className="relative flex flex-1 flex-col">
                  <div className="flex items-center justify-between gap-3">
                    <Badge tone={statusBadge[g.status]}>{statusLabel[g.status]}</Badge>
                    <span className="label">{g.badge}</span>
                  </div>
                  <GameIcon game={g.name} className="mt-6 h-11 w-11" />
                  <h2 className="display mt-3 text-3xl xl:text-4xl">{g.name}</h2>
                  <p className="mt-1 text-sm text-muted">{g.genre}</p>
                  <p className="mt-4 text-sm leading-relaxed text-muted">{g.desc}</p>
                  <dl className={`mt-5 grid gap-3 border-t border-line pt-4 ${site.showSchedule || counts.upcoming > 0 ? "grid-cols-3" : "grid-cols-2"}`}>
                    <div>
                      <dt className="label">Players</dt>
                      <dd className="display display-gold mt-1 text-2xl">{counts.players}</dd>
                    </div>
                    <div>
                      <dt className="label">Videos</dt>
                      <dd className="display mt-1 text-2xl">{counts.videos}</dd>
                    </div>
                    {(site.showSchedule || counts.upcoming > 0) && (
                      <div>
                        <dt className="label">Upcoming</dt>
                        <dd className="display mt-1 text-2xl">{counts.upcoming}</dd>
                      </div>
                    )}
                  </dl>
                  <p className="mt-auto pt-6 font-display text-[0.72rem] font-bold uppercase tracking-[0.2em] text-gold transition group-hover:text-gold-bright">
                    Open {g.short ?? g.name} →
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <div className="py-24">
        <JoinCTA />
      </div>
    </>
  );
}
