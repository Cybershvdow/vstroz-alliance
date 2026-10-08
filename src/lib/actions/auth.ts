"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { db } from "@/lib/db";
import { notifyNewApplication } from "@/lib/email";
import { createSession, deleteSession } from "@/lib/session";
import { getCurrentUser } from "@/lib/auth";
import {
  registerSchema,
  playerProfileSchema,
  validateGameAnswers,
  loginSchema,
  profileSchema,
  flattenErrors,
  type ActionState,
} from "@/lib/validation";

function clean(v: FormDataEntryValue | null) {
  return typeof v === "string" ? v : "";
}

/** Step 1: create the account. The player profile (game, in-game name, how they play) comes next, inside the account. */
export async function registerAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = registerSchema.safeParse({
    username: clean(formData.get("username")),
    email: clean(formData.get("email")),
    displayName: clean(formData.get("displayName")),
    password: clean(formData.get("password")),
    confirmPassword: clean(formData.get("confirmPassword")),
    discord: clean(formData.get("discord")),
    ageConfirm: clean(formData.get("ageConfirm")),
  });
  if (!parsed.success) {
    return { ok: false, errors: flattenErrors(parsed.error), message: "Fix the highlighted fields." };
  }

  const d = parsed.data;
  const email = d.email.toLowerCase();

  const existing = await db.user.findFirst({
    where: { OR: [{ username: d.username }, { email }] },
    select: { username: true, email: true },
  });
  if (existing) {
    const errors: Record<string, string[]> = {};
    if (existing.username.toLowerCase() === d.username.toLowerCase()) errors.username = ["That username is taken"];
    if (existing.email === email) errors.email = ["That email is already registered"];
    return { ok: false, errors, message: "Account already exists." };
  }

  const passwordHash = await bcrypt.hash(d.password, 12);
  const user = await db.user.create({
    data: {
      username: d.username,
      email,
      displayName: d.displayName,
      passwordHash,
      discord: d.discord || null,
      status: "PENDING",
      role: "MEMBER",
    },
  });

  await createSession(user.id);
  redirect("/dashboard");
}

/**
 * Step 2 (and later edits): the player profile. The first submission is the membership application:
 * it stamps appliedAt and notifies the officers. Approved members use the same action from their profile page.
 */
export async function savePlayerProfileAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  if (me.status === "DENIED") {
    return { ok: false, message: "Your application was declined. Reach out in Discord if you think that was a mistake." };
  }

  const parsed = playerProfileSchema.safeParse({
    playtime: clean(formData.get("playtime")),
    playerType: clean(formData.get("playerType")),
    interests: formData.getAll("interests").filter((x): x is string => typeof x === "string"),
    games: clean(formData.get("games")),
    game: clean(formData.get("game")),
    applicationNote: clean(formData.get("applicationNote")),
  });
  const gameCheck = parsed.success ? validateGameAnswers(parsed.data.game, formData) : { answers: {}, errors: {} };
  if (!parsed.success || Object.keys(gameCheck.errors).length) {
    return {
      ok: false,
      errors: { ...(parsed.success ? {} : flattenErrors(parsed.error)), ...gameCheck.errors },
      message: "Fix the highlighted fields.",
    };
  }

  const d = parsed.data;
  const answers = gameCheck.answers;
  const firstTime = !me.appliedAt;
  const user = await db.user.update({
    where: { id: me.id },
    data: {
      game: d.game,
      gameAnswers: JSON.stringify(answers),
      ign: answers.ign || null,
      gameClass: answers.mainClass || null,
      playtime: d.playtime,
      playerType: d.playerType,
      interests: d.interests.join(", "),
      games: d.games || null,
      applicationNote: d.applicationNote || null,
      ...(firstTime ? { appliedAt: new Date() } : {}),
    },
  });

  if (firstTime) {
    // Notify the officers' inbox once the response has been sent.
    after(() => notifyNewApplication(user));
  }
  revalidatePath("/", "layout");
  if (firstTime) redirect("/dashboard");
  return { ok: true, message: me.status === "APPROVED" ? "Player profile saved." : "Application updated." };
}

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    identifier: clean(formData.get("identifier")),
    password: clean(formData.get("password")),
  });
  if (!parsed.success) {
    return { ok: false, errors: flattenErrors(parsed.error) };
  }

  const { identifier, password } = parsed.data;
  const user = await db.user.findFirst({
    where: { OR: [{ username: identifier }, { email: identifier.toLowerCase() }] },
  });

  // Constant-ish time: always run a compare so timing doesn't leak whether the user exists.
  const hash = user?.passwordHash ?? "$2a$12$CjwqHfjJ8bYt0Zx0Yl2fSeUxYt9fXbQ1rY9G2Q5lQxN5qYbP0kA1a";
  const valid = await bcrypt.compare(password, hash);

  if (!user || !valid) {
    return { ok: false, message: "Invalid username or password." };
  }

  await createSession(user.id);
  const next = clean(formData.get("next"));
  const safeNext = /^\/(?!\/)[^\s]*$/.test(next) && !next.startsWith("/api") ? next : null;
  redirect(safeNext ?? (user.status === "APPROVED" && (user.role === "OFFICER" || user.role === "LEADER") ? "/admin" : "/dashboard"));
}

export async function logoutAction() {
  await deleteSession();
  redirect("/");
}

export async function updateProfileAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  const parsed = profileSchema.safeParse({
    displayName: clean(formData.get("displayName")),
    email: clean(formData.get("email")),
    discord: clean(formData.get("discord")),
  });
  if (!parsed.success) return { ok: false, errors: flattenErrors(parsed.error) };

  const d = parsed.data;
  const email = d.email.toLowerCase();
  const taken = await db.user.findFirst({ where: { email, NOT: { id: me.id } }, select: { id: true } });
  if (taken) return { ok: false, errors: { email: ["That email is already used by another account"] } };
  await db.user.update({
    where: { id: me.id },
    data: {
      displayName: d.displayName,
      email,
      discord: d.discord || null,
    },
  });
  return { ok: true, message: "Profile saved." };
}

export async function changePasswordAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  const current = clean(formData.get("currentPassword"));
  const next = clean(formData.get("newPassword"));
  const confirm = clean(formData.get("confirmPassword"));

  if (next.length < 8) return { ok: false, errors: { newPassword: ["At least 8 characters"] } };
  if (next !== confirm) return { ok: false, errors: { confirmPassword: ["Passwords do not match"] } };

  const full = await db.user.findUnique({ where: { id: me.id } });
  if (!full || !(await bcrypt.compare(current, full.passwordHash))) {
    return { ok: false, errors: { currentPassword: ["Current password is incorrect"] } };
  }

  await db.user.update({ where: { id: me.id }, data: { passwordHash: await bcrypt.hash(next, 12) } });
  return { ok: true, message: "Password updated." };
}
