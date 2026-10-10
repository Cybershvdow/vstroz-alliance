import { z } from "zod";
import { MATCH_TYPE, POSITION, PLAYTIME_OPTIONS, PLAYER_TYPES, INTEREST_OPTIONS, ENABLED_GAMES, OTHER_GAME, questionsFor } from "@/lib/constants";

export const usernameSchema = z
  .string()
  .trim()
  .min(3, "Username must be at least 3 characters")
  .max(20, "Username must be 20 characters or fewer")
  .regex(/^[a-zA-Z0-9_]+$/, "Letters, numbers, and underscores only");

export const registerSchema = z
  .object({
    username: usernameSchema,
    email: z.string().trim().email("Enter a valid email").max(120),
    displayName: z.string().trim().min(2, "Display name is too short").max(32),
    password: z.string().min(8, "Password must be at least 8 characters").max(128),
    confirmPassword: z.string(),
    discord: z.string().trim().max(40).optional().or(z.literal("")),
    ageConfirm: z.literal("yes", { message: "You must be 18 or older to join" }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

/** The player profile. Its first submission is the membership application. */
export const playerProfileSchema = z.object({
  playtime: z.enum(PLAYTIME_OPTIONS, { message: "Tell us how long you have been playing" }),
  playerType: z.enum(PLAYER_TYPES, { message: "Pick the type of player you are" }),
  interests: z.array(z.enum(INTEREST_OPTIONS)).min(1, "Pick at least one thing you enjoy"),
  games: z.string().trim().max(300).optional().or(z.literal("")),
  game: z.string().refine((g) => g === "" || g === OTHER_GAME || ENABLED_GAMES.some((e) => e.name === g), "Pick a game"),
  gameOther: z.string().trim().max(60).optional().or(z.literal("")),
  applicationNote: z.string().trim().max(1000).optional().or(z.literal("")),
});

/** Validate genre-specific answers for a game. Returns cleaned answers or field errors keyed q_<key>. */
export function validateGameAnswers(game: string, formData: FormData): { answers: Record<string, string>; errors: FieldErrors } {
  const answers: Record<string, string> = {};
  const errors: FieldErrors = {};
  for (const q of questionsFor(game)) {
    const raw = formData.get(`q_${q.key}`);
    const v = (typeof raw === "string" ? raw : "").trim().slice(0, 200);
    if (q.type === "select" && v && q.options && !q.options.includes(v)) {
      errors[`q_${q.key}`] = ["Pick one of the options"];
      continue;
    }
    if (q.required && !v) {
      errors[`q_${q.key}`] = ["Required"];
      continue;
    }
    if (v) answers[q.key] = v;
  }
  return { answers, errors };
}

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, "Enter your username or email"),
  password: z.string().min(1, "Enter your password"),
});

export const profileSchema = z.object({
  displayName: z.string().trim().min(2).max(32),
  email: z.string().trim().email("Enter a valid email").max(120),
  discord: z.string().trim().max(40).optional().or(z.literal("")),
  socialYoutube: z.string().trim().max(200).optional().or(z.literal("")),
  socialTwitch: z.string().trim().max(200).optional().or(z.literal("")),
  socialTiktok: z.string().trim().max(200).optional().or(z.literal("")),
  socialX: z.string().trim().max(200).optional().or(z.literal("")),
  socialInstagram: z.string().trim().max(200).optional().or(z.literal("")),
});

export const matchSchema = z.object({
  title: z.string().trim().min(3).max(80),
  game: z.string().trim().min(1).max(40),
  type: z.enum(MATCH_TYPE),
  startsAt: z.string().min(1, "Pick a date and time"),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  maxPlayers: z.coerce.number().int().min(1).max(500).optional().or(z.literal("")),
  isPublic: z.coerce.boolean().optional(),
});

export const signupSchema = z.object({
  matchId: z.string().min(1),
  position: z.enum(POSITION),
  note: z.string().trim().max(300).optional().or(z.literal("")),
});

export const guildRoleSchema = z.object({
  name: z.string().trim().min(2).max(60),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  slots: z.coerce.number().int().min(1).max(50),
});

export const roleApplySchema = z.object({
  roleId: z.string().min(1),
  message: z.string().trim().min(10, "Tell us why you fit this role (10+ characters)").max(1000),
});

export const announcementSchema = z.object({
  title: z.string().trim().min(3).max(120),
  body: z.string().trim().min(3).max(5000),
  pinned: z.coerce.boolean().optional(),
});

export type FieldErrors = Record<string, string[] | undefined>;

export type ActionState =
  | { ok: true; message?: string }
  | { ok: false; message?: string; errors?: FieldErrors; values?: Record<string, string | string[]> }
  | undefined;

export function flattenErrors(error: z.ZodError): FieldErrors {
  return error.flatten().fieldErrors as FieldErrors;
}
