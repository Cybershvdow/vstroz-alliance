import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { site } from "@/lib/site";
import { ROLE_LABEL, type UserRole } from "@/lib/constants";
import { embedSrc, folderHref, thumbnailFor } from "@/lib/media";
import { formatDate } from "@/lib/format";
import { Badge, ButtonLink, SectionHeading } from "@/components/ui";
import { FolderCard, firstThumb } from "@/components/site/MediaFolders";
import { ArrowIcon } from "@/components/site/Icons";

export const metadata: Metadata = { title: "Media" };
export const dynamic = "force-dynamic";

const SOCIAL_LABEL: Record<string, string> = { youtube: "YouTube", twitch: "Twitch", tiktok: "TikTok", x: "X", instagram: "Instagram" };

/** Media overview: one folder for official Vstroz Alliance content, one folder per member who has posted. */
export default async function MediaPage() {
  const parent = new URL(process.env.APP_URL || "http://localhost:3000").hostname;
  const posts = await db.mediaPost.findMany({
    where: { approved: true },
    orderBy: { createdAt: "desc" },
    include: { postedBy: { select: { id: true, username: true, displayName: true, role: true } } },
  });

  const official = posts.filter((p) => p.official);
  const personal = posts.filter((p) => !p.official);

  // One folder per poster, most prolific first, newest activity breaking ties.
  const byPoster = new Map<string, { user: (typeof posts)[number]["postedBy"]; posts: typeof posts }>();
  for (const p of personal) {
    const entry = byPoster.get(p.postedById) ?? { user: p.postedBy, posts: [] };
    entry.posts.push(p);
    byPoster.set(p.postedById, entry);
  }
  const people = [...byPoster.values()].sort(
    (a, b) => b.posts.length - a.posts.length || b.posts[0].createdAt.getTime() - a.posts[0].createdAt.getTime(),
  );
  const latest = posts.slice(0, 6);
  const socials = Object.entries(site.social).filter(([, url]) => url);

  return (
    <>
      <section className="mx-auto max-w-7xl px-4 pb-10 pt-32 md:px-6 md:pt-40">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <SectionHeading
            eyebrow="Media"
            title="Highlights, streams, and guides."
            text="Official Vstroz Alliance content in its own folder. Every member who posts gets a folder of their own."
          />
          <div className="flex flex-wrap gap-2">
            {socials.map(([k, url]) => (
              <a
                key={k}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="cut-sm border border-gold/35 bg-white/[0.03] px-4 py-2 font-display text-[0.72rem] font-bold uppercase tracking-[0.18em] hover:border-gold/70"
              >
                {SOCIAL_LABEL[k] ?? k}
              </a>
            ))}
            <ButtonLink href="/dashboard/media" variant="secondary">
              Post content <ArrowIcon />
            </ButtonLink>
          </div>
        </div>
      </section>

      {site.twitchChannel && (
        <section className="mx-auto max-w-7xl px-4 pb-12 md:px-6">
          <p className="eyebrow mb-3">Live channel</p>
          <div className="panel cut p-2">
            <div className="relative aspect-video w-full bg-black">
              <iframe
                src={embedSrc({ provider: "TWITCH", embedId: site.twitchChannel, kind: "channel" }, parent)}
                title="Live stream"
                className="absolute inset-0 h-full w-full"
                allowFullScreen
              />
            </div>
          </div>
        </section>
      )}

      {/* Folders */}
      <section className="mx-auto max-w-7xl px-4 pb-16 md:px-6">
        <p className="eyebrow mb-4">Folders</p>
        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <FolderCard
            kind="alliance"
            href="/media/alliance"
            name={site.name}
            subtitle="Official content from the command"
            count={official.length}
            thumb={firstThumb(official)}
          />
          {people.map(({ user, posts: theirs }) => (
            <FolderCard
              key={user.id}
              kind="member"
              href={`/media/members/${encodeURIComponent(user.username)}`}
              name={user.displayName}
              subtitle={`@${user.username}${user.role !== "MEMBER" ? ` · ${ROLE_LABEL[user.role as UserRole]}` : ""}`}
              count={theirs.length}
              thumb={firstThumb(theirs)}
              role={user.role}
            />
          ))}
        </ul>
        {people.length === 0 && (
          <div className="panel mt-4 border-dashed p-8 text-center">
            <p className="display text-xl text-muted">No member folders yet</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-dim">
              The first member to post a YouTube or Twitch link gets a folder here with everything they share.
            </p>
          </div>
        )}
      </section>

      {/* Latest across all folders */}
      {latest.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-24 md:px-6">
          <div className="flex items-end justify-between gap-6">
            <p className="eyebrow">Latest drops</p>
            <Link href="/media/alliance" className="font-display text-[0.7rem] font-bold uppercase tracking-[0.2em] text-gold transition hover:text-gold-bright">
              Alliance folder →
            </Link>
          </div>
          <ul className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {latest.map((p) => {
              const thumb = thumbnailFor(p);
              return (
                <li key={p.id} className="panel cut group overflow-hidden transition hover:-translate-y-1">
                  <Link href={folderHref(p, p.id)} className="block">
                    <span className="relative block aspect-video w-full bg-black">
                      {thumb ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={thumb} alt="" className="h-full w-full object-cover transition group-hover:scale-[1.03]" loading="lazy" />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center font-display text-sm uppercase tracking-widest text-[#c9a8ff]">Twitch</span>
                      )}
                      {(p.official || p.featured) && (
                        <Badge tone="gold" className="absolute left-3 top-3">
                          {p.official ? "Official" : "Featured"}
                        </Badge>
                      )}
                    </span>
                    <span className="block p-5">
                      <span className="text-xs text-muted">
                        {p.official ? site.name : p.postedBy.displayName} · {formatDate(p.createdAt)}
                        {p.game ? ` · ${p.game}` : ""}
                      </span>
                      <span className="display mt-2 block text-xl">{p.title}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </>
  );
}
