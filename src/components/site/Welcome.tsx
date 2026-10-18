import { site } from "@/lib/site";
import { ButtonLink } from "@/components/ui";

/** Short welcome right under the hero: who we are and the two ways in. */
export function Welcome() {
  return (
    <section className="mx-auto max-w-4xl px-4 pt-16 text-center md:px-6 md:pt-20">
      <p className="eyebrow justify-center">Welcome</p>
      <h2 className="display mt-3 text-3xl md:text-5xl">Glad you found us.</h2>
      <p className="mx-auto mt-4 max-w-2xl text-muted">
        {site.name} started as a group of friends and grew into a community across a bunch of games. If you&apos;re in our Discord, you&apos;re already part of it. Make an account here to
        become a Member, pick the games you play, and come find a squad.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <ButtonLink href="/register">Join the alliance</ButtonLink>
        <ButtonLink href={site.discordInvite} variant="secondary">
          Join the Discord
        </ButtonLink>
      </div>
    </section>
  );
}
