import "server-only";
import { db } from "@/lib/db";

/* Profile badges. Nothing is stored: each one is worked out from what the member has actually done. */

export type ProfileBadge = { key: string; label: string; how: string; tone: "gold" | "accent" | "cyan" | "neutral" };

/** Accounts made before the alliance opened its doors to the wider Discord. */
const FOUNDING_CUTOFF = new Date("2026-10-12T21:20:00Z");

export async function badgesFor(user: { id: string; createdAt: Date }): Promise<ProfileBadge[]> {
  const [clips, likesReceived, votes, comments, hosted, joined] = await Promise.all([
    db.mediaPost.count({ where: { postedById: user.id, approved: true, official: false } }),
    db.mediaLike.count({ where: { post: { postedById: user.id, approved: true, official: false }, userId: { not: user.id } } }),
    db.vote.count({ where: { voterId: user.id } }),
    db.mediaComment.count({ where: { userId: user.id } }),
    db.playSession.count({ where: { hostId: user.id } }),
    db.playJoin.count({ where: { userId: user.id, session: { hostId: { not: user.id } } } }),
  ]);
  const out: ProfileBadge[] = [];
  if (user.createdAt < FOUNDING_CUTOFF) out.push({ key: "founding", label: "Founding member", how: "Joined before the alliance opened up", tone: "gold" });
  if (clips >= 10) out.push({ key: "clips10", label: "Content machine", how: "Posted 10 clips", tone: "gold" });
  else if (clips >= 1) out.push({ key: "clip1", label: "First clip", how: "Posted a clip", tone: "accent" });
  if (likesReceived >= 10) out.push({ key: "likes10", label: "Fan favorite", how: "10 likes on their clips", tone: "gold" });
  if (votes >= 5) out.push({ key: "votes5", label: "Voter", how: "Voted in 5 promotions", tone: "accent" });
  if (comments >= 10) out.push({ key: "comments10", label: "Hype man", how: "Left 10 comments", tone: "cyan" });
  if (hosted >= 3) out.push({ key: "host3", label: "Squad leader", how: "Started 3 play sessions", tone: "cyan" });
  if (joined >= 5) out.push({ key: "join5", label: "Always in", how: "Joined 5 play sessions", tone: "cyan" });
  return out;
}
