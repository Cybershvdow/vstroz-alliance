import Link from "next/link";
import { db } from "@/lib/db";
import { requireOfficer } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { MATCH_TYPE_LABEL, type MatchType } from "@/lib/constants";
import { Badge, Card, PageHeader, statusTone } from "@/components/ui";
import { CreateMatchForm } from "@/components/forms/AdminForms";

export default async function AdminMatchesPage() {
  await requireOfficer();
  const matches = await db.match.findMany({
    orderBy: { startsAt: "desc" },
    include: { _count: { select: { signups: { where: { status: { not: "DECLINED" } } } } }, signups: { where: { status: "PENDING" }, select: { id: true } } },
  });
  const now = new Date();
  const upcoming = matches.filter((m) => m.startsAt >= now && !["COMPLETED", "CANCELLED"].includes(m.status)).reverse();
  const past = matches.filter((m) => !upcoming.includes(m));

  return (
    <>
      <PageHeader title="Matches" text="Create sieges, scrims, and training. Confirm rosters from each match page." />
      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        <div>
          <h2 className="display mb-3 text-2xl">Upcoming</h2>
          <MatchTable rows={upcoming} empty="No upcoming matches. Create one on the right." />
          <h2 className="display mb-3 mt-10 text-2xl">Past</h2>
          <MatchTable rows={past} empty="No past matches." />
        </div>
        <Card accent className="h-fit">
          <h2 className="display mb-4 text-2xl">New match</h2>
          <CreateMatchForm />
        </Card>
      </div>
    </>
  );
}

function MatchTable({
  rows,
  empty,
}: {
  rows: { id: string; title: string; game: string; type: string; status: string; startsAt: Date; maxPlayers: number | null; isPublic: boolean; result: string | null; _count: { signups: number }; signups: { id: string }[] }[];
  empty: string;
}) {
  if (rows.length === 0) return <p className="panel px-4 py-6 text-center text-sm text-muted">{empty}</p>;
  return (
    <ul className="panel divide-y divide-line">
      {rows.map((m) => (
        <li key={m.id} className="grid gap-2 px-4 py-3 md:grid-cols-[170px_1fr_auto] md:items-center">
          <span className="text-sm text-muted">{formatDateTime(m.startsAt)}</span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="accent">{MATCH_TYPE_LABEL[m.type as MatchType] ?? m.type}</Badge>
              <Badge tone={statusTone(m.status)}>{m.status}</Badge>
              {!m.isPublic && <Badge tone="neutral">Private</Badge>}
            </div>
            <Link href={`/admin/matches/${m.id}`} className="display mt-1 block truncate text-xl hover:text-accent">
              {m.title}
            </Link>
            {m.result && <p className="text-xs text-success">{m.result}</p>}
          </div>
          <div className="text-xs text-muted md:text-right">
            <p>
              <span className="text-text">{m._count.signups}</span>
              {m.maxPlayers ? `/${m.maxPlayers}` : ""} signed up
            </p>
            {m.signups.length > 0 && <p className="text-warning">{m.signups.length} pending</p>}
          </div>
        </li>
      ))}
    </ul>
  );
}
