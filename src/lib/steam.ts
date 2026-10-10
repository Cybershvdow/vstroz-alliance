import "server-only";
import { db } from "@/lib/db";

/*
  Steam: official sign-in (OpenID 2.0) to link a member's Steam account, then the Steam Web API for
  their public profile and Apex Legends playtime. Needs STEAM_API_KEY (https://steamcommunity.com/dev/apikey).
  Apex's in-game stats are NOT on Steam; those come from src/lib/apex.ts.
*/

const OPENID = "https://steamcommunity.com/openid/login";
const APEX_APPID = 1172470;
export const STEAM_TTL_MS = 30 * 60_000;

export function steamConfigured() {
  return !!process.env.STEAM_API_KEY?.trim();
}

function appUrl() {
  return (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

/** Where to send the member to sign in with Steam. */
export function steamLoginUrl() {
  const base = appUrl();
  const p = new URLSearchParams({
    "openid.ns": "http://specs.openid.net/auth/2.0",
    "openid.mode": "checkid_setup",
    "openid.return_to": `${base}/api/steam/callback`,
    "openid.realm": base,
    "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
    "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
  });
  return `${OPENID}?${p.toString()}`;
}

/** Verify Steam's OpenID response with Steam itself and return the 64-bit SteamID, or null. */
export async function verifySteamCallback(params: URLSearchParams): Promise<string | null> {
  if (params.get("openid.mode") !== "id_res") return null;
  const claimed = params.get("openid.claimed_id") ?? "";
  const m = claimed.match(/^https?:\/\/steamcommunity\.com\/openid\/id\/(\d{17})$/);
  if (!m) return null;
  if (params.get("openid.return_to") !== `${appUrl()}/api/steam/callback`) return null;

  const body = new URLSearchParams();
  for (const [k, v] of params) if (k.startsWith("openid.")) body.set(k, v);
  body.set("openid.mode", "check_authentication");
  try {
    const res = await fetch(OPENID, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    const text = await res.text();
    return /is_valid\s*:\s*true/.test(text) ? m[1] : null;
  } catch {
    return null;
  }
}

export type SteamSnapshot = {
  name: string | null;
  avatar: string | null;
  profileUrl: string | null;
  /** Steam profile "Game details" are public (needed for playtime). */
  gamesVisible: boolean;
  apexMinutes: number | null;
  apexMinutes2w: number | null;
  fetchedAt: string;
};

export async function fetchSteamSnapshot(steamId: string): Promise<SteamSnapshot | null> {
  const key = process.env.STEAM_API_KEY?.trim();
  if (!key) return null;
  try {
    const [sumRes, gamesRes] = await Promise.all([
      fetch(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${key}&steamids=${steamId}`, { cache: "no-store", signal: AbortSignal.timeout(8000) }),
      fetch(
        `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${key}&steamid=${steamId}&include_appinfo=1&include_played_free_games=1&appids_filter%5B0%5D=${APEX_APPID}`,
        { cache: "no-store", signal: AbortSignal.timeout(8000) },
      ),
    ]);
    const sum = (await sumRes.json()) as { response?: { players?: Record<string, unknown>[] } };
    const games = (await gamesRes.json()) as { response?: { games?: { appid: number; playtime_forever?: number; playtime_2weeks?: number }[] } };
    const p = sum.response?.players?.[0] ?? {};
    const list = games.response?.games;
    const apex = list?.find((g) => g.appid === APEX_APPID);
    return {
      name: typeof p.personaname === "string" ? p.personaname : null,
      avatar: typeof p.avatarfull === "string" ? p.avatarfull : null,
      profileUrl: typeof p.profileurl === "string" ? p.profileurl : null,
      gamesVisible: Array.isArray(list),
      apexMinutes: apex?.playtime_forever ?? null,
      apexMinutes2w: apex?.playtime_2weeks ?? null,
      fetchedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function parseSteamSnapshot(json: string | null | undefined): SteamSnapshot | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as SteamSnapshot;
  } catch {
    return null;
  }
}

/** Refresh a user's cached Steam snapshot if stale. Never throws. */
export async function refreshSteamStats(user: { id: string; steamId: string | null; steamStats: string | null; steamStatsAt: Date | null }) {
  const cached = parseSteamSnapshot(user.steamStats);
  if (!user.steamId || !steamConfigured()) return cached;
  const stale = !user.steamStatsAt || Date.now() - user.steamStatsAt.getTime() > STEAM_TTL_MS;
  if (!stale) return cached;
  const snap = await fetchSteamSnapshot(user.steamId);
  if (snap) {
    await db.user.update({ where: { id: user.id }, data: { steamStats: JSON.stringify(snap), steamStatsAt: new Date(), steamName: snap.name, steamAvatar: snap.avatar } });
    return snap;
  }
  await db.user.update({ where: { id: user.id }, data: { steamStatsAt: new Date() } });
  return cached;
}

export const hours = (minutes: number | null | undefined) => (minutes == null ? null : Math.round(minutes / 6) / 10);
