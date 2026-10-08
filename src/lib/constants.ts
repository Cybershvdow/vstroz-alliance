// Central place for every string-backed "enum" used in the database.

export const USER_STATUS = ["PENDING", "APPROVED", "DENIED"] as const;
export type UserStatus = (typeof USER_STATUS)[number];

export const USER_ROLE = ["MEMBER", "OFFICER", "LEADER"] as const;
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

export const GAMES = ["Aion 2", "All Games", "Side Game"] as const;

/* Militant officer titles, per the alliance. Change here and every page updates. */
export const ROLE_LABEL: Record<UserRole, string> = {
  LEADER: "General",
  OFFICER: "Captain",
  MEMBER: "Member",
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
  return role === "OFFICER" || role === "LEADER";
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
  RECRUIT: "Recruit",
  MEMBER: "Member",
  VETERAN: "Veteran",
  ELITE: "Elite",
};

export const TIER_BLURB: Record<Tier, string> = {
  RECRUIT: "New to the alliance. Proving reliability and attitude.",
  MEMBER: "Trusted regular. Promoted by an officer after showing up consistently.",
  VETERAN: "Backbone of the alliance. Voted in by Veterans, Elites, and officers.",
  ELITE: "The competitive roster. Voted in by the Elite and officers. Plays the professional matches.",
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

/** Can this user vote on a nomination to the given tier? */
export function canVoteOn(user: { role: string; tier: string }, targetTier: string) {
  return isOfficer(user.role) || tierRank(user.tier) >= tierRank(targetTier);
}

/* ---------- Game catalog & genre-specific application questions ---------- */

export type Genre = "MMO" | "FPS" | "MOBA" | "BATTLE_ROYALE" | "STRATEGY" | "OTHER";

export type GameEntry = {
  name: string;
  genre: Genre;
  enabled: boolean;
  /** Optional class/character list for MMO/MOBA games. */
  classes?: readonly string[];
};

/** Add a game here and it appears in the application form with the right question set. */
export const GAME_CATALOG: readonly GameEntry[] = [
  { name: "Aion 2", genre: "MMO", enabled: true, classes: GAME_CLASSES },
  // { name: "Valorant", genre: "FPS", enabled: false },
  // { name: "League of Legends", genre: "MOBA", enabled: false },
];

export const ENABLED_GAMES = GAME_CATALOG.filter((g) => g.enabled);

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
    { key: "ign", label: "In-game name", type: "text", placeholder: "Leave blank if you have not made a character yet" },
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
