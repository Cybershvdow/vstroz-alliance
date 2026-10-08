import { db } from "@/lib/db";
import { requireOfficer } from "@/lib/auth";
import { setMemberRoleAction, setMemberTitleAction, removeMemberAction } from "@/lib/actions/admin";
import { formatDate } from "@/lib/format";
import { Avatar, Badge, Button, PageHeader, roleTone } from "@/components/ui";
import { ROLE_LABEL, type UserRole } from "@/lib/constants";
import { ConfirmSubmit } from "@/components/forms/SubmitButton";

const ROLE_ORDER: Record<string, number> = { LEADER: 0, OFFICER: 1, MEMBER: 2 };

export default async function MembersPage() {
  const me = await requireOfficer();
  const members = await db.user.findMany({ where: { status: "APPROVED" }, orderBy: { createdAt: "asc" } });
  members.sort((a, b) => ROLE_ORDER[a.role] - ROLE_ORDER[b.role]);
  const isLeader = me.role === "LEADER";

  return (
    <>
      <PageHeader title="Legion members" text={`${members.length} in the legion. ${isLeader ? "As a General you can promote and demote Captains." : "Only a General can promote or demote Captains. Ranks are managed on the Ranks page."}`} />

      <ul className="panel divide-y divide-line">
        {members.map((u) => {
          const self = u.id === me.id;
          const protectedTarget = u.role !== "MEMBER" && !isLeader;
          return (
            <li key={u.id} className="grid gap-4 px-4 py-4 lg:grid-cols-[1.4fr_1fr_auto] lg:items-center">
              <div className="flex items-center gap-3">
                <Avatar name={u.displayName} tone={roleTone(u.role)} />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="display text-xl">{u.displayName}</p>
                    <Badge tone={roleTone(u.role)}>{ROLE_LABEL[u.role as UserRole]}</Badge>
                    {self && <Badge tone="neutral">You</Badge>}
                  </div>
                  <p className="text-xs text-muted">
                    @{u.username} · {u.gameClass ?? "No class"} · {u.discord ?? "no discord"} · since {formatDate(u.createdAt)}
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
