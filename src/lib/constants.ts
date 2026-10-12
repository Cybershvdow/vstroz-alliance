// Central place for every string-backed "enum" used in the database.

export const USER_STATUS = ["PENDING", "APPROVED", "DENIED"] as const;
export type UserStatus = (typeof USER_STATUS)[number];

export const USER_ROLE = ["MEMBER", "OFFICER", "TRIBUNE", "LEADER"] as const;
export type UserRole = (typeof USER_ROLE)[number];

export const MATCH_TYPE = [
  "SIEGE",
  "SCRIM",
  "TOURNAMENT",
  "PVE",
  "TRAINING",
  "MEETING",
  "COMMUNITY",
] as const;
export type MatchType = (typeof MATCH_TYPE)[number];

export const MATCH_STATUS = ["OPEN", "LOCKED", "COMPLETED", "CANCELLED"] as const;
export type MatchStatus = (typeof MATCH_STATUS)[number];

export const POSITION = ["TANK", "HEALER", "DPS", "SUPPORT"] as const;
export type Position = (typeof POSITION)[number];

export const SIGNUP_STATUS = ["PENDING", "CONFIRMED", "BENCH", "DECLINED"] as const;
export type SignupStatus = (typeof SIGNUP_STATUS)[number];

export const APPLICATION_STATUS = ["PENDING", "APPROVED", "DENIED"] as const;

export const GAME_CLASSES = [
  "Gladiator",
  "Templar",
  "Assassin",
  "Ranger",
  "Sorcerer",
  "Spiritmaster",
  "Cleric",
  "Chanter",
  "Undecided",
] as const;


/** Legion status labels (User.status). An account is always a community member; APPROVED means in the legion. */
export const STATUS_LABEL: Record<string, string> = { PENDING: "Pending", APPROVED: "In the legion", DENIED: "Declined" };

/* Rank names are Roman (the alliance's own style). Change here and every page updates. RANK_PLAIN gives the everyday word. */
export const ROLE_LABEL: Record<UserRole, string> = {
  LEADER: "Legatus",
  TRIBUNE: "Tribune",
  OFFICER: "Centurion",
  MEMBER: "Socius",
};

/** The everyday word for each rank name, shown next to it so nobody has to guess. */
export const RANK_PLAIN: Record<string, string> = {
  Legatus: "General",
  Tribune: "Lieutenant",
  Centurion: "Captain",
  Evocatus: "Elite",
  Veteranus: "Veteran",
  Socius: "Member",
  Tiro: "Recruit",
};

export const MATCH_TYPE_LABEL: Record<MatchType, string> = {
  SIEGE: "Siege",
  SCRIM: "Scrim",
  TOURNAMENT: "Tournament",
  PVE: "PvE",
  TRAINING: "Training",
  MEETING: "Meeting",
  COMMUNITY: "Community",
};

export function isOfficer(role: string) {
  return role === "OFFICER" || role === "TRIBUNE" || role === "LEADER";
}

/* ---------- Application questions ---------- */

export const PLAYTIME_OPTIONS = [
  "Less than 6 months",
  "6–12 months",
  "1–3 years",
  "3–5 years",
  "5+ years",
] as const;

export const PLAYER_TYPES = ["Casual", "Softcore", "Hardcore", "Competitive"] as const;

export const INTEREST_OPTIONS = [
  "Dungeons & Raids",
  "PvP",
  "Sieges & Large-scale War",
  "Leveling & Questing",
  "Crafting & Economy",
  "Community & Events",
] as const;

/* ---------- Rank ladder & voting ---------- */

export const TIERS = ["RECRUIT", "MEMBER", "VETERAN", "ELITE"] as const;
export type Tier = (typeof TIERS)[number];

export const TIER_LABEL: Record<Tier, string> = {
  RECRUIT: "Tiro",
  MEMBER: "Socius",
  VETERAN: "Veteranus",
  ELITE: "Evocatus",
};

