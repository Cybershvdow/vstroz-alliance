import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { Avatar, Badge, roleTone } from "@/components/ui";
import { logoutAction } from "@/lib/actions/auth";
import { ROLE_LABEL, type UserRole } from "@/lib/constants";
import type { CurrentUser } from "@/lib/auth";
import { PortalNav } from "./PortalNav";

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
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
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
            <Avatar name={user.displayName} tone={roleTone(user.role)} />
            <div className="min-w-0">
              <p className="truncate font-display text-lg font-bold uppercase leading-tight">{user.displayName}</p>
              <div className="flex flex-wrap gap-1">
                {user.status === "APPROVED" && user.role !== "MEMBER" && <Badge tone={roleTone(user.role)}>{ROLE_LABEL[user.role as UserRole] ?? user.role}</Badge>}
                <Badge tone={user.status === "APPROVED" ? "success" : "neutral"}>{user.status === "APPROVED" ? "Legion" : "Community"}</Badge>
              </div>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Link href="/" className="cut-sm flex-1 border border-line-strong px-3 py-2 text-center font-display text-xs font-bold uppercase tracking-[0.14em] text-muted hover:text-text">
              Site
            </Link>
            <form action={logoutAction} className="flex-1">
              <button type="submit" className="cut-sm w-full border border-line-strong px-3 py-2 font-display text-xs font-bold uppercase tracking-[0.14em] text-muted hover:border-danger hover:text-danger">
                Sign out
              </button>
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
