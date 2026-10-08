import { db } from "@/lib/db";
import { requireOfficer } from "@/lib/auth";
import { reviewRoleApplicationAction, toggleGuildRoleAction, deleteGuildRoleAction } from "@/lib/actions/admin";
import { formatDate } from "@/lib/format";
import { Avatar, Badge, Button, Card, EmptyState, PageHeader, statusTone } from "@/components/ui";
import { CreateRoleForm } from "@/components/forms/AdminForms";
import { ConfirmSubmit } from "@/components/forms/SubmitButton";

export default async function AdminRolesPage() {
  await requireOfficer();
  const [pending, roles] = await Promise.all([
    db.roleApplication.findMany({
      where: { status: "PENDING" },
      include: { role: true, user: { select: { displayName: true, gameClass: true, discord: true } } },
      orderBy: { createdAt: "asc" },
    }),
    db.guildRole.findMany({
      orderBy: { createdAt: "asc" },
      include: { applications: { where: { status: "APPROVED" }, include: { user: { select: { displayName: true } } } } },
    }),
  ]);

  return (
    <>
      <PageHeader title="Guild roles" text="Define positions members can apply for, then approve the right people." />

      <h2 className="display mb-3 text-2xl">
        Pending applications <span className="text-muted">({pending.length})</span>
      </h2>
      {pending.length === 0 ? (
        <EmptyState title="Nothing to review" />
      ) : (
        <ul className="space-y-3">
          {pending.map((a) => (
            <li key={a.id} className="panel panel-accent cut grid gap-4 p-5 md:grid-cols-[1fr_260px]">
              <div className="flex gap-3">
                <Avatar name={a.user.displayName} />
                <div>
                  <p className="display text-2xl">
                    {a.user.displayName} <span className="text-muted">→</span> {a.role.name}
                  </p>
                  <p className="text-xs text-muted">
                    {a.user.gameClass ?? "—"} · {a.user.discord ?? "no discord"} · {formatDate(a.createdAt)}
                  </p>
                  <p className="mt-3 whitespace-pre-line text-sm text-muted">{a.message}</p>
                </div>
              </div>
              <form action={reviewRoleApplicationAction} className="flex flex-col gap-2">
                <input type="hidden" name="applicationId" value={a.id} />
                <input name="note" className="input" placeholder="Note (optional)" maxLength={300} />
                <div className="grid grid-cols-2 gap-2">
                  <Button type="submit" name="decision" value="APPROVED" size="sm">
                    Approve
                  </Button>
                  <Button type="submit" name="decision" value="DENIED" size="sm" variant="danger">
                    Deny
                  </Button>
                </div>
              </form>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-12 grid gap-6 lg:grid-cols-[1fr_380px]">
        <div>
          <h2 className="display mb-3 text-2xl">All roles</h2>
          <ul className="panel divide-y divide-line">
            {roles.length === 0 && <li className="px-4 py-6 text-center text-sm text-muted">No roles yet.</li>}
            {roles.map((r) => (
              <li key={r.id} className="grid gap-3 px-4 py-4 md:grid-cols-[1fr_auto] md:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="display text-xl">{r.name}</p>
                    <Badge tone={r.isOpen ? "success" : "neutral"}>{r.isOpen ? "Open" : "Closed"}</Badge>
                    <Badge tone={statusTone(r.applications.length >= r.slots ? "LOCKED" : "OPEN")}>
                      {r.applications.length}/{r.slots} filled
                    </Badge>
                  </div>
                  {r.description && <p className="mt-1 text-sm text-muted">{r.description}</p>}
                  {r.applications.length > 0 && (
                    <p className="mt-1 text-xs text-gold">Held by: {r.applications.map((a) => a.user.displayName).join(", ")}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <form action={toggleGuildRoleAction}>
                    <input type="hidden" name="roleId" value={r.id} />
                    <Button type="submit" size="sm" variant="secondary">
                      {r.isOpen ? "Close" : "Reopen"}
                    </Button>
                  </form>
                  <form action={deleteGuildRoleAction}>
                    <input type="hidden" name="roleId" value={r.id} />
                    <ConfirmSubmit size="sm" variant="danger" message={`Delete "${r.name}" and all its applications?`}>
                      Delete
                    </ConfirmSubmit>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <Card accent className="h-fit">
          <h2 className="display mb-4 text-2xl">New role</h2>
          <CreateRoleForm />
        </Card>
      </div>
    </>
  );
}