export const TIER_BLURB: Record<Tier, string> = {
  RECRUIT: "Where everyone starts. New to the alliance, proving reliability and attitude.",
  MEMBER: "Trusted regular. Promoted by an officer after showing up consistently.",
  VETERAN: "Backbone of the crew. Voted in by the alliance; officers can veto.",
  ELITE: "The competitive roster. Voted in by the alliance; officers can veto. Plays the professional matches.",
};

/** Tiers that require a member vote instead of an officer decision. */
export const VOTED_TIERS: readonly Tier[] = ["VETERAN", "ELITE"];

export const VOTE_RULES = {
  windowHours: 72,   // how long a nomination stays open
  quorum: 3,         // minimum yes+no votes for a result to count
  passRatio: 2 / 3,  // yes / (yes + no) needed to pass
};

export const VOTE_CHOICES = ["YES", "NO", "ABSTAIN"] as const;

export function tierRank(t: string) {
  const i = (TIERS as readonly string[]).indexOf(t);
  return i < 0 ? 0 : i;
}

/**
 * A member's one rank in the alliance, highest first: General, Captain, then the ladder (Elite, Veteran, Member,
 * Recruit). The ladder is alliance-wide: every account starts as a Recruit, whatever they play. The legion is separate.
 */
export type Rank = { label: string; plain: string; full: string; order: number; tone: "gold" | "accent" | "neutral"; command: boolean };
const rank = (label: string, order: number, tone: Rank["tone"], command = false): Rank => ({ label, plain: RANK_PLAIN[label] ?? label, full: `${label} · ${RANK_PLAIN[label] ?? label}`, order, tone, command });

/** Two tracks: command is appointed (Legatus, Tribune, Centurion); the ladder is earned (Evocatus down to Tiro). */
export function allianceRank(u: { role: string; tier: string }): Rank {
  if (u.role === "LEADER") return rank(ROLE_LABEL.LEADER, 0, "gold", true);
  if (u.role === "TRIBUNE") return rank(ROLE_LABEL.TRIBUNE, 1, "gold", true);
  if (u.role === "OFFICER") return rank(ROLE_LABEL.OFFICER, 2, "accent", true);
  if (u.tier === "ELITE") return rank(TIER_LABEL.ELITE, 3, "gold");
  if (u.tier === "VETERAN") return rank(TIER_LABEL.VETERAN, 4, "accent");
  if (u.tier === "MEMBER") return rank(TIER_LABEL.MEMBER, 5, "neutral");
  return rank(TIER_LABEL.RECRUIT, 6, "neutral");
}

/** Every rank, highest first. */
export const ALL_RANKS: Rank[] = [
  allianceRank({ role: "LEADER", tier: "ELITE" }),
  allianceRank({ role: "TRIBUNE", tier: "ELITE" }),
  allianceRank({ role: "OFFICER", tier: "ELITE" }),
  ...(["ELITE", "VETERAN", "MEMBER", "RECRUIT"] as const).map((tier) => allianceRank({ role: "MEMBER", tier })),
];

/* ---------- Specialty roles: a job someone holds on top of their rank ---------- */

export const SPECIALTIES = [
  { key: "RECRUITER", label: "Conquisitor", plain: "Recruiter", does: "The recruiting officer. Finds players, welcomes new sign-ups, and gets them settled in." },
  { key: "HERALD", label: "Praeco", plain: "Marketing and content", does: "The herald. Promotes the alliance: clips, posts, and the alliance's social channels." },
  { key: "GAMES", label: "Magister Ludi", plain: "Events", does: "Master of the games. Plans and runs events, game nights, and tournaments." },
  { key: "GUARDIAN", label: "Custos", plain: "Discord moderator", does: "The guardian. Keeps the Discord in order and enforces the rules there." },
] as const;

/** The specialty roles a member holds, in the order above. */
export function specialtiesOf(u: { specialties?: string | null }) {
  let keys: unknown = [];
  try {
    keys = u.specialties ? JSON.parse(u.specialties) : [];
  } catch {
    keys = [];
  }
  const set = new Set(Array.isArray(keys) ? keys : []);
  return SPECIALTIES.filter((s) => set.has(s.key));
}

