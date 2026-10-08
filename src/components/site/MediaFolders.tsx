import Link from "next/link";
import type { ReactNode } from "react";
import { Avatar, Badge, roleTone } from "@/components/ui";
import { LogoMark } from "@/components/brand/Logo";
import { MediaPlayer, type MediaItem } from "@/components/site/MediaPlayer";
import { thumbnailFor } from "@/lib/media";

/* ---------------- Shared helpers ---------------- */

type PostRow = {
  id: string;
  title: string;
  provider: string;
  embedId: string;
  kind: string;
  description: string;
  game: string | null;
  createdAt: Date;
  featured: boolean;
  postedBy: { displayName: string };
};

/** Map database rows to what the player needs (dates serialised for the client). `creditAs` overrides the poster label. */
export function toItems(posts: PostRow[], creditAs?: string): MediaItem[] {
  return posts.map((p) => ({
    id: p.id,
    title: p.title,
    provider: p.provider,
    embedId: p.embedId,
    kind: p.kind,
    description: p.description,
    game: p.game,
    postedBy: creditAs ?? p.postedBy.displayName,
    createdAt: p.createdAt.toISOString(),
    featured: p.featured,
  }));
}

/** First post in the list that has a thumbnail (YouTube). Twitch has none. */
export function firstThumb(posts: { provider: string; embedId: string }[]) {
  for (const p of posts) {
    const t = thumbnailFor(p);
    if (t) return t;
  }
  return null;
}

/* ---------------- Folder card (Media overview) ---------------- */

export function FolderCard({
  href,
  name,
  subtitle,
  count,
  thumb,
  kind,
  role = "MEMBER",
}: {
  href: string;
  name: string;
  subtitle?: string;
  count: number;
  thumb: string | null;
  kind: "alliance" | "member";
  role?: string;
}) {
  const alliance = kind === "alliance";
  return (
    <li>
      <Link
        href={href}
        className={`panel cut group relative block overflow-hidden transition hover:-translate-y-1 ${alliance ? "border-gold/40" : ""}`}
      >
        {alliance && <div className="bg-glow-accent absolute inset-0 opacity-50" />}
        <span className="relative block aspect-video w-full bg-black">
          {thumb ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumb}
              alt=""
              className="h-full w-full object-cover opacity-75 transition group-hover:scale-[1.03] group-hover:opacity-100"
              loading="lazy"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_50%_40%,#2a1d4a,#07060b)]">
              {alliance ? (
                <span aria-hidden>
                  <LogoMark className="h-24 w-24 drop-shadow-[0_0_24px_rgba(155,77,255,0.5)]" title="" />
                </span>
              ) : (
                <Avatar name={name} size="lg" tone={roleTone(role)} />
              )}
            </span>
          )}
          <span className="absolute left-3 top-3">
            <Badge tone={alliance ? "gold" : "neutral"}>{alliance ? "Official" : "Member"}</Badge>
          </span>
          <span className="absolute bottom-3 right-3 border border-line-strong bg-black/70 px-2 py-0.5 font-display text-[0.66rem] font-bold uppercase tracking-[0.2em] text-text">
            {count} {count === 1 ? "video" : "videos"}
          </span>
        </span>
        <span className="relative flex items-center gap-3 p-4">
          {alliance ? (
            <span aria-hidden>
              <LogoMark className="h-9 w-9" title="" />
            </span>
          ) : (
            <Avatar name={name} size="sm" tone={roleTone(role)} />
          )}
          <span className="min-w-0 flex-1">
            <span className="display block truncate text-xl">{name}</span>
            {subtitle && <span className="block truncate text-xs text-muted">{subtitle}</span>}
          </span>
          <span className="font-display text-[0.68rem] font-bold uppercase tracking-[0.2em] text-gold transition group-hover:text-gold-bright">
            Open →
          </span>
        </span>
      </Link>
    </li>
  );
}

/* ---------------- Folder page (one folder = header + player) ---------------- */

export function FolderView({
  eyebrow,
  title,
  text,
  avatar,
  badges,
  cta,
  items,
  parent,
  initialId,
  emptyText,
}: {
  eyebrow: string;
  title: string;
  text?: string;
  avatar?: ReactNode;
  badges?: ReactNode;
  /** Action for this folder (e.g. "Post content" for the viewer's own folder). Omit when the viewer cannot post here. */
  cta?: ReactNode;
  items: MediaItem[];
  parent: string;
  initialId?: string;
  emptyText: string;
}) {
  return (
    <>
      <section className="mx-auto max-w-7xl px-4 pb-10 pt-32 md:px-6 md:pt-40">
        <Link
          href="/media"
          className="inline-flex items-center gap-2 font-display text-[0.72rem] font-bold uppercase tracking-[0.2em] text-gold transition hover:text-gold-bright"
        >
          ← All folders
        </Link>
        <div className="mt-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-center">
            {avatar}
            <div className="min-w-0 flex-1">
              <p className="eyebrow">{eyebrow}</p>
              <h1 className="display mt-3 break-words text-3xl sm:text-4xl md:text-6xl">{title}</h1>
              {text && <p className="mt-3 max-w-xl break-words text-muted">{text}</p>}
              {badges && <div className="mt-3 flex flex-wrap gap-1.5">{badges}</div>}
            </div>
          </div>
          {cta && <div className="shrink-0">{cta}</div>}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-24 md:px-6">
        {items.length === 0 ? (
          <div className="panel border-dashed p-12 text-center">
            <p className="display text-2xl text-muted">Nothing here yet</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-dim">{emptyText}</p>
            {cta && <div className="mt-6 flex justify-center">{cta}</div>}
          </div>
        ) : (
          <MediaPlayer items={items} parent={parent} initialId={initialId} />
        )}
      </section>
    </>
  );
}
