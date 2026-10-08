"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireApproved, requireOfficer } from "@/lib/auth";
import { ENABLED_GAMES } from "@/lib/constants";
import { parseMediaUrl } from "@/lib/media";
import type { ActionState } from "@/lib/validation";

function clean(v: FormDataEntryValue | null) {
  return typeof v === "string" ? v : "";
}
function revalidateAll() {
  revalidatePath("/", "layout");
}

/* ---------------- The Round Table: disputes ---------------- */

export async function raiseDisputeAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const me = await requireApproved();
  const subject = clean(formData.get("subject")).trim().slice(0, 120);
  const details = clean(formData.get("details")).trim().slice(0, 3000);
  const againstUserId = clean(formData.get("againstUserId")).trim() || null;
  if (subject.length < 4) return { ok: false, errors: { subject: ["Give it a short subject"] } };
  if (details.length < 20) return { ok: false, errors: { details: ["Explain what happened (20+ characters)"] } };
  if (againstUserId) {
    const target = await db.user.findUnique({ where: { id: againstUserId }, select: { id: true } });
    if (!target) return { ok: false, message: "That member was not found." };
  }
  await db.dispute.create({ data: { raisedById: me.id, againstUserId, subject, details } });
  revalidateAll();
  return { ok: true, message: "Brought to The Round Table. Officers will review it and record a decision." };
}

export async function resolveDisputeAction(formData: FormData) {
  const officer = await requireOfficer();
  const id = clean(formData.get("id"));
  const status = clean(formData.get("status"));
  const resolution = clean(formData.get("resolution")).trim().slice(0, 1000);
  if (!id || !["RESOLVED", "DISMISSED"].includes(status)) return;
  await db.dispute.update({ where: { id }, data: { status, resolution: resolution || null, resolvedById: officer.id, resolvedAt: new Date() } });
  revalidateAll();
}

/* ---------------- Esports: tryouts ---------------- */

export async function requestTryoutAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const me = await requireApproved();
  const game = clean(formData.get("game"));
  const message = clean(formData.get("message")).trim().slice(0, 1000);
  if (!ENABLED_GAMES.some((g) => g.name === game)) return { ok: false, errors: { game: ["Pick a game"] } };
  if (message.length < 10) return { ok: false, errors: { message: ["Tell the coaches why (10+ characters)"] } };
  const open = await db.tryoutRequest.findFirst({ where: { userId: me.id, game, status: { in: ["PENDING", "SCHEDULED"] } } });
  if (open) return { ok: false, message: "You already have a tryout request open for this game." };
  await db.tryoutRequest.create({ data: { userId: me.id, game, message } });
  revalidateAll();
  return { ok: true, message: "Tryout requested. An officer will schedule it and reach you on Discord." };
}

export async function reviewTryoutAction(formData: FormData) {
  await requireOfficer();
  const id = clean(formData.get("id"));
  const status = clean(formData.get("status"));
  const note = clean(formData.get("note")).trim().slice(0, 500);
  if (!id || !["SCHEDULED", "PASSED", "FAILED", "PENDING"].includes(status)) return;
  await db.tryoutRequest.update({ where: { id }, data: { status, note: note || null, reviewedAt: new Date() } });
  revalidateAll();
}

/* ---------------- Media hub ---------------- */

export async function submitMediaAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const me = await requireApproved();
  const title = clean(formData.get("title")).trim().slice(0, 120);
  const url = clean(formData.get("url")).trim();
  const description = clean(formData.get("description")).trim().slice(0, 1000);
  const game = clean(formData.get("game")).trim().slice(0, 60) || null;
  if (title.length < 3) return { ok: false, errors: { title: ["Give it a title"] } };
  const parsed = parseMediaUrl(url);
  if (!parsed) return { ok: false, errors: { url: ["Paste a YouTube or Twitch link (video, short, clip, or channel)"] } };

  const isOfficer = me.role === "OFFICER" || me.role === "LEADER";
  await db.mediaPost.create({
    data: { title, url, provider: parsed.provider, embedId: parsed.embedId, kind: parsed.kind, description, game, postedById: me.id, approved: isOfficer },
  });
  revalidateAll();
  return { ok: true, message: isOfficer ? "Posted to the Media page." : "Submitted. An officer will approve it before it goes public." };
}

export async function reviewMediaAction(formData: FormData) {
  await requireOfficer();
  const id = clean(formData.get("id"));
  const mode = clean(formData.get("mode")); // approve | unapprove | feature | unfeature | delete
  if (!id) return;
  if (mode === "delete") await db.mediaPost.delete({ where: { id } });
  else if (mode === "approve") await db.mediaPost.update({ where: { id }, data: { approved: true } });
  else if (mode === "unapprove") await db.mediaPost.update({ where: { id }, data: { approved: false, featured: false } });
  else if (mode === "feature") await db.mediaPost.update({ where: { id }, data: { featured: true, approved: true } });
  else if (mode === "unfeature") await db.mediaPost.update({ where: { id }, data: { featured: false } });
  revalidateAll();
}

export async function deleteOwnMediaAction(formData: FormData) {
  const me = await requireApproved();
  const id = clean(formData.get("id"));
  await db.mediaPost.deleteMany({ where: { id, postedById: me.id } });
  revalidateAll();
}