/** Can this user vote on a nomination to the given tier? */
/** Every community member votes on rank promotions (alliance rule, 2026-10-08). Officers keep veto and override. */
export function canVoteOn(user: { role: string; tier: string }, targetTier: string) {
  return !!user && !!targetTier; // any signed-in member, any voted tier
}

/* ---------- Game catalog & genre-specific application questions ---------- */

export type Genre = "MMO" | "FPS" | "MOBA" | "BATTLE_ROYALE" | "STRATEGY" | "OTHER";

export type GameEntry = {
  name: string;
  genre: Genre;
  enabled: boolean;
  /** The alliance runs an in-game legion/guild for this game (members apply to it). */
  legion?: boolean;
  /** Optional class/character list for MMO/MOBA games. */
  classes?: readonly string[];
};

/** Add a game here and it appears in the application form with the right question set. */
export const GAME_CATALOG: readonly GameEntry[] = [
  { name: "Aion", genre: "MMO", enabled: true, legion: true, classes: GAME_CLASSES },
  { name: "Apex Legends", genre: "BATTLE_ROYALE", enabled: true },
  { name: "Enshrouded", genre: "OTHER", enabled: true },
  { name: "Project Zomboid", genre: "OTHER", enabled: true },
  { name: "Deadlock", genre: "MOBA", enabled: true },
  { name: "Battlefield 6", genre: "FPS", enabled: true },
  { name: "Call of Duty", genre: "FPS", enabled: true },
  { name: "Fortnite", genre: "BATTLE_ROYALE", enabled: true },
  // { name: "Valorant", genre: "FPS", enabled: false },
  // { name: "League of Legends", genre: "MOBA", enabled: false },
];

export const ENABLED_GAMES = GAME_CATALOG.filter((g) => g.enabled);
/** Games you can apply to a legion for (today: Aion). */
export const LEGION_GAMES = GAME_CATALOG.filter((g) => g.enabled && g.legion);

/** Game choices for matches and events. */
export const GAMES: readonly string[] = [...ENABLED_GAMES.map((g) => g.name), "All Games", "Side Game"];

/** The listed games a member plays (their profile tags), in catalog order. Old rows fall back to their single game. */
export function playedGamesOf(u: { playedGames?: string | null; game?: string | null }): string[] {
  let parsed: unknown = [];
  try {
    parsed = u.playedGames ? JSON.parse(u.playedGames) : [];
  } catch {
    parsed = [];
  }
  const picked = new Set(Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : []);
  if (u.playedGames == null && u.game) picked.add(u.game);
  return ENABLED_GAMES.map((g) => g.name).filter((n) => picked.has(n));
}

export type Question = {
  key: string;
  label: string;
  type: "select" | "text" | "multiselect";
  options?: readonly string[];
  required?: boolean;
  hint?: string;
  placeholder?: string;
};

const HOURS = ["Under 5 hours", "5–10 hours", "10–20 hours", "20+ hours"] as const;

