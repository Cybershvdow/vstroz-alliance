import Link from "next/link";
import type { ReactNode } from "react";
import { Avatar, Badge, ButtonLink, roleTone } from "@/components/ui";
import { LogoMark } from "@/components/brand/Logo";
import { MediaPlayer, type MediaItem } from "@/components/site/MediaPlayer";
import { ArrowIcon } from "@/components/site/Icons";
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

/** Map database rows to what the player needs (dates serialised for the client). */
export function toItems(posts: PostRow[]): MediaItem[] {
  return posts.map((p) => ({
    id: p.id,
    title: p.title,
    provider: p.provider,
    embedId: p.embedId,
    kind: p.kind,
    description: p.description,
    game: p.game,
    postedBy: p.postedBy.displayName,
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
                <LogoMark className="h-24 w-24 drop-shadow-[0_0_24px_rgba(155,77,255,0.5)]" />
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
          {alliance ? <LogoMark className="h-9 w-9" /> : <Avatar name={name} size="sm" tone={roleTone(role)} />}
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
          <div className="flex items-center gap-5">
            {avatar}
            <div>
              <p className="eyebrow">{eyebrow}</p>
              <h1 className="display mt-3 text-4xl md:text-6xl">{title}</h1>
              {text && <p className="mt-3 max-w-xl text-muted">{text}</p>}
              {badges && <div className="mt-3 flex flex-wrap gap-1.5">{badges}</div>}
            </div>
          </div>
          <ButtonLink href="/dashboard/media" variant="secondary">
            Post content <ArrowIcon />
          </ButtonLink>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-24 md:px-6">
        {items.length === 0 ? (
          <div className="panel border-dashed p-12 text-center">
            <p className="display text-2xl text-muted">Nothing here yet</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-dim">{emptyText}</p>
            <div className="mt-6 flex justify-center">
              <ButtonLink href="/dashboard/media">Post content</ButtonLink>
            </div>
          </div>
        ) : (
          <MediaPlayer items={items} parent={parent} initialId={initialId} />
        )}
      </section>
    </>
  );
}
