import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { gameBySlug, games, site } from "@/lib/site";
import { gameActivity } from "@/lib/games";
import { LEGION_GAMES, MATCH_TYPE_LABEL, type MatchType } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";
import { avatarUrl } from "@/lib/avatar";
import { Avatar, Badge, ButtonLink, EmptyState } from "@/components/ui";
import { GameIcon } from "@/components/site/GameTag";
import { MediaPlayer, type MediaItem } from "@/components/site/MediaPlayer";
import { DiscordButton } from "@/components/site/DiscordButton";
import { JoinCTA } from "@/components/site/Sections";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ v?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const game = gameBySlug(slug);
  if (!game) return { title: "Games" };
  return { title: game.name, description: `What the ${site.name} does in ${game.name}: videos, the members who play it, and upcoming events.` };
}

/**
 * One game: everything the alliance does there. Videos tagged with the game, members who ticked it on their
 * profile, and public events scheduled for it all land here on their own; nothing is curated by hand.
 */
export default async function GamePage({ params, searchParams }: Props) {
  const [{ slug }, { v }] = await Promise.all([params, searchParams]);
  const game = gameBySlug(slug);
  if (!game) notFound();

  const { players, posts, upcoming, upcomingTotal, results } = await gameActivity(game.name);
  const parent = new URL(process.env.APP_URL || "http://localhost:3000").hostname;
  const isLegionGame = LEGION_GAMES.some((g) => g.name === game.name);
  const short = game.short ?? game.name;

  const items: MediaItem[] = posts.map((p) => ({
    id: p.id,
    title: p.title,
    provider: p.provider,
    embedId: p.embedId,
    kind: p.kind,
    description: p.description,
    game: p.game,
    postedBy: p.official ? site.name : p.postedBy.displayName,
    createdAt: p.createdAt.toISOString(),
    featured: p.featured,
  }));

  const stats: [string, number][] = [
    ["Players", players.length],
    ["Videos", posts.length],
    ...(site.showSchedule || upcomingTotal > 0 ? ([["Upcoming", upcomingTotal]] as [string, number][]) : []),
  ];

  return (
    <>
      <section className="mx-auto max-w-7xl px-4 pb-10 pt-32 md:px-6 md:pt-40">
        <Link href="/games" className="-my-3 inline-flex items-center gap-2 py-3 font-display text-[0.72rem] font-bold uppercase tracking-[0.2em] text-gold transition hover:text-gold-bright">
          ← All games
        </Link>

        {/* Switch game without going back to the list. */}
        <nav aria-label="Games" className="mt-6 flex flex-wrap gap-2">
          {games.map((g) => {
            const current = g.slug === game.slug;
            return (
              <Link
                key={g.slug}
                href={`/games/${g.slug}`}
                aria-current={current ? "page" : undefined}
                className={`cut-sm inline-flex items-center gap-2 border px-3 py-1.5 font-display text-sm font-bold uppercase tracking-[0.12em] transition ${current ? "border-gold/70 bg-gold/10 text-text" : "border-line-strong text-muted hover:border-text hover:text-text"}`}
              >
                <GameIcon game={g.name} className="h-5 w-5" />
                {g.short ?? g.name}
              </Link>
            );
          })}
        </nav>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1.4fr_0.9fr] lg:items-end">
          <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-start">
            <GameIcon game={game.name} className="h-16 w-16 sm:h-20 sm:w-20" />
            <div className="min-w-0 flex-1">
              <p className="eyebrow">
                {game.badge} · {game.genre}
              </p>
              <h1 className="display mt-3 break-words text-4xl md:text-6xl">{game.name}</h1>
              <p className="mt-4 max-w-2xl text-muted">{game.desc}</p>
              <ul className="mt-5 flex flex-wrap gap-2">
                {game.focus.map((f) => (
                  <li key={f} className="border border-line-strong px-2 py-1 text-xs text-muted">
                    {f}
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex flex-wrap gap-2">
                {isLegionGame ? (
                  <ButtonLink href="/dashboard/legion">Apply to the {site.legionName}</ButtonLink>
                ) : (
                  <DiscordButton href={site.discordInvite} external>
                    Squad up in Discord
                  </DiscordButton>
                )}
                <ButtonLink href="/dashboard/media" variant="secondary">
                  Post {short} content
                </ButtonLink>
              </div>
            </div>
          </div>

          <dl className={`panel grid divide-x divide-line ${stats.length === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
            {stats.map(([label, value]) => (
              <div key={label} className="p-4 text-center">
                <dt className="label">{label}</dt>
                <dd className="display display-gold mt-1 text-3xl">{value}</dd>
              </div>
            ))}
            {game.facts.map(([k, val]) => (
              <div key={k} className="col-span-full flex items-center justify-between gap-4 border-t border-line px-4 py-3 text-sm">
                <dt className="label">{k}</dt>
                <dd className="text-right">{val}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ---------- Content tagged with this game ---------- */}
      <section aria-labelledby="game-content" className="mx-auto max-w-7xl px-4 pb-16 md:px-6">
        <div className="flex items-end justify-between gap-6 border-b border-line pb-3">
          <h2 id="game-content" className="display text-2xl">
            {short} content
          </h2>
          <Link href="/media" className="-my-2 inline-block py-2 font-display text-[0.7rem] font-bold uppercase tracking-[0.2em] text-gold transition hover:text-gold-bright">
            All media →
          </Link>
        </div>
        <div className="mt-6">
          {items.length === 0 ? (
            <EmptyState
              title={`No ${short} videos yet`}
              text={`Post a YouTube or Twitch link and pick ${game.name} as the game. It shows up here once an officer approves it.`}
              action={
                <ButtonLink href="/dashboard/media" variant="secondary">
                  Post {short} content
                </ButtonLink>
              }
            />
          ) : (
            <MediaPlayer items={items} parent={parent} initialId={v} />
          )}
        </div>
      </section>

      {/* ---------- Members who play it ---------- */}
      <section aria-labelledby="game-players" className="mx-auto max-w-7xl px-4 pb-16 md:px-6">
        <div className="flex items-end justify-between gap-6 border-b border-line pb-3">
          <h2 id="game-players" className="display flex items-baseline gap-3 text-2xl">
            Who plays {short}
            <span className="font-sans text-sm font-normal normal-case tracking-normal text-muted">{players.length}</span>
          </h2>
          <Link href="/roster" className="-my-2 inline-block py-2 font-display text-[0.7rem] font-bold uppercase tracking-[0.2em] text-gold transition hover:text-gold-bright">
            Full roster →
          </Link>
        </div>
        {players.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              title={`Nobody has tagged ${short} yet`}
              text={`Tick ${game.name} under "Games you play" on your profile and you show up here.`}
              action={
                <ButtonLink href="/dashboard/profile#player-profile" variant="secondary">
                  Pick your games
                </ButtonLink>
              }
            />
          </div>
        ) : (
          <ul aria-labelledby="game-players" className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {players.map((m) => (
              <li key={m.id} className="min-w-0">
                <Link
                  href={`/members/${encodeURIComponent(m.username)}`}
                  className="cut-sm flex min-w-0 items-center gap-3 border border-line-strong bg-white/[0.02] px-3 py-2.5 transition hover:border-text"
                >
                  <Avatar name={m.displayName} size="sm" tone={m.rank.tone} src={avatarUrl(m)} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-display font-bold uppercase tracking-wider">{m.displayName}</span>
                    {m.title && <span className="block truncate text-xs text-muted">{m.title}</span>}
                  </span>
                  <Badge tone={m.rank.tone}>{m.rank.label}</Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ---------- What is on the calendar (hidden while the alliance is only recruiting and nothing is posted) ---------- */}
      {(site.showSchedule || upcoming.length > 0 || results.length > 0) && (
      <section aria-labelledby="game-schedule" className="mx-auto max-w-7xl px-4 pb-24 md:px-6">
        <div className="flex items-end justify-between gap-6 border-b border-line pb-3">
          <h2 id="game-schedule" className="display text-2xl">
            {short} schedule
          </h2>
          <Link href="/schedule" className="-my-2 inline-block py-2 font-display text-[0.7rem] font-bold uppercase tracking-[0.2em] text-gold transition hover:text-gold-bright">
            Full schedule →
          </Link>
        </div>
        <ol className="divide-y divide-line border-b border-line">
          {upcoming.length === 0 && <li className="py-8 text-center text-muted">Nothing scheduled for {game.name} yet.</li>}
          {upcoming.map((m) => (
            <li key={m.id} className="grid gap-3 py-5 md:grid-cols-[170px_1fr_auto] md:items-center">
              <p className="text-sm text-muted">{formatDateTime(m.startsAt)}</p>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="accent">{MATCH_TYPE_LABEL[m.type as MatchType] ?? m.type}</Badge>
                  {m.game !== game.name && <span className="text-xs text-dim">{m.game}</span>}
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
        {upcomingTotal > upcoming.length && (
          <p className="mt-3 text-sm text-muted">
            {upcomingTotal - upcoming.length} more on the{" "}
            <Link href="/schedule" className="text-text underline underline-offset-4 hover:text-gold">
              full schedule
            </Link>
            .
          </p>
        )}

        {results.length > 0 && (
          <>
            <h3 className="display mt-10 text-xl">Recent results</h3>
            <ol className="mt-3 divide-y divide-line border-y border-line">
              {results.map((m) => (
                <li key={m.id} className="grid gap-2 py-4 md:grid-cols-[170px_1fr_auto] md:items-center">
                  <p className="text-sm text-muted">{formatDateTime(m.startsAt)}</p>
                  <p className="display text-xl">{m.title}</p>
                  <p className={`font-display text-lg font-bold uppercase tracking-wider md:text-right ${m.result?.toLowerCase().includes("victory") ? "text-success" : "text-muted"}`}>
                    {m.result ?? "Completed"}
                  </p>
                </li>
              ))}
            </ol>
          </>
        )}
      </section>
      )}

      <div className="pb-24">
        <JoinCTA />
      </div>
    </>
  );
}
