import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { site } from "@/lib/site";
import { formatDate } from "@/lib/format";
import { reviewPollAction } from "@/lib/actions/social";
import { Badge, Button, Card, EmptyState, PageHeader } from "@/components/ui";
import { PollForm } from "@/components/forms/PollForm";

const LENGTH: Record<number, string> = { 24: "1 day", 48: "2 days", 72: "3 days", 168: "1 week" };

export default async function PollsPage() {
  const me = await requireUser();
  const officer = me.role !== "MEMBER" && !me.discordLeftAt;
  const rows = await db.pollRequest.findMany({
    where: officer ? {} : { OR: [{ userId: me.id }, { status: "POSTED" }] },
    orderBy: { createdAt: "desc" },
    take: 30,
    include: { user: { select: { displayName: true } } },
  });
  const link = (id: string) => `https://discord.com/channels/${process.env.DISCORD_GUILD_ID ?? ""}/${site.discordVotesChannelId}/${id}`;

  return (
    <>
      <PageHeader
        title="Vote questions"
        text={
          officer
            ? "Members ask for a vote here. Approve one and the bot posts it in Discord with a timer. Everyone votes there."
            : "Want the alliance to vote on something? Ask here. Once an officer approves it, it is posted in Discord with a timer and everyone votes there."
        }
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <Card accent>
          <h2 className="display text-2xl">{officer ? "Post a vote" : "Request a vote"}</h2>
          <p className="mb-4 mt-1 text-sm text-muted">Keep the question clear and the answers short.</p>
          <PollForm officer={officer} />
        </Card>

        <div className="space-y-3">
          {rows.length === 0 ? (
            <EmptyState title="No vote questions yet" text="The first one is yours to ask." />
          ) : (
            rows.map((r) => {
              const options = JSON.parse(r.options) as string[];
              const open = r.status === "POSTED" && !!r.postedAt && r.postedAt.getTime() + r.hours * 3_600_000 > Date.now();
              return (
                <div key={r.id} className="panel cut p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <p className="display min-w-0 flex-1 text-lg [overflow-wrap:anywhere]">{r.question}</p>
                    <Badge tone={r.status === "PENDING" ? "warning" : r.status === "DENIED" ? "danger" : open ? "success" : "neutral"}>
                      {r.status === "PENDING" ? "Waiting" : r.status === "DENIED" ? "Not approved" : open ? "Voting open" : "Closed"}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted">{options.join(" · ")}</p>
                  <p className="mt-1 text-xs text-dim">
                    Asked by {r.user.displayName} · {formatDate(r.createdAt)} · runs {LENGTH[r.hours] ?? `${r.hours} hours`}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {r.status === "POSTED" && r.messageId && (
                      <a href={link(r.messageId)} target="_blank" rel="noreferrer" className="text-sm text-gold underline underline-offset-4 hover:text-gold-bright">
                        {open ? "Vote in Discord" : "See the result in Discord"}
                      </a>
                    )}
                    {officer && r.status === "PENDING" && (
                      <form action={reviewPollAction} className="flex gap-2">
                        <input type="hidden" name="id" value={r.id} />
                        <Button type="submit" name="mode" value="approve" size="sm" variant="gold">
                          Approve and post
                        </Button>
                        <Button type="submit" name="mode" value="deny" size="sm" variant="secondary">
                          Decline
                        </Button>
                      </form>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
