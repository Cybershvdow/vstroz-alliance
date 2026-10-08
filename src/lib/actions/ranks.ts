"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireApproved, requireOfficer, requireLeader } from "@/lib/auth";
import { TIERS, VOTED_TIERS, VOTE_RULES, VOTE_CHOICES, canVoteOn, tierRank, type Tier } from "@/lib/constants";
import { tally } from "@/lib/ranks";
import type { ActionState } from "@/lib/validation";

function clean(v: FormDataEntryValue | null) {
  return typeof v === "string" ? v : "";
}
function revalidateAll() {
  revalidatePath("/", "layout");
}

/* ---------------- Officer: set a non-voted tier directly ---------------- */

export async function setTierAction(formData: FormData) {
  const officer = await requireOfficer();
  const userId = clean(formData.get("userId"));
  const tier = clean(formData.get("tier"));
  if (!userId || !(TIERS as readonly string[]).includes(tier)) return;
  const target = await db.user.findUnique({ where: { id: userId }, select: { id: true, role: true, tier: true } });
  if (!target) return;
  // Generals are peers: only they can change their own tier.
  if (target.role === "LEADER" && target.id !== officer.id) return;
  if (officer.role !== "LEADER") {
    // Captains: only Recruit ⇄ Member, only for plain members, never touching a voted rank.
    const isVoted = (t: string) => (VOTED_TIERS as readonly string[]).includes(t);
    if (target.role !== "MEMBER" || isVoted(tier) || isVoted(target.tier)) return;
  }
  await db.user.update({ where: { id: userId }, data: { tier } });
  revalidateAll();
}

/* ---------------- Officer: open a nomination ---------------- */

export async function nominateAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const officer = await requireOfficer();
  const userId = clean(formData.get("userId"));
  const tier = clean(formData.get("tier")) as Tier;
  const reason = clean(formData.get("reason")).trim().slice(0, 1000);

  if (!userId) return { ok: false, message: "Pick a member." };
  if (!(VOTED_TIERS as readonly string[]).includes(tier)) return { ok: false, message: "That rank is not decided by vote." };
  if (reason.length < 10) return { ok: false, message: "Give the voters a reason (10+ characters)." };

  const target = await db.user.findUnique({ where: { id: userId } });
  if (!target || target.status !== "APPROVED") return { ok: false, message: "Member not found." };
  if (tierRank(target.tier) >= tierRank(tier)) return { ok: false, message: `${target.displayName} is already ${target.tier.toLowerCase()} or higher.` };

  const open = await db.nomination.findFirst({ where: { userId, status: "OPEN" } });
  if (open) return { ok: false, message: `${target.displayName} already has an open vote.` };

  await db.nomination.create({
    data: {
      userId,
      tier,
      nominatedById: officer.id,
      reason,
      closesAt: new Date(Date.now() + VOTE_RULES.windowHours * 3600 * 1000),
    },
  });
  revalidateAll();
  return { ok: true, message: `Vote opened for ${target.displayName} → ${tier}. Closes in ${VOTE_RULES.windowHours} hours.` };
}

/* ---------------- Member: cast a vote ---------------- */

export async function castVoteAction(formData: FormData) {
  const me = await requireApproved();
  const nominationId = clean(formData.get("nominationId"));
  const choice = clean(formData.get("choice"));
  const comment = clean(formData.get("comment")).trim().slice(0, 300);
  if (!nominationId || !(VOTE_CHOICES as readonly string[]).includes(choice)) return;

  const nom = await db.nomination.findUnique({ where: { id: nominationId } });
  if (!nom || nom.status !== "OPEN" || nom.closesAt < new Date()) return;
  if (nom.userId === me.id) return; // cannot vote on yourself
  const meFull = await db.user.findUnique({ where: { id: me.id }, select: { role: true, tier: true } });
  if (!meFull || !canVoteOn(meFull, nom.tier)) return;

  await db.vote.upsert({
    where: { nominationId_voterId: { nominationId, voterId: me.id } },
    create: { nominationId, voterId: me.id, choice, comment: comment || null },
    update: { choice, comment: comment || null },
  });
  revalidateAll();
}

/* ---------------- Officer/Leader: close a nomination ---------------- */

export async function finalizeNominationAction(formData: FormData) {
  const officer = await requireOfficer();
  const nominationId = clean(formData.get("nominationId"));
  const mode = clean(formData.get("mode")); // "close" (apply result) | "veto" | "withdraw"
  const nom = await db.nomination.findUnique({ where: { id: nominationId }, include: { votes: true } });
  if (!nom || nom.status !== "OPEN") return;

  if (mode === "veto") {
    await requireLeader();
    await db.nomination.update({ where: { id: nominationId }, data: { status: "VETOED", decidedAt: new Date(), decidedById: officer.id } });
    revalidateAll();
    return;
  }
  if (mode === "withdraw") {
    await db.nomination.update({ where: { id: nominationId }, data: { status: "WITHDRAWN", decidedAt: new Date(), decidedById: officer.id } });
    revalidateAll();
    return;
  }

  // "close": officers can close once the window has ended; leaders can close early.
  const ended = nom.closesAt <= new Date();
  if (!ended && officer.role !== "LEADER") return;

  const t = tally(nom.votes);
  const status = t.passing ? "PASSED" : "FAILED";
  await db.$transaction([
    db.nomination.update({ where: { id: nominationId }, data: { status, decidedAt: new Date(), decidedById: officer.id } }),
    ...(t.passing ? [db.user.updateMany({ where: { id: nom.userId, tier: { in: TIERS.slice(0, tierRank(nom.tier)) as string[] } }, data: { tier: nom.tier } })] : []),
  ]);
  revalidateAll();
}
