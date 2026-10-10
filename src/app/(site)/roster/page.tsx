import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { GAME_CLASSES, ROLE_LABEL, type UserRole } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { Avatar, Badge, SectionHeading, roleTone } from "@/components/ui";

export const metadata: Metadata = { title: "Roster" };
export const dynamic = "force-dynamic";

const ROLE_ORDER: Record<string, number> = { LEADER: 0, OFFICER: 1, MEMBER: 2 };

export default async function RosterPage({ searchParams }: { searchParams: Promise<{ cls?: string }> }) {
  const { cls } = await searchParams;
  const filter = cls && (GAME_CLASSES as readonly string[]).includes(cls) ? cls : undefined;

  const members = await db.user.findMany({
    where: { status: "APPROVED", ...(filter ? { gameClass: filter } : {}) },
    select: { id: true, username: true, displayName: true, ign: true, gameClass: true, role: true, tier: true, title: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  const TIER_ORDER: Record<string, number> = { ELITE: 0, VETERAN: 1, MEMBER: 2, RECRUIT: 3 };
  members.sort((a, b) => ROLE_ORDER[a.role] - ROLE_ORDER[b.role] || TIER_ORDER[a.tier] - TIER_ORDER[b.tier]);

  const counts = await db.user.groupBy({
    by: ["gameClass"],
    where: { status: "APPROVED" },
    _count: { _all: true },
  });
  const countFor = (c: string) => counts.find((x) => x.gameClass === c)?._count._all ?? 0;

  // Members with public content get a link to their media folder.
  const community = await db.user.findMany({ where: { status: { not: "APPROVED" }, discordLeftAt: null }, select: { id: true, username: true, displayName: true }, orderBy: { createdAt: "desc" } });
  const mediaCounts = await db.mediaPost.groupBy({ by: ["postedById"], where: { approved: true, official: false }, _count: { _all: true } });
  const videosBy = (id: string) => mediaCounts.find((x) => x.postedById === id)?._count._all ?? 0;

  return (
    <section className="mx-auto max-w-7xl px-4 pb-24 pt-32 md:px-6 md:pt-40">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <SectionHeading eyebrow="Roster" title="The alliance" text={`${members.length} ${filter ? filter + (members.length === 1 ? "" : "s") : "legion members"} on the roster.`} />
      </div>

      <p className="label mt-10 mb-2">Filter by Aion class</p>
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

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {members.map((m) => (
          <Link key={m.id} href={`/members/${encodeURIComponent(m.username)}`} className={`panel cut flex items-center gap-4 p-4 transition hover:-translate-y-0.5 ${m.role === "LEADER" ? "border-gold/50" : m.role === "OFFICER" ? "border-accent/40" : ""}`}>
            <Avatar name={m.displayName} tone={roleTone(m.role)} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="display truncate text-xl">{m.displayName}</p>
                {m.role !== "MEMBER" && <Badge tone={roleTone(m.role)}>{ROLE_LABEL[m.role as UserRole]}</Badge>}
                {m.tier === "ELITE" && <Badge tone="gold">Elite</Badge>}
                {m.tier === "VETERAN" && <Badge tone="accent">Veteran</Badge>}
              </div>
              <p className="truncate text-xs text-muted">
                {m.gameClass ? `Aion · ${m.gameClass}` : "Alliance member"}
                {m.title ? ` · ${m.title}` : ""}
              </p>
              <p className="text-[0.7rem] text-dim">
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
        ))}
        {members.length === 0 && <p className="col-span-full py-10 text-center text-muted">No members match that filter.</p>}
      </div>

      {community.length > 0 && (
        <>
          <h2 className="display mt-16 text-2xl">
            Community <span className="text-muted">· {community.length}</span>
          </h2>
          <p className="mt-1 text-sm text-muted">Members of the alliance who are not in the legion. Click a name to see their profile and content.</p>
          <ul className="mt-5 flex flex-wrap gap-2">
            {community.map((c) => (
              <li key={c.id}>
                <Link href={`/members/${encodeURIComponent(c.username)}`} className="cut-sm inline-flex items-center gap-2 border border-line-strong bg-white/[0.02] px-3 py-2 text-sm transition hover:border-text">
                  <Avatar name={c.displayName} size="sm" />
                  <span className="font-display font-bold uppercase tracking-wider">{c.displayName}</span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
