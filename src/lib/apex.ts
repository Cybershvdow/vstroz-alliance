import "server-only";
import { db } from "@/lib/db";

/*
  Apex Legends stats via the Apex Legends Status API (third party; EA has no public stats API).
  Docs: https://apexlegendsapi.com — GET https://api.apexlegendsstatus.com/bridge?auth=KEY&player=NAME&platform=PC|PS4|X1
  Members enter their EA/Origin name (PC, also for Steam players), PSN name, or Xbox gamertag.
  Stats are cached on the user row and refreshed when older than APEX_TTL_MS.
*/

export const APEX_PLATFORMS = [
  { key: "PC", label: "PC (EA / Steam)", hint: "Your EA account name, even if you play through Steam." },
  { key: "PS4", label: "PlayStation", hint: "Your PSN name." },
  { key: "X1", label: "Xbox", hint: "Your Xbox gamertag." },
] as const;
export type ApexPlatform = (typeof APEX_PLATFORMS)[number]["key"];

export const APEX_TTL_MS = 15 * 60_000;

export type ApexStats = {
  name: string;
  platform: string;
  level: number | null;
  rankName: string | null;
  rankDiv: number | null;
  rankScore: number | null;
  rankImg: string | null;
  kills: number | null;
  kd: string | null;
  online: boolean | null;
  state: string | null;
  legend: string | null;
  avatar: string | null;
  fetchedAt: string;
};

export function apexConfigured() {
  return !!process.env.APEX_API_KEY?.trim();
}

function num(v: unknown): number | null {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  return Number.isFinite(n) ? n : null;
}
function str(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

/** Fetch and normalise a player's stats. Returns { error } for player-not-found / API problems. */
export async function fetchApexStats(platform: string, name: string): Promise<{ stats?: ApexStats; error?: string }> {
  const key = process.env.APEX_API_KEY?.trim();
  if (!key) return { error: "Apex stats are not set up yet." };
  if (!APEX_PLATFORMS.some((p) => p.key === platform)) return { error: "Pick a platform." };
  const url = `https://api.apexlegendsstatus.com/bridge?auth=${encodeURIComponent(key)}&player=${encodeURIComponent(name)}&platform=${platform}`;
  let json: Record<string, unknown>;
  try {
    const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(8000) });
    json = (await res.json()) as Record<string, unknown>;
    if (!res.ok && !json?.global) return { error: `Stats service error (${res.status}).` };
  } catch {
    return { error: "Could not reach the stats service. Try again in a minute." };
  }
  if (typeof json.Error === "string") return { error: json.Error };
  const g = (json.global ?? {}) as Record<string, unknown>;
  const rank = (g.rank ?? {}) as Record<string, unknown>;
  const rt = (json.realtime ?? {}) as Record<string, unknown>;
  const total = (json.total ?? {}) as Record<string, Record<string, unknown>>;
  const legends = (json.legends ?? {}) as Record<string, Record<string, unknown>>;
  const stats: ApexStats = {
    name: str(g.name) ?? name,
    platform,
    level: num(g.level),
    rankName: str(rank.rankName),
    rankDiv: num(rank.rankDiv),
    rankScore: num(rank.rankScore),
    rankImg: str(rank.rankImg),
    kills: num(total.kills?.value),
    kd: str(total.kd?.value),
    online: typeof rt.isOnline === "number" ? rt.isOnline === 1 : null,
    state: str(rt.currentStateAsText),
    legend: str(legends.selected?.LegendName),
    avatar: str(g.avatar),
    fetchedAt: new Date().toISOString(),
  };
  if (stats.level === null && stats.rankName === null) return { error: "No stats came back for that name. Check the spelling and platform." };
  return { stats };
}

export function parseApexStats(json: string | null | undefined): ApexStats | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as ApexStats;
  } catch {
    return null;
  }
}

/** Refresh a user's cached Apex stats if stale. Never throws; returns what should be displayed. */
export async function refreshApexStats(user: { id: string; apexPlatform: string | null; apexName: string | null; apexStats: string | null; apexStatsAt: Date | null }) {
  const cached = parseApexStats(user.apexStats);
  if (!user.apexPlatform || !user.apexName || !apexConfigured()) return cached;
  const fresh = !user.apexStatsAt || Date.now() - user.apexStatsAt.getTime() > APEX_TTL_MS;
  if (!fresh) return cached;
  const r = await fetchApexStats(user.apexPlatform, user.apexName);
  if (r.stats) {
    await db.user.update({ where: { id: user.id }, data: { apexStats: JSON.stringify(r.stats), apexStatsAt: new Date(), apexError: null } });
    return r.stats;
  }
  // Keep the last good snapshot; remember the error, and back off by stamping the time.
  await db.user.update({ where: { id: user.id }, data: { apexStatsAt: new Date(), apexError: r.error ?? "Unknown error" } });
  return cached;
}
