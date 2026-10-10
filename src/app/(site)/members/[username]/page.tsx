import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { site } from "@/lib/site";
import { formatDate } from "@/lib/format";
import { ROLE_LABEL, TIER_LABEL, type Tier, type UserRole } from "@/lib/constants";
import { folderHref } from "@/lib/media";
import { SOCIAL_PLATFORMS, parseSocials } from "@/lib/social";
import { Avatar, Badge, ButtonLink, roleTone } from "@/components/ui";
import { ArrowIcon, DiscordIcon } from "@/components/site/Icons";
import { MediaPlayer } from "@/components/site/MediaPlayer";
import { toItems } from "@/components/site/MediaFolders";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ username: string }>; searchParams: Promise<{ v?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const user = await db.user.findUnique({ where: { username }, select: { displayName: true } });
  return { title: user ? user.displayName : "Member" };
}

/** Public member profile: who they are, what they play, their social links, and the videos they posted. Every account has one. */
export default async function MemberProfilePage({ params, searchParams }: Props) {
  const { username } = await params;
  const { v } = await searchParams;
  const [user, me] = await Promise.all([
    db.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        displayName: true,
        role: true,
        tier: true,
        status: true,
        title: true,
        game: true,
        ign: true,
        gameClass: true,
        playerType: true,
        playtime: true,
        interests: true,
        games: true,
        discord: true,
        discordUsername: true,
        discordLeftAt: true,
        socials: true,
        createdAt: true,
      },
    }),
    getCurrentUser(),
  ]);
  if (!user || user.discordLeftAt) notFound();

  const parent = new URL(process.env.APP_URL || "http://localhost:3000").hostname;
  const posts = await db.mediaPost.findMany({
    where: { approved: true, official: false, postedById: user.id },
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    include: { postedBy: { select: { displayName: true } } },
  });

  // A deep link to a video that lives in another folder goes there instead of silently playing something else.
  if (v && !posts.some((p) => p.id === v)) {
    const elsewhere = await db.mediaPost.findFirst({ where: { id: v, approved: true }, include: { postedBy: { select: { username: true } } } });
    if (elsewhere) redirect(folderHref(elsewhere, v));
  }

  const inLegion = user.status === "APPROVED";
  const mine = !!me && me.id === user.id;
  const discordHandle = user.discordUsername ?? user.discord;
  const socials = parseSocials(user.socials);
  const links = SOCIAL_PLATFORMS.filter((p) => socials[p.key]);
  const interests = (user.interests ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const facts: [string, string][] = [
    ["Game", user.game ?? "—"],
    ["In-game name", user.ign ?? "—"],
    ["Class", user.gameClass ?? "—"],
    ["Player type", user.playerType ?? "—"],
    ["Playing MMOs", user.playtime ?? "—"],
    ["Other games", user.games ?? "—"],
  ];

  return (
    <>
      <section className="mx-auto max-w-7xl px-4 pb-10 pt-32 md:px-6 md:pt-40">
        <Link href="/roster" className="inline-flex items-center gap-2 font-display text-[0.72rem] font-bold uppercase tracking-[0.2em] text-gold transition hover:text-gold-bright">
          ← Roster
        </Link>
        <div className="mt-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-center">
            <Avatar name={user.displayName} size="lg" tone={roleTone(user.role)} />
            <div className="min-w-0 flex-1">
              <p className="eyebrow">{inLegion ? `${site.legionName} member` : "Community member"}</p>
              <h1 className="display mt-3 break-words text-3xl sm:text-4xl md:text-6xl">{user.displayName}</h1>
              <p className="mt-2 break-words text-sm text-muted">
                @{user.username}
                {user.title ? ` · ${user.title}` : ""} · with the alliance since {formatDate(user.createdAt)}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {inLegion && user.role !== "MEMBER" && <Badge tone={roleTone(user.role)}>{ROLE_LABEL[user.role as UserRole]}</Badge>}
                {inLegion && <Badge tone={user.tier === "ELITE" ? "gold" : user.tier === "VETERAN" ? "accent" : "neutral"}>{TIER_LABEL[user.tier as Tier] ?? user.tier}</Badge>}
                <Badge tone={inLegion ? "success" : "neutral"}>{inLegion ? "Legion" : "Community"}</Badge>
              </div>
            </div>
          </div>
          {mine && (
            <div className="flex shrink-0 flex-wrap gap-2">
              <ButtonLink href="/dashboard/profile" variant="secondary">
                Edit profile
              </ButtonLink>
              <ButtonLink href="/dashboard/media">
                Post content <ArrowIcon />
              </ButtonLink>
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-12 md:px-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
          <div className="space-y-6">
            <div className="panel cut p-6">
              <p className="eyebrow">Player</p>
              <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                {facts.map(([k, val]) => (
                  <div key={k}>
                    <dt className="label">{k}</dt>
                    <dd className="mt-1 break-words">{val}</dd>
                  </div>
                ))}
              </dl>
              {interests.length > 0 && (
                <ul className="mt-5 flex flex-wrap gap-2">
                  {interests.map((i) => (
                    <li key={i} className="border border-line-strong px-2 py-1 text-xs text-muted">
                      {i}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="panel cut p-6">
              <p className="eyebrow">Find them</p>
              {links.length === 0 && !discordHandle ? (
                <p className="mt-3 text-sm text-dim">{mine ? "Add your social links on your profile page." : "No links shared yet."}</p>
              ) : (
                <div className="mt-4 flex flex-wrap gap-2">
                  {discordHandle && (
                    <span className="cut-sm inline-flex max-w-full items-center gap-2 border border-line-strong bg-white/[0.03] px-4 py-2 font-display text-[0.72rem] font-bold uppercase tracking-[0.18em]">
                      <DiscordIcon className="h-4 w-4 shrink-0" /> <span className="truncate">{discordHandle}</span>
                    </span>
                  )}
                  {links.map((p) => (
                    <a
                      key={p.key}
                      href={socials[p.key]}
                      target="_blank"
                      rel="noreferrer"
                      className="cut-sm border border-gold/35 bg-white/[0.03] px-4 py-2 font-display text-[0.72rem] font-bold uppercase tracking-[0.18em] hover:border-gold/70"
                    >
                      {p.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="mb-4 flex items-end justify-between gap-4">
              <p className="eyebrow">Content · {posts.length}</p>
              <Link href="/media" className="font-display text-[0.7rem] font-bold uppercase tracking-[0.2em] text-gold transition hover:text-gold-bright">
                All folders →
              </Link>
            </div>
            {posts.length === 0 ? (
              <div className="panel border-dashed p-10 text-center">
                <p className="display text-2xl text-muted">Nothing posted yet</p>
                <p className="mx-auto mt-2 max-w-md text-sm text-dim">
                  {mine ? "Share YouTube or Twitch links from your portal. They show up here once an officer approves them." : `${user.displayName} has not shared any videos yet.`}
                </p>
                {mine && (
                  <div className="mt-6 flex justify-center">
                    <ButtonLink href="/dashboard/media">Post content</ButtonLink>
                  </div>
                )}
              </div>
            ) : (
              <MediaPlayer items={toItems(posts)} parent={parent} initialId={v} />
            )}
          </div>
        </div>
      </section>
    </>
  );
}
