"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { db } from "@/lib/db";
import { notifyDecision } from "@/lib/email";
import { site } from "@/lib/site";
import { requireOfficer, requireLeader } from "@/lib/auth";
import { MATCH_STATUS, SIGNUP_STATUS, USER_ROLE } from "@/lib/constants";
import {
  matchSchema,
  guildRoleSchema,
  announcementSchema,
  flattenErrors,
  type ActionState,
} from "@/lib/validation";

function clean(v: FormDataEntryValue | null) {
  return typeof v === "string" ? v : "";
}

function revalidateAll() {
  revalidatePath("/", "layout");
}

/* ---------------- Applicants ---------------- */

export async function reviewApplicantAction(formData: FormData) {
  const officer = await requireOfficer();
  const userId = clean(formData.get("userId"));
  const decision = clean(formData.get("decision"));
  const note = clean(formData.get("note"));
  if (!userId || !["APPROVED", "DENIED"].includes(decision)) return;

  const target = await db.user.findUnique({ where: { id: userId } });
  if (!target || target.id === officer.id) return;
  // Officers cannot deny/reset other officers or the leader.
  if (target.role !== "MEMBER" && officer.role !== "LEADER") return;

  await db.user.update({
    where: { id: userId },
    data: {
      status: decision,
      reviewedAt: new Date(),
      reviewedById: officer.id,
      reviewNote: note || null,
    },
  });
  after(() => notifyDecision(target, decision as "APPROVED" | "DENIED", note || null, site.discordInvite));
  revalidateAll();
}

/* ---------------- Members ---------------- */

export async function setMemberRoleAction(formData: FormData) {
  const leader = await requireLeader();
  const userId = clean(formData.get("userId"));
  const role = clean(formData.get("role"));
  if (!userId || userId === leader.id) return;
  if (!(USER_ROLE as readonly string[]).includes(role) || role === "LEADER") return;
  await db.user.update({ where: { id: userId }, data: { role } });
  revalidateAll();
}

export async function setMemberTitleAction(formData: FormData) {
  await requireOfficer();
  const userId = clean(formData.get("userId"));
  const title = clean(formData.get("title")).trim().slice(0, 40);
  if (!userId) return;
  await db.user.update({ where: { id: userId }, data: { title: title || null } });
  revalidateAll();
}

export async function removeMemberAction(formData: FormData) {
  const officer = await requireOfficer();
  const userId = clean(formData.get("userId"));
  const target = await db.user.findUnique({ where: { id: userId } });
  if (!target || target.id === officer.id) return;
  if (target.role !== "MEMBER" && officer.role !== "LEADER") return;
  await db.user.delete({ where: { id: userId } });
  revalidateAll();
}

/* ---------------- Matches ---------------- */

export async function createMatchAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireOfficer();
  const parsed = matchSchema.safeParse({
    title: clean(formData.get("title")),
    game: clean(formData.get("game")),
    type: clean(formData.get("type")),
    startsAt: clean(formData.get("startsAt")),
    description: clean(formData.get("description")),
    maxPlayers: clean(formData.get("maxPlayers")),
    isPublic: formData.get("isPublic") === "on",
  });
  if (!parsed.success) return { ok: false, errors: flattenErrors(parsed.error), message: "Fix the highlighted fields." };

  const d = parsed.data;
  const startsAt = new Date(d.startsAt + (d.startsAt.length === 16 ? ":00Z" : ""));
  if (Number.isNaN(startsAt.getTime())) return { ok: false, errors: { startsAt: ["Invalid date"] } };

  await db.match.create({
    data: {
      title: d.title,
      game: d.game,
      type: d.type,
      startsAt,
      description: d.description || "",
      maxPlayers: d.maxPlayers === "" || d.maxPlayers === undefined ? null : d.maxPlayers,
      isPublic: d.isPublic ?? true,
    },
  });
  revalidateAll();
  return { ok: true, message: "Match created." };
}

export async function updateMatchStatusAction(formData: FormData) {
  await requireOfficer();
  const matchId = clean(formData.get("matchId"));
  const status = clean(formData.get("status"));
  const result = clean(formData.get("result")).trim().slice(0, 120);
  if (!matchId || !(MATCH_STATUS as readonly string[]).includes(status)) return;
  await db.match.update({ where: { id: matchId }, data: { status, result: result || undefined } });
  revalidateAll();
}

export async function deleteMatchAction(formData: FormData) {
  await requireOfficer();
  const matchId = clean(formData.get("matchId"));
  if (!matchId) return;
  await db.match.delete({ where: { id: matchId } });
  revalidateAll();
  redirect("/admin/matches");
}

export async function reviewSignupAction(formData: FormData) {
  await requireOfficer();
  const signupId = clean(formData.get("signupId"));
  const status = clean(formData.get("status"));
  if (!signupId || !(SIGNUP_STATUS as readonly string[]).includes(status)) return;
  await db.matchSignup.update({ where: { id: signupId }, data: { status } });
  revalidateAll();
}

/* ---------------- Guild roles ---------------- */

export async function createGuildRoleAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireOfficer();
  const parsed = guildRoleSchema.safeParse({
    name: clean(formData.get("name")),
    description: clean(formData.get("description")),
    slots: clean(formData.get("slots")) || "1",
  });
  if (!parsed.success) return { ok: false, errors: flattenErrors(parsed.error) };
  await db.guildRole.create({
    data: { name: parsed.data.name, description: parsed.data.description || "", slots: parsed.data.slots },
  });
  revalidateAll();
  return { ok: true, message: "Role created." };
}

export async function toggleGuildRoleAction(formData: FormData) {
  await requireOfficer();
  const roleId = clean(formData.get("roleId"));
  const role = await db.guildRole.findUnique({ where: { id: roleId } });
  if (!role) return;
  await db.guildRole.update({ where: { id: roleId }, data: { isOpen: !role.isOpen } });
  revalidateAll();
}

export async function deleteGuildRoleAction(formData: FormData) {
  await requireOfficer();
  const roleId = clean(formData.get("roleId"));
  if (!roleId) return;
  await db.guildRole.delete({ where: { id: roleId } });
  revalidateAll();
}

export async function reviewRoleApplicationAction(formData: FormData) {
  await requireOfficer();
  const applicationId = clean(formData.get("applicationId"));
  const decision = clean(formData.get("decision"));
  const note = clean(formData.get("note")).trim().slice(0, 300);
  if (!applicationId || !["APPROVED", "DENIED"].includes(decision)) return;
  await db.roleApplication.update({
    where: { id: applicationId },
    data: { status: decision, reviewNote: note || null, reviewedAt: new Date() },
  });
  revalidateAll();
}

/* ---------------- Announcements ---------------- */

export async function createAnnouncementAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const officer = await requireOfficer();
  const parsed = announcementSchema.safeParse({
    title: clean(formData.get("title")),
    body: clean(formData.get("body")),
    pinned: formData.get("pinned") === "on",
  });
  if (!parsed.success) return { ok: false, errors: flattenErrors(parsed.error) };
  await db.announcement.create({
    data: { title: parsed.data.title, body: parsed.data.body, pinned: parsed.data.pinned ?? false, authorId: officer.id },
  });
  revalidateAll();
  return { ok: true, message: "Posted." };
}

export async function deleteAnnouncementAction(formData: FormData) {
  await requireOfficer();
  const id = clean(formData.get("id"));
  if (!id) return;
  await db.announcement.delete({ where: { id } });
  revalidateAll();
}
