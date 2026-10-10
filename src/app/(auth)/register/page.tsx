import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "@/components/forms/AuthForms";
import { DiscordButton } from "@/components/site/DiscordButton";
import { discordConfigured } from "@/lib/discord";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Join the community" };

export default function RegisterPage() {
  if (discordConfigured()) {
    return (
      <div>
        <p className="eyebrow">Recruitment · Your account</p>
        <h1 className="display mt-3 text-4xl">Join the community</h1>
        <p className="mt-3 text-muted">
          The Vstroz Alliance community lives in Discord. Everyone in the server is part of it, and your website account comes from
          your Discord. Joining the Aion legion is a separate step from inside your account.
        </p>
        <ol className="mt-8 space-y-4">
          <li className="panel cut p-5">
            <p className="label">Step 1</p>
            <p className="display mt-1 text-2xl">Join the Discord</p>
            <p className="mt-1 text-sm text-muted">Skip this if you are already in the server.</p>
            <div className="mt-4">
              <DiscordButton href={site.discordInvite} external>
                Join the Discord
              </DiscordButton>
            </div>
          </li>
          <li className="panel cut p-5">
            <p className="label">Step 2</p>
            <p className="display mt-1 text-2xl">Continue with Discord</p>
            <p className="mt-1 text-sm text-muted">One click. We check you are in the server and create your community account.</p>
            <div className="mt-4">
              <DiscordButton href="/api/discord/login">Continue with Discord</DiscordButton>
            </div>
          </li>
          <li className="panel cut p-5">
            <p className="label">Then</p>
            <p className="display mt-1 text-2xl">Apply to the legion</p>
            <p className="mt-1 text-sm text-muted">
              Join the Vstroz Alliance legion in Aion, fill in your player profile in your account, and apply. An officer reviews it within
              48 hours.
            </p>
          </li>
        </ol>
        <p className="mt-8 text-center text-sm text-muted">
          Already have an account?{" "}
          <Link href="/login" className="text-text underline-offset-4 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="eyebrow">Recruitment · Your account</p>
      <h1 className="display mt-3 text-4xl">Join the community</h1>
      <p className="mt-3 text-muted">
        Create your Vstroz Alliance account and you are in the community. Joining the Aion legion is a separate step from inside
        your account: fill in your player profile and apply.
      </p>
      <div className="mt-8">
        <RegisterForm />
      </div>
    </div>
  );
}
