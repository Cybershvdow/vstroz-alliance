import { db } from "@/lib/db";
import { requireOfficer } from "@/lib/auth";
import { reviewApplicantAction } from "@/lib/actions/admin";
import { formatDate } from "@/lib/format";
import { Avatar, Badge, Button, EmptyState, PageHeader, statusTone } from "@/components/ui";
import { questionsFor } from "@/lib/constants";

function GameAnswers({ game, json }: { game: string | null; json: string | null }) {
  if (!game) return null;
  let answers: Record<string, string> = {};
  try {
    answers = json ? JSON.parse(json) : {};
  } catch {
    answers = {};
  }
  const qs = questionsFor(game).filter((q) => answers[q.key]);
  return (
    <div className="mt-3 border border-line bg-bg-2 p-3 text-sm">
      <p className="label mb-2">{game} · application answers</p>
      {qs.length === 0 ? (
        <p className="text-muted">No game answers.</p>
      ) : (
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
          {qs.map((q) => (
            <div key={q.key}>
              <dt className="label">{q.label}</dt>
              <dd>{answers[q.key]}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

export default async function ApplicantsPage() {
  await requireOfficer();
  const [pending, recent] = await Promise.all([
    db.user.findMany({ where: { status: "PENDING" }, orderBy: { createdAt: "asc" } }),
    db.user.findMany({
      where: { status: { in: ["APPROVED", "DENIED"] }, role: "MEMBER", reviewedAt: { not: null } },
      orderBy: { reviewedAt: "desc" },
      take: 10,
    }),
  ]);

  return (
    <>
      <PageHeader title="Applicants" text="Approve to unlock the member portal for them. Deny with a note so they know why." />

      {pending.length === 0 ? (
        <EmptyState title="Queue is clear" text="New applications appear here the moment someone registers." />
      ) : (
        <ul className="space-y-4">
          {pending.map((u) => (
            <li key={u.id} className="panel panel-accent cut p-5 md:p-6">
              <div className="flex flex-col gap-5 md:flex-row">
                <div className="flex flex-1 gap-4">
                  <Avatar name={u.displayName} size="lg" />
                  <div className="min-w-0">
                    <h2 className="display text-3xl">{u.displayName}</h2>
                    <p className="text-sm text-muted">
                      @{u.username} · {u.email}
                    </p>
                    <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
                      <div>
                        <dt className="label">Game</dt>
                        <dd>{u.game ?? "—"}</dd>
                      </div>
                      <div>
                        <dt className="label">Class / IGN</dt>
                        <dd>{[u.gameClass, u.ign].filter(Boolean).join(" · ") || "—"}</dd>
                      </div>
                      <div>
                        <dt className="label">Discord</dt>
                        <dd>{u.discord ?? "—"}</dd>
                      </div>
                      <div>
                        <dt className="label">Applied</dt>
                        <dd>{formatDate(u.createdAt)}</dd>
                      </div>
                    </dl>
                    <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
                      <div>
                        <dt className="label">Playing MMOs</dt>
                        <dd>{u.playtime ?? "—"}</dd>
                      </div>
                      <div>
                        <dt className="label">Player type</dt>
                        <dd>{u.playerType ?? "—"}</dd>
                      </div>
                      <div className="col-span-2">
                        <dt className="label">Wants to do</dt>
                        <dd>{u.interests ?? "—"}</dd>
                      </div>
                      <div className="col-span-2 sm:col-span-4">
                        <dt className="label">Games</dt>
                        <dd>{u.games ?? "—"}</dd>
                      </div>
                    </dl>
                    <GameAnswers game={u.game} json={u.gameAnswers} />
                    <div className="mt-4 border border-line bg-bg-2 p-3 text-sm">
                      <p className="label mb-1">Comments</p>
                      <p className="whitespace-pre-line text-muted">{u.applicationNote || "No comments provided."}</p>
                    </div>
                  </div>
                </div>

                <form action={reviewApplicantAction} className="flex w-full flex-col gap-2 md:w-64">
                  <input type="hidden" name="userId" value={u.id} />
                  <label className="label" htmlFor={`note-${u.id}`}>
                    Note to applicant (optional)
                  </label>
                  <input id={`note-${u.id}`} name="note" className="input" placeholder="e.g. Welcome! Join voice Saturday." maxLength={300} />
                  <div className="mt-1 grid grid-cols-2 gap-2">
                    <Button type="submit" name="decision" value="APPROVED" size="sm">
                      Approve
                    </Button>
                    <Button type="submit" name="decision" value="DENIED" size="sm" variant="danger">
                      Deny
                    </Button>
                  </div>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}

      {recent.length > 0 && (
        <>
          <h2 className="display mb-3 mt-12 text-2xl">Recent decisions</h2>
          <ul className="panel divide-y divide-line">
            {recent.map((u) => (
              <li key={u.id} className="grid gap-2 px-4 py-3 md:grid-cols-[1fr_auto_auto] md:items-center">
                <div>
                  <p className="display text-lg">{u.displayName}</p>
                  <p className="text-xs text-muted">{u.reviewNote ?? "No note"}</p>
                </div>
                <span className="text-xs text-dim">{u.reviewedAt ? formatDate(u.reviewedAt) : ""}</span>
                <form action={reviewApplicantAction} className="flex items-center gap-2">
                  <input type="hidden" name="userId" value={u.id} />
                  <Badge tone={statusTone(u.status)}>{u.status}</Badge>
                  <Button type="submit" name="decision" value={u.status === "APPROVED" ? "DENIED" : "APPROVED"} size="sm" variant="ghost">
                    {u.status === "APPROVED" ? "Revoke" : "Approve"}
                  </Button>
                </form>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