export const GENRE_QUESTIONS: Record<Genre, Question[]> = {
  MMO: [
    { key: "ign", label: "Character name", type: "text", placeholder: "Leave blank if you have not made a character yet", hint: "Your character's name in the game, so officers can find you on the legion list." },
    { key: "mainClass", label: "Main class", type: "select", options: [] /* filled from the game's class list */ },
    { key: "preferredRole", label: "Preferred group role", type: "select", options: ["Tank", "Healer", "DPS", "Support", "Flexible"], required: true },
    { key: "focus", label: "What do you focus on?", type: "select", options: ["PvE", "PvP", "Both equally"], required: true },
    { key: "raidExperience", label: "Raid / siege experience", type: "select", options: ["None yet", "Some", "Experienced", "I have led raids or sieges"], required: true },
    { key: "hoursPerWeek", label: "Hours per week you can play", type: "select", options: HOURS, required: true },
    { key: "voice", label: "Comfortable on voice during events?", type: "select", options: ["Yes, always", "Yes, when needed", "Listen only"], required: true },
    { key: "previousGuilds", label: "Previous guilds or legions", type: "text", placeholder: "Names and roughly how long" },
  ],
  FPS: [
    { key: "ign", label: "In-game name / tag", type: "text" },
    { key: "mainRole", label: "Main role", type: "select", options: ["Entry", "Support", "In-game leader", "Lurker", "Flex"], required: true },
    { key: "currentRank", label: "Current rank", type: "text", placeholder: "e.g. Diamond 2", required: true },
    { key: "peakRank", label: "Peak rank", type: "text" },
    { key: "input", label: "Input", type: "select", options: ["Keyboard & mouse", "Controller"], required: true },
    { key: "competitiveExperience", label: "Competitive experience", type: "select", options: ["Ranked only", "Scrims", "Tournaments", "Semi-pro / pro"], required: true },
    { key: "hoursPerWeek", label: "Hours per week you can play", type: "select", options: HOURS, required: true },
    { key: "voice", label: "Comfortable on voice during matches?", type: "select", options: ["Yes, always", "Yes, when needed", "Listen only"], required: true },
    { key: "previousTeams", label: "Previous teams", type: "text" },
  ],
  MOBA: [
    { key: "ign", label: "In-game name", type: "text" },
    { key: "mainRole", label: "Main role / lane", type: "select", options: ["Top", "Jungle", "Mid", "Bot / Carry", "Support", "Flex"], required: true },
    { key: "currentRank", label: "Current rank", type: "text", required: true },
    { key: "competitiveExperience", label: "Competitive experience", type: "select", options: ["Ranked only", "Scrims", "Tournaments", "Semi-pro / pro"], required: true },
    { key: "hoursPerWeek", label: "Hours per week you can play", type: "select", options: HOURS, required: true },
    { key: "voice", label: "Comfortable on voice during matches?", type: "select", options: ["Yes, always", "Yes, when needed", "Listen only"], required: true },
    { key: "previousTeams", label: "Previous teams", type: "text" },
  ],
  BATTLE_ROYALE: [
    { key: "ign", label: "In-game name", type: "text" },
    { key: "mainRole", label: "Main role", type: "select", options: ["Fragger", "Support", "In-game leader", "Flex"], required: true },
    { key: "currentRank", label: "Current rank", type: "text", required: true },
    { key: "input", label: "Input", type: "select", options: ["Keyboard & mouse", "Controller"], required: true },
    { key: "hoursPerWeek", label: "Hours per week you can play", type: "select", options: HOURS, required: true },
    { key: "voice", label: "Comfortable on voice during matches?", type: "select", options: ["Yes, always", "Yes, when needed", "Listen only"], required: true },
  ],
  STRATEGY: [
    { key: "ign", label: "In-game name", type: "text" },
    { key: "currentRank", label: "Current rank / league", type: "text", required: true },
    { key: "competitiveExperience", label: "Competitive experience", type: "select", options: ["Ranked only", "Tournaments", "Semi-pro / pro"], required: true },
    { key: "hoursPerWeek", label: "Hours per week you can play", type: "select", options: HOURS, required: true },
  ],
  OTHER: [
    { key: "ign", label: "In-game name", type: "text" },
    { key: "experience", label: "Experience level", type: "select", options: ["New", "Intermediate", "Experienced", "Competitive"], required: true },
    { key: "hoursPerWeek", label: "Hours per week you can play", type: "select", options: HOURS, required: true },
  ],
};

/** Split the free-text "other games" box: names that match a listed game become tags, the rest stays as text. */
export function splitOtherGames(text: string): { tags: string[]; rest: string } {
  const tags: string[] = [];
  const rest: string[] = [];
  for (const part of text.split(",").map((s) => s.trim()).filter(Boolean)) {
    const hit = ENABLED_GAMES.find((g) => g.name.toLowerCase() === part.toLowerCase());
    if (hit) tags.push(hit.name);
    else rest.push(part);
  }
  return { tags, rest: rest.join(", ") };
}

