import type { Metadata } from "next";
import { db } from "@/lib/db";
import { games, site } from "@/lib/site";
import { ENABLED_GAMES, TIER_LABEL, ROLE_LABEL, type UserRole } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";
import { Avatar, Badge, ButtonLink, SectionHeading, roleTone } from "@/components/ui";
import { ArrowIcon, DiscordIcon } from "@/components/site/Icons";

export const metadata: Metadata = { title: "Esports" };
export const dynamic = "force-dynamic";

export default async function EsportsPage() {
  const [elite, results, upcoming] = await Promise.all([
    db.user.findMany({
      where: { status: "APPROVED", tier: "ELITE" },
      select: { id: true, displayName: true, role: true, title: true, gameClass: true, game: true, ign: true },
      orderBy: { createdAt: "asc" },
    }),
    db.match.findMany({ where: { status: "COMPLETED", isPublic: true }, orderBy: { startsAt: "desc" }, take: 8 }),
    db.match.findMany({ where: { isPublic: true, startsAt: { gte: new Date() }, status: { in: ["OPEN", "LOCKED"] }, type: { in: ["SIEGE", "SCRIM", "TOURNAMENT"] } }, orderBy: { startsAt: "asc" }, take: 5 }),
  ]);
  elite.sort((a, b) => (a.role === "LEADER" ? -1 : b.role === "LEADER" ? 1 : 0));
  const wins = results.filter((r) => r.result?.toLowerCase().includes("victory")).length;

  return (
    <>
      <section className="relative overflow-hidden pt-32 md:pt-40">
        <div className="bg-rays absolute inset-0" />
        <div className="bg-glow-accent ember absolute inset-0" />
        <div className="relative mx-auto max-w-7xl px-4 pb-16 md:px-6">
          <SectionHeading
            eyebrow="Esports"
            title="Everything competitive is tried out for."
            text="The Elite rank is the competitive roster. Spots are earned at tryouts, confirmed by vote, and can be lost. Mic required."
          />
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/dashboard/table" size="lg">
              Request a tryout <ArrowIcon />
            </ButtonLink>
            <ButtonLink href="/register" size="lg" variant="secondary">
              Not a member yet? Apply
            </ButtonLink>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              ["Competitive roster", `${elite.length}`],
              ["Titles", `${ENABLED_GAMES.length}`],
              ["Matches played", `${results.length}`],
              ["Wins", `${wins}`],
            ].map(([l, v]) => (
              <div key={l} className="panel p-4">
                <p className="label">{l}</p>
                <p className="display display-gold mt-1 text-3xl">{v}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Teams per game */}
      <section className="border-y border-line bg-bg-2 py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          {ENABLED_GAMES.map((g) => {
            const meta = games.find((x) => x.name === g.name);
            const roster = elite.filter((m) => !m.game || m.game === g.name);
            return (
              <div key={g.name} className="grid gap-8 lg:grid-cols-[320px_1fr]">
                <div className="panel cut p-6">
                  <Badge tone="success">Active</Badge>
                  <h2 className="display mt-4 text-4xl">{g.name}</h2>
                  <p className="mt-1 text-sm text-muted">{meta?.genre}</p>
                  <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-line pt-4 text-sm">
                    <div>
                      <dt className="label">Server</dt>
                      <dd className="mt-1">{meta?.server ?? "TBA"}</dd>
                    </div>
                    <div>
                      <dt className="label">Faction</dt>
                      <dd className="mt-1">{meta?.faction ?? "TBA"}</dd>
                    </div>
                  </dl>
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {meta?.focus.map((f) => (
                      <li key={f} className="border border-line-strong px-2 py-1 text-xs text-muted">
                        {f}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-5 text-xs text-muted">Tryouts open. Roster details lock in as the game rolls out.</p>
                </div>

                <div>
                  <div className="mb-4 flex items-end justify-between">
                    <h3 className="display text-2xl">{g.name} roster</h3>
                    <span className="label">{roster.length} players</span>
                  </div>
                  {roster.length === 0 ? (
                    <div className="panel border-dashed p-8 text-center text-sm text-muted">Roster forms at launch. Request a tryout to be first.</div>
                  ) : (
                    <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {roster.map((p) => (
                        <li key={p.id} className="panel cut flex items-center gap-4 p-4">
                          <Avatar name={p.displayName} size="lg" tone={roleTone(p.role)} />
                          <div className="min-w-0">
                            <p className="display truncate text-xl">{p.displayName}</p>
                            <div className="mt-1 flex flex-wrap gap-1.5">
                              <Badge tone="gold">{TIER_LABEL.ELITE}</Badge>
                              {p.role !== "MEMBER" && <Badge tone={roleTone(p.role)}>{ROLE_LABEL[p.role as UserRole]}</Badge>}
                            </div>
                            <p className="mt-1 truncate text-xs text-muted">{[p.gameClass, p.ign && `IGN ${p.ign}`, p.title].filter(Boolean).join(" · ") || "Role TBA"}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Matches & results */}
      <section className="mx-auto max-w-7xl px-4 py-20 md:px-6">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className="display text-2xl">Upcoming competitive</h2>
            <ol className="mt-4 divide-y divide-line border-y border-line">
              {upcoming.length === 0 && <li className="py-8 text-center text-sm text-muted">Nothing scheduled yet.</li>}
              {upcoming.map((m) => (
                <li key={m.id} className="py-4">
                  <p className="text-xs text-muted">{formatDateTime(m.startsAt)}</p>
                  <p className="display mt-1 text-xl">{m.title}</p>
                </li>
              ))}
            </ol>
          </div>
          <div>
            <h2 className="display text-2xl">Results</h2>
            <ol className="mt-4 divide-y divide-line border-y border-line">
              {results.length === 0 && <li className="py-8 text-center text-sm text-muted">No results yet. The record starts at launch.</li>}
              {results.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-4 py-4">
                  <div>
                    <p className="text-xs text-muted">{formatDateTime(m.startsAt)}</p>
                    <p className="display mt-1 text-xl">{m.title}</p>
                  </div>
                  <span className={`font-display text-sm font-bold uppercase tracking-wider ${m.result?.toLowerCase().includes("victory") ? "text-success" : "text-muted"}`}>{m.result ?? "Played"}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
        <div className="mt-12 flex flex-wrap gap-3">
          <a href={site.discordInvite} target="_blank" rel="noreferrer" className="cut-sm inline-flex items-center gap-2 bg-[#5865F2] px-5 py-2.5 font-display text-[0.78rem] font-bold uppercase tracking-[0.16em] text-white hover:brightness-110">
            <DiscordIcon className="h-4 w-4" /> Scrim us on Discord
          </a>
        </div>
      </section>
    </>
  );
}
