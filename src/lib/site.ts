// Public site content. Edit freely — no code changes needed elsewhere.

export const site = {
  name: "Vstroz Alliance",
  legionName: "Vstroz Legion", // the guild inside Aion that members apply to; an account alone makes someone an alliance member
  legionGame: "Aion",
  /** The alliance is only recruiting for now. Set to true to bring back the Schedule tab and the match sections. */
  showSchedule: false,
  /** Discord roles and nicknames follow the website. "dry" only logs the plan, "on" applies it, "off" does nothing. */
  discordRoleSync: "on" as "off" | "dry" | "on",
  /** While trying it out: limit real changes to these Discord user ids. Empty means everyone. */
  discordRoleSyncOnly: [] as string[],
  /** Also set each matched member's server nickname to their website display name. Off until the owner confirms. */
  discordRenameMembers: false,
  /** Discord channel the bot posts site activity into (new members, clips, promotions, play sessions). Empty turns it off. */
  discordFeedChannelId: "1559393203738906696", // #alliance-feed
  /** Homepage intro film (files in public/video). Set to null to fall back to the still hero. */
  introVideo: {
    src: "/video/vstroz-intro-1080.mp4?v=2",
    mobileSrc: "/video/vstroz-intro-720.mp4?v=2",
    poster: "/video/vstroz-intro-poster.jpg?v=2",
  } as { src: string; mobileSrc?: string; poster: string } | null,
  shortName: "Vstroz",
  tag: "VST",
  motto: "One banner. Every world.",
  tagline:
    "Friends who became a community. A competitive, multi-game alliance for adults who play to win and look after their own.",
  founded: "2024",
  discordInvite: "https://discord.gg/Ydjz54qsp",
  contactEmail: "gdiazmarine@gmail.com",
  /* Social links — leave empty to hide. Add handles when they exist. */
  social: {
    youtube: "",
    twitch: "",
    tiktok: "",
    x: "",
    instagram: "",
  },
  /* Optional: a Twitch channel to embed as the live player on the Media page when it is live. */
  twitchChannel: "",
};

export const nav = [
  { href: "/", label: "Home" },
  { href: "/games", label: "Games" },
  { href: "/media", label: "Media" },
  { href: "/roster", label: "Roster" },
  ...(site.showSchedule ? [{ href: "/schedule", label: "Schedule" }] : []),
  { href: "/rules", label: "Rules" },
  { href: "/recruit", label: "Recruit" },
];

/* Who we are */
export const identity = {
  origin:
    "Vstroz started as a group of friends who kept ending up in the same lobbies. It grew into a community, then into an alliance with a competitive edge. The name stays until we decide otherwise. The people are the point.",
  audience: "Adults only (18+). Any time zone. English-speaking, every background welcome.",
  values: ["Discipline", "Brotherhood", "Elite", "Welcoming", "Ruthless", "Fun", "Competitive"],
};

export const pillars = [
  {
    icon: "⚔",
    title: "Discipline",
    text: "Sieges, scrims, and events are planned and called. Show up on time, know your role, listen on voice.",
  },
  {
    icon: "◈",
    title: "Brotherhood",
    text: "Nobody fights alone. Escorts, gear help, carries, and a word when someone is having a bad week.",
  },
  {
    icon: "▲",
    title: "Elite, earned",
    text: "Competitive spots are voted on by the alliance. You do not buy in. You get voted in.",
  },
  {
    icon: "∞",
    title: "One alliance, every game",
    text: "Games change. The crew does not. Play what you love, bring it to the alliance, keep the same ranks and culture.",
  },
];

export type GameStatus = "active" | "voting" | "upcoming";

