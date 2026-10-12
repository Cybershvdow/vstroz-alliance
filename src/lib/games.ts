import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { LEGION_GAMES, allianceRank, guildRankOf, playedGamesOf } from "@/lib/constants";

/*
  What the alliance does in one listed game: who plays it, what content is tagged with it, what is on the calendar.
  Everything is keyed by the game's name ("Aion"), the same string members tick on their profile and pick when
  they post a video or an officer schedules a match.
*/

/** Earlier names for a listed game that older rows may still carry. */
const ALIASES: Record<string, string[]> = { Aion: ["Aion 2"] };
const namesFor = (game: string) => [game, ...(ALIASES[game] ?? [])];

/** Members who ticked this game (or, for old rows, whose single game is this one). Hidden accounts are left out. */
const playsWhere = (game: string): Prisma.UserWhereInput => ({
  discordLeftAt: null,
  OR: [{ playedGames: { contains: `"${game}"` } }, { playedGames: null, game }],
});

/** Approved videos tagged with this game: official ones, and members' while their account is visible. */
const postsWhere = (game: string): Prisma.MediaPostWhereInput => ({
  approved: true,
  game: { in: namesFor(game) },
  OR: [{ official: true }, { postedBy: { discordLeftAt: null } }],
});

/** Public events for this game. Events set to "All Games" belong on every game's page. */
const eventsWhere = (game: string): Prisma.MatchWhereInput => ({ isPublic: true, game: { in: [...namesFor(game), "All Games"] } });

/** The numbers on a game card. */
export async function gameCounts(game: string) {
  const [players, videos, upcoming] = await Promise.all([
    db.user.count({ where: playsWhere(game) }),
    db.mediaPost.count({ where: postsWhere(game) }),
    db.match.count({ where: { ...eventsWhere(game), startsAt: { gte: new Date() }, status: { in: ["OPEN", "LOCKED"] } } }),
  ]);
  return { players, videos, upcoming };
}

/** Everything shown on a game's page. */
export async function gameActivity(game: string) {
  const now = new Date();
  const upcomingWhere: Prisma.MatchWhereInput = { ...eventsWhere(game), startsAt: { gte: now }, status: { in: ["OPEN", "LOCKED"] } };
  const [members, posts, upcoming, upcomingTotal, results] = await Promise.all([
    db.user.findMany({
      where: playsWhere(game),
      select: { id: true, username: true, displayName: true, role: true, tier: true, title: true, status: true, game: true, playedGames: true, avatarAt: true, discordLeftAt: true },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    }),
    db.mediaPost.findMany({
      where: postsWhere(game),
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      include: { postedBy: { select: { displayName: true, username: true } } },
    }),
    db.match.findMany({
      where: upcomingWhere,
      orderBy: { startsAt: "asc" },
      take: 6,
      include: { _count: { select: { signups: { where: { status: { not: "DECLINED" } } } } } },
    }),
    db.match.count({ where: upcomingWhere }),
    db.match.findMany({ where: { ...eventsWhere(game), status: "COMPLETED" }, orderBy: { startsAt: "desc" }, take: 5 }),
  ]);

  // The text match above is loose; keep only members whose tags really include the game, highest rank first.
  const players = members
    .filter((m) => playedGamesOf(m).includes(game))
    .map((m) => ({ ...m, rank: allianceRank(m) }))
    .sort((a, b) => a.rank.order - b.rank.order);

  // The game's guild, when it has one: its own roster with its own ranks, apart from the alliance ranks.
  const hasGuild = LEGION_GAMES.some((g) => g.name === game);
  const guild = hasGuild
    ? (
        await db.user.findMany({
          where: { status: "APPROVED", discordLeftAt: null },
          select: { id: true, username: true, displayName: true, role: true, tier: true, status: true, guildRank: true, ign: true, gameClass: true, avatarAt: true, discordLeftAt: true },
          orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        })
      )
        .map((m) => ({ ...m, rank: allianceRank(m), guild: guildRankOf(m)! }))
        .sort((a, b) => a.guild.order - b.guild.order)
    : [];

  return { players, posts, upcoming, upcomingTotal, results, guild };
}
