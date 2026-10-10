import type { Metadata } from "next";
import { LoginForm } from "@/components/forms/AuthForms";
import { DiscordButton } from "@/components/site/DiscordButton";
import { discordConfigured } from "@/lib/discord";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Sign in" };

const ERRORS: Record<string, string> = {
  not_in_discord: "You are not in the Vstroz Alliance Discord yet. Join it first, then continue with Discord.",
  discord_state: "That Discord sign-in expired. Try again.",
  discord_token: "Discord did not accept the sign-in. Try again.",
  discord_user: "Could not read your Discord profile. Try again.",
  discord_off: "Discord sign-in is not set up yet. Use your username and password.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams;
  const discord = discordConfigured();
  const message = error ? ERRORS[error] : undefined;
  return (
    <div>
      <p className="eyebrow">Members</p>
      <h1 className="display mt-3 text-4xl">Sign in</h1>
      <p className="mt-3 text-muted">Your community portal: profile, content, votes, The Round Table, and match signups once you are in the legion.</p>

      {message && (
        <div className="panel mt-6 border-danger/50 p-4 text-sm">
          {message}
          {error === "not_in_discord" && (
            <div className="mt-3">
              <DiscordButton href={site.discordInvite} external>
                Join the Discord
              </DiscordButton>
            </div>
          )}
        </div>
      )}

      {discord && (
        <div className="mt-8">
          <DiscordButton href="/api/discord/login" className="w-full">
            Continue with Discord
          </DiscordButton>
          <p className="mt-2 text-center text-xs text-dim">Members of the Discord sign in with one click. No account yet? This creates one.</p>
          <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-dim">
            <span className="h-px flex-1 bg-line" />
            or with your password
            <span className="h-px flex-1 bg-line" />
          </div>
        </div>
      )}
      <div className={discord ? "" : "mt-8"}>
        <LoginForm next={next} />
      </div>
    </div>
  );
}
