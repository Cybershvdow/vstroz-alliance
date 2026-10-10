import Link from "next/link";
import { db } from "@/lib/db";
import { requireOfficer } from "@/lib/auth";
import { formatDate, formatDateTime } from "@/lib/format";
import { Avatar, Badge, Button, ButtonLink, Card, EmptyState, PageHeader, Stat } from "@/components/ui";
import { syncDiscordAction } from "@/lib/actions/discord";
import { discordConfigured, discordSyncConfigured, lastDiscordSync } from "@/lib/discord";

export default async function AdminOverview({ searchParams }: { searchParams: Promise<{ discord?: string; removed?: string; restored?: string }> }) {
  const me = await requireOfficer();
  const { discord, removed, restored } = await searchParams;
  const sync = discordSyncConfigured();
  const last = lastDiscordSync();
  const discordTitle = sync ? "Connected to the server" : discordConfigured() ? "Sign-in connected, sync not set up" : "Not connected yet";
  const discordText = sync
    ? `Every 5 minutes the site checks who is still in the Discord. Leaving removes them from the legion and hides their account; rejoining restores it. Last check: ${last ? `${formatDateTime(last.at)}${last.ok ? ` · ${last.checked} linked accounts` : ` · failed: ${last.error}`}` : "not yet since the last restart"}.`
    : discordConfigured()
      ? "Members can sign in with Discord. Add DISCORD_BOT_TOKEN in Railway to enable automatic removal when someone leaves the server."
      : "Add DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, DISCORD_GUILD_ID and DISCORD_BOT_TOKEN in Railway to turn on Discord sign-in and membership sync.";
  const gamesPlayed = await db.user.groupBy({
    by: ["game"],
    where: { game: { not: null }, discordLeftAt: null },
    _count: { _all: true },
    orderBy: { _count: { game: "desc" } },
    take: 12,
  });
  const discordMsg =
    discord === "synced" ? `Sync done: ${removed ?? 0} removed, ${restored ?? 0} restored.` : discord === "error" ? "Sync failed. Check the server logs." : discord === "off" ? "Discord sync is not configured." : undefined;
  const now = new Date();
  const [members, pending, roleApps, upcoming, recentApplicants] = await Promise.all([
    db.user.count({ where: { status: "APPROVED" } }),
    db.user.count({ where: { status: "PENDING", appliedAt: { not: null } } }),
    db.roleApplication.count({ where: { status: "PENDING" } }),
    db.match.findMany({ where: { startsAt: { gte: now }, status: { in: ["OPEN", "LOCKED"] } }, orderBy: { startsAt: "asc" }, take: 5, include: { _count: { select: { signups: { where: { status: { not: "DECLINED" } } } } }, signups: { where: { status: "PENDING" }, select: { id: true } } } }),
    db.user.findMany({ where: { status: "PENDING", appliedAt: { not: null } }, orderBy: { appliedAt: "asc" }, take: 5 }),
  ]);

  return (
    <>
      <PageHeader title="Command center" text={`Signed in as ${me.displayName}. Everything that needs an officer decision lands here.`} actions={<ButtonLink href="/admin/matches">New match</ButtonLink>} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Legion members" value={members} tone="gold" />
        <Stat label="Legion applications" value={pending} tone={pending ? "accent" : "text"} />
        <Stat label="Role applications" value={roleApps} tone={roleApps ? "accent" : "text"} />
        <Stat label="Upcoming matches" value={upcoming.length} />
      </div>

      <Card className="mt-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="eyebrow">Discord</p>
            <h2 className="display mt-2 text-2xl">{discordTitle}</h2>
            <p className="mt-2 max-w-2xl text-sm text-muted">{discordText}</p>
            {discordMsg && <p className={`mt-2 text-sm ${discord === "synced" ? "text-success" : "text-danger"}`}>{discordMsg}</p>}
          </div>
          {sync && (
            <form action={syncDiscordAction}>
              <Button type="submit" variant="secondary">
                Sync now
              </Button>
            </form>
          )}
        </div>
      </Card>

      <Card className="mt-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="eyebrow">Games members play</p>
            <p className="mt-1 text-sm text-muted">From every profile. When a game catches on, add it to the site (one line in src/lib/constants.ts and src/lib/site.ts).</p>
          </div>
        </div>
        {gamesPlayed.length === 0 ? (
          <p className="mt-4 text-sm text-muted">No games on profiles yet.</p>
        ) : (
          <ul className="mt-4 flex flex-wrap gap-2">
            {gamesPlayed.map((g) => (
              <li key={g.game ?? ""} className="cut-sm inline-flex items-center gap-2 border border-line-strong bg-white/[0.02] px-3 py-1.5 text-sm">
                <span className="font-display font-bold uppercase tracking-wider">{g.game}</span>
                <span className="text-muted">{g._count._all}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card accent>
          <div className="flex items-center justify-between">
            <h2 className="display text-2xl">Legion applications</h2>
            <Link href="/admin/applicants" className="label hover:text-text">
              Review all →
            </Link>
          </div>
          {recentApplicants.length === 0 ? (
            <p className="mt-4 text-sm text-muted">Queue is clear.</p>
          ) : (
            <ul className="mt-4 divide-y divide-line">
              {recentApplicants.map((u) => (
                <li key={u.id} className="flex items-center gap-3 py-3">
                  <Avatar name={u.displayName} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="display truncate text-lg">{u.displayName}</p>
                    <p className="text-xs text-muted">
                      {u.gameClass ?? "No class"} · applied {formatDate(u.appliedAt ?? u.createdAt)}
                    </p>
                  </div>
                  <Badge tone="warning">Pending</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <h2 className="display text-2xl">Upcoming matches</h2>
            <Link href="/admin/matches" className="label hover:text-text">
              Manage →
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <div className="mt-4">
              <EmptyState title="Nothing scheduled" action={<ButtonLink href="/admin/matches" size="sm">Create a match</ButtonLink>} />
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-line">
              {upcoming.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <Link href={`/admin/matches/${m.id}`} className="display block truncate text-lg hover:text-accent">
                      {m.title}
                    </Link>
                    <p className="text-xs text-muted">{formatDateTime(m.startsAt)}</p>
                  </div>
                  <div className="text-right text-xs text-muted">
                    <p>
                      <span className="text-text">{m._count.signups}</span>
                      {m.maxPlayers ? `/${m.maxPlayers}` : ""} signed up
                    </p>
                    {m.signups.length > 0 && <p className="text-warning">{m.signups.length} to confirm</p>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
