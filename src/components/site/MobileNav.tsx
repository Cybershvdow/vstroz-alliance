"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function MobileNav({
  items,
  portalHref,
  portalLabel,
  discord,
}: {
  items: { href: string; label: string }[];
  portalHref: string;
  portalLabel: string;
  discord: string;
}) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex h-10 w-10 flex-col items-center justify-center gap-1.5"
      >
        <span className={`h-0.5 w-6 bg-text transition ${open ? "translate-y-2 rotate-45" : ""}`} />
        <span className={`h-0.5 w-6 bg-text transition ${open ? "opacity-0" : ""}`} />
        <span className={`h-0.5 w-6 bg-text transition ${open ? "-translate-y-2 -rotate-45" : ""}`} />
      </button>

      {open && (
        // The header blurs what is behind it, which makes it the box this fixed panel is measured against.
        // So the panel gets its own height (screen minus header) instead of stretching to a bottom edge, and it scrolls.
        <div className="fixed inset-x-0 top-18 z-40 h-[calc(100dvh-4.5rem)] overflow-y-auto overscroll-contain bg-bg">
          <nav className="flex flex-col px-6 pb-10 pt-4" aria-label="Mobile">
            {items.map((item, i) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={close}
                className={`rise border-b border-line py-3 font-display text-2xl font-bold uppercase tracking-wide rise-${Math.min(i + 1, 4)}`}
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-5 flex flex-col gap-3">
              <Link href={portalHref} onClick={close} className="cut-sm bg-accent px-5 py-3 text-center font-display text-base font-bold uppercase tracking-[0.14em] text-white">
                {portalLabel}
              </Link>
              <a href={discord} target="_blank" rel="noreferrer" className="cut-sm border border-line-strong px-5 py-3 text-center font-display text-base font-bold uppercase tracking-[0.14em]">
                Join Discord
              </a>
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}
