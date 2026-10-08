import { db } from "@/lib/db";
import { requireApproved } from "@/lib/auth";
import { deleteOwnMediaAction } from "@/lib/actions/community";
import { thumbnailFor } from "@/lib/media";
import { formatDate } from "@/lib/format";
import { Badge, ButtonLink, Card, EmptyState, PageHeader } from "@/components/ui";
import { MediaForm } from "@/components/forms/CommunityForms";
import { ConfirmSubmit } from "@/components/forms/SubmitButton";

export default async function MyMediaPage() {
  const me = await requireApproved();
  const mine = await db.mediaPost.findMany({ where: { postedById: me.id }, orderBy: { createdAt: "desc" } });

  return (
    <>
      <PageHeader title="Post content" text="Share YouTube or Twitch links. Officers approve posts before they appear on the public Media page." actions={<ButtonLink href="/media" variant="secondary">View Media page</ButtonLink>} />
      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <Card accent className="h-fit">
          <MediaForm />
        </Card>
        <div>
          <h2 className="display mb-3 text-2xl">Your posts</h2>
          {mine.length === 0 ? (
            <EmptyState title="Nothing posted yet" text="Highlights, guides, VODs, clips. Anything that shows the alliance." />
          ) : (
            <ul className="space-y-2">
              {mine.map((p) => {
                const thumb = thumbnailFor(p);
                return (
                  <li key={p.id} className="panel flex items-center gap-4 p-3">
                    <span className="relative aspect-video w-32 shrink-0 overflow-hidden bg-black">
                      {thumb ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={thumb} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center font-display text-xs uppercase tracking-widest text-[#c9a8ff]">Twitch</span>
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="display truncate text-lg">{p.title}</p>
                      <p className="text-xs text-muted">
                        {formatDate(p.createdAt)}
                        {p.game ? ` · ${p.game}` : ""}
                      </p>
                      <div className="mt-1 flex gap-1.5">
                        <Badge tone={p.approved ? "success" : "warning"}>{p.approved ? "Live" : "Awaiting approval"}</Badge>
                        {p.featured && <Badge tone="gold">Featured</Badge>}
                      </div>
                    </div>
                    <form action={deleteOwnMediaAction}>
                      <input type="hidden" name="id" value={p.id} />
                      <ConfirmSubmit size="sm" variant="ghost" message="Remove this post?">
                        Remove
                      </ConfirmSubmit>
                    </form>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
