import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { playedGamesOf } from "@/lib/constants";
import { cancelPlaySessionAction, togglePlayJoinAction } from "@/lib/actions/social";
import { Button, Card, EmptyState, PageHeader } from "@/components/ui";
import { GameTag } from "@/components/site/GameTag";
import { LocalTime, PlayForm } from "@/components/forms/PlayForm";
import { ConfirmSubmit } from "@/components/forms/SubmitButton";

export default async function PlayPage() {
  const me = await requireUser();
  // Sessions stay listed until two hours after they start, so latecomers can still see who is on.
  const sessions = await db.playSession.findMany({
    where: { startsAt: { gte: new Date(Date.now() - 2 * 3_600_000) }, host: { discordLeftAt: null } },
    orderBy: { startsAt: "asc" },
    include: { host: { select: { displayName: true, username: true } }, joins: { orderBy: { createdAt: "asc" }, include: { user: { select: { id: true, displayName: true, username: true } } } } },
  });

  return (
    <>
      <PageHeader title="Who is playing" text="Say what you are playing and when. Others tap I'm in, and it posts to Discord so nobody misses it." />
      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <Card accent>
          <h2 className="display text-2xl">I&apos;m playing</h2>
          <p className="mb-4 mt-1 text-sm text-muted">No schedule needed. Tonight, tomorrow, whenever.</p>
          <PlayForm games={playedGamesOf(me)} />
        </Card>

        <div className="space-y-3">
          {sessions.length === 0 ? (
            <EmptyState title="Nobody has posted yet" text="Be the first. Pick a game and a time." />
          ) : (
            sessions.map((s) => {
              const mine = s.hostId === me.id;
              const inIt = s.joins.some((j) => j.user.id === me.id);
              return (
                <div key={s.id} className="panel cut p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <GameTag game={s.game} compact />
                        <span className="display text-lg">
                          <LocalTime iso={s.startsAt.toISOString()} />
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-muted">
                        Posted by{" "}
                        <Link href={`/members/${encodeURIComponent(s.host.username)}`} className="text-text hover:text-gold">
                          {s.host.displayName}
                        </Link>
                        {s.note ? ` · ${s.note}` : ""}
                      </p>
                    </div>
                    {mine || me.role !== "MEMBER" ? (
                      <form action={cancelPlaySessionAction}>
                        <input type="hidden" name="sessionId" value={s.id} />
                        <ConfirmSubmit size="sm" variant="secondary" message="Cancel this session?">
                          Cancel
                        </ConfirmSubmit>
                      </form>
                    ) : null}
                    {!mine && (
                      <form action={togglePlayJoinAction}>
                        <input type="hidden" name="sessionId" value={s.id} />
                        <Button type="submit" size="sm" variant={inIt ? "secondary" : "gold"}>
                          {inIt ? "I'm out" : "I'm in"}
                        </Button>
                      </form>
                    )}
                  </div>
                  <p className="mt-3 text-sm">
                    <span className="label mr-2">In · {s.joins.length}</span>
                    <span className="text-muted">{s.joins.map((j) => j.user.displayName).join(", ")}</span>
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
