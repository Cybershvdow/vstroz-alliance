import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { closeExpiredNominations } from "@/lib/ranks";
import { rules } from "@/lib/site";
import { formatDate } from "@/lib/format";
import { Badge, ButtonLink, Card, EmptyState, PageHeader, statusTone } from "@/components/ui";
import { DisputeForm, TryoutForm } from "@/components/forms/CommunityForms";

export default async function TablePage() {
  const me = await requireUser();
  await closeExpiredNominations();

  const [openVotes, members, myDisputes, myTryouts] = await Promise.all([
    db.nomination.count({ where: { status: "OPEN" } }),
    db.user.findMany({ where: { NOT: { id: me.id } }, select: { id: true, displayName: true }, orderBy: { displayName: "asc" } }),
    db.dispute.findMany({ where: { raisedById: me.id }, orderBy: { createdAt: "desc" }, take: 10, include: { against: { select: { displayName: true } } } }),
    db.tryoutRequest.findMany({ where: { userId: me.id }, orderBy: { createdAt: "desc" }, take: 10 }),
  ]);

  return (
    <>
      <PageHeader title={rules.table.title} text={rules.table.text} actions={<ButtonLink href="/dashboard/votes">Rank votes{openVotes ? ` (${openVotes} open)` : ""}</ButtonLink>} />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Card accent>
            <h2 className="display text-2xl">Bring a dispute</h2>
            <p className="mb-4 mt-1 text-sm text-muted">No-shows, rule breaks, conflicts. Officers review it and record a decision.</p>
            <DisputeForm members={members} />
          </Card>
          <div>
            <h3 className="display mb-3 text-xl">Your disputes</h3>
            {myDisputes.length === 0 ? (
              <EmptyState title="Nothing brought yet" />
            ) : (
              <ul className="panel divide-y divide-line">
                {myDisputes.map((d) => (
                  <li key={d.id} className="px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="display text-lg">{d.subject}</p>
                      <Badge tone={d.status === "OPEN" ? "warning" : d.status === "RESOLVED" ? "success" : "neutral"}>{d.status}</Badge>
                    </div>
                    <p className="text-xs text-muted">
                      {formatDate(d.createdAt)}
                      {d.against ? ` · about ${d.against.displayName}` : ""}
                    </p>
                    {d.resolution && <p className="mt-2 border-t border-line pt-2 text-sm text-muted">Decision: {d.resolution}</p>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <Card accent>
            <h2 className="display text-2xl">Competitive tryout</h2>
            <p className="mb-4 mt-1 text-sm text-muted">Every competitive spot is tried out for. Pass the tryout, then the Elite vote.</p>
            {me.status === "APPROVED" ? (
              <TryoutForm />
            ) : (
              <p className="text-sm text-muted">
                Tryouts are for legion members.{" "}
                <Link href="/dashboard/legion" className="text-gold hover:underline">
                  Apply to the legion →
                </Link>
              </p>
            )}
          </Card>
          <div>
            <h3 className="display mb-3 text-xl">Your tryouts</h3>
            {myTryouts.length === 0 ? (
              <EmptyState title="No tryouts requested" />
            ) : (
              <ul className="panel divide-y divide-line">
                {myTryouts.map((t) => (
                  <li key={t.id} className="px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="display text-lg">{t.game}</p>
                      <Badge tone={statusTone(t.status === "PASSED" ? "APPROVED" : t.status === "FAILED" ? "DENIED" : "PENDING")}>{t.status}</Badge>
                    </div>
                    <p className="text-xs text-muted">{formatDate(t.createdAt)}</p>
                    {t.note && <p className="mt-2 border-t border-line pt-2 text-sm text-muted">Officer note: {t.note}</p>}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <p className="text-xs text-dim">
            Rank promotions are voted on separately. <Link href="/dashboard/votes" className="text-gold hover:underline">Open rank votes →</Link>
          </p>
        </div>
      </div>
    </>
  );
}
