// Public site content. Edit freely — no code changes needed elsewhere.

export const site = {
  name: "Vstroz Alliance",
  shortName: "Vstroz",
  tag: "VST",
  motto: "One banner. Every world.",
  tagline:
    "Friends who became a community. A competitive, multi-game alliance for adults who play to win and look after their own. Aion 2 is where we start.",
  founded: "2026",
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
  { href: "/media", label: "Media" },
  { href: "/roster", label: "Roster" },
  { href: "/schedule", label: "Schedule" },
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
    text: "Competitive spots are voted on by the players already holding them. You do not buy in. You get voted in.",
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
  status: GameStatus;
  badge: string;
  genre: string;
  faction: string;
  server: string;
  desc: string;
  focus: string[];
}[] = [
  {
    slug: "aion-2",
    name: "Aion 2",
    status: "active",
    badge: "First Title",
    genre: "MMORPG · NCSOFT",
    faction: "Decided at launch",
    server: "Decided at launch",
    desc: "The first game the alliance builds its competitive brand on. Legion structure, siege rosters, dungeon groups, and class leads. Details lock in as the game rolls out.",
    focus: ["Fortress Sieges", "Abyss PvP", "Endgame Dungeons", "Legion Progression"],
  },
  {
    slug: "second-title",
    name: "Next title",
    status: "voting",
    badge: "Member Vote",
    genre: "Decided by the alliance",
    faction: "—",
    server: "—",
    desc: "Once the Aion 2 core is established, members vote on the next shared title. Nominations open in Discord.",
    focus: ["Nominations open", "Vote at The Round Table"],
  },
  {
    slug: "side-games",
    name: "Side games",
    status: "upcoming",
    badge: "Community Nights",
    genre: "Co-op · Shooters · Strategy",
    faction: "—",
    server: "—",
    desc: "Off-night sessions for whatever the crew is into that week. No commitment, same people.",
    focus: ["Weekend Sessions", "Open to all ranks"],
  },
];

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
  { n: "01", title: "Apply", text: "Tell us who you are, what you play, and how you play it. Two minutes." },
  { n: "02", title: "Review", text: "An officer reads every application and replies within 48 hours. Discord intro if needed." },
  { n: "03", title: "Recruit", text: "You are in the community. Portal unlocked: events, roles, media, and The Round Table." },
  { n: "04", title: "Member", text: "Show up consistently and an officer promotes you. Members hold roles that keep the alliance running." },
  { n: "05", title: "Veteran & Elite", text: "Voted in by the players already at that rank. Elite is the competitive roster. Everything competitive is tried out for." },
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
        "Recruit → Member is decided by officers after consistent attendance and attitude.",
        "Veteran and Elite are decided by vote of the players already at that rank, plus officers and leaders.",
        "Elite is the competitive roster. Every competitive spot is tried out for and can be lost.",
        "Members hold individual roles they must keep up to remain part of the crew.",
      ],
    },
  ],
  table: {
    title: "The Round Table",
    text:
      "The Round Table is command. Every General and Captain has a seat. Decisions, orders, rank votes, disputes, no-show reviews, and rule breaks are brought to The Round Table and settled there, professionally and on the record. Members vote where the rules call for it. Any member can bring a dispute. Decisions are final.",
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
  { date: "Aion 2", title: "The first guild website", text: "Aion 2 is the first game the alliance officially builds a guild website for. Recruitment is open, and the alliance grows from here." },
];
