import type { Metadata } from "next";
import { rules, identity, site } from "@/lib/site";
import { CHAIN_OF_COMMAND } from "@/lib/constants";
import { Badge, ButtonLink, SectionHeading } from "@/components/ui";
import { DiscordIcon } from "@/components/site/Icons";

export const metadata: Metadata = { title: "Rules & The Round Table" };

export default function RulesPage() {
  return (
    <>
      <section className="mx-auto max-w-7xl px-4 pb-12 pt-32 md:px-6 md:pt-40">
        <SectionHeading eyebrow="Code of conduct" title="The rules." text={rules.intro} />
        <div className="mt-6 flex flex-wrap gap-2">
          {identity.values.map((v) => (
            <Badge key={v} tone="gold">
              {v}
            </Badge>
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-bg-2 py-20">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 md:px-6 lg:grid-cols-3">
          {rules.sections.map((s, i) => (
            <div key={s.title} className="panel cut p-6">
              <p className="display display-gold text-3xl">0{i + 1}</p>
              <h2 className="display mt-2 text-2xl">{s.title}</h2>
              <ul className="mt-4 space-y-3">
                {s.items.map((item) => (
                  <li key={item} className="flex gap-3 text-sm text-muted">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rotate-45 bg-gold" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 md:px-6">
        <div className="grid gap-10 lg:grid-cols-[1fr_1fr]">
          <div>
            <SectionHeading eyebrow="Where decisions are made" title={rules.table.title} text={rules.table.text} />
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/dashboard/table">Open The Round Table</ButtonLink>
              <a href={site.discordInvite} target="_blank" rel="noreferrer" className="cut-sm inline-flex items-center gap-2 border border-gold/35 bg-white/[0.03] px-5 py-2.5 font-display text-[0.78rem] font-bold uppercase tracking-[0.16em] hover:border-gold/70">
                <DiscordIcon className="h-4 w-4" /> Discord
              </a>
            </div>
          </div>
          <div>
            <h3 className="display text-2xl">Ranks &amp; chain of command</h3>
            <ul className="mt-4 divide-y divide-line border-y border-line">
              {CHAIN_OF_COMMAND.map((c) => (
                <li key={c.rank} className="flex items-start gap-4 py-3">
                  <Badge tone={c.tone} className="mt-0.5 w-24 shrink-0 justify-center">
                    {c.rank}
                  </Badge>
                  <span className="text-sm text-muted">
                    {c.does}
                    <span className="mt-1 block text-xs text-dim">
                      Goes to: <span className="text-text">{c.goesTo}</span>
                    </span>
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-muted">
              The alliance runs like a business. You take a question or an issue to the level above you, not straight to the top. A Captain
              answers it or sends it up. Veterans and Elite have earned a direct line to The Round Table. Recruit to Member is an officer
              decision; Veteran and Elite are voted in by the alliance.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
