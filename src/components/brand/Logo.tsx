/* Vstroz Alliance logo.
   Official raven-crest artwork (public/brand/source-logo.webp), imported by scripts/import-logo.mjs into
   public/brand/logo-raven-*.png with faded edges so it floats on dark backgrounds.
   Re-run the script with a new file to update everything. The vector wordmark lives in LogoArt.tsx. */

import Image from "next/image";
import { LogoWordmark } from "./LogoArt";

/** The original emblem tile. */
export function LogoMark({ className = "h-10 w-10", title = "Vstroz Alliance" }: { className?: string; title?: string }) {
  return (
    <Image
      src="/brand/logo-raven-512.png"
      alt={title}
      width={512}
      height={512}
      priority
      className={`object-contain ${className}`}
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
      src="/brand/logo-raven-1024.png"
      alt="Vstroz Alliance"
      width={1024}
      height={1024}
      className={`object-contain ${className}`}
    />
  );
}

/** Horizontal lockup used in the navbar and footer. */
export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-3">
      <LogoMark className="h-14 w-14 drop-shadow-[0_0_16px_rgba(155,77,255,0.55)]" />
      {!compact && <Wordmark className="h-9 w-auto" />}
    </span>
  );
}
