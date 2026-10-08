import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireOfficer } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { updateMatchStatusAction, deleteMatchAction, reviewSignupAction } from "@/lib/actions/admin";
import { MATCH_TYPE_LABEL, POSITION, type MatchType } from "@/lib/constants";
import { Avatar, Badge, Button, Card, PageHeader, statusTone, roleTone } from "@/components/ui";
import { ConfirmSubmit } from "@/components/forms/SubmitButton";

export default async function AdminMatchDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireOfficer();
  const { id } = await params;
  const match = await db.match.findUnique({
    where: { id },
    include: { signups: { include: { user: { select: { displayName: true, gameClass: true, role: true, discord: true } } }, orderBy: { createdAt: "asc" } } },
  });
  if (!match) notFound();

  const confirmed = match.signups.filter((s) => s.status === "CONFIRMED");
  const byPos = POSITION.map((p) => ({ p, n: confirmed.filter((s) => s.position === p).length }));

  return (
    <>
      <Link href="/admin/matches" className="label mb-4 inline-block hover:text-text">
        ← All matches
      </Link>
      <PageHeader
        title={match.title}
        text={
          <span className="flex flex-wrap items-center gap-2">
            <Badge tone="accent">{MATCH_TYPE_LABEL[match.type as MatchType] ?? match.type}</Badge>
            <Badge tone={statusTone(match.status)}>{match.status}</Badge>
            {!match.isPublic && <Badge tone="neutral">Private</Badge>}
            <span>{match.game} · {formatDateTime(match.startsAt)}</span>
          </span>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="display text-2xl">
              Signups <span className="text-muted">({match.signups.filter((s) => s.status !== "DECLINED").length}{match.maxPlayers ? `/${match.maxPlayers}` : ""} active)</span>
            </h2>
            <div className="flex gap-3 text-xs text-muted">
              {byPos.map(({ p, n }) => (
                <span key={p}>
                  <span className="text-text">{n}</span> {p}
                </span>
              ))}
              <span className="text-dim">confirmed</span>
            </div>
          </div>
          <ul className="panel divide-y divide-line">
            {match.signups.length === 0 && <li className="px-4 py-6 text-center text-sm text-muted">No signups yet.</li>}
            {match.signups.map((s) => (
              <li key={s.id} className="grid gap-3 px-4 py-3 md:grid-cols-[1fr_auto] md:items-center">
                <div className="flex items-center gap-3">
                  <Avatar name={s.user.displayName} size="sm" tone={roleTone(s.user.role)} />
                  <div className="min-w-0">
                    <p className="display text-lg">
                      {s.user.displayName} <span className="text-sm text-muted">· {s.position}</span>
                    </p>
                    <p className="text-xs text-muted">
                      {s.user.gameClass ?? "—"} · {s.user.discord ?? "no discord"}
                      {s.note ? ` · "${s.note}"` : ""}
                    </p>
                  </div>
                </div>
                <form action={reviewSignupAction} className="flex flex-wrap items-center gap-1.5">
                  <input type="hidden" name="signupId" value={s.id} />
                  <Badge tone={statusTone(s.status)} className="mr-2">
                    {s.status}
                  </Badge>
                  {s.status !== "CONFIRMED" && (
                    <Button type="submit" name="status" value="CONFIRMED" size="sm">
                      Confirm
                    </Button>
                  )}
                  {s.status !== "BENCH" && (
                    <Button type="submit" name="status" value="BENCH" size="sm" variant="secondary">
                      Bench
                    </Button>
                  )}
                  {s.status !== "DECLINED" && (
                    <Button type="submit" name="status" value="DECLINED" size="sm" variant="ghost">
                      Decline
                    </Button>
                  )}
                </form>
              </li>
            ))}
          </ul>
          {match.description && (
            <Card className="mt-6">
              <p className="label mb-2">Briefing</p>
              <p className="whitespace-pre-line text-sm text-muted">{match.description}</p>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card accent>
            <h2 className="display text-2xl">Status</h2>
            <form action={updateMatchStatusAction} className="mt-4 space-y-3">
              <input type="hidden" name="matchId" value={match.id} />
              <div className="grid grid-cols-2 gap-2">
                <Button type="submit" name="status" value="OPEN" size="sm" variant={match.status === "OPEN" ? "primary" : "secondary"}>
                  Open
                </Button>
                <Button type="submit" name="status" value="LOCKED" size="sm" variant={match.status === "LOCKED" ? "primary" : "secondary"}>
                  Lock roster
                </Button>
                <Button type="submit" name="status" value="CANCELLED" size="sm" variant="ghost">
                  Cancel
                </Button>
                <Button type="submit" name="status" value="COMPLETED" size="sm" variant="gold">
                  Complete
                </Button>
              </div>
              <div>
                <label htmlFor="result" className="label mb-1 block">
                  Result (saved with any status change)
                </label>
                <input id="result" name="result" defaultValue={match.result ?? ""} placeholder="Victory 3–1" className="input" maxLength={120} />
              </div>
            </form>
          </Card>
          <Card>
            <h2 className="display text-2xl">Danger zone</h2>
            <p className="mt-2 text-sm text-muted">Deleting removes all signups too.</p>
            <form action={deleteMatchAction} className="mt-4">
              <input type="hidden" name="matchId" value={match.id} />
              <ConfirmSubmit variant="danger" size="sm" message="Delete this match and all of its signups?">
                Delete match
              </ConfirmSubmit>
            </form>
          </Card>
        </div>
      </div>
    </>
  );
}
