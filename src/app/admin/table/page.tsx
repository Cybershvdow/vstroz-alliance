import { db } from "@/lib/db";
import { requireOfficer } from "@/lib/auth";
import { escalateDisputeAction, resolveDisputeAction, reviewTryoutAction } from "@/lib/actions/community";
import { rules } from "@/lib/site";
import { CHAIN_LEVEL_LABEL, allianceRank } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { avatarUrl } from "@/lib/avatar";
import { Avatar, Badge, Button, ButtonLink, EmptyState, PageHeader, statusTone } from "@/components/ui";

export default async function AdminTablePage() {
  const me = await requireOfficer();
  const isGeneral = me.role === "LEADER";
  const [disputes, tryouts, openVotes] = await Promise.all([
    db.dispute.findMany({ orderBy: [{ status: "asc" }, { createdAt: "desc" }], take: 40, include: { raisedBy: { select: { displayName: true } }, against: { select: { displayName: true } } } }),
    db.tryoutRequest.findMany({ orderBy: [{ createdAt: "desc" }], take: 40, include: { user: { select: { id: true, displayName: true, gameClass: true, discord: true, role: true, tier: true, avatarAt: true } } } }),
    db.nomination.count({ where: { status: "OPEN" } }),
  ]);
  const openDisputes = disputes.filter((d) => d.status === "OPEN");
  const closedDisputes = disputes.filter((d) => d.status !== "OPEN");
  const activeTryouts = tryouts.filter((t) => t.status === "PENDING" || t.status === "SCHEDULED");
  const pastTryouts = tryouts.filter((t) => t.status === "PASSED" || t.status === "FAILED");

  return (
    <>
      <PageHeader title={rules.table.title} text="Questions and issues come up the chain: Captains take the first line and send up what needs a General. Generals decide what sits at The Round Table." actions={<ButtonLink href="/admin/ranks">Rank votes{openVotes ? ` (${openVotes} open)` : ""}</ButtonLink>} />

      <h2 className="display mb-3 text-2xl">
        Open matters <span className="text-muted">({openDisputes.length})</span>
      </h2>
      {openDisputes.length === 0 ? (
        <EmptyState title="The Round Table is clear" />
      ) : (
        <ul className="space-y-4">
          {openDisputes.map((d) => (
            <li key={d.id} className="panel panel-accent cut grid gap-4 p-5 md:grid-cols-[1fr_300px]">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="display text-2xl">{d.subject}</h3>
                  <Badge tone={d.level === "TABLE" ? "gold" : "accent"}>{CHAIN_LEVEL_LABEL[d.level] ?? d.level}</Badge>
                  {d.escalatedAt && <Badge tone="neutral">Sent up by a Captain</Badge>}
                </div>
                <p className="text-xs text-muted">
                  Brought by {d.raisedBy.displayName} · {formatDate(d.createdAt)}
                  {d.against ? ` · about ${d.against.displayName}` : ""}
                </p>
                <p className="mt-3 whitespace-pre-line text-sm text-muted">{d.details}</p>
              </div>
              {d.level === "TABLE" && !isGeneral ? (
                <p className="text-sm text-muted">This sits at The Round Table. A General records the decision.</p>
              ) : (
              <div className="flex flex-col gap-3">
              <form action={resolveDisputeAction} className="flex flex-col gap-2">
                <input type="hidden" name="id" value={d.id} />
                <label className="label" htmlFor={`res-${d.id}`}>
                  Answer or decision (recorded and shown to the member)
                </label>
                <textarea id={`res-${d.id}`} name="resolution" className="input min-h-20" maxLength={1000} placeholder="The answer or decision, and why." />
                <div className="grid grid-cols-2 gap-2">
                  <Button type="submit" name="status" value="RESOLVED" size="sm">
                    Resolve
                  </Button>
                  <Button type="submit" name="status" value="DISMISSED" size="sm" variant="secondary">
                    Dismiss
                  </Button>
                </div>
              </form>
              {d.level === "CAPTAIN" && (
                <form action={escalateDisputeAction}>
                  <input type="hidden" name="id" value={d.id} />
                  <Button type="submit" size="sm" variant="ghost" className="w-full">
                    Send up to The Round Table
                  </Button>
                </form>
              )}
              </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <h2 className="display mb-3 mt-12 text-2xl">
        Tryout requests <span className="text-muted">({activeTryouts.length})</span>
      </h2>
      {activeTryouts.length === 0 ? (
        <EmptyState title="No tryouts requested" />
      ) : (
        <ul className="space-y-3">
          {activeTryouts.map((t) => (
            <li key={t.id} className="panel cut grid gap-4 p-5 md:grid-cols-[1fr_320px]">
              <div className="flex gap-3">
                <Avatar name={t.user.displayName} src={avatarUrl(t.user)} />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="display text-xl">{t.user.displayName}</p>
                    <Badge tone="accent">{t.game}</Badge>
                    <Badge tone={statusTone(t.status)}>{t.status}</Badge>
                  </div>
                  <p className="text-xs text-muted">
                    {allianceRank(t.user).label} · {t.user.gameClass ?? "—"} · {t.user.discord ?? "no discord"} · {formatDate(t.createdAt)}
                  </p>
                  <p className="mt-2 text-sm text-muted">{t.message}</p>
                </div>
              </div>
              <form action={reviewTryoutAction} className="flex flex-col gap-2">
                <input type="hidden" name="id" value={t.id} />
                <input name="note" className="input" placeholder="Note to player (time, result, feedback)" maxLength={500} defaultValue={t.note ?? ""} />
                <div className="grid grid-cols-3 gap-2">
                  <Button type="submit" name="status" value="SCHEDULED" size="sm" variant="secondary">
                    Scheduled
                  </Button>
                  <Button type="submit" name="status" value="PASSED" size="sm">
                    Passed
                  </Button>
                  <Button type="submit" name="status" value="FAILED" size="sm" variant="danger">
                    Failed
                  </Button>
                </div>
                <p className="text-[0.7rem] text-dim">A passed tryout does not change a rank. Elite is decided by a vote on the Ranks page, with or without a tryout.</p>
              </form>
            </li>
          ))}
        </ul>
      )}

      {(closedDisputes.length > 0 || pastTryouts.length > 0) && (
        <div className="mt-12 grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="display mb-3 text-2xl">Recorded decisions</h2>
            <ul className="panel divide-y divide-line">
              {closedDisputes.length === 0 && <li className="px-4 py-4 text-sm text-muted">None yet.</li>}
              {closedDisputes.map((d) => (
                <li key={d.id} className="px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="display text-lg">{d.subject}</p>
                    <Badge tone={d.status === "RESOLVED" ? "success" : "neutral"}>{d.status}</Badge>
                  </div>
                  <p className="text-xs text-muted">
                    {d.raisedBy.displayName} · {d.resolvedAt ? formatDate(d.resolvedAt) : ""}
                  </p>
                  {d.resolution && <p className="mt-1 text-sm text-muted">{d.resolution}</p>}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="display mb-3 text-2xl">Tryout history</h2>
            <ul className="panel divide-y divide-line">
              {pastTryouts.length === 0 && <li className="px-4 py-4 text-sm text-muted">None yet.</li>}
              {pastTryouts.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div>
                    <p className="display text-lg">{t.user.displayName}</p>
                    <p className="text-xs text-muted">
                      {t.game} · {t.reviewedAt ? formatDate(t.reviewedAt) : ""}
                    </p>
                  </div>
                  <Badge tone={statusTone(t.status === "PASSED" ? "APPROVED" : "DENIED")}>{t.status}</Badge>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
