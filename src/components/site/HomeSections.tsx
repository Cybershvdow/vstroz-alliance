import Link from "next/link";
import { gridCols } from "@/components/site/Sections";
import { db } from "@/lib/db";
import { site, games, identity } from "@/lib/site";
import { ENABLED_GAMES, ROLE_LABEL, TIER_LABEL, type UserRole } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { thumbnailFor, folderHref } from "@/lib/media";
import { Avatar, Badge, ButtonLink, SectionHeading, roleTone } from "@/components/ui";
import { ArrowIcon, DiscordIcon } from "./Icons";

/* ---------------- Teams grid (Team Liquid "divisions" pattern) ---------------- */

const statusBadge = { active: "success", voting: "gold", upcoming: "neutral" } as const;
const statusLabel = { active: "Active", voting: "Member vote", upcoming: "Upcoming" } as const;

export async function TeamsGrid() {
  const counts = await Promise.all(
    ENABLED_GAMES.map(async (g) => ({
      name: g.name,
      elite: await db.user.count({ where: { status: "APPROVED", tier: "ELITE", OR: [{ game: g.name }, { game: null }] } }),
      members: await db.user.count({ where: { status: "APPROVED", OR: [{ game: g.name }, { game: null }] } }),
    })),
  );

  return (
    <section className="relative border-y border-line bg-bg-2 py-24">
      <div className="bg-stripes absolute inset-0 opacity-40" />
      <div className="relative mx-auto max-w-7xl px-4 md:px-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <SectionHeading eyebrow="Divisions" title="Ride under the banner." text="One competitive division per game. Every division has a tried-out roster, a schedule, and a seat at The Round Table." />
          <ButtonLink href="/games" variant="secondary">
            All games <ArrowIcon />
          </ButtonLink>
        </div>
        <div className={`mt-12 grid gap-4 ${gridCols(games.length)}`}>
          {games.map((g) => {
            const c = counts.find((x) => x.name === g.name);
            const active = g.status === "active";
            return (
              <article key={g.slug} className={`panel cut group relative flex flex-col p-6 transition hover:-translate-y-1 ${active ? "border-gold/40" : ""}`}>
                {active && <div className="bg-glow-accent absolute inset-0 opacity-60" />}
                <div className="relative flex flex-1 flex-col">
                  <div className="flex items-center justify-between">
                    <Badge tone={statusBadge[g.status]}>{statusLabel[g.status]}</Badge>
                    <span className="label">{g.badge}</span>
                  </div>
                  <h3 className="display mt-6 text-4xl">{g.name}</h3>
                  <p className="mt-1 text-sm text-muted">{g.genre}</p>
                  <p className="mt-4 text-sm leading-relaxed text-muted">{g.desc}</p>
                  {active && c && (
                    <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-line pt-4">
                      <div>
                        <dt className="label">Roster</dt>
                        <dd className="display display-gold mt-1 text-2xl">{c.elite}</dd>
                      </div>
                      <div>
                        <dt className="label">Members</dt>
                        <dd className="display mt-1 text-2xl">{c.members}</dd>
                      </div>
                      <div>
                        <dt className="label">Tryouts</dt>
                        <dd className="mt-1 text-sm text-success">Open</dd>
                      </div>
                    </dl>
                  )}
                  <ul className="mt-5 flex flex-wrap gap-2">
                    {g.focus.map((f) => (
                      <li key={f} className="border border-line-strong px-2 py-1 text-xs text-muted">
                        {f}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto pt-6">
                    <Link href="/games" className="font-display text-[0.72rem] font-bold uppercase tracking-[0.2em] text-gold transition group-hover:text-gold-bright">
                      Learn more →
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Community tiles (join + socials) ---------------- */

const SOCIAL_LABEL: Record<string, string> = { youtube: "YouTube", twitch: "Twitch", tiktok: "TikTok", x: "X", instagram: "Instagram" };

export async function CommunityTiles() {
  const memberCount = await db.user.count({ where: { status: "APPROVED" } });
  const socials = Object.entries(site.social).filter(([, url]) => url);
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="panel cut relative overflow-hidden p-8 md:p-10">
          <div className="bg-glow-accent ember absolute inset-0 opacity-70" />
          <div className="relative">
            <p className="eyebrow">Community</p>
            <h2 className="display mt-3 text-3xl md:text-4xl">The crew lives on Discord.</h2>
            <p className="mt-3 max-w-lg text-sm text-muted md:text-base">{identity.audience} Events are called there, votes are announced there, and every applicant gets their intro there.</p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <a href={site.discordInvite} target="_blank" rel="noreferrer" className="cut-sm inline-flex items-center gap-2 bg-[#5865F2] px-6 py-3 font-display text-[0.8rem] font-bold uppercase tracking-[0.16em] text-white hover:brightness-110">
                <DiscordIcon className="h-4 w-4" /> Join the Discord
              </a>
              <span className="text-sm text-muted">
                <span className="display display-gold text-2xl">{memberCount}</span> approved members
              </span>
            </div>
          </div>
        </div>
        <div className="panel cut flex flex-col justify-between p-8">
          <div>
            <p className="eyebrow">Follow the banner</p>
            <h2 className="display mt-3 text-2xl">Highlights, streams, guides.</h2>
            <p className="mt-2 text-sm text-muted">Member content and official uploads land on the Media page.</p>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {socials.length === 0 && <span className="text-xs text-dim">Channels announced at launch.</span>}
            {socials.map(([k, url]) => (
              <a key={k} href={url} target="_blank" rel="noreferrer" className="cut-sm border border-gold/35 bg-white/[0.03] px-4 py-2 font-display text-[0.7rem] font-bold uppercase tracking-[0.18em] hover:border-gold/70">
                {SOCIAL_LABEL[k] ?? k}
              </a>
            ))}
            <ButtonLink href="/media" variant="secondary" size="sm">
              Media <ArrowIcon />
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Latest content (OpTic / Sentinels video feed) ---------------- */

export async function LatestContent() {
  const posts = await db.mediaPost.findMany({ where: { approved: true }, orderBy: [{ featured: "desc" }, { createdAt: "desc" }], take: 3, include: { postedBy: { select: { displayName: true, username: true } } } });
  if (posts.length === 0) return null;
  return (
    <section className="mx-auto max-w-7xl px-4 py-24 md:px-6">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <SectionHeading eyebrow="Latest content" title="From the front line." />
        <ButtonLink href="/media" variant="secondary">
          All media <ArrowIcon />
        </ButtonLink>
      </div>
      <ul className="mt-12 grid gap-4 md:grid-cols-3">
        {posts.map((p) => {
          const thumb = thumbnailFor(p);
          return (
            <li key={p.id} className="panel cut group overflow-hidden transition hover:-translate-y-1">
              <Link href={folderHref(p, p.id)} className="block">
                <span className="relative block aspect-video w-full bg-black">
                  {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={thumb} alt="" className="h-full w-full object-cover transition group-hover:scale-[1.03]" loading="lazy" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center font-display text-sm uppercase tracking-widest text-[#c9a8ff]">Twitch</span>
                  )}
                  {(p.official || p.featured) && (
                    <Badge tone="gold" className="absolute left-3 top-3">
                      {p.official ? "Official" : "Featured"}
                    </Badge>
                  )}
                </span>
                <span className="block p-5">
                  <span className="text-xs text-muted">
                    {p.official ? site.name : p.postedBy.displayName} · {formatDate(p.createdAt)}
                    {p.game ? ` · ${p.game}` : ""}
                  </span>
                  <span className="display mt-2 block text-xl">{p.title}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/* ---------------- Command (Vitality-style cards) ---------------- */

export async function Command() {
  const leaders = await db.user.findMany({
    where: { status: "APPROVED", role: { in: ["LEADER", "OFFICER"] } },
    orderBy: [{ createdAt: "asc" }],
    select: { id: true, displayName: true, role: true, title: true, tier: true, gameClass: true, game: true },
  });
  leaders.sort((a, b) => (a.role === "LEADER" ? -1 : b.role === "LEADER" ? 1 : 0));

  return (
    <section className="relative border-y border-line bg-bg-2 py-24">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <SectionHeading eyebrow="Command" title="The Round Table." text="Every General and Captain has a seat. Orders, votes, and disputes are settled here, on the record." />
          <ButtonLink href="/roster" variant="secondary">
            Full roster <ArrowIcon />
          </ButtonLink>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {leaders.map((l) => (
            <div key={l.id} className={`panel cut group relative overflow-hidden p-6 transition hover:-translate-y-1 ${l.role === "LEADER" ? "border-gold/50 shadow-[0_0_60px_-30px_rgba(155,77,255,0.6)]" : ""}`}>
              <div className="bg-glow-accent absolute inset-0 opacity-0 transition group-hover:opacity-60" />
              <div className="relative">
                <div className="flex items-start justify-between">
                  <Avatar name={l.displayName} size="lg" tone={roleTone(l.role)} />
                  <Badge tone={roleTone(l.role)}>{ROLE_LABEL[l.role as UserRole]}</Badge>
                </div>
                <h3 className="display mt-5 text-3xl">{l.displayName}</h3>
                <p className="mt-1 text-sm text-text">{l.title ?? ROLE_LABEL[l.role as UserRole]}</p>
                <div className="mt-4 flex flex-wrap gap-1.5 border-t border-line pt-4">
                  <Badge tone="gold">{TIER_LABEL[l.tier as keyof typeof TIER_LABEL] ?? l.tier}</Badge>
                  {l.game && <Badge tone="neutral">{l.game}</Badge>}
                  {l.gameClass && <Badge tone="neutral">{l.gameClass}</Badge>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
