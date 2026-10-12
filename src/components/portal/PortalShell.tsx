import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { Avatar, Badge } from "@/components/ui";
import { logoutAction } from "@/lib/actions/auth";
import { allianceRank } from "@/lib/constants";
import type { CurrentUser } from "@/lib/auth";
import { PortalNav } from "./PortalNav";
import { avatarUrl } from "@/lib/avatar";
import { SignOutButton } from "./SignOutButton";

export type NavItem = { href: string; label: string; badge?: number };

export function PortalShell({
  user,
  items,
  area,
  children,
}: {
  user: CurrentUser;
  items: NavItem[];
  area: "Member portal" | "Command center";
  children: React.ReactNode;
}) {
  const rank = allianceRank(user);
  return (
    <div className="flex min-h-screen flex-col lg:flex-row" data-draft-scope={user.username}>
      <aside className="flex shrink-0 flex-col border-b border-line bg-bg-2 lg:w-72 lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between px-5 py-4 lg:py-6">
          <Link href="/" aria-label="Back to site">
            <Logo />
          </Link>
          <span className="label hidden lg:block">{area}</span>
        </div>

        <PortalNav items={items} />

        <div className="mt-auto border-t border-line p-5">
          <div className="flex items-center gap-3">
            <Link href="/dashboard/profile#profile-picture" aria-label="Change your profile picture" title="Change your profile picture" className="shrink-0 rounded-full transition hover:opacity-80">
              <Avatar name={user.displayName} tone={rank.tone} src={avatarUrl(user)} />
            </Link>
            <div className="min-w-0">
              <p className="truncate font-display text-lg font-bold uppercase leading-tight">{user.displayName}</p>
              <div className="flex flex-wrap gap-1">
                <Badge tone={rank.tone}>{rank.label}</Badge>
                {user.status === "APPROVED" && <Badge tone="success">Legion</Badge>}
              </div>
              <Link href="/dashboard/profile#profile-picture" className="inline-block py-2 text-xs text-muted underline-offset-4 hover:text-text hover:underline">
                {user.avatarAt ? "Change picture" : "Add a picture"}
              </Link>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Link href="/" className="cut-sm flex-1 border border-line-strong px-3 py-2 text-center font-display text-xs font-bold uppercase tracking-[0.14em] text-muted hover:text-text">
              Site
            </Link>
            <form action={logoutAction} className="flex-1">
              <SignOutButton
                scope={user.username}
                className="cut-sm w-full border border-line-strong px-3 py-2 font-display text-xs font-bold uppercase tracking-[0.14em] text-muted hover:border-danger hover:text-danger"
              />
            </form>
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-10">{children}</div>
      </main>
    </div>
  );
}
