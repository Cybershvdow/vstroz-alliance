import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { nav, site } from "@/lib/site";
import { DiscordIcon } from "./Icons";

export function Footer() {
  const socials = Object.entries(site.social).filter(([, url]) => url);
  return (
    <footer className="relative mt-28 bg-bg-2">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="rule" />
      </div>
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-[1.4fr_1fr_1fr] md:px-6">
        <div>
          <Logo />
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-muted">{site.tagline}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={site.discordInvite}
              target="_blank"
              rel="noreferrer"
              className="cut-sm inline-flex items-center gap-2 bg-[#5865F2] px-4 py-2 font-display text-sm font-bold uppercase tracking-[0.14em] text-white hover:brightness-110"
            >
              <DiscordIcon className="h-4 w-4" /> Join Discord
            </a>
            {socials.map(([name, url]) => (
              <a
                key={name}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="cut-sm border border-line-strong px-4 py-2 font-display text-sm font-bold uppercase tracking-[0.14em] text-muted hover:text-text"
              >
                {name}
              </a>
            ))}
          </div>
        </div>

        <div>
          <p className="label mb-4">Navigate</p>
          <ul className="space-y-2.5">
            {nav.map((n) => (
              <li key={n.href}>
                <Link href={n.href} className="text-sm text-muted transition hover:text-text">
                  {n.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/register" className="text-sm text-muted transition hover:text-text">
                Apply to join
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="label mb-4">Members</p>
          <ul className="space-y-2.5">
            <li>
              <Link href="/login" className="text-sm text-muted transition hover:text-text">
                Sign in
              </Link>
            </li>
            <li>
              <Link href="/dashboard" className="text-sm text-muted transition hover:text-text">
                Member portal
              </Link>
            </li>
            <li>
              <a href={`mailto:${site.contactEmail}`} className="text-sm text-muted transition hover:text-text">
                {site.contactEmail}
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-dim md:flex-row md:items-center md:justify-between md:px-6">
          <p>
            © {new Date().getFullYear()} {site.name}. All rights reserved.
          </p>
          <p>Aion is a trademark of NCSOFT. Vstroz Alliance is an independent player community.</p>
        </div>
      </div>
    </footer>
  );
}
