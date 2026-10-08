import Link from "next/link";
import { requireUser, type CurrentUser } from "@/lib/auth";
import { isOfficer } from "@/lib/constants";
import { PortalShell, type NavItem } from "@/components/portal/PortalShell";
import { Badge, ButtonLink } from "@/components/ui";
import { logoutAction } from "@/lib/actions/auth";
import { site } from "@/lib/site";
import { DiscordIcon } from "@/components/site/Icons";
import { Logo } from "@/components/brand/Logo";
import { PlayerProfileForm } from "@/components/forms/PlayerProfileForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Member portal" };

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  if (user.status !== "APPROVED") {
    return <PendingGate user={user} />;
  }

  const items: NavItem[] = [
    { href: "/dashboard", label: "Overview" },
    { href: "/dashboard/matches", label: "Matches" },
    { href: "/dashboard/roles", label: "Roles" },
    { href: "/dashboard/table", label: "The Round Table" },
    { href: "/dashboard/votes", label: "Rank votes" },
    { href: "/dashboard/media", label: "Post content" },
    { href: "/dashboard/profile", label: "Profile" },
  ];
  if (isOfficer(user.role)) items.push({ href: "/admin", label: "Command center" });

  return (
    <PortalShell user={user} items={items} area="Member portal">
      {children}
    </PortalShell>
  );
}

function PendingGate({ user }: { user: CurrentUser }) {
  const denied = user.status === "DENIED";
  const applied = !!user.appliedAt;
  const name = user.displayName;
  return (
    <div className="relative flex min-h-screen flex-col">
      <div className="bg-rays absolute inset-0" />
      <div className="bg-glow-accent ember absolute inset-0" />
      <header className="relative flex items-center justify-between border-b border-line px-6 py-4">
        <Link href="/">
          <Logo />
        </Link>
        <form action={logoutAction}>
          <button type="submit" className="font-display text-sm font-bold uppercase tracking-[0.14em] text-muted hover:text-text">
            Sign out
          </button>
        </form>
      </header>
      <main className="relative flex flex-1 justify-center px-4 py-12 md:py-16">
        <div className="w-full max-w-3xl space-y-6">
          <div className="panel panel-accent cut p-8 md:p-10">
            <Badge tone={denied ? "danger" : applied ? "warning" : "accent"}>
              {denied ? "Application declined" : applied ? "Application under review" : "Step 2 of 2 · Player profile"}
            </Badge>
            <h1 className="display mt-4 text-3xl md:text-4xl">
              {denied ? `Not this time, ${name}.` : applied ? `Hold the line, ${name}.` : `Welcome, ${name}.`}
            </h1>
            <p className="mt-4 text-muted">
              {denied
                ? "An officer reviewed your application and did not approve it. You can reach out in Discord if you think this was a mistake."
                : applied
                  ? "Your application is in the officer queue. Most reviews happen within 48 hours. Once approved, this page becomes your member portal with match signups and role applications. You can update your answers below until it is reviewed."
                  : "Your account is ready. Tell us which game you play, your in-game name, and how you play. An officer reviews it and unlocks the member portal."}
            </p>
            {applied && !denied && (
              <p className="mt-3 font-display text-lg font-bold uppercase tracking-wider text-gold">
                Next step: join the Vstroz Alliance Discord so an officer can reach you.
              </p>
            )}
            {user.reviewNote && (
              <div className="mt-5 border border-line bg-bg-2 p-4 text-sm">
                <p className="label mb-1">Officer note</p>
                <p>{user.reviewNote}</p>
              </div>
            )}
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={site.discordInvite}
                target="_blank"
                rel="noreferrer"
                className="cut-sm inline-flex items-center gap-2 bg-[#5865F2] px-5 py-2.5 font-display text-sm font-bold uppercase tracking-[0.14em] text-white"
              >
                <DiscordIcon className="h-4 w-4" /> Join the Discord
              </a>
              <ButtonLink href="/" variant="secondary">
                Back to site
              </ButtonLink>
            </div>
          </div>

          {!denied && (
            <div className="panel cut p-8 md:p-10">
              <h2 className="display text-2xl md:text-3xl">{applied ? "Your application" : "Your player profile"}</h2>
              <p className="mb-6 mt-1 text-sm text-muted">
                {applied ? "Officers see exactly this. Edit anything and save." : "This is what the officers review. Two minutes."}
              </p>
              <PlayerProfileForm
                mode={applied ? "profile" : "apply"}
                submitLabel={applied ? "Update application" : undefined}
                initial={{
                  game: user.game,
                  gameAnswers: user.gameAnswers,
                  playtime: user.playtime,
                  playerType: user.playerType,
                  interests: user.interests,
                  games: user.games,
                  applicationNote: user.applicationNote,
                }}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
