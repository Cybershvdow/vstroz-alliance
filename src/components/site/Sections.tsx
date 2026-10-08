import Link from "next/link";
import { db } from "@/lib/db";
import { site, pillars, games, milestones } from "@/lib/site";
import { formatDateTime } from "@/lib/format";
import { MATCH_TYPE_LABEL, ROLE_LABEL, type MatchType, type UserRole } from "@/lib/constants";
import { Badge, ButtonLink, SectionHeading, Avatar, roleTone } from "@/components/ui";
import { Countdown } from "./Countdown";
import { ArrowIcon, DiscordIcon } from "./Icons";
import { LogoFull } from "@/components/brand/Logo";

/* ---------------- Hero ---------------- */

export async function Hero() {
  const [memberCount, nextMatch, wins] = await Promise.all([
    db.user.count({ where: { status: "APPROVED" } }),
    db.match.findFirst({
      where: { isPublic: true, status: { in: ["OPEN", "LOCKED"] }, startsAt: { gte: new Date() } },
      orderBy: { startsAt: "asc" },
      include: { _count: { select: { signups: { where: { status: { not: "DECLINED" } } } } } },
    }),
    db.match.count({ where: { status: "COMPLETED", result: { contains: "Victory" } } }),
  ]);

  return (
    <section className="relative overflow-hidden pt-18">
      <div className="bg-rays absolute inset-0" />
      <div className="bg-glow-accent ember absolute inset-0" />
      <div className="bg-grid absolute inset-0 opacity-70" />
      <div className="hero-vignette absolute inset-0" />

      <div className="relative mx-auto grid max-w-7xl gap-12 px-4 pb-20 pt-16 md:px-6 md:pt-24 lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:pb-28 lg:pt-28">
        <div>
          <p className="eyebrow rise rise-1 flex items-center gap-3">
            Est. {site.founded} · Multi-game alliance · Every player welcome
          </p>
          <h1 className="display rise rise-2 mt-7 text-5xl sm:text-6xl md:text-7xl lg:text-[5.6rem]">
            One banner.
            <br />
            <span className="display-gold">Every world.</span>
          </h1>
          <p className="rise rise-3 mt-7 max-w-xl text-base leading-relaxed text-muted md:text-lg">{site.tagline}</p>
          <div className="rise rise-4 mt-9 flex flex-wrap gap-3">
            <ButtonLink href="/register" size="lg">
              Apply to join <ArrowIcon />
            </ButtonLink>
            <a
              href={site.discordInvite}
              target="_blank"
              rel="noreferrer"
              className="cut-sm inline-flex items-center gap-2 border border-gold/35 bg-white/[0.03] px-7 py-3.5 font-display text-[0.86rem] font-bold uppercase tracking-[0.16em] text-text backdrop-blur hover:border-gold/70 hover:bg-white/[0.06]"
            >
              <DiscordIcon /> Discord
            </a>
          </div>
        </div>

        <div className="rise rise-3">
          <LogoFull className="mx-auto mb-8 h-64 w-64 drop-shadow-[0_0_70px_rgba(155,77,255,0.5)] md:h-80 md:w-80" />
          <div className="panel panel-accent cut relative p-6 md:p-8">
            <div className="flex items-center justify-between">
              <p className="eyebrow">Next match</p>
              {nextMatch && <Badge tone="accent">{MATCH_TYPE_LABEL[nextMatch.type as MatchType] ?? nextMatch.type}</Badge>}
            </div>
            {nextMatch ? (
              <>
                <h2 className="display mt-4 text-3xl md:text-4xl">{nextMatch.title}</h2>
                <p className="mt-2 text-sm text-muted">
                  {nextMatch.game} · {formatDateTime(nextMatch.startsAt)}
                </p>
                <div className="mt-6">
                  <Countdown iso={nextMatch.startsAt.toISOString()} />
                </div>
                <div className="mt-6 flex items-center justify-between border-t border-line pt-4 text-sm">
                  <span className="text-muted">
                    <span className="text-text">{nextMatch._count.signups}</span>
                    {nextMatch.maxPlayers ? ` / ${nextMatch.maxPlayers}` : ""} signed up
                  </span>
                  <Link href="/schedule" className="font-display font-bold uppercase tracking-[0.14em] text-accent hover:text-accent-hover">
                    Full schedule →
                  </Link>
                </div>
              </>
            ) : (
              <>
                <h2 className="display mt-4 text-3xl">Schedule opens soon</h2>
                <p className="mt-2 text-sm text-muted">Officers post sieges, scrims, and training here.</p>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="relative border-y border-line bg-bg-2/80 backdrop-blur">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-line md:grid-cols-4 md:divide-x">
          {[
            ["Active members", `${memberCount}`],
            ["Playing now", "Aion"],
            ["Matches won", `${wins}`],
            ["Recruiting", "Open"],
          ].map(([label, value]) => (
            <div key={label} className="px-6 py-6">
              <p className="label">{label}</p>
              <p className="display display-gold mt-1 text-2xl md:text-3xl">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Marquee ---------------- */

export function Marquee() {
  const items = ["Vstroz Alliance", "Multi-game", "Now Recruiting", "All skill levels", "Every game welcome", "Zero drama", "One banner"];
  const row = [...items, ...items];
  return (
    <div className="overflow-hidden border-b border-line bg-[linear-gradient(90deg,#0a0910,#0f0e16,#0a0910)] py-3.5">
      <div className="marquee-track flex w-max gap-12 whitespace-nowrap">
        {row.map((t, i) => (
          <span key={i} className="font-display text-[0.72rem] font-bold uppercase tracking-[0.34em] text-gold">
            {t} <span className="mx-5 text-[0.5rem] text-gold/50">◆</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Pillars ---------------- */

export function Pillars() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-24 md:px-6">
      <SectionHeading eyebrow="Who we are" title={<>Built to win. Built to last.</>} text="Four rules every member lives by, in every game we play." />
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {pillars.map((p, i) => (
          <div key={p.title} className="panel cut group relative overflow-hidden p-6 transition hover:-translate-y-1">
            <span className="display absolute right-4 top-3 text-5xl text-gold/[0.07] transition group-hover:text-gold/[0.16]">0{i + 1}</span>
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-gold/40 bg-[radial-gradient(circle_at_30%_25%,rgba(155,77,255,0.25),transparent_70%)] text-xl text-gold-bright">{p.icon}</span>
            <h3 className="display mt-5 text-2xl">{p.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted">{p.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------------- Games ---------------- */

const statusBadge = { active: "success", voting: "gold", upcoming: "neutral" } as const;
const statusLabel = { active: "Active", voting: "Voting", upcoming: "Upcoming" } as const;

/** One game = one wide featured card; two or three = columns. */
export const gridCols = (n: number) => (n >= 3 ? "lg:grid-cols-3" : n === 2 ? "lg:grid-cols-2" : "mx-auto w-full max-w-3xl lg:grid-cols-1");

export function GamesGrid({ full = false }: { full?: boolean }) {
  return (
    <section className="relative border-y border-line bg-bg-2 py-24">
      <div className="bg-stripes absolute inset-0 opacity-40" />
      <div className="relative mx-auto max-w-7xl px-4 md:px-6">
        {!full && (
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <SectionHeading eyebrow="Our games" title="Every game we play, we play together." />
            <ButtonLink href="/games" variant="secondary">
              All games <ArrowIcon />
            </ButtonLink>
          </div>
        )}
        <div className={`${full ? "" : "mt-12"} grid gap-4 ${gridCols(games.length)}`}>
          {games.map((g) => (
            <article
              key={g.slug}
              className={`panel cut relative flex flex-col p-6 ${g.status === "active" ? "border-gold/40" : ""}`}
            >
              {g.status === "active" && <div className="bg-glow-accent absolute inset-0 opacity-70" />}
              <div className="relative">
                <div className="flex items-center justify-between">
                  <Badge tone={statusBadge[g.status]}>{statusLabel[g.status]}</Badge>
                  <span className="label">{g.badge}</span>
                </div>
                <h3 className="display mt-6 text-4xl md:text-5xl">{g.name}</h3>
                <p className="mt-1 text-sm text-muted">{g.genre}</p>
                <p className="mt-5 text-sm leading-relaxed text-muted">{g.desc}</p>
                <dl className="mt-6 grid grid-cols-2 gap-3 border-t border-line pt-4 text-sm">
                  <div>
                    <dt className="label">Faction</dt>
                    <dd className="mt-1">{g.faction}</dd>
                  </div>
                  <div>
                    <dt className="label">Server</dt>
                    <dd className="mt-1">{g.server}</dd>
                  </div>
                </dl>
                <ul className="mt-5 flex flex-wrap gap-2">
                  {g.focus.map((f) => (
                    <li key={f} className="border border-line-strong px-2 py-1 text-xs text-muted">
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Upcoming matches ---------------- */

export async function UpcomingMatches() {
  const matches = await db.match.findMany({
    where: { isPublic: true, startsAt: { gte: new Date() }, status: { in: ["OPEN", "LOCKED"] } },
    orderBy: { startsAt: "asc" },
    take: 4,
    include: { _count: { select: { signups: { where: { status: { not: "DECLINED" } } } } } },
  });

  return (
    <section className="mx-auto max-w-7xl px-4 py-24 md:px-6">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <SectionHeading eyebrow="Schedule" title="Upcoming operations" text="Sieges, scrims, and training nights. Members sign up from the portal." />
        <ButtonLink href="/schedule" variant="secondary">
          Full schedule <ArrowIcon />
        </ButtonLink>
      </div>

      <ol className="mt-12 divide-y divide-line border-y border-line">
        {matches.length === 0 && <li className="py-10 text-center text-muted">No public matches scheduled yet.</li>}
        {matches.map((m) => {
          const d = m.startsAt;
          return (
            <li key={m.id} className="group grid gap-4 py-6 md:grid-cols-[120px_1fr_auto] md:items-center">
              <div className="flex items-baseline gap-2 md:flex-col md:gap-0">
                <span className="display text-4xl">{d.getUTCDate().toString().padStart(2, "0")}</span>
                <span className="label">{d.toLocaleString("en-US", { month: "short", timeZone: "UTC" })} · {d.toISOString().slice(11, 16)} UTC</span>
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="accent">{MATCH_TYPE_LABEL[m.type as MatchType] ?? m.type}</Badge>
                  <span className="text-xs text-dim">{m.game}</span>
                </div>
                <h3 className="display mt-2 text-2xl transition group-hover:text-accent md:text-3xl">{m.title}</h3>
                {m.description && <p className="mt-1 max-w-2xl text-sm text-muted">{m.description}</p>}
              </div>
              <div className="text-sm text-muted md:text-right">
                <span className="text-text">{m._count.signups}</span>
                {m.maxPlayers ? ` / ${m.maxPlayers}` : ""} signed up
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/* ---------------- Leadership ---------------- */

export async function Leadership() {
  const leaders = await db.user.findMany({
    where: { status: "APPROVED", role: { in: ["LEADER", "OFFICER"] } },
    orderBy: [{ createdAt: "asc" }],
    select: { id: true, displayName: true, role: true, title: true, gameClass: true, ign: true },
  });
  leaders.sort((a, b) => (a.role === "LEADER" ? -1 : b.role === "LEADER" ? 1 : 0));

  return (
    <section className="relative border-y border-line bg-bg-2 py-24">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <SectionHeading eyebrow="Command" title="Leadership" text="The Generals and Captains who call the shots and sit at The Round Table." />
          <ButtonLink href="/roster" variant="secondary">
            Full roster <ArrowIcon />
          </ButtonLink>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {leaders.map((l) => (
            <div key={l.id} className={`panel cut p-6 transition hover:-translate-y-1 ${l.role === "LEADER" ? "border-gold/50 shadow-[0_0_60px_-30px_rgba(155,77,255,0.6)]" : ""}`}>
              <div className="flex items-center justify-between">
                <Avatar name={l.displayName} size="lg" tone={roleTone(l.role)} />
                <span />
              </div>
              <h3 className="display mt-5 text-3xl">{l.displayName}</h3>
              <Badge tone={roleTone(l.role)} className="mt-2">
                {ROLE_LABEL[l.role as UserRole]}
              </Badge>
              {l.title && <p className="mt-3 text-sm text-text">{l.title}</p>}
              {l.gameClass && <p className="mt-1 text-xs text-muted">Aion · {l.gameClass}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Milestones ---------------- */

export function Milestones() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-24 md:px-6">
      <SectionHeading eyebrow="History" title="The road so far" />
      <ol className="relative mt-12 border-l border-line pl-8 md:pl-12">
        {milestones.map((m, i) => (
          <li key={m.title} className="relative pb-10 last:pb-0">
            <span className={`absolute -left-[calc(2rem+5px)] top-1.5 h-2.5 w-2.5 rotate-45 md:-left-[calc(3rem+5px)] ${i === milestones.length - 1 ? "bg-accent shadow-glow" : "bg-line-strong"}`} />
            <p className="label">{m.date}</p>
            <h3 className="display mt-1 text-2xl md:text-3xl">{m.title}</h3>
            <p className="mt-1 max-w-xl text-sm text-muted">{m.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* ---------------- Join CTA ---------------- */

export function JoinCTA() {
  return (
    <section className="mx-auto max-w-7xl px-4 md:px-6">
      <div className="panel cut relative overflow-hidden p-10 md:p-16">
        <div className="bg-glow-accent ember absolute inset-0" />
        <div className="bg-rays absolute inset-0 opacity-70" />
        <div className="relative flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="eyebrow">Recruitment open</p>
            <h2 className="display mt-4 text-4xl md:text-5xl">
              Earn the <span className="display-gold">banner.</span>
            </h2>
            <p className="mt-4 max-w-xl text-muted">
              Submit an application, get reviewed by an officer, and unlock the member portal: match signups, role
              applications, and the full roster.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/register" size="lg">
              Apply now <ArrowIcon />
            </ButtonLink>
            <ButtonLink href="/recruit" size="lg" variant="secondary">
              Requirements
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
