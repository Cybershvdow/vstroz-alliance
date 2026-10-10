import "server-only";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

/*
  Discord integration.
  - Sign in / create an account with Discord (OAuth2). Only members of the alliance server can create an account:
    being in the Discord IS being in the community.
  - Membership sync via the bot: leaving the server removes you from the legion and hides your account;
    rejoining restores a community account. Command (Generals/Captains) is never auto-removed.
  Everything is driven by env vars; when they are missing the site falls back to username/password only.
*/

const API = "https://discord.com/api/v10";
export const STATE_COOKIE = "vzt_discord_state";

export function discordConfig() {
  const appUrl = (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
  return {
    clientId: process.env.DISCORD_CLIENT_ID?.trim() || "",
    clientSecret: process.env.DISCORD_CLIENT_SECRET?.trim() || "",
    botToken: process.env.DISCORD_BOT_TOKEN?.trim() || "",
    guildId: process.env.DISCORD_GUILD_ID?.trim() || "",
    appUrl,
    redirectUri: `${appUrl}/api/discord/callback`,
  };
}

/** OAuth sign-in works once the app id, secret, and server id are set. */
export function discordConfigured() {
  const c = discordConfig();
  return !!(c.clientId && c.clientSecret && c.guildId);
}

/** Leave/rejoin sync additionally needs the bot token. */
export function discordSyncConfigured() {
  return discordConfigured() && !!discordConfig().botToken;
}

export function authorizeUrl(state: string) {
  const c = discordConfig();
  const p = new URLSearchParams({
    client_id: c.clientId,
    response_type: "code",
    redirect_uri: c.redirectUri,
    scope: "identify email guilds.members.read",
    state,
    prompt: "consent",
  });
  return `https://discord.com/oauth2/authorize?${p.toString()}`;
}

export type DiscordUser = { id: string; username: string; global_name: string | null; email?: string | null; verified?: boolean };

export async function exchangeCode(code: string): Promise<string | null> {
  const c = discordConfig();
  const res = await fetch(`${API}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: c.clientId, client_secret: c.clientSecret, grant_type: "authorization_code", code, redirect_uri: c.redirectUri }),
    cache: "no-store",
  });
  if (!res.ok) {
    console.error(`[discord] token exchange failed: ${res.status} ${await res.text()}`);
    return null;
  }
  const j = (await res.json()) as { access_token?: string };
  return j.access_token ?? null;
}

export async function fetchDiscordUser(token: string): Promise<DiscordUser | null> {
  const res = await fetch(`${API}/users/@me`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
  return res.ok ? ((await res.json()) as DiscordUser) : null;
}

/** Is the signed-in Discord user in the alliance server? (scope guilds.members.read; 404 when not a member) */
export async function isGuildMember(token: string): Promise<boolean> {
  const c = discordConfig();
  const res = await fetch(`${API}/users/@me/guilds/${c.guildId}/member`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
  return res.ok;
}

/** Create a community account for a Discord user who has no website account yet. */
export async function createDiscordAccount(du: DiscordUser) {
  let base = (du.username || "member").toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 16);
  if (base.length < 3) base = `${base}_${du.id.slice(-4)}`;
  let username = base;
  for (let i = 2; await db.user.findUnique({ where: { username }, select: { id: true } }); i++) username = `${base}${i}`;

  const placeholder = `${du.id}@discord.vstroz.local`;
  let email = du.email && du.verified ? du.email.toLowerCase() : placeholder;
  if (await db.user.findUnique({ where: { email }, select: { id: true } })) email = placeholder;

  const passwordHash = await bcrypt.hash(crypto.randomBytes(24).toString("base64url"), 12);
  return db.user.create({
    data: {
      username,
      email,
      passwordHash,
      displayName: (du.global_name || du.username || "Member").slice(0, 32),
      discord: du.username,
      discordId: du.id,
      discordUsername: du.username,
      discordLinkedAt: new Date(),
      status: "PENDING",
      role: "MEMBER",
    },
  });
}

/** All member ids in the server, read with the bot (needs the Server Members Intent). */
export async function listGuildMemberIds(): Promise<Set<string> | null> {
  const c = discordConfig();
  if (!c.botToken || !c.guildId) return null;
  const ids = new Set<string>();
  let after = "0";
  for (let page = 0; page < 100; page++) {
    const res = await fetch(`${API}/guilds/${c.guildId}/members?limit=1000&after=${after}`, { headers: { Authorization: `Bot ${c.botToken}` }, cache: "no-store" });
    if (!res.ok) {
      console.error(`[discord] member list failed: ${res.status} ${await res.text()}`);
      return null;
    }
    const batch = (await res.json()) as { user: { id: string } }[];
    for (const m of batch) ids.add(m.user.id);
    if (batch.length < 1000) break;
    after = batch[batch.length - 1].user.id;
  }
  return ids;
}

export type SyncResult = { ok: boolean; checked: number; removed: number; restored: number; at: Date; error?: string };

const g = globalThis as unknown as { __vztLastDiscordSync?: SyncResult | null };
export function lastDiscordSync(): SyncResult | null {
  return g.__vztLastDiscordSync ?? null;
}

/** Reconcile linked accounts with the server member list. Safe to run as often as you like. */
export async function reconcileDiscord(): Promise<SyncResult> {
  const at = new Date();
  const ids = await listGuildMemberIds();
  if (!ids) {
    g.__vztLastDiscordSync = {
      ok: false,
      checked: 0,
      removed: 0,
      restored: 0,
      at,
      error: "Could not read the server member list. Check DISCORD_BOT_TOKEN, turn on the Server Members Intent, and make sure the bot is in the server.",
    };
    return g.__vztLastDiscordSync;
  }
  const linked = await db.user.findMany({
    where: { discordId: { not: null } },
    select: { id: true, discordId: true, role: true, status: true, discordLeftAt: true },
  });
  let removed = 0;
  let restored = 0;
  for (const u of linked) {
    const inGuild = ids.has(u.discordId ?? "");
    if (!inGuild && !u.discordLeftAt) {
      if (u.role !== "MEMBER") continue; // command is never auto-removed
      await db.user.update({
        where: { id: u.id },
        data: { discordLeftAt: at, status: "DENIED", appliedAt: null, reviewedAt: at, reviewNote: "Left the Discord server." },
      });
      removed++;
    } else if (inGuild && u.discordLeftAt) {
      await db.user.update({
        where: { id: u.id },
        data: { discordLeftAt: null, status: "PENDING", appliedAt: null, reviewedAt: null, reviewNote: null },
      });
      restored++;
    }
  }
  g.__vztLastDiscordSync = { ok: true, checked: linked.length, removed, restored, at };
  if (removed || restored) console.log(`[discord] sync: ${removed} removed, ${restored} restored`);
  return g.__vztLastDiscordSync;
}
