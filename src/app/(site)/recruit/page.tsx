import type { Metadata } from "next";
import { requirements, membershipPath, site } from "@/lib/site";
import { ButtonLink, SectionHeading } from "@/components/ui";
import { ArrowIcon, CheckIcon, DiscordIcon } from "@/components/site/Icons";

export const metadata: Metadata = { title: "Recruitment" };

const steps = membershipPath;

export default function RecruitPage() {
  return (
    <>
      <section className="mx-auto max-w-7xl px-4 pb-16 pt-32 md:px-6 md:pt-40">
        <SectionHeading eyebrow="Recruitment · 18+" title="Earn the banner." text="Adults only, any time zone, English-speaking. We recruit for attitude and consistency first. Skill gets you a tryout. Character gets you a rank." />
        <div className="mt-10 flex flex-wrap gap-3">
          <ButtonLink href="/register" size="lg">
            Create an account <ArrowIcon />
          </ButtonLink>
          <a href={site.discordInvite} target="_blank" rel="noreferrer" className="cut-sm inline-flex items-center gap-2 border border-line-strong px-7 py-3.5 font-display text-base font-bold uppercase tracking-[0.12em] hover:border-text">
            <DiscordIcon /> Ask in Discord
          </a>
        </div>
      </section>

      <section className="border-y border-line bg-bg-2 py-20">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 md:px-6 lg:grid-cols-2">
          <div>
            <h2 className="display text-3xl">Requirements</h2>
            <ul className="mt-6 space-y-3">
              {requirements.map((r) => (
                <li key={r} className="flex items-start gap-3 text-muted">
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-gold/50 text-gold">
                    <CheckIcon className="h-3 w-3" />
                  </span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="display text-3xl">How it works</h2>
            <ol className="mt-6 space-y-4">
              {steps.map((s) => (
                <li key={s.n} className="panel cut flex gap-5 p-5">
                  <span className="display display-gold text-3xl">{s.n}</span>
                  <div>
                    <p className="display text-2xl">{s.title}</p>
                    <p className="mt-1 text-sm text-muted">{s.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>
    </>
  );
}
