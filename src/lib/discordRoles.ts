import "server-only";
import { db } from "@/lib/db";
import { discordConfig, discordSyncConfigured } from "@/lib/discord";
import { ALL_RANKS, ENABLED_GAMES, GUILD_RANKS, SPECIALTIES, allianceRank, guildRankOf, playedGamesOf, specialtiesOf } from "@/lib/constants";
import { site } from "@/lib/site";

/*
  Keeps the Discord server in step with the website:
  - one role per rank (Legatus … Tiro), per listed game, and per specialty role, created if missing;
  - each Discord member matched to their website account gets the website's rank, game tags, and specialty roles,
    and their server nickname is set to their website display name;
  - members with no website account are in the Discord community but not in the alliance: they get no rank and
    their roles are left exactly as they are.
  Only the roles named here are ever added or removed. Every other role in the server is left alone.
*/

const API = "https://discord.com/api/v10";

const RANK_COLORS: Record<string, number> = { Legatus: 0xe0a94a, Tribune: 0xd4b06a, Centurion: 0x9b4dff, Evocatus: 0xf0c674, Veteranus: 0xb78bff, Socius: 0xc9ccd6, Tiro: 0x8a8d99 };

type Role = { id: string; name: string; position: number; managed: boolean };
type Member = { user: { id: string; username: string; global_name: string | null; bot?: boolean }; nick: string | null; roles: string[]; joined_at: string };

export type RoleSyncMode = "off" | "dry" | "on";
export type RoleSyncResult = {
  ok: boolean;
  mode: RoleSyncMode;
  at: Date;
  members: number;
  matched: number;
  rolesCreated: string[];
  changes: string[];
  skipped: string[];
  error?: string;
};

const g = globalThis as unknown as { __vztLastRoleSync?: RoleSyncResult | null };
export function lastRoleSync(): RoleSyncResult | null {
  return g.__vztLastRoleSync ?? null;
}

async function api<T>(path: string, init?: RequestInit): Promise<{ ok: boolean; status: number; data: T | null; text: string }> {
  const c = discordConfig();
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(`${API}${path}`, {
      ...init,
      headers: { Authorization: `Bot ${c.botToken}`, "Content-Type": "application/json", ...(init?.headers ?? {}) },
      cache: "no-store",
    });
    if (res.status === 429) {
      const body = (await res.json().catch(() => ({}))) as { retry_after?: number };
      await new Promise((r) => setTimeout(r, Math.min(10_000, Math.ceil((body.retry_after ?? 1) * 1000) + 100)));
      continue;
    }
    const text = await res.text();
    let data: T | null = null;
    try {
      data = text ? (JSON.parse(text) as T) : null;
    } catch {
      data = null;
    }
    return { ok: res.ok, status: res.status, data, text: text.slice(0, 200) };
  }
  return { ok: false, status: 429, data: null, text: "rate limited" };
}

const norm = (s: string | null | undefined) => (s ?? "").trim().replace(/^@/, "").toLowerCase();

/**
 * Bring Discord roles and nicknames in line with the website. `dry` only works out the plan and changes nothing.
 * `onlyDiscordIds` limits real changes to those members (used to try it on one person first).
 */
