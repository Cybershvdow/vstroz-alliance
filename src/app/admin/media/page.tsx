import { db } from "@/lib/db";
import { requireOfficer } from "@/lib/auth";
import { reviewMediaAction } from "@/lib/actions/community";
import { thumbnailFor } from "@/lib/media";
import { formatDate } from "@/lib/format";
import { Badge, Button, ButtonLink, Card, EmptyState, PageHeader } from "@/components/ui";
import { MediaForm } from "@/components/forms/CommunityForms";
import { ConfirmSubmit } from "@/components/forms/SubmitButton";

export default async function AdminMediaPage() {
  await requireOfficer();
  const posts = await db.mediaPost.findMany({ orderBy: [{ approved: "asc" }, { featured: "desc" }, { createdAt: "desc" }], include: { postedBy: { select: { displayName: true } } } });
  const pending = posts.filter((p) => !p.approved);
  const live = posts.filter((p) => p.approved);

  const Row = ({ p }: { p: (typeof posts)[number] }) => {
    const thumb = thumbnailFor(p);
    return (
      <li className="panel flex flex-col gap-3 p-3 md:flex-row md:items-center">
        <span className="relative aspect-video w-full shrink-0 overflow-hidden bg-black md:w-36">
          {thumb ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={thumb} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center font-display text-xs uppercase tracking-widest text-[#a970ff]">Twitch</span>
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="display truncate text-lg">{p.title}</p>
          <p className="text-xs text-muted">
            {p.postedBy.displayName} · {formatDate(p.createdAt)}
            {p.game ? ` · ${p.game}` : ""} ·{" "}
            <a href={p.url} target="_blank" rel="noreferrer" className="text-gold hover:underline">
              open link
            </a>
          </p>
          <div className="mt-1 flex gap-1.5">
            <Badge tone={p.approved ? "success" : "warning"}>{p.approved ? "Live" : "Pending"}</Badge>
            {p.featured && <Badge tone="gold">Featured</Badge>}
          </div>
        </div>
        <form action={reviewMediaAction} className="flex flex-wrap gap-1.5">
          <input type="hidden" name="id" value={p.id} />
          {!p.approved && (
            <Button type="submit" name="mode" value="approve" size="sm">
              Approve
            </Button>
          )}
          {p.approved && !p.featured && (
            <Button type="submit" name="mode" value="feature" size="sm" variant="gold">
              Feature
            </Button>
          )}
          {p.featured && (
            <Button type="submit" name="mode" value="unfeature" size="sm" variant="secondary">
              Unfeature
            </Button>
          )}
          {p.approved && (
            <Button type="submit" name="mode" value="unapprove" size="sm" variant="ghost">
              Hide
            </Button>
          )}
          <ConfirmSubmit name="mode" value="delete" size="sm" variant="danger" message="Delete this post?">
            Delete
          </ConfirmSubmit>
        </form>
      </li>
    );
  };

  return (
    <>
      <PageHeader title="Media" text="Approve member posts, feature the best, and post official content." actions={<ButtonLink href="/media" variant="secondary">View Media page</ButtonLink>} />
      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        <div>
          <h2 className="display mb-3 text-2xl">
            Awaiting approval <span className="text-muted">({pending.length})</span>
          </h2>
          {pending.length === 0 ? <EmptyState title="Nothing pending" /> : <ul className="space-y-2">{pending.map((p) => <Row key={p.id} p={p} />)}</ul>}
          <h2 className="display mb-3 mt-10 text-2xl">
            Live <span className="text-muted">({live.length})</span>
          </h2>
          {live.length === 0 ? <EmptyState title="No content live yet" /> : <ul className="space-y-2">{live.map((p) => <Row key={p.id} p={p} />)}</ul>}
        </div>
        <Card accent className="h-fit">
          <h2 className="display mb-1 text-2xl">Post official content</h2>
          <p className="mb-4 text-xs text-muted">Officer posts go live immediately.</p>
          <MediaForm />
        </Card>
      </div>
    </>
  );
}
