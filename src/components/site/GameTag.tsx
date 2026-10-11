import type { ReactNode } from "react";
import Link from "next/link";
import { gameHref } from "@/lib/site";

/*
  Game icons and tags. Each listed game has its own colour and an original icon drawn for this site.
  To use a game's official artwork instead, put a square image in public/games/ and add its path to ART
  (for example "Apex Legends": "/games/apex.png"); the tag then shows that image.
*/

const ART: Record<string, string> = {};

type Look = { color: string; glyph: ReactNode };

const LOOKS: Record<string, Look> = {
  // Wings
  Aion: {
    color: "#b57bff",
    glyph: (
      <>
        <path d="M12 20.5C7.6 18.2 4 13.6 3 5.5c3.1 2.3 6.2 3.2 9 6.8Z" />
        <path d="M12 20.5c4.4-2.3 8-6.9 9-15-3.1 2.3-6.2 3.2-9 6.8Z" />
      </>
    ),
  },
  // Crosshair
  "Apex Legends": {
    color: "#ff6a4d",
    glyph: (
      <>
        <circle cx="12" cy="12" r="6.2" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M12 2.5v5M12 16.5v5M2.5 12h5M16.5 12h5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="12" cy="12" r="1.6" />
      </>
    ),
  },
  // Flame
  Enshrouded: {
    color: "#4fd1a5",
    glyph: <path d="M12.4 2.5c.6 4 4.9 6 4.9 11a5.3 5.3 0 0 1-10.6 0c0-2.9 1.9-4 2.5-6.6 1.6 1 2.6-1.5 3.2-4.4Zm-.4 10c-1.4 1.2-2.1 2.2-2.1 3.4a2.1 2.1 0 0 0 4.2 0c0-1.2-.7-2.2-2.1-3.4Z" fillRule="evenodd" />,
  },
  // Skull
  "Project Zomboid": {
    color: "#c8d24a",
    glyph: (
      <path
        d="M12 2.8a7.4 7.4 0 0 0-7.4 7.4c0 2.6 1.3 4.6 3.2 5.8V19a1.2 1.2 0 0 0 1.2 1.2h6A1.2 1.2 0 0 0 16.2 19v-3c1.9-1.2 3.2-3.2 3.2-5.8A7.4 7.4 0 0 0 12 2.8ZM9.3 8.4a1.9 1.9 0 1 1 0 3.8 1.9 1.9 0 0 1 0-3.8Zm5.4 0a1.9 1.9 0 1 1 0 3.8 1.9 1.9 0 0 1 0-3.8ZM12 12.6l1.1 2.2h-2.2Z"
        fillRule="evenodd"
      />
    ),
  },
  // Padlock
  Deadlock: {
    color: "#e0a94a",
    glyph: (
      <>
        <path d="M8.3 10.6V8a3.7 3.7 0 0 1 7.4 0v2.6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M6.4 10.6h11.2c.5 0 .9.4.9.9v7.6c0 .5-.4.9-.9.9H6.4a.9.9 0 0 1-.9-.9v-7.6c0-.5.4-.9.9-.9Zm5.6 3a1.5 1.5 0 0 0-.7 2.8v1.4h1.4v-1.4a1.5 1.5 0 0 0-.7-2.8Z" fillRule="evenodd" />
      </>
    ),
  },
};

const FALLBACK_COLOR = "#c9ccd6";

/** The game's icon in a small tinted tile. Unknown games get their first letter. */
export function GameIcon({ game, className = "h-5 w-5" }: { game: string; className?: string }) {
  const look = LOOKS[game];
  const color = look?.color ?? FALLBACK_COLOR;
  if (ART[game]) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={ART[game]} alt="" className={`shrink-0 rounded-[3px] object-cover ${className}`} />;
  }
  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 items-center justify-center rounded-[3px] ${className}`}
      style={{ color, backgroundColor: `${color}22`, boxShadow: `inset 0 0 0 1px ${color}55` }}
    >
      {look ? (
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-[72%] w-[72%]">
          {look.glyph}
        </svg>
      ) : (
        <span className="font-display text-[0.6em] font-bold leading-none">{game.slice(0, 1).toUpperCase()}</span>
      )}
    </span>
  );
}

/**
 * A game tag for profiles and roster cards: icon plus name. With `link`, the tag opens that game's page
 * (only use it where the tag is not already inside another link).
 */
export function GameTag({ game, compact = false, link = false }: { game: string; compact?: boolean; link?: boolean }) {
  const color = LOOKS[game]?.color ?? FALLBACK_COLOR;
  const href = link ? gameHref(game) : null;
  const className = `inline-flex items-center gap-1.5 rounded-[2px] border bg-white/[0.03] font-sans font-bold uppercase tracking-[0.16em] text-text ${compact ? "px-1 py-0.5 text-[0.56rem]" : "py-0.5 pl-1 pr-2 text-[0.62rem]"}`;
  const body = (
    <>
      <GameIcon game={game} className={compact ? "h-4 w-4" : "h-5 w-5"} />
      <span className="whitespace-nowrap">{game}</span>
    </>
  );
  if (href) {
    return (
      <Link href={href} title={`See what the alliance does in ${game}`} className={`${className} transition hover:bg-white/[0.08]`} style={{ borderColor: `${color}55` }}>
        {body}
      </Link>
    );
  }
  return (
    <span title={game} className={className} style={{ borderColor: `${color}55` }}>
      {body}
    </span>
  );
}
