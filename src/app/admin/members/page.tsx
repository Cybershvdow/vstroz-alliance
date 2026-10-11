import { db } from "@/lib/db";
import { requireOfficer } from "@/lib/auth";
import { setMemberRoleAction, setMemberTitleAction, removeMemberAction } from "@/lib/actions/admin";
import { formatDate } from "@/lib/format";
import { avatarUrl } from "@/lib/avatar";
import { Avatar, Badge, Button, PageHeader } from "@/components/ui";
import { site } from "@/lib/site";
import { allianceRank, playedGamesOf } from "@/lib/constants";
import { ConfirmSubmit } from "@/components/forms/SubmitButton";

export default async function MembersPage() {
  const me = await requireOfficer();
  // Everyone in the alliance, in the legion or not. Accounts hidden after leaving the Discord are left out.
  const members = await db.user.findMany({ where: { discordLeftAt: null }, orderBy: [{ createdAt: "asc" }, { id: "asc" }] });
  // Rank first; the sort is stable, so within a rank the earliest account comes first.
  members.sort((a, b) => allianceRank(a).order - allianceRank(b).order);
  const isLeader = me.role === "LEADER";

  return (
    <>
      <PageHeader title="Alliance members" text={`${members.length} in the alliance. ${isLeader ? "As a General you can promote and demote Captains." : "Only a General can promote or demote Captains. Ranks are managed on the Ranks page."}`} />

      <ul className="panel divide-y divide-line">
        {members.map((u) => {
          const self = u.id === me.id;
          const protectedTarget = u.role !== "MEMBER" && !isLeader;
          const rank = allianceRank(u);
          return (
            <li key={u.id} className="grid gap-4 px-4 py-4 lg:grid-cols-[1.4fr_1fr_auto] lg:items-center">
              <div className="flex items-center gap-3">
                <Avatar name={u.displayName} tone={rank.tone} src={avatarUrl(u)} />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="display text-xl">{u.displayName}</p>
                    <Badge tone={rank.tone}>{rank.label}</Badge>
                    {u.status === "APPROVED" && <Badge tone="success">{site.legionName}</Badge>}
                    {self && <Badge tone="neutral">You</Badge>}
                  </div>
                  <p className="text-xs text-muted">
                    @{u.username} · {playedGamesOf(u).join(", ") || "no games picked"} · {u.discord ?? "no discord"} · since {formatDate(u.createdAt)}
                  </p>
                </div>
              </div>

              <form action={setMemberTitleAction} className="flex gap-2">
                <input type="hidden" name="userId" value={u.id} />
                <input name="title" defaultValue={u.title ?? ""} placeholder="Title, e.g. Siege Lead" className="input" maxLength={40} />
                <Button type="submit" size="sm" variant="secondary">
                  Save
                </Button>
              </form>

              <div className="flex flex-wrap gap-2 lg:justify-end">
                {isLeader && !self && u.role !== "LEADER" && (
                  <form action={setMemberRoleAction}>
                    <input type="hidden" name="userId" value={u.id} />
                    <input type="hidden" name="role" value={u.role === "OFFICER" ? "MEMBER" : "OFFICER"} />
                    <Button type="submit" size="sm" variant={u.role === "OFFICER" ? "ghost" : "gold"}>
                      {u.role === "OFFICER" ? "Demote" : "Promote to officer"}
                    </Button>
                  </form>
                )}
                {!self && !protectedTarget && u.role !== "LEADER" && (
                  <form action={removeMemberAction}>
                    <input type="hidden" name="userId" value={u.id} />
                    <ConfirmSubmit size="sm" variant="danger" message={`Remove ${u.displayName} from the alliance? Their account is deleted. Announcements, votes and disputes they created are re-attributed to you; their videos move to the Vstroz Alliance folder.`}>
                      Remove
                    </ConfirmSubmit>
                  </form>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
