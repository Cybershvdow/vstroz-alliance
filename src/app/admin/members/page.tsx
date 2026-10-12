import { db } from "@/lib/db";
import { requireOfficer } from "@/lib/auth";
import { setMemberRoleAction, setMemberSpecialtiesAction, setMemberTitleAction, removeMemberAction } from "@/lib/actions/admin";
import { formatDate } from "@/lib/format";
import { avatarUrl } from "@/lib/avatar";
import { Avatar, Badge, Button, PageHeader } from "@/components/ui";
import { site } from "@/lib/site";
import { ROLE_LABEL, SPECIALTIES, allianceRank, playedGamesOf, specialtiesOf } from "@/lib/constants";
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
      <PageHeader title="Alliance members" text={`${members.length} in the alliance. ${isLeader ? "As a Legatus you appoint Tribunes and Centurions and hand out specialty roles." : "Only a Legatus can appoint command or hand out specialty roles. Ladder ranks are managed on the Ranks page."}`} />

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
                    <Badge tone={rank.tone}>{rank.full}</Badge>
                    {specialtiesOf(u).map((s) => (
                      <Badge key={s.key} tone="cyan">
                        {s.label}
                      </Badge>
                    ))}
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
                  <form action={setMemberRoleAction} className="flex gap-2">
                    <input type="hidden" name="userId" value={u.id} />
                    <label className="sr-only" htmlFor={`role-${u.id}`}>
                      Command rank for {u.displayName}
                    </label>
                    <select id={`role-${u.id}`} name="role" defaultValue={u.role} className="input w-auto py-1.5 text-sm">
                      <option value="MEMBER">No command rank</option>
                      <option value="OFFICER">{ROLE_LABEL.OFFICER} (Captain)</option>
                      <option value="TRIBUNE">{ROLE_LABEL.TRIBUNE} (Lieutenant)</option>
                    </select>
                    <Button type="submit" size="sm" variant="gold">
                      Set
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
              {isLeader && (
                <form action={setMemberSpecialtiesAction} className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-3 lg:col-span-3">
                  <input type="hidden" name="userId" value={u.id} />
                  <span className="label">Specialty roles</span>
                  {SPECIALTIES.map((s) => (
                    <label key={s.key} className="flex items-center gap-2 text-sm text-muted">
                      <input type="checkbox" name="specialty" value={s.key} defaultChecked={specialtiesOf(u).some((x) => x.key === s.key)} className="h-4 w-4 accent-[#9b4dff]" />
                      {s.label} <span className="text-dim">({s.plain})</span>
                    </label>
                  ))}
                  <Button type="submit" size="sm" variant="secondary">
                    Save roles
                  </Button>
                </form>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}
