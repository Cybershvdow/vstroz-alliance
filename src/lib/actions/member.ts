"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { db } from "@/lib/db";
import { notifyRoleApplication } from "@/lib/email";
import { requireApproved } from "@/lib/auth";
import { signupSchema, roleApplySchema, flattenErrors, type ActionState } from "@/lib/validation";

function clean(v: FormDataEntryValue | null) {
  return typeof v === "string" ? v : "";
}

export async function signupForMatchAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const me = await requireApproved();
  const parsed = signupSchema.safeParse({
    matchId: clean(formData.get("matchId")),
    position: clean(formData.get("position")),
    note: clean(formData.get("note")),
  });
  if (!parsed.success) return { ok: false, errors: flattenErrors(parsed.error) };

  const { matchId, position, note } = parsed.data;
  const match = await db.match.findUnique({ where: { id: matchId }, include: { _count: { select: { signups: { where: { status: { not: "DECLINED" } } } } } } });
  if (!match) return { ok: false, message: "Match not found." };
  if (match.status !== "OPEN") return { ok: false, message: "Signups are closed for this match." };
  if (match.startsAt < new Date()) return { ok: false, message: "This match has already started." };

  const existing = await db.matchSignup.findUnique({ where: { matchId_userId: { matchId, userId: me.id } } });
  if (existing) {
    await db.matchSignup.update({ where: { id: existing.id }, data: { position, note: note || null } });
  } else {
    if (match.maxPlayers && match._count.signups >= match.maxPlayers) {
      return { ok: false, message: "This match is full. If a slot opens up, you can sign up then." };
    }
    await db.matchSignup.create({ data: { matchId, userId: me.id, position, note: note || null } });
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/matches");
  revalidatePath(`/dashboard/matches/${matchId}`);
  revalidatePath(`/admin/matches/${matchId}`);
  return { ok: true, message: existing ? "Signup updated." : "You're signed up. An officer will confirm the roster." };
}

export async function withdrawSignupAction(formData: FormData) {
  const me = await requireApproved();
  const matchId = clean(formData.get("matchId"));
  const match = await db.match.findUnique({ where: { id: matchId }, select: { status: true, startsAt: true } });
  // Withdrawals are only allowed while the roster is open and the match has not started.
  if (!match || match.status !== "OPEN" || match.startsAt <= new Date()) return;
  await db.matchSignup.deleteMany({ where: { matchId, userId: me.id } });
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/matches");
  revalidatePath(`/dashboard/matches/${matchId}`);
  revalidatePath(`/admin/matches/${matchId}`);
}

export async function applyForRoleAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const me = await requireApproved();
  const parsed = roleApplySchema.safeParse({
    roleId: clean(formData.get("roleId")),
    message: clean(formData.get("message")),
  });
  if (!parsed.success) return { ok: false, errors: flattenErrors(parsed.error) };

  const { roleId, message } = parsed.data;
  const role = await db.guildRole.findUnique({ where: { id: roleId } });
  if (!role || !role.isOpen) return { ok: false, message: "This role is not accepting applications." };

  const existing = await db.roleApplication.findUnique({ where: { roleId_userId: { roleId, userId: me.id } } });
  if (existing && existing.status !== "DENIED") {
    return { ok: false, message: "You already applied for this role." };
  }

  if (existing) {
    await db.roleApplication.update({
      where: { id: existing.id },
      data: { message, status: "PENDING", reviewNote: null, reviewedAt: null },
    });
  } else {
    await db.roleApplication.create({ data: { roleId, userId: me.id, message } });
  }
  after(() => notifyRoleApplication({ displayName: me.displayName, roleName: role.name, message }));

  revalidatePath("/dashboard/roles");
  revalidatePath("/admin/roles");
  return { ok: true, message: "Application sent. Officers will review it." };
}

export async function withdrawRoleApplicationAction(formData: FormData) {
  const me = await requireApproved();
  const roleId = clean(formData.get("roleId"));
  await db.roleApplication.deleteMany({ where: { roleId, userId: me.id, status: "PENDING" } });
  revalidatePath("/dashboard/roles");
  revalidatePath("/admin/roles");
}
