import Link from "next/link";
import { db } from "@/lib/db";
import { requireOfficer } from "@/lib/auth";
import { formatDate, formatDateTime } from "@/lib/format";
import { Avatar, Badge, ButtonLink, Card, EmptyState, PageHeader, Stat } from "@/components/ui";

export default async function AdminOverview() {
  const me = await requireOfficer();
  const now = new Date();
  const [members, pending, roleApps, upcoming, recentApplicants] = await Promise.all([
    db.user.count({ where: { status: "APPROVED" } }),
    db.user.count({ where: { status: "PENDING" } }),
    db.roleApplication.count({ where: { status: "PENDING" } }),
    db.match.findMany({ where: { startsAt: { gte: now }, status: { in: ["OPEN", "LOCKED"] } }, orderBy: { startsAt: "asc" }, take: 5, include: { _count: { select: { signups: { where: { status: { not: "DECLINED" } } } } }, signups: { where: { status: "PENDING" }, select: { id: true } } } }),
    db.user.findMany({ where: { status: "PENDING" }, orderBy: { createdAt: "asc" }, take: 5 }),
  ]);

  return (
    <>
      <PageHeader title="Command center" text={`Signed in as ${me.displayName}. Everything that needs an officer decision lands here.`} actions={<ButtonLink href="/admin/matches">New match</ButtonLink>} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Approved members" value={members} tone="gold" />
        <Stat label="Pending applicants" value={pending} tone={pending ? "accent" : "text"} />
        <Stat label="Role applications" value={roleApps} tone={roleApps ? "accent" : "text"} />
        <Stat label="Upcoming matches" value={upcoming.length} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card accent>
          <div className="flex items-center justify-between">
            <h2 className="display text-2xl">Applicant queue</h2>
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
                      {u.gameClass ?? "No class"} · applied {formatDate(u.createdAt)}
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
