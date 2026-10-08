"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "./PortalShell";

export function PortalNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:px-3 lg:pb-0" aria-label="Portal">
      {items.map((item) => {
        const active = item.href === pathname || (item.href !== "/dashboard" && item.href !== "/admin" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex shrink-0 items-center justify-between gap-3 px-3 py-2.5 font-display text-sm font-bold uppercase tracking-[0.14em] transition ${
              active ? "cut-sm bg-accent/15 text-text" : "text-muted hover:text-text"
            }`}
          >
            <span className="flex items-center gap-2">
              <span className={`h-1.5 w-1.5 rotate-45 ${active ? "bg-accent" : "bg-line-strong"}`} />
              {item.label}
            </span>
            {item.badge ? <span className="rounded-sm bg-accent px-1.5 text-[0.65rem] text-white">{item.badge}</span> : null}
          </Link>
        );
      })}
    </nav>
  );
}
