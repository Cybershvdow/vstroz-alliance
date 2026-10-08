import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { site } from "@/lib/site";
import { formatDateTime, formatDate } from "@/lib/format";
import { MATCH_TYPE_LABEL, type MatchType } from "@/lib/constants";
import { Badge, ButtonLink, Card, EmptyState, PageHeader, Stat, statusTone } from "@/components/ui";
import { Countdown } from "@/components/site/Countdown";

export default async function DashboardPage() {
  const me = await requireUser();
  const inLegion = me.status === "APPROVED";
  const now = new Date();

  const [announcements, upcoming, mySignups, myRoleApps, memberCount] = await Promise.all([
    db.announcement.findMany({ orderBy: [{ pinned: "desc" }, { createdAt: "desc" }], take: 5, include: { author: { select: { displayName: true } } } }),
    db.match.findMany({ where: { startsAt: { gte: now }, status: { in: ["OPEN", "LOCKED"] } }, orderBy: { startsAt: "asc" }, take: 5, include: { _count: { select: { signups: { where: { status: { not: "DECLINED" } } } } } } }),
    db.matchSignup.findMany({ where: { userId: me.id, match: { startsAt: { gte: now } } }, include: { match: true }, orderBy: { match: { startsAt: "asc" } } }),
    db.roleApplication.findMany({ where: { userId: me.id }, include: { role: true }, orderBy: { createdAt: "desc" } }),
    db.user.count({ where: { status: "APPROVED" } }),
  ]);

  const next = upcoming[0];
  const signedIds = new Set(mySignups.map((s) => s.matchId));

  return (
    <>
      <PageHeader
        title={<>Welcome back, <span className="text-accent">{me.displayName}</span></>}
        text={[me.playerType, me.gameClass ? `Aion · ${me.gameClass}` : null, `With the alliance since ${formatDate(me.createdAt)}`].filter(Boolean).join(" · ")}
        actions={inLegion ? <ButtonLink href="/dashboard/matches">Match signups</ButtonLink> : <ButtonLink href="/dashboard/legion">{me.appliedAt ? "Your legion application" : "Join the legion"}</ButtonLink>}
      />

      {!inLegion && (
        <Card accent className="mb-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="eyebrow">{site.legionName}</p>
              <h2 className="display mt-2 text-2xl">
                {me.status === "DENIED" ? "Legion application declined" : me.appliedAt ? "Legion application under review" : "You're in the community. Want in the legion?"}
              </h2>
              <p className="mt-2 max-w-xl text-sm text-muted">
                {me.status === "DENIED"
                  ? "You are still part of the community: post content, bring disputes, vote, and keep your profile."
                  : me.appliedAt
                    ? "An officer reviews it within 48 hours. Match signups, roles, and the roster unlock when you are approved."
                    : "Fill in your player profile (game, in-game name, how you play) and apply. Officers review within 48 hours."}
              </p>
            </div>
            <ButtonLink href="/dashboard/legion" variant={me.appliedAt ? "secondary" : "primary"}>
              {me.status === "DENIED" ? "Details" : me.appliedAt ? "View application" : "Apply to the legion"}
            </ButtonLink>
          </div>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Upcoming matches" value={upcoming.length} />
        <Stat label="My signups" value={mySignups.length} tone="accent" />
        <Stat label="Alliance members" value={memberCount} tone="gold" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          {next && (
            <Card accent>
              <div className="flex items-center justify-between">
                <p className="eyebrow">Next match</p>
                <Badge tone="accent">{MATCH_TYPE_LABEL[next.type as MatchType] ?? next.type}</Badge>
              </div>
              <h2 className="display mt-3 text-3xl">{next.title}</h2>
              <p className="mt-1 text-sm text-muted">{next.game} · {formatDateTime(next.startsAt)}</p>
              <div className="mt-5">
                <Countdown iso={next.startsAt.toISOString()} compact />
              </div>
              <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
                <span className="text-sm text-muted">
                  <span className="text-text">{next._count.signups}</span>
                  {next.maxPlayers ? ` / ${next.maxPlayers}` : ""} signed up
                </span>
                <ButtonLink href={`/dashboard/matches/${next.id}`} size="sm" variant={signedIds.has(next.id) ? "secondary" : "primary"}>
                  {signedIds.has(next.id) ? "View signup" : "Sign up"}
                </ButtonLink>
              </div>
            </Card>
          )}

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="display text-2xl">Announcements</h2>
            </div>
            {announcements.length === 0 ? (
              <EmptyState title="Quiet for now" text="Officers post siege calls and alliance news here." />
            ) : (
              <ul className="space-y-3">
                {announcements.map((a) => (
                  <li key={a.id} className={`panel p-5 ${a.pinned ? "border-gold/40" : ""}`}>
                    <div className="flex flex-wrap items-center gap-2">
                      {a.pinned && <Badge tone="gold">Pinned</Badge>}
                      <span className="text-xs text-dim">
                        {a.author.displayName} · {formatDate(a.createdAt)}
                      </span>
                    </div>
                    <h3 className="display mt-2 text-2xl">{a.title}</h3>
                    <p className="mt-2 whitespace-pre-line text-sm text-muted">{a.body}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="display mb-3 text-2xl">My signups</h2>
            {mySignups.length === 0 ? (
              <EmptyState title="No signups yet" action={<ButtonLink href="/dashboard/matches" size="sm">Browse matches</ButtonLink>} />
            ) : (
              <ul className="panel divide-y divide-line">
                {mySignups.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <Link href={`/dashboard/matches/${s.matchId}`} className="display block truncate text-lg hover:text-accent">
                        {s.match.title}
                      </Link>
                      <p className="text-xs text-muted">
                        {formatDateTime(s.match.startsAt)} · {s.position}
                      </p>
                    </div>
                    <Badge tone={statusTone(s.status)}>{s.status}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h2 className="display mb-3 text-2xl">My role applications</h2>
            {myRoleApps.length === 0 ? (
              <EmptyState title="No applications" action={<ButtonLink href="/dashboard/roles" size="sm" variant="secondary">See open roles</ButtonLink>} />
            ) : (
              <ul className="panel divide-y divide-line">
                {myRoleApps.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <p className="display truncate text-lg">{r.role.name}</p>
                    <Badge tone={statusTone(r.status)}>{r.status}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
