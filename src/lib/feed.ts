import "server-only";
import fs from "node:fs";
import path from "node:path";
import { db } from "@/lib/db";
import { discordConfig, discordSyncConfigured } from "@/lib/discord";
import { site } from "@/lib/site";

/*
  Site activity: one line posted into a Discord channel when something happens on the website (a new member,
  a new clip, a promotion, someone looking for a squad), plus the weekly "clip of the week".
  Posting never throws and never blocks the action that caused it.
*/

const base = () => (process.env.APP_URL || "https://vstrozalliance.com").replace(/\/$/, "");
export const siteUrl = (p: string) => `${base()}${p}`;

/** Post a line to a channel (the feed by default). Nobody is pinged unless the caller names exactly who. */
export async function announce(text: string, channel: string = site.discordFeedChannelId, ping: { users?: string[]; roles?: string[] } = {}) {
  if (!channel || !discordSyncConfigured()) return false;
  try {
    const res = await fetch(`https://discord.com/api/v10/channels/${channel}/messages`, {
      method: "POST",
      headers: { Authorization: `Bot ${discordConfig().botToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ content: text.slice(0, 1950), allowed_mentions: { parse: [], users: ping.users ?? [], roles: ping.roles ?? [] } }),
      cache: "no-store",
    });
    if (!res.ok) console.error(`[feed] Discord refused the post (${res.status}) ${(await res.text()).slice(0, 160)}`);
    return res.ok;
  } catch (e) {
    console.error("[feed] post failed", e);
    return false;
  }
}

/** The clip with the most likes given in the last 7 days. Ties go to the newer clip. */
export async function clipOfTheWeek() {
  const since = new Date(Date.now() - 7 * 86_400_000);
  const top = await db.mediaLike.groupBy({ by: ["postId"], where: { createdAt: { gte: since }, post: { approved: true } }, _count: { _all: true } });
  if (top.length === 0) return null;
  const posts = await db.mediaPost.findMany({
    where: { id: { in: top.map((t) => t.postId) }, approved: true, OR: [{ official: true }, { postedBy: { discordLeftAt: null } }] },
    include: { postedBy: { select: { displayName: true, username: true } } },
  });
  const likes = new Map(top.map((t) => [t.postId, t._count._all]));
  const best = posts.sort((a, b) => (likes.get(b.id) ?? 0) - (likes.get(a.id) ?? 0) || b.createdAt.getTime() - a.createdAt.getTime())[0];
  return best ? { post: best, likes: likes.get(best.id) ?? 0 } : null;
}

/** Once a week (Sunday evening UTC) the winner is announced in Discord. A marker file next to the database stops repeats. */
export async function announceClipOfTheWeek() {
  const now = new Date();
  if (now.getUTCDay() !== 0 || now.getUTCHours() < 18) return;
  const dbFile = (process.env.DATABASE_URL || "").replace(/^file:/, "");
  if (!dbFile) return;
  const dir = path.dirname(path.isAbsolute(dbFile) ? dbFile : path.resolve("prisma", dbFile));
  const marker = path.join(dir, `.clip-of-the-week-${now.toISOString().slice(0, 10)}`);
  if (fs.existsSync(marker)) return;
  const win = await clipOfTheWeek();
  fs.writeFileSync(marker, win ? win.post.id : "none");
  if (!win) return;
  const who = win.post.official ? site.name : win.post.postedBy.displayName;
  const href = win.post.official ? `/media/alliance?v=${win.post.id}` : `/members/${encodeURIComponent(win.post.postedBy.username)}?v=${win.post.id}`;
  await announce(`Clip of the week: "${win.post.title}" by ${who}, with ${win.likes} ${win.likes === 1 ? "like" : "likes"}.\n${siteUrl(href)}`);
}

/** Says hello in the feed channel once, which also proves the bot is allowed to post there. */
export async function announceFeedLive() {
  const dbFile = (process.env.DATABASE_URL || "").replace(/^file:/, "");
  if (!dbFile || !site.discordFeedChannelId) return;
  const marker = path.join(path.dirname(path.isAbsolute(dbFile) ? dbFile : path.resolve("prisma", dbFile)), ".feed-live");
  if (fs.existsSync(marker)) return;
  const ok = await announce(`The alliance feed is live. New members, clips, promotions and play sessions from the website show up here.\n${siteUrl("/")}`);
  console.log(`[feed] first post ${ok ? "sent" : "FAILED: the bot cannot post in the feed channel"}`);
  if (ok) fs.writeFileSync(marker, new Date().toISOString());
}

/** Official news: an announcement posted on the website goes to the news channel, word for word. Pinned ones are marked important. */
export async function announceNews(a: { title: string; body: string; pinned: boolean }, author: string) {
  const head = `${a.pinned ? "IMPORTANT: " : ""}**${a.title}**`;
  const tail = `

Posted by ${author} on ${siteUrl("/dashboard")}`;
  const room = 1950 - head.length - tail.length - 2;
  const body = a.body.length > room ? `${a.body.slice(0, room - 1)}…` : a.body;
  return announce(`${head}
${body}${tail}`, site.discordNewsChannelId);
}

/**
 * Welcomes people who joined the Discord since the last check: one message each in the welcome channel, with what to
 * do next, and a ping to the Recruiters so a person follows up. The time of the last check is kept next to the
 * database, so nobody is welcomed twice and nobody who was already in the server gets a late welcome.
 */
export async function welcomeNewDiscordMembers(members: { user: { id: string; bot?: boolean }; joined_at: string }[], recruiterRoleId?: string) {
  const channel = site.discordWelcomeChannelId;
  const dbFile = (process.env.DATABASE_URL || "").replace(/^file:/, "");
  if (!channel || !dbFile) return 0;
  const marker = path.join(path.dirname(path.isAbsolute(dbFile) ? dbFile : path.resolve("prisma", dbFile)), ".discord-welcome-since");
  const now = new Date();
  if (!fs.existsSync(marker)) {
    fs.writeFileSync(marker, now.toISOString()); // first run: start from now
    return 0;
  }
  const since = new Date(fs.readFileSync(marker, "utf8").trim());
  if (Number.isNaN(since.getTime())) {
    fs.writeFileSync(marker, now.toISOString());
    return 0;
  }
  const fresh = members.filter((m) => !m.user.bot && new Date(m.joined_at) > since).sort((a, b) => a.joined_at.localeCompare(b.joined_at));
  let sent = 0;
  let upTo = since;
  for (const m of fresh.slice(0, 10)) {
    const text =
      `Welcome to the Vstroz Alliance, <@${m.user.id}>. You're in as a Recruit.

` +
      `1. Say hi and tell us what you play.
` +
      `2. Want to be a Member? Make an account at ${siteUrl("/register")} and use the same name you have here.
` +
      `3. Play Aion? Apply for the guild from your account after you sign up.

` +
      (recruiterRoleId ? `<@&${recruiterRoleId}> come say hello.` : "Someone from the team will say hello soon.");
    const ok = await announce(text, channel, { users: [m.user.id], roles: recruiterRoleId ? [recruiterRoleId] : [] });
    if (!ok) break; // try again on the next check rather than skipping someone
    sent++;
    upTo = new Date(m.joined_at);
  }
  // Everyone welcomed (or nobody new): move the line up to now. Otherwise only as far as we got.
  fs.writeFileSync(marker, (sent === Math.min(fresh.length, 10) && fresh.length <= 10 ? now : upTo).toISOString());
  if (fresh.length) console.log(`[feed] welcomed ${sent} of ${fresh.length} new Discord members`);
  return sent;
}