export const games: {
  slug: string;
  name: string;
  /** Short label for stats and tags. */
  short?: string;
  status: GameStatus;
  badge: string;
  genre: string;
  /** Two quick facts shown on the card. */
  facts: [string, string][];
  desc: string;
  focus: string[];
}[] = [
  {
    slug: "aion",
    name: "Aion",
    short: "Aion",
    status: "active",
    badge: "Vstroz Legion",
    genre: "MMORPG · NCSOFT",
    facts: [
      ["Faction", "Decided at launch"],
      ["Server", "Decided at launch"],
    ],
    desc: "The first game the alliance officially builds a guild website for. Legion structure, siege rosters, dungeon groups, and class leads. Details lock in as the game rolls out.",
    focus: ["Fortress Sieges", "Abyss PvP", "Endgame Dungeons", "Legion Progression"],
  },
  {
    slug: "apex-legends",
    name: "Apex Legends",
    short: "Apex",
    status: "active",
    badge: "Alliance Game",
    genre: "Battle royale · EA",
    facts: [
      ["Squads", "Ranked & pubs"],
      ["Platform", "Crossplay"],
    ],
    desc: "A lot of the community drops in Apex. Squad up from the Discord, post your clips, and build the Apex side of the alliance. An Apex division with its own squads opens when the numbers are there.",
    focus: ["Ranked Squads", "Mixtape Nights", "Clips & Highlights", "Scrims later"],
  },
  {
    slug: "enshrouded",
    name: "Enshrouded",
    short: "Enshrouded",
    status: "active",
    badge: "Alliance Game",
    genre: "Co-op survival RPG · Keen Games",
    facts: [
      ["Style", "Build, explore, survive"],
      ["Squad up", "In Discord"],
    ],
    desc: "For the builders and explorers. Share a world, push into the Shroud together, and post what you build.",
    focus: ["Shared Worlds", "Base Building", "Boss Runs", "Screenshots & Clips"],
  },
  {
    slug: "project-zomboid",
    name: "Project Zomboid",
    short: "Zomboid",
    status: "active",
    badge: "Alliance Game",
    genre: "Zombie survival sandbox · The Indie Stone",
    facts: [
      ["Style", "Hardcore co-op survival"],
      ["Squad up", "In Discord"],
    ],
    desc: "Zombie survival where one mistake ends the run. Team up, hold a base, and see how long the crew lasts.",
    focus: ["Co-op Runs", "Base Defense", "Long-haul Saves", "Clips & Stories"],
  },
  {
    slug: "deadlock",
    name: "Deadlock",
    short: "Deadlock",
    status: "active",
    badge: "Alliance Game",
    genre: "Hero shooter MOBA · Valve",
    facts: [
      ["Style", "Team lanes and gunfights"],
      ["Squad up", "In Discord"],
    ],
    desc: "Valve's lane-pushing hero shooter. Queue as a stack from the Discord and learn it together.",
    focus: ["Stack Queues", "Hero Pools", "Clips & Highlights", "Scrims later"],
  },
  {
    slug: "battlefield-6",
    name: "Battlefield 6",
    short: "Battlefield",
    status: "active",
    badge: "Alliance Game",
    genre: "Large-scale shooter · EA",
    facts: [
      ["Style", "Squads and all-out war"],
      ["Squad up", "In Discord"],
    ],
    desc: "Big maps, vehicles, and squad play. Fill a squad from the Discord and hold the objective together.",
    focus: ["Squad Play", "Conquest Nights", "Vehicles", "Clips & Highlights"],
  },
  {
    slug: "call-of-duty",
    name: "Call of Duty",
    short: "CoD",
    status: "active",
    badge: "Alliance Game",
    genre: "Shooter · Activision",
    facts: [
      ["Modes", "Multiplayer, Warzone, Zombies"],
      ["Squad up", "In Discord"],
    ],
    desc: "Multiplayer, Warzone, or Zombies. Find a stack in the Discord and post your best clips.",
    focus: ["Warzone Squads", "Multiplayer Stacks", "Zombies Runs", "Clips & Highlights"],
  },
  {
    slug: "fortnite",
    name: "Fortnite",
    short: "Fortnite",
    status: "active",
    badge: "Alliance Game",
    genre: "Battle royale · Epic Games",
    facts: [
      ["Modes", "Build, Zero Build, Ranked"],
      ["Platform", "Crossplay"],
    ],
    desc: "Drop in as a duo, trio, or squad. Crossplay means everyone in the alliance can queue together.",
    focus: ["Squads", "Zero Build", "Ranked", "Clips & Highlights"],
  },
];

const activeGames = games.filter((g) => g.status === "active");
/** Short "what we play" line for stat tiles. */
export const playingNow =
  activeGames.length > 2
    ? `${activeGames[0].short ?? activeGames[0].name} + ${activeGames.length - 1} more`
    : activeGames.map((g) => g.short ?? g.name).join(" + ");

/* Recruitment */
export const requirements = [
  "18 or older. No exceptions.",
  "A working mic and Discord. Required for anything competitive or played as a team. Casual members can listen only.",
  "Active and reachable. Tell an officer before a long break.",
  "Show up prepared for whatever game we are playing that night.",
  "Respect the chain of command during play. Bring disagreements to The Round Table afterward.",
  "Zero tolerance for slurs, harassment, cheating, or drama.",
];

