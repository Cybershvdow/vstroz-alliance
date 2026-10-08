import type { Metadata } from "next";
import { db } from "@/lib/db";
import { site } from "@/lib/site";
import { embedSrc } from "@/lib/media";
import { ButtonLink, SectionHeading } from "@/components/ui";
import { MediaPlayer, type MediaItem } from "@/components/site/MediaPlayer";
import { ArrowIcon } from "@/components/site/Icons";

export const metadata: Metadata = { title: "Media" };
export const dynamic = "force-dynamic";

const SOCIAL_LABEL: Record<string, string> = { youtube: "YouTube", twitch: "Twitch", tiktok: "TikTok", x: "X", instagram: "Instagram" };

export default async function MediaPage() {
  const parent = new URL(process.env.APP_URL || "http://localhost:3000").hostname;
  const posts = await db.mediaPost.findMany({
    where: { approved: true },
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    include: { postedBy: { select: { displayName: true } } },
  });
  const items: MediaItem[] = posts.map((p) => ({
    id: p.id,
    title: p.title,
    provider: p.provider,
    embedId: p.embedId,
    description: p.description,
    game: p.game,
    postedBy: p.postedBy.displayName,
    createdAt: p.createdAt.toISOString(),
    featured: p.featured,
  }));
  const socials = Object.entries(site.social).filter(([, url]) => url);

  return (
    <>
      <section className="mx-auto max-w-7xl px-4 pb-10 pt-32 md:px-6 md:pt-40">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <SectionHeading eyebrow="Media" title="Highlights, streams, and guides." text="Content from the alliance and its members. Members post; officers approve; it lands here." />
          <div className="flex flex-wrap gap-2">
            {socials.map(([k, url]) => (
              <a key={k} href={url} target="_blank" rel="noreferrer" className="cut-sm border border-gold/35 bg-white/[0.03] px-4 py-2 font-display text-[0.72rem] font-bold uppercase tracking-[0.18em] hover:border-gold/70">
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
              <iframe src={embedSrc({ provider: "TWITCH", embedId: site.twitchChannel }, parent)} title="Live stream" className="absolute inset-0 h-full w-full" allowFullScreen />
            </div>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 pb-24 md:px-6">
        {items.length === 0 ? (
          <div className="panel border-dashed p-12 text-center">
            <p className="display text-2xl text-muted">No content yet</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-dim">The first highlights land after launch. Members can post YouTube and Twitch links from the portal.</p>
            <div className="mt-6 flex justify-center">
              <ButtonLink href="/dashboard/media">Post the first video</ButtonLink>
            </div>
          </div>
        ) : (
          <MediaPlayer items={items} parent={parent} />
        )}
      </section>
    </>
  );
}