export async function syncDiscordRoles(mode: RoleSyncMode, onlyDiscordIds?: string[]): Promise<RoleSyncResult> {
  const at = new Date();
  const out: RoleSyncResult = { ok: false, mode, at, members: 0, matched: 0, rolesCreated: [], changes: [], skipped: [] };
  const done = (r: RoleSyncResult) => (g.__vztLastRoleSync = r);
  if (mode === "off" || !discordSyncConfigured()) return done({ ...out, error: "Discord role sync is off or the bot is not configured." });
  const c = discordConfig();
  const apply = mode === "on";

  /* ---- roles: make sure every managed role exists ---- */
  const rolesRes = await api<Role[]>(`/guilds/${c.guildId}/roles`);
  if (!rolesRes.ok || !rolesRes.data) return done({ ...out, error: `Could not read the server's roles (${rolesRes.status}). Is the bot in the server?` });
  const roles = rolesRes.data;
  // Role names read English first with the Latin in parentheses, e.g. "General (Legatus)" (owner's rule, 2026-10-12).
  const specialtyName = (s: { label: string; plain: string }) => `${s.plain} (${s.label})`;
  const guildRoleName = (r: { label: string }) => `${site.legionGame} ${r.label}`;
  const rankNames = ALL_RANKS.map((r) => r.full);
  const guildNames = GUILD_RANKS.map(guildRoleName);
  const gameNames = ENABLED_GAMES.map((x) => x.name);
  const specialtyNames = SPECIALTIES.map(specialtyName);
  const legionName = site.legionName;
  const managedNames = [...rankNames, ...guildNames, ...specialtyNames, legionName, ...gameNames];
  // The Latin-only names these roles were first created with: renamed in place so nobody loses a role.
  const oldNames = new Map<string, string>([...ALL_RANKS.map((r) => [r.full, r.label] as [string, string]), ...SPECIALTIES.map((s) => [specialtyName(s), s.label] as [string, string])]);
  const colorOf = (name: string) => RANK_COLORS[oldNames.get(name) ?? ""];
  const byName = new Map<string, Role>();
  for (const r of roles) if (!r.managed && !byName.has(r.name.toLowerCase())) byName.set(r.name.toLowerCase(), r);

  for (const [name, old] of oldNames) {
    const existing = byName.get(old.toLowerCase());
    if (byName.has(name.toLowerCase()) || !existing) continue;
    out.changes.push(`${apply ? "" : "would "}rename role "${old}" to "${name}"`);
    byName.set(name.toLowerCase(), existing);
    if (!apply) continue;
    const renamed = await api<Role>(`/guilds/${c.guildId}/roles/${existing.id}`, { method: "PATCH", body: JSON.stringify({ name }) });
    if (!renamed.ok) return done({ ...out, error: `Could not rename the role "${old}" (${renamed.status}): ${renamed.text}` });
  }

  for (const name of managedNames) {
    if (byName.has(name.toLowerCase())) continue;
    out.rolesCreated.push(name);
    if (!apply) continue;
    const isRank = rankNames.includes(name);
    const made = await api<Role>(`/guilds/${c.guildId}/roles`, {
      method: "POST",
      body: JSON.stringify({ name, hoist: isRank, mentionable: !isRank, permissions: "0", ...(colorOf(name) ? { color: colorOf(name) } : {}) }),
    });
    if (!made.ok || !made.data) return done({ ...out, error: `Could not create the role "${name}" (${made.status}): ${made.text}. The bot needs Manage Roles.` });
    byName.set(name.toLowerCase(), made.data);
  }
  const idOf = (name: string) => byName.get(name.toLowerCase())?.id;
  const managedIds = new Set(managedNames.map(idOf).filter((x): x is string => !!x));

  /* ---- order: rank roles sit right under the bot's own role, highest rank first, so the member sidebar groups by rank ---- */
  if (apply) {
    const me = await api<{ id: string }>("/users/@me");
    const mine = me.data ? await api<{ roles: string[] }>(`/guilds/${c.guildId}/members/${me.data.id}`) : null;
    const fresh = await api<Role[]>(`/guilds/${c.guildId}/roles`);
    if (mine?.data && fresh.data) {
      const pos = new Map(fresh.data.map((r) => [r.id, r.position]));
      const botTop = Math.max(0, ...mine.data.roles.map((r) => pos.get(r) ?? 0));
      const ordered = [...rankNames, ...guildNames, ...specialtyNames].map(idOf).filter((x): x is string => !!x);
      // Roles that sit between the bot and our roles keep everyone grouped under them instead of under a rank.
      const blockers = fresh.data.filter((r) => !ordered.includes(r.id) && r.position < botTop && r.position > Math.min(...ordered.map((id) => pos.get(id) ?? 0)) && r.name !== "@everyone");
      const want = ordered.map((id, i) => ({ id, position: botTop - 1 - i }));
      const already = blockers.length === 0 && want.every((w, i) => i === 0 || (pos.get(want[i - 1].id) ?? 0) > (pos.get(w.id) ?? 0));
      if (botTop <= ordered.length) {
        out.skipped.push(`Rank roles could not be moved up: the bot role is too low (position ${botTop}, needs more than ${ordered.length}). In Server Settings > Roles, drag the Vstroz Alliance bot role to the top.`);
      } else if (!already) {
        const moved = await api(`/guilds/${c.guildId}/roles`, { method: "PATCH", body: JSON.stringify(want) });
        if (moved.ok) out.changes.push(`role order: moved ${ordered.length} rank, guild and specialty roles to the top, under the bot's role`);
        else out.skipped.push(`Rank roles could not be moved up (${moved.status}) ${moved.text}`);
      }
    }
  }

  /* ---- members ---- */
  const members: Member[] = [];
  let after = "0";
  for (let page = 0; page < 100; page++) {
    const res = await api<Member[]>(`/guilds/${c.guildId}/members?limit=1000&after=${after}`);
    if (!res.ok || !res.data) return done({ ...out, error: `Could not read the member list (${res.status}). Turn on the Server Members Intent.` });
    members.push(...res.data);
    if (res.data.length < 1000) break;
    after = res.data[res.data.length - 1].user.id;
  }
  const people = members.filter((m) => !m.user.bot);
  out.members = people.length;
  if (apply) {
    // Greet anyone who joined since the last check, and call the Recruiters over.
    const { welcomeNewDiscordMembers } = await import("@/lib/feed");
    await welcomeNewDiscordMembers(people, idOf(specialtyName(SPECIALTIES[0]))).catch((e) => console.error("[feed] welcome failed", e));
  }

  const users = await db.user.findMany({
    where: { discordLeftAt: null },
    select: { id: true, username: true, displayName: true, discord: true, discordId: true, discordUsername: true, role: true, tier: true, status: true, guildRank: true, game: true, playedGames: true, specialties: true },
  });
  const guild = await api<{ owner_id: string }>(`/guilds/${c.guildId}`);
  const ownerId = guild.data?.owner_id;

  const taken = new Set<string>();
  const findUser = (m: Member) => {
    const names = new Set([norm(m.user.username), norm(m.user.global_name), norm(m.nick)].filter(Boolean));
    // 1. linked by signing in with Discord; 2. the Discord handle they typed on their profile; 3. same name on both.
    const hit =
      users.find((u) => u.discordId === m.user.id) ??
      users.find((u) => !u.discordId && !taken.has(u.id) && !!norm(u.discord) && norm(u.discord) === norm(m.user.username)) ??
      users.find((u) => !u.discordId && !taken.has(u.id) && !!norm(u.discord) && names.has(norm(u.discord))) ??
      users.find((u) => !u.discordId && !taken.has(u.id) && (names.has(norm(u.username)) || names.has(norm(u.displayName))));
    if (hit) taken.add(hit.id);
    return hit ?? null;
  };

  for (const m of people) {
    const label = m.nick ?? m.user.global_name ?? m.user.username;
    const u = findUser(m);
    const current = new Set(m.roles);
    const want = new Set(m.roles.filter((r) => !managedIds.has(r))); // everything we do not manage stays
    const names: string[] = [];
    const add = (name: string) => {
      const id = idOf(name);
      if (id) want.add(id);
      names.push(name);
    };

    if (u) {
      out.matched++;
      add(allianceRank(u).full);
      const guildRank = guildRankOf(u); // only for members of the guild; separate from the alliance rank
      if (guildRank) add(guildRoleName(guildRank));
      for (const s of specialtiesOf(u)) add(specialtyName(s));
      for (const game of playedGamesOf(u)) add(game);
      if (u.status === "APPROVED") add(legionName);
    } else {
      // No website account: they are in the Discord community but not in the alliance, so they hold no alliance
      // rank (owner's rule, 2026-10-12). Joining the alliance means making a website account, which starts at Tiro.
      // Whatever roles they already have are left exactly as they are.
      // Rule changed the same day: everyone in the Discord without a website account is a Recruit (Tiro).
      // A website account makes them a Member. Nothing else of theirs is touched.
      for (const r of m.roles) if (managedIds.has(r) && !rankNames.some((n) => idOf(n) === r)) want.add(r);
      add(ALL_RANKS[ALL_RANKS.length - 1].full);
    }

    const adding = [...want].filter((r) => !current.has(r));
    const removing = [...current].filter((r) => !want.has(r));
    const wantsNick = u && m.user.id !== ownerId && norm(label) !== norm(u.displayName) ? u.displayName.slice(0, 32) : null;
    const nick = site.discordRenameMembers ? wantsNick : null;
    if (wantsNick && !nick) out.skipped.push(`${label}: website name is "${wantsNick}" (renaming is switched off)`);
    const missingRole = names.some((n) => !idOf(n)); // in a dry run the roles may not exist yet
    if (!adding.length && !removing.length && !nick && !missingRole) continue;
    // In a dry run the roles may not exist yet, so describe by name.
    const nameOf = (id: string) => roles.find((r) => r.id === id)?.name ?? [...byName.values()].find((r) => r.id === id)?.name ?? id;
    const plan = `${label}${u ? ` (site: ${u.displayName})` : ""}: ${apply ? "" : "would "}set ${names.join(", ") || "no managed roles"}${removing.length ? `; remove ${removing.map(nameOf).join(", ")}` : ""}${nick ? `; rename to "${nick}"` : ""}`;
    if (!apply) {
      out.changes.push(plan);
      continue;
    }
    if (onlyDiscordIds && !onlyDiscordIds.includes(m.user.id) && !(onlyDiscordIds.includes("owner") && m.user.id === ownerId)) continue;
    if (adding.length || removing.length) {
      const res = await api(`/guilds/${c.guildId}/members/${m.user.id}`, { method: "PATCH", body: JSON.stringify({ roles: [...want] }) });
      if (!res.ok) {
        out.skipped.push(`${label}: roles not changed (${res.status}) ${res.text}`);
        continue;
      }
    }
    if (nick) {
      const res = await api(`/guilds/${c.guildId}/members/${m.user.id}`, { method: "PATCH", body: JSON.stringify({ nick }) });
      if (!res.ok) out.skipped.push(`${label}: name not changed (${res.status}). Discord does not let a bot rename someone ranked above it.`);
    }
    out.changes.push(plan);
    // Remember the link when it came from the handle the member typed themselves, so later syncs do not depend on names.
    if (u && !u.discordId && norm(u.discord) === norm(m.user.username)) {
      const clash = await db.user.findFirst({ where: { discordId: m.user.id }, select: { id: true } });
      if (!clash) await db.user.update({ where: { id: u.id }, data: { discordId: m.user.id, discordUsername: m.user.username, discordLinkedAt: new Date() } });
    }
  }

  return done({ ...out, ok: true });
}
