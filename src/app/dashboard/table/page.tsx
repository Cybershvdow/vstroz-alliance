import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { closeExpiredNominations } from "@/lib/ranks";
import { rules } from "@/lib/site";
import { CHAIN_LEVEL_LABEL, CHAIN_OF_COMMAND, allianceRank, canAddressTable } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { Badge, ButtonLink, Card, EmptyState, PageHeader, statusTone } from "@/components/ui";
import { DisputeForm, TryoutForm } from "@/components/forms/CommunityForms";

export default async function TablePage() {
  const me = await requireUser();
  await closeExpiredNominations();
  const rank = allianceRank(me);
  const canTable = canAddressTable(me);
  const command = me.role !== "MEMBER";

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
            <h2 className="display text-2xl">{command ? "Bring it to The Round Table" : canTable ? "Bring it up the chain" : "Ask a Captain"}</h2>
            <p className="mb-4 mt-1 text-sm text-muted">
              {command
                ? "Captains and Generals bring matters straight to The Round Table. A General records the decision."
                : canTable
                  ? `As ${rank.label === "Elite" ? "an" : "a"} ${rank.label} you can go to a Captain or straight to The Round Table. Start with a Captain when you can.`
                  : `As a ${rank.label} your first stop is a Captain. They answer it or send it up to The Round Table. Veterans and Elite can go to The Round Table directly.`}
            </p>
            <DisputeForm members={members} canTable={canTable} commandOnly={command} />
          </Card>
          <div>
            <h3 className="display mb-3 text-xl">What you have sent</h3>
            {myDisputes.length === 0 ? (
              <EmptyState title="Nothing sent yet" />
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
                      {d.status === "OPEN" ? ` · ${CHAIN_LEVEL_LABEL[d.level] ?? d.level}` : ""}
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
            <p className="mb-4 mt-1 text-sm text-muted">Aion competitive spots are tried out for.</p>
            {me.status === "APPROVED" ? (
              <TryoutForm />
            ) : (
              <p className="text-sm text-muted">
                Aion tryouts are for Vstroz Legion members. Elite itself is an alliance vote and does not need one.{" "}
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
          <Card>
            <h2 className="display text-xl">Chain of command</h2>
            <p className="mt-1 text-sm text-muted">Go to the level above you. Only what that level cannot settle moves up.</p>
            <ul className="mt-3 divide-y divide-line border-y border-line">
              {CHAIN_OF_COMMAND.map((c) => (
                <li key={c.rank} className="flex items-center justify-between gap-4 py-2 text-sm">
                  <Badge tone={c.tone}>{c.rank}</Badge>
                  <span className="text-right text-muted">{c.goesTo}</span>
                </li>
              ))}
            </ul>
          </Card>
          <p className="text-xs text-dim">
            Rank promotions are voted on separately. <Link href="/dashboard/votes" className="text-gold hover:underline">Open rank votes →</Link>
          </p>
        </div>
      </div>
    </>
  );
}