export const membershipPath = [
  { n: "01", title: "Recruit (Tiro)", text: "Everyone in the Discord. You are part of the community and you can see what is going on." },
  { n: "02", title: "Member (Socius)", text: "Create your Vstroz Alliance account and you are a Member, whatever you play. Pick your games, post content, vote, and get a public profile and a place on the roster." },
  { n: "03", title: "Veteran (Veteranus)", text: "Voted in by the alliance. Every member and officer votes; a General has the last say." },
  { n: "04", title: "Elite (Evocatus)", text: "The competitive roster. Voted in by the alliance; a General has the last say." },
];

/* Rules & The Round Table */
export const rules = {
  intro:
    "Short version: no bullshit. We are adults who play to win and treat each other like family. Everything below exists so the leaders never have to guess.",
  sections: [
    {
      title: "Conduct",
      items: [
        "No racial, sexual, or other slurs. Anywhere. Ever. First offense is a Round Table hearing; proven cases are removal.",
        "No harassment, doxxing, or targeting members outside the alliance.",
        "No cheating, exploits, account sharing, or real-money trading. Removal.",
        "Bank, resources, and shared assets are for the alliance. Theft is removal.",
      ],
    },
    {
      title: "Playing together",
      items: [
        "Mic and Discord are required for competitive play and team events. Casual play does not require voice.",
        "During events the caller's word is final. Debate afterward, not during.",
        "If you sign up, you show up. Withdraw in the portal before the deadline if you cannot make it.",
        "Two unexcused no-shows on confirmed rosters triggers a Round Table review.",
      ],
    },
    {
      title: "Ranks",
      items: [
        "Everyone in the Discord is a Recruit. Make an account on the website and you are a Member. Ranks belong to the alliance, not to one game.",
        "Each game faction has its own application. Right now that is Aion.",
        "Veteran and Elite are decided by a vote of the alliance. Every member and officer votes. A General has the last say.",
        "Elite is the competitive roster. A spot is earned by vote and can be lost.",
        "Captain and General are command ranks above the ladder.",
        "The Vstroz Legion is our Aion guild. Joining it unlocks match signups and guild roles. It does not change your rank.",
        "Anyone who holds a guild role must keep it up to remain part of the crew.",
      ],
    },
  ],
  table: {
    title: "The Round Table",
    text:
      "The Round Table is command. Every General and Captain has a seat. Decisions, orders, rank votes, disputes, no-show reviews, and rule breaks are brought to The Round Table and settled there, professionally and on the record. Everyone in the alliance votes where the rules call for it. Questions and issues come up the chain of command: Recruits and Members go to a Captain, Veterans and Elite can come to The Round Table directly, and Captains send up what needs a General. Decisions are final.",
  },
};

export const weeklySchedule = [
  { day: "Mon", activity: "Free play · gathering & crafting" },
  { day: "Tue", activity: "PvP training · 19:30 UTC" },
  { day: "Wed", activity: "Dungeon groups · 20:00 UTC" },
  { day: "Thu", activity: "The Round Table · 19:00 UTC" },
  { day: "Fri", activity: "Open-world PvP & scouting" },
  { day: "Sat", activity: "Main event window · 19:00–22:00 UTC" },
  { day: "Sun", activity: "Side games & community night" },
];

export const milestones = [
  { date: "July 2024", title: "The Discord opens", text: "A group of friends who wanted to get together and play start a Discord server. No roster, no ranks. Just a crew and a voice channel." },
  { date: "2024 – 2026", title: "The community grows", text: "Friends bring friends. The server builds slowly, one group at a time, into a community that shows up for each other in every game it plays." },
  { date: "Aion", title: "The first guild website", text: "Aion is the first game the alliance officially builds a guild website for. Recruitment is open, and the alliance grows from here." },
];

/* ---------- Game pages ---------- */

/** A listed game from its URL slug ("aion"), or null. */
export function gameBySlug(slug: string) {
  return games.find((g) => g.slug === slug) ?? null;
}

/** The page for a listed game, from its name ("Aion" gives "/games/aion"). Null when the game has no page. */
export function gameHref(name: string) {
  const g = games.find((x) => x.name === name);
  return g ? `/games/${g.slug}` : null;
}
