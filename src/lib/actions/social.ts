"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser, requireUser } from "@/lib/auth";
import { ENABLED_GAMES } from "@/lib/constants";
import { announce, siteUrl } from "@/lib/feed";
import type { ActionState } from "@/lib/validation";

/* Likes and comments on clips, and "who's playing" sessions. Any signed-in alliance member can use them. */

export type ClipReactions = {
  signedIn: boolean;
  likes: number;
  liked: boolean;
  comments: { id: string; body: string; at: string; name: string; username: string; canDelete: boolean }[];
};

const visiblePost = (id: string) => db.mediaPost.findFirst({ where: { id, approved: true }, select: { id: true } });

export async function getReactionsAction(postId: string): Promise<ClipReactions> {
  const me = await getCurrentUser();
  const [likes, mine, comments] = await Promise.all([
    db.mediaLike.count({ where: { postId } }),
    me ? db.mediaLike.findUnique({ where: { postId_userId: { postId, userId: me.id } }, select: { id: true } }) : null,
    db.mediaComment.findMany({ where: { postId, user: { discordLeftAt: null } }, orderBy: { createdAt: "asc" }, take: 100, include: { user: { select: { displayName: true, username: true } } } }),
  ]);
  const officer = !!me && me.role !== "MEMBER";
  return {
    signedIn: !!me && !me.discordLeftAt,
    likes,
    liked: !!mine,
    comments: comments.map((c) => ({ id: c.id, body: c.body, at: c.createdAt.toISOString(), name: c.user.displayName, username: c.user.username, canDelete: officer || c.userId === me?.id })),
  };
}

export async function toggleLikeAction(postId: string): Promise<ClipReactions> {
  const me = await requireUser();
  if (!me.discordLeftAt && (await visiblePost(postId))) {
    const existing = await db.mediaLike.findUnique({ where: { postId_userId: { postId, userId: me.id } }, select: { id: true } });
    if (existing) await db.mediaLike.delete({ where: { id: existing.id } });
    else await db.mediaLike.create({ data: { postId, userId: me.id } }).catch(() => null); // a double tap is not an error
    revalidatePath("/");
  }
  return getReactionsAction(postId);
}

export async function addCommentAction(postId: string, text: string): Promise<ClipReactions> {
  const me = await requireUser();
  const body = String(text ?? "").trim().slice(0, 500);
  if (body && !me.discordLeftAt && (await visiblePost(postId))) await db.mediaComment.create({ data: { postId, userId: me.id, body } });
  return getReactionsAction(postId);
}

export async function deleteCommentAction(commentId: string, postId: string): Promise<ClipReactions> {
  const me = await requireUser();
  const c = await db.mediaComment.findUnique({ where: { id: commentId }, select: { userId: true } });
  if (c && (c.userId === me.id || me.role !== "MEMBER")) await db.mediaComment.delete({ where: { id: commentId } });
  return getReactionsAction(postId);
}

/* ---------------- Who's playing ---------------- */

const clean = (v: FormDataEntryValue | null) => (typeof v === "string" ? v : "");

export async function createPlaySessionAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const me = await requireUser();
  if (me.discordLeftAt) return { ok: false, message: "Your account is hidden." };
  const game = clean(formData.get("game"));
  const note = clean(formData.get("note")).trim().slice(0, 140);
  // The browser sends the chosen time as an instant (see PlayForm), so nobody's time zone is guessed on the server.
  const startsAt = new Date(clean(formData.get("startsAt")));
  if (!ENABLED_GAMES.some((g) => g.name === game)) return { ok: false, errors: { game: ["Pick a game"] } };
  if (Number.isNaN(startsAt.getTime())) return { ok: false, errors: { when: ["Pick a time"] } };
  if (startsAt.getTime() < Date.now() - 15 * 60_000) return { ok: false, errors: { when: ["That time has already passed"] } };
  if (startsAt.getTime() > Date.now() + 14 * 86_400_000) return { ok: false, errors: { when: ["Keep it within the next two weeks"] } };
  const open = await db.playSession.count({ where: { hostId: me.id, startsAt: { gte: new Date() } } });
  if (open >= 5) return { ok: false, message: "You already have five sessions coming up." };

  const session = await db.playSession.create({ data: { hostId: me.id, game, startsAt, note, joins: { create: { userId: me.id } } } });
  revalidatePath("/", "layout");
  const unix = Math.floor(session.startsAt.getTime() / 1000);
  after(() => announce(`${me.displayName} is playing ${game} <t:${unix}:F> (<t:${unix}:R>).${note ? ` "${note}"` : ""} Who's in?\n${siteUrl("/dashboard/play")}`));
  return { ok: true, message: "Posted. It is on the site and in Discord." };
}

export async function togglePlayJoinAction(formData: FormData) {
  const me = await requireUser();
  const sessionId = clean(formData.get("sessionId"));
  const s = await db.playSession.findUnique({ where: { id: sessionId }, select: { id: true, hostId: true } });
  if (!s || me.discordLeftAt || s.hostId === me.id) return; // the host is always in; they cancel instead
  const existing = await db.playJoin.findUnique({ where: { sessionId_userId: { sessionId, userId: me.id } }, select: { id: true } });
  if (existing) await db.playJoin.delete({ where: { id: existing.id } });
  else await db.playJoin.create({ data: { sessionId, userId: me.id } }).catch(() => null);
  revalidatePath("/", "layout");
}

export async function cancelPlaySessionAction(formData: FormData) {
  const me = await requireUser();
  const sessionId = clean(formData.get("sessionId"));
  const s = await db.playSession.findUnique({ where: { id: sessionId }, select: { hostId: true } });
  if (!s || (s.hostId !== me.id && me.role === "MEMBER")) return;
  await db.playSession.delete({ where: { id: sessionId } });
  revalidatePath("/", "layout");
}
