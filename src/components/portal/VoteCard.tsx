import { castVoteAction, finalizeNominationAction } from "@/lib/actions/ranks";
import { tally } from "@/lib/ranks";
import { TIER_LABEL, VOTE_RULES, type Tier } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";
import { Avatar, Badge, Button, statusTone } from "@/components/ui";
import { ConfirmSubmit } from "@/components/forms/SubmitButton";
import { Countdown } from "@/components/site/Countdown";

export type NominationView = {
  id: string;
  tier: string;
  reason: string;
  status: string;
  closesAt: Date;
  createdAt: Date;
  user: { id: string; displayName: string; tier: string; gameClass: string | null; role: string };
  nominatedBy: { displayName: string };
  votes: { id: string; voterId: string; choice: string; comment: string | null; voter: { displayName: string } }[];
};

export function VoteCard({
  nom,
  viewer,
  canVote,
  officerControls = false,
  isLeader = false,
}: {
  nom: NominationView;
  viewer: { id: string };
  canVote: boolean;
  officerControls?: boolean;
  isLeader?: boolean;
}) {
  const t = tally(nom.votes);
  const mine = nom.votes.find((v) => v.voterId === viewer.id);
  const open = nom.status === "OPEN" && nom.closesAt > new Date();
  const ended = nom.status === "OPEN" && nom.closesAt <= new Date();
  const self = nom.user.id === viewer.id;
  const pct = t.counted ? Math.round(t.ratio * 100) : 0;
  const needed = Math.round(VOTE_RULES.passRatio * 100);

  return (
    <article className={`panel cut p-5 md:p-6 ${nom.status === "OPEN" ? "border-gold/40" : ""}`}>
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div className="flex gap-4">
          <Avatar name={nom.user.displayName} size="lg" tone={nom.tier === "ELITE" ? "gold" : "accent"} />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="display text-2xl">{nom.user.displayName}</h3>
              <Badge tone="neutral">{TIER_LABEL[nom.user.tier as Tier] ?? nom.user.tier}</Badge>
              <span className="text-muted">→</span>
              <Badge tone={nom.tier === "ELITE" ? "gold" : "accent"}>{TIER_LABEL[nom.tier as Tier] ?? nom.tier}</Badge>
              <Badge tone={nom.status === "OPEN" ? "warning" : statusTone(nom.status === "PASSED" ? "APPROVED" : "DENIED")}>{nom.status}</Badge>
            </div>
            <p className="mt-1 text-xs text-muted">
              Nominated by {nom.nominatedBy.displayName} · {formatDateTime(nom.createdAt)}
              {nom.user.gameClass ? ` · ${nom.user.gameClass}` : ""}
            </p>
            <p className="mt-3 max-w-xl text-sm text-muted">{nom.reason}</p>
          </div>
        </div>
        <div className="shrink-0 md:text-right">
          {open ? (
            <>
              <p className="label mb-1">Closes in</p>
              <Countdown iso={nom.closesAt.toISOString()} compact />
            </>
          ) : (
            <p className="text-xs text-muted">{ended ? "Voting ended, awaiting close" : `Decided ${nom.status.toLowerCase()}`}</p>
          )}
        </div>
      </div>

      {/* Tally */}
      <div className="mt-5 border-t border-line pt-4">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
          <span>
            <span className="text-success">{t.yes} yes</span> · <span className="text-danger">{t.no} no</span> · {t.abstain} abstain
          </span>
          <span>
            {t.counted}/{VOTE_RULES.quorum} needed for quorum · {pct}% yes ({needed}% to pass)
          </span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-sm bg-white/5">
          <div className={`h-full ${t.passing ? "bg-success" : "bg-gold"}`} style={{ width: `${pct}%` }} />
        </div>
        {nom.votes.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {nom.votes.map((v) => (
              <li key={v.id} title={officerControls ? (v.comment ?? undefined) : undefined}>
                <Badge tone={v.choice === "YES" ? "success" : v.choice === "NO" ? "danger" : "neutral"}>
                  {v.voter.displayName}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Actions */}
      {open && !self && canVote && (
        <form action={castVoteAction} className="mt-4 flex flex-wrap items-end gap-2 border-t border-line pt-4">
          <input type="hidden" name="nominationId" value={nom.id} />
          <div className="min-w-[200px] flex-1">
            <label className="label mb-1 block" htmlFor={`c-${nom.id}`}>
              {mine ? `Your vote: ${mine.choice}. Change it?` : "Your vote"}
            </label>
            <input id={`c-${nom.id}`} name="comment" className="input" placeholder="Optional comment for officers" maxLength={300} defaultValue={mine?.comment ?? ""} />
          </div>
          <Button type="submit" name="choice" value="YES" size="sm">
            Yes
          </Button>
          <Button type="submit" name="choice" value="NO" size="sm" variant="danger">
            No
          </Button>
          <Button type="submit" name="choice" value="ABSTAIN" size="sm" variant="ghost">
            Abstain
          </Button>
        </form>
      )}
      {open && self && <p className="mt-4 text-xs text-muted">You cannot vote on your own nomination.</p>}
      {open && !self && !canVote && (
        <p className="mt-4 text-xs text-muted">Only {TIER_LABEL[nom.tier as Tier]}s and above, plus officers, vote on this rank.</p>
      )}

      {officerControls && nom.status === "OPEN" && (
        <form action={finalizeNominationAction} className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
          <input type="hidden" name="nominationId" value={nom.id} />
          {(ended || isLeader) && (
            <ConfirmSubmit name="mode" value="close" size="sm" variant="gold" message={`Close this vote now and apply the result (${t.passing ? "PASS" : "FAIL"})?`}>
              {ended ? "Close & apply result" : "Close early & apply"}
            </ConfirmSubmit>
          )}
          <ConfirmSubmit name="mode" value="withdraw" size="sm" variant="secondary" message="Withdraw this nomination?">
            Withdraw
          </ConfirmSubmit>
          {isLeader && (
            <ConfirmSubmit name="mode" value="veto" size="sm" variant="danger" message="Veto this nomination? It fails regardless of votes.">
              Veto
            </ConfirmSubmit>
          )}
        </form>
      )}
    </article>
  );
}