/** Questions for a specific game, with the class list injected for MMO/MOBA. */
export function questionsFor(gameName: string): Question[] {
  const game = GAME_CATALOG.find((g) => g.name === gameName);
  if (!game) return [];
  return GENRE_QUESTIONS[game.genre].flatMap((q) => {
    if (q.key === "mainClass") {
      if (!game.classes?.length) return [];
      return [{ ...q, options: game.classes }];
    }
    return [q];
  });
}

/* ---------- Chain of command ---------- */

/**
 * Who a member takes a question or an issue to. The alliance runs like a business: you go to the level above you,
 * and only what that level cannot settle moves up. Recruits and Members go to a Captain. Veterans and Elite have
 * earned a direct line to The Round Table. Captains bring matters to the Generals.
 */
export function canAddressTable(u: { role: string; tier: string }) {
  return u.role !== "MEMBER" || u.tier === "VETERAN" || u.tier === "ELITE";
}

export const CHAIN_LEVEL_LABEL: Record<string, string> = { CAPTAIN: "With the Captains", TABLE: "At The Round Table" };

/** The chain of command, highest first. Shown on the Rules page and in the portal. */
export const CHAIN_OF_COMMAND: { rank: string; tone: "gold" | "accent" | "neutral"; does: string; goesTo: string }[] = [
  { rank: "Legatus · General", tone: "gold", does: "Runs the alliance and sits at the head of The Round Table. Final say. Can veto or override.", goesTo: "The other Legati" },
  { rank: "Tribune · Lieutenant", tone: "gold", does: "Second to the Legati. Runs things day to day and decides what reaches The Round Table, so the Legati are not asked to do everything.", goesTo: "A Legatus" },
  { rank: "Centurion · Captain", tone: "accent", does: "The first stop for the ranks. Answers questions, settles day-to-day issues, and sends up only what needs The Round Table.", goesTo: "A Tribune, at The Round Table" },
  { rank: "Evocatus · Elite", tone: "gold", does: "Senior rank, voted in. Can bring a matter straight to The Round Table. Expected to help the ranks below before it gets that far.", goesTo: "A Centurion, or The Round Table directly" },
  { rank: "Veteranus · Veteran", tone: "accent", does: "Senior rank, voted in. Can bring a matter straight to The Round Table. Expected to help the ranks below before it gets that far.", goesTo: "A Centurion, or The Round Table directly" },
  { rank: "Socius · Member", tone: "neutral", does: "Trusted regular. Takes questions and issues to a Centurion, who answers or sends it up.", goesTo: "A Centurion" },
  { rank: "Tiro · Recruit", tone: "neutral", does: "New to the alliance. Takes questions and issues to a Centurion, who answers or sends it up.", goesTo: "A Centurion" },
];

/* ---------- Guild ranks: inside one game's guild only (today: the Vstroz Legion in Aion) ---------- */

/**
 * Three layers, kept apart: the Discord community (no rank), the alliance (Tiro to Legatus, the same in every game),
 * and a game's guild, which has its own short ladder. An alliance rank does not carry into a guild: a Centurion
 * applies to the legion like anyone else and holds a guild rank there.
 */
export const GUILD_RANKS = [
  { key: "LEADER", label: "Guild Leader", order: 0, tone: "gold" },
  { key: "OFFICER", label: "Guild Officer", order: 1, tone: "accent" },
  { key: "MEMBER", label: "Guild Member", order: 2, tone: "neutral" },
] as const;

/** A legion member's guild rank (Guild Member unless set), or null when they are not in the legion. */
export function guildRankOf(u: { status: string; guildRank?: string | null }) {
  if (u.status !== "APPROVED") return null;
  return GUILD_RANKS.find((r) => r.key === u.guildRank) ?? GUILD_RANKS[2];
}
