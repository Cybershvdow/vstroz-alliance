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
  type FieldErrors,
} from "@/lib/validation";
import { normalizeSocial, SOCIAL_PLATFORMS, type SocialKey } from "@/lib/social";
import { discordConfigured } from "@/lib/discord";

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
  // The account alone makes them a community member; the legion page is where they apply.
  redirect("/dashboard/legion?welcome=1");
}

/**
 * The player profile (game, in-game name, class, how they play). intent="save" just stores it.
 * intent="apply" also submits it as the legion application: stamps appliedAt once and notifies the officers.
 */
export async function savePlayerProfileAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  const intent = clean(formData.get("intent")) === "apply" ? "apply" : "save";

  // Echo what was typed so a validation error does not wipe the form.
  const echo = (): Record<string, string | string[]> =>
    Object.fromEntries(
      [...new Set(formData.keys())]
        .filter((k) => k !== "intent")
        .map((k) => [k, k === "interests" ? formData.getAll(k).filter((x): x is string => typeof x === "string") : clean(formData.get(k))]),
    );

  const parsed = playerProfileSchema.safeParse({
    playtime: clean(formData.get("playtime")),
    playerType: clean(formData.get("playerType")),
    interests: formData.getAll("interests").filter((x): x is string => typeof x === "string"),
    games: clean(formData.get("games")),
    game: clean(formData.get("game")),
    applicationNote: clean(formData.get("applicationNote")),
  });
  if (!parsed.success) return { ok: false, errors: flattenErrors(parsed.error), values: echo(), message: "Fix the highlighted fields." };
  const d = parsed.data;
  const gameCheck = d.game ? validateGameAnswers(d.game, formData) : { answers: {} as Record<string, string>, errors: {} as FieldErrors };
  const errors: FieldErrors = { ...gameCheck.errors };
  if (intent === "apply" && !d.game) errors.game = ["Pick the game you are applying with"];
  if (intent === "apply" && clean(formData.get("inGameLegion")) !== "yes") {
    errors.inGameLegion = ["Join the Vstroz Alliance legion in-game first, then confirm it here"];
  }
  if (Object.keys(errors).length) return { ok: false, errors, values: echo(), message: "Fix the highlighted fields." };

  // The in-game confirmation travels with the answers so officers (and later saves) keep it.
  let previous: Record<string, string> = {};
  try {
    previous = me.gameAnswers ? JSON.parse(me.gameAnswers) : {};
  } catch {
    previous = {};
  }
  const answers: Record<string, string> = {
    ...gameCheck.answers,
    ...(intent === "apply" || previous.inGameLegion === "Yes" ? { inGameLegion: "Yes" } : {}),
  };
  await db.user.update({
    where: { id: me.id },
    data: {
      game: d.game || null,
      gameAnswers: JSON.stringify(answers),
      // Only touch the in-game name/class when a game was picked; "No listed game" keeps what is stored.
      ...(d.game ? { ign: answers.ign || null, gameClass: answers.mainClass || null } : {}),
      playtime: d.playtime,
      playerType: d.playerType,
      interests: d.interests.join(", "),
      games: d.games || null,
      applicationNote: d.applicationNote || null,
    },
  });

  if (intent === "apply") {
    if (me.status === "DENIED") {
      return { ok: false, message: "Your legion application was declined. Reach out to an officer in Discord if you think that was a mistake." };
    }
    if (me.status === "APPROVED") {
      revalidatePath("/", "layout");
      return { ok: true, message: "Player profile saved. You are already in the legion." };
    }
    if (discordConfigured() && !me.discordId) {
      return { ok: false, message: "Connect your Discord to this account first. Being in the Discord is what makes you part of the community." };
    }
    // Atomic: only the first apply stamps appliedAt and notifies the officers, even under double submits.
    const stamped = await db.user.updateMany({ where: { id: me.id, status: "PENDING", appliedAt: null }, data: { appliedAt: new Date() } });
    if (stamped.count === 1) {
      const user = await db.user.findUniqueOrThrow({ where: { id: me.id } });
      after(() => notifyNewApplication(user));
    }
    revalidatePath("/", "layout");
    redirect("/dashboard/legion?submitted=1");
  }

  revalidatePath("/", "layout");
  return { ok: true, message: me.status === "APPROVED" ? "Player profile saved." : me.appliedAt ? "Application updated." : "Player profile saved." };
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
    socialYoutube: clean(formData.get("socialYoutube")),
    socialTwitch: clean(formData.get("socialTwitch")),
    socialTiktok: clean(formData.get("socialTiktok")),
    socialX: clean(formData.get("socialX")),
    socialInstagram: clean(formData.get("socialInstagram")),
  });
  if (!parsed.success) return { ok: false, errors: flattenErrors(parsed.error) };

  const d = parsed.data;
  const email = d.email.toLowerCase();
  const taken = await db.user.findFirst({ where: { email, NOT: { id: me.id } }, select: { id: true } });
  if (taken) return { ok: false, errors: { email: ["That email is already used by another account"] } };

  // Social links: handle or URL in, normalized https URL out.
  const fieldFor: Record<SocialKey, keyof typeof d> = { youtube: "socialYoutube", twitch: "socialTwitch", tiktok: "socialTiktok", x: "socialX", instagram: "socialInstagram" };
  const socials: Partial<Record<SocialKey, string>> = {};
  const errors: FieldErrors = {};
  for (const p of SOCIAL_PLATFORMS) {
    const r = normalizeSocial(p.key, String(d[fieldFor[p.key]] ?? ""));
    if (r.error) errors[fieldFor[p.key]] = [r.error];
    else if (r.url) socials[p.key] = r.url;
  }
  if (Object.keys(errors).length) return { ok: false, errors, message: "Check your social links." };

  await db.user.update({
    where: { id: me.id },
    data: {
      displayName: d.displayName,
      email,
      discord: d.discord || null,
      socials: Object.keys(socials).length ? JSON.stringify(socials) : null,
    },
  });
  revalidatePath("/", "layout");
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
