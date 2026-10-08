import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { nav, site } from "@/lib/site";
import { getCurrentUser } from "@/lib/auth";
import { isOfficer } from "@/lib/constants";
import { MobileNav } from "./MobileNav";
import { DiscordIcon } from "./Icons";

export async function Navbar() {
  const user = await getCurrentUser();
  const portalHref = user ? (user.status === "APPROVED" && isOfficer(user.role) ? "/admin" : "/dashboard") : "/login";
  const portalLabel = user ? "Portal" : "Sign in";

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-line bg-bg/60 backdrop-blur-2xl [box-shadow:0_1px_0_rgba(230,185,90,0.06),0_20px_40px_-30px_rgba(0,0,0,0.9)]">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 md:px-6">
        <Link href="/" aria-label="Vstroz Alliance home" className="shrink-0">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="relative px-4 py-2 font-sans text-[0.72rem] font-bold uppercase tracking-[0.24em] text-muted transition hover:text-gold-bright after:absolute after:inset-x-4 after:-bottom-0.5 after:h-px after:origin-left after:scale-x-0 after:bg-gold after:transition-transform hover:after:scale-x-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <a
            href={site.discordInvite}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 font-sans text-[0.72rem] font-bold uppercase tracking-[0.22em] text-muted hover:text-text"
          >
            <DiscordIcon className="h-4 w-4" /> Discord
          </a>
          <Link
            href={portalHref}
            className="cut-sm bg-[linear-gradient(180deg,#f8e2a0_0%,#dcb24d_48%,#b48a2b_100%)] px-5 py-2.5 font-display text-[0.72rem] font-bold uppercase tracking-[0.18em] text-[#1a1207] shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] hover:brightness-[1.07]"
          >
            {portalLabel}
          </Link>
        </div>

        <MobileNav items={nav} portalHref={portalHref} portalLabel={portalLabel} discord={site.discordInvite} />
      </div>
    </header>
  );
}
