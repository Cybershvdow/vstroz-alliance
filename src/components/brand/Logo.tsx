/* Vstroz Alliance logo.
   The site uses the ORIGINAL artwork supplied by the alliance: public/brand/logo-original.png
   (enlarged from the source file; replace it with a higher-resolution export when available —
   same filename, nothing else changes). A vector redraw is kept in LogoArt.tsx as a spare. */

import Image from "next/image";
import { LogoWordmark } from "./LogoArt";

/** The original emblem tile. */
export function LogoMark({ className = "h-10 w-10", title = "Vstroz Alliance" }: { className?: string; title?: string }) {
  return (
    <Image
      src="/brand/logo-original.png"
      alt={title}
      width={512}
      height={512}
      priority
      className={`rounded-[18%] object-contain ${className}`}
    />
  );
}

/** Silver "VSTROZ / ALLIANCE" wordmark as vector outlines (matches the logo's lettering). */
export function Wordmark({ className = "h-8 w-auto" }: { className?: string }) {
  return <LogoWordmark className={className} />;
}

/** Large version of the original logo for hero / auth panels. */
export function LogoFull({ className = "h-64 w-64" }: { className?: string }) {
  return (
    <Image
      src="/brand/logo-original-1024.png"
      alt="Vstroz Alliance"
      width={1024}
      height={1024}
      className={`rounded-[18%] object-contain ${className}`}
    />
  );
}

/** Horizontal lockup used in the navbar and footer. */
export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-3">
      <LogoMark className="h-12 w-12 drop-shadow-[0_0_14px_rgba(255,90,31,0.45)]" />
      {!compact && <Wordmark className="h-9 w-auto" />}
    </span>
  );
}
