import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireApproved } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { withdrawSignupAction } from "@/lib/actions/member";
import { MATCH_TYPE_LABEL, POSITION, type MatchType } from "@/lib/constants";
import { Avatar, Badge, Card, PageHeader, statusTone, roleTone } from "@/components/ui";
import { MatchSignupForm } from "@/components/forms/MemberForms";
import { ConfirmSubmit } from "@/components/forms/SubmitButton";
import { Countdown } from "@/components/site/Countdown";

const defaultPositionFor = (cls: string | null) =>
  cls === "Templar" ? "TANK" : cls === "Cleric" ? "HEALER" : cls === "Chanter" ? "SUPPORT" : "DPS";

export default async function MatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireApproved();
  const { id } = await params;

  const match = await db.match.findUnique({
    where: { id },
    include: {
      signups: {
        include: { user: { select: { id: true, displayName: true, gameClass: true, role: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!match) notFound();

  const mine = match.signups.find((s) => s.userId === me.id);
  const open = match.status === "OPEN" && match.startsAt > new Date();
  const full = !!match.maxPlayers && match.signups.length >= match.maxPlayers;
  const confirmed = match.signups.filter((s) => s.status === "CONFIRMED");
  const byPosition = POSITION.map((p) => ({ p, n: confirmed.filter((s) => s.position === p).length }));

  return (
    <>
      <Link href="/dashboard/matches" className="label mb-4 inline-block hover:text-text">
        ← All matches
      </Link>
      <PageHeader
        title={match.title}
        text={
          <span className="flex flex-wrap items-center gap-2">
            <Badge tone="accent">{MATCH_TYPE_LABEL[match.type as MatchType] ?? match.type}</Badge>
            <Badge tone={statusTone(match.status)}>{match.status}</Badge>
            <span>{match.game} · {formatDateTime(match.startsAt)}</span>
          </span>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <Countdown iso={match.startsAt.toISOString()} compact />
              <div className="text-right text-sm text-muted">
                <span className="display text-3xl text-text">{match.signups.length}</span>
                {match.maxPlayers ? ` / ${match.maxPlayers}` : ""} signed up
              </div>
            </div>
            {match.description && <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-muted">{match.description}</p>}
            {match.result && (
              <p className="mt-4 font-display text-lg font-bold uppercase tracking-wider text-success">Result: {match.result}</p>
            )}
          </Card>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="display text-2xl">Roster</h2>
              <div className="flex gap-3 text-xs text-muted">
                {byPosition.map(({ p, n }) => (
                  <span key={p}>
                    <span className="text-text">{n}</span> {p}
                  </span>
                ))}
              </div>
            </div>
            <ul className="panel divide-y divide-line">
              {match.signups.length === 0 && <li className="px-4 py-6 text-center text-sm text-muted">No signups yet. Be the first.</li>}
              {match.signups.map((s) => (
                <li key={s.id} className={`flex items-center gap-3 px-4 py-3 ${s.userId === me.id ? "bg-accent/5" : ""}`}>
                  <Avatar name={s.user.displayName} size="sm" tone={roleTone(s.user.role)} />
                  <div className="min-w-0 flex-1">
                    <p className="display truncate text-lg">
                      {s.user.displayName} {s.userId === me.id && <span className="text-xs text-accent">(you)</span>}
                    </p>
                    <p className="text-xs text-muted">
                      {s.user.gameClass ?? "—"} · {s.position}
                      {s.note ? ` · ${s.note}` : ""}
                    </p>
                  </div>
                  <Badge tone={statusTone(s.status)}>{s.status}</Badge>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div>
          <Card accent>
            <p className="eyebrow">{mine ? "Your signup" : "Sign up"}</p>
            {mine && (
              <div className="mt-3 flex items-center justify-between border-b border-line pb-3">
                <span className="text-sm text-muted">Status</span>
                <Badge tone={statusTone(mine.status)}>{mine.status}</Badge>
              </div>
            )}
            {open ? (
              <>
                {!mine && full ? (
                  <p className="mt-3 text-sm text-muted">This match is full. Ask an officer in Discord to be added to the bench.</p>
                ) : (
                  <div className="mt-4">
                    <MatchSignupForm matchId={match.id} existing={mine ? { position: mine.position, note: mine.note } : null} defaultPosition={defaultPositionFor(me.gameClass)} />
                  </div>
                )}
                {mine && (
                  <form action={withdrawSignupAction} className="mt-4 border-t border-line pt-4">
                    <input type="hidden" name="matchId" value={match.id} />
                    <ConfirmSubmit variant="danger" size="sm" message="Withdraw from this match?">
                      Withdraw signup
                    </ConfirmSubmit>
                  </form>
                )}
              </>
            ) : (
              <p className="mt-3 text-sm text-muted">
                {match.status === "LOCKED" ? "The roster is locked. Contact an officer for changes." : "Signups are closed for this match."}
              </p>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
