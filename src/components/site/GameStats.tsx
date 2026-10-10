import type { ApexStats } from "@/lib/apex";
import { hours, type SteamSnapshot } from "@/lib/steam";

/** Public stats block for a member profile: Apex (from Apex Legends Status) and Steam (playtime). Renders nothing when there is nothing to show. */
export function GameStats({ apex, apexError, steam, steamProfileUrl }: { apex: ApexStats | null; apexError?: string | null; steam: SteamSnapshot | null; steamProfileUrl?: string | null }) {
  if (!apex && !steam && !apexError) return null;
  const rank = apex?.rankName ? `${apex.rankName}${apex.rankDiv ? ` ${apex.rankDiv}` : ""}` : null;
  const h = hours(steam?.apexMinutes);
  const h2 = hours(steam?.apexMinutes2w);
  const when = (iso?: string | null) => (iso ? new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : null);

  return (
    <div className="panel cut p-6">
      <div className="flex items-center justify-between gap-4">
        <p className="eyebrow">Live stats</p>
        <span className="text-[0.68rem] uppercase tracking-[0.18em] text-dim">
          {apex ? `Apex updated ${when(apex.fetchedAt)}` : steam ? `Steam updated ${when(steam.fetchedAt)}` : ""}
        </span>
      </div>

      {apex && (
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
          {apex.rankImg ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={apex.rankImg} alt={rank ?? "Rank"} className="h-20 w-20 shrink-0 object-contain" />
          ) : (
            <div className="flex h-20 w-20 shrink-0 items-center justify-center border border-line-strong font-display text-xs uppercase tracking-widest text-muted">Apex</div>
          )}
          <div className="min-w-0 flex-1">
            <p className="display text-2xl">
              {rank ?? "Unranked"}
              {apex.rankScore != null && <span className="ml-2 text-base text-muted">{apex.rankScore.toLocaleString()} RP</span>}
            </p>
            <dl className="mt-2 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
              <div>
                <dt className="label">Level</dt>
                <dd className="mt-1">{apex.level ?? "—"}</dd>
              </div>
              <div>
                <dt className="label">Kills</dt>
                <dd className="mt-1">{apex.kills != null ? apex.kills.toLocaleString() : "—"}</dd>
              </div>
              <div>
                <dt className="label">K/D</dt>
                <dd className="mt-1">{apex.kd ?? "—"}</dd>
              </div>
              <div>
                <dt className="label">Right now</dt>
                <dd className={`mt-1 ${apex.online ? "text-success" : ""}`}>{apex.state ?? (apex.online == null ? "—" : apex.online ? "Online" : "Offline")}</dd>
              </div>
            </dl>
            <p className="mt-2 text-xs text-dim">
              {apex.name} · {apex.platform === "PC" ? "PC" : apex.platform === "PS4" ? "PlayStation" : "Xbox"}
              {apex.legend ? ` · playing ${apex.legend}` : ""}
            </p>
          </div>
        </div>
      )}
      {!apex && apexError && <p className="mt-3 text-sm text-warning">Apex stats unavailable: {apexError}</p>}

      {steam && (
        <div className={`flex items-center gap-4 ${apex ? "mt-5 border-t border-line pt-5" : "mt-4"}`}>
          {steam.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={steam.avatar} alt="" className="h-12 w-12 shrink-0 rounded-sm" />
          ) : null}
          <div className="min-w-0 flex-1 text-sm">
            <p>
              <span className="label">Steam</span>{" "}
              {steamProfileUrl ? (
                <a href={steamProfileUrl} target="_blank" rel="noreferrer" className="text-text hover:underline">
                  {steam.name ?? "profile"}
                </a>
              ) : (
                <span className="text-text">{steam.name ?? "linked"}</span>
              )}
            </p>
            <p className="mt-1 text-muted">
              {steam.gamesVisible
                ? h != null
                  ? `${h.toLocaleString()} h in Apex Legends${h2 ? ` · ${h2.toLocaleString()} h last two weeks` : ""}`
                  : "No Apex playtime on this Steam account."
                : "Playtime hidden: set Steam privacy → Game details to Public."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
