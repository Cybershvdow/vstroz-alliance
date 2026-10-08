import { db } from "@/lib/db";
import { requireApproved } from "@/lib/auth";
import { withdrawRoleApplicationAction } from "@/lib/actions/member";
import { Badge, EmptyState, PageHeader, statusTone } from "@/components/ui";
import { RoleApplyForm } from "@/components/forms/MemberForms";
import { ConfirmSubmit } from "@/components/forms/SubmitButton";

export default async function RolesPage() {
  const me = await requireApproved();

  const roles = await db.guildRole.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      applications: {
        where: { status: "APPROVED" },
        include: { user: { select: { displayName: true } } },
      },
    },
  });
  const myApps = await db.roleApplication.findMany({ where: { userId: me.id } });
  const mineFor = (roleId: string) => myApps.find((a) => a.roleId === roleId);

  return (
    <>
      <PageHeader title="Guild roles" text="Leadership positions inside the alliance. Apply for what you can own. Officers review every application." />

      {roles.length === 0 ? (
        <EmptyState title="No roles posted yet" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {roles.map((r) => {
            const mine = mineFor(r.id);
            const filled = r.applications.length;
            const canApply = r.isOpen && filled < r.slots && (!mine || mine.status === "DENIED");
            return (
              <article key={r.id} className="panel cut flex flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="display text-2xl">{r.name}</h2>
                  <Badge tone={r.isOpen && filled < r.slots ? "success" : "neutral"}>
                    {filled}/{r.slots} filled
                  </Badge>
                </div>
                {r.description && <p className="mt-2 text-sm text-muted">{r.description}</p>}

                {r.applications.length > 0 && (
                  <div className="mt-4">
                    <p className="label mb-1">Held by</p>
                    <div className="flex flex-wrap gap-2">
                      {r.applications.map((a) => (
                        <Badge key={a.id} tone="gold">
                          {a.user.displayName}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-5 border-t border-line pt-4">
                  {mine && mine.status !== "DENIED" ? (
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="label">Your application</p>
                        <Badge tone={statusTone(mine.status)} className="mt-1">
                          {mine.status}
                        </Badge>
                        {mine.reviewNote && <p className="mt-2 text-xs text-muted">Note: {mine.reviewNote}</p>}
                      </div>
                      {mine.status === "PENDING" && (
                        <form action={withdrawRoleApplicationAction}>
                          <input type="hidden" name="roleId" value={r.id} />
                          <ConfirmSubmit variant="ghost" size="sm" message="Withdraw this application?">
                            Withdraw
                          </ConfirmSubmit>
                        </form>
                      )}
                    </div>
                  ) : canApply ? (
                    <>
                      {mine?.status === "DENIED" && (
                        <p className="mb-3 text-xs text-muted">
                          Previous application declined{mine.reviewNote ? `: ${mine.reviewNote}` : "."} You can re-apply.
                        </p>
                      )}
                      <RoleApplyForm roleId={r.id} />
                    </>
                  ) : (
                    <p className="text-sm text-muted">{!r.isOpen ? "Applications closed." : "All slots are filled."}</p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
