"use client";

import { useState } from "react";
import { embedSrc, thumbnailFor } from "@/lib/media";

export type MediaItem = {
  id: string;
  title: string;
  provider: string;
  embedId: string;
  kind: string;
  description: string;
  game: string | null;
  postedBy: string;
  createdAt: string;
  featured: boolean;
};

/** Featured player + playlist grid. Picks the first (featured) item by default. */
export function MediaPlayer({ items, parent }: { items: MediaItem[]; parent: string }) {
  const [current, setCurrent] = useState<MediaItem | null>(items[0] ?? null);
  if (!current) return null;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
      <div>
        <div className="panel cut overflow-hidden p-2">
          <div className="relative aspect-video w-full bg-black">
            <iframe
              key={current.id}
              src={embedSrc(current, parent)}
              title={current.title}
              className="absolute inset-0 h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
              allowFullScreen
            />
          </div>
        </div>
        <div className="mt-4">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
            <span className="label">{current.provider === "YOUTUBE" ? "YouTube" : "Twitch"}</span>
            {current.game && <span>· {current.game}</span>}
            <span>· posted by {current.postedBy}</span>
          </div>
          <h2 className="display mt-2 text-2xl md:text-3xl">{current.title}</h2>
          {current.description && <p className="mt-2 max-w-2xl text-sm text-muted">{current.description}</p>}
        </div>
      </div>

      <div>
        <p className="label mb-3">Playlist · {items.length}</p>
        <ul className="max-h-[560px] space-y-2 overflow-y-auto pr-1">
          {items.map((it) => {
            const thumb = thumbnailFor(it);
            const active = it.id === current.id;
            return (
              <li key={it.id}>
                <button
                  type="button"
                  onClick={() => setCurrent(it)}
                  className={`flex w-full items-center gap-3 border p-2 text-left transition ${active ? "border-gold/60 bg-gold/10" : "border-line hover:border-line-strong hover:bg-white/[0.03]"}`}
                >
                  <span className="relative aspect-video w-28 shrink-0 overflow-hidden bg-black">
                    {thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={thumb} alt="" className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center font-display text-xs uppercase tracking-widest text-[#c9a8ff]">Twitch</span>
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{it.title}</span>
                    <span className="block truncate text-xs text-muted">
                      {it.postedBy}
                      {it.game ? ` · ${it.game}` : ""}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
