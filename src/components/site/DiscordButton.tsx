import type { ReactNode } from "react";
import { DiscordIcon } from "./Icons";

/** Discord-branded call to action. `href` is a normal link (OAuth start or the invite). */
export function DiscordButton({ href, children, className = "", external = false }: { href: string; children: ReactNode; className?: string; external?: boolean }) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
      className={`cut-sm inline-flex items-center justify-center gap-2 bg-[#5865F2] px-5 py-3 font-display text-sm font-bold uppercase tracking-[0.14em] text-white transition hover:brightness-110 ${className}`}
    >
      <DiscordIcon className="h-5 w-5" /> {children}
    </a>
  );
}
