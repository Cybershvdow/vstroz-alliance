import { db } from "@/lib/db";
import { requireOfficer } from "@/lib/auth";
import { deleteAnnouncementAction } from "@/lib/actions/admin";
import { formatDate } from "@/lib/format";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { AnnouncementForm } from "@/components/forms/AdminForms";
import { ConfirmSubmit } from "@/components/forms/SubmitButton";

export default async function AdminAnnouncementsPage() {
  await requireOfficer();
  const announcements = await db.announcement.findMany({
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    include: { author: { select: { displayName: true } } },
  });

  return (
    <>
      <PageHeader title="Announcements" text="Posts appear on every member's portal overview." />
      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        <div>
          {announcements.length === 0 ? (
            <EmptyState title="No announcements yet" />
          ) : (
            <ul className="space-y-3">
              {announcements.map((a) => (
                <li key={a.id} className={`panel p-5 ${a.pinned ? "border-gold/40" : ""}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        {a.pinned && <Badge tone="gold">Pinned</Badge>}
                        <span className="text-xs text-dim">
                          {a.author.displayName} · {formatDate(a.createdAt)}
                        </span>
                      </div>
                      <h2 className="display mt-2 text-2xl">{a.title}</h2>
                      <p className="mt-2 whitespace-pre-line text-sm text-muted">{a.body}</p>
                    </div>
                    <form action={deleteAnnouncementAction}>
                      <input type="hidden" name="id" value={a.id} />
                      <ConfirmSubmit size="sm" variant="ghost" message="Delete this announcement?">
                        Delete
                      </ConfirmSubmit>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <Card accent className="h-fit">
          <h2 className="display mb-4 text-2xl">New post</h2>
          <AnnouncementForm />
        </Card>
      </div>
    </>
  );
}
