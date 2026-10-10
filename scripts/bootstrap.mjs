/* First-boot bootstrap for production: if the database has no users yet, run the live seed
   (creates the leadership accounts from SEED_* env vars). Safe to run on every start. */
import { execSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
try {
  const users = await db.user.count();
  if (users === 0) {
    console.log("[bootstrap] empty database — creating leadership accounts");
    execSync("npx tsx prisma/seed.live.ts", { stdio: "inherit" });
  } else {
    console.log(`[bootstrap] database ready (${users} users)`);
  }
  // Accounts reviewed before the legion flow existed count as applied. Never touches unreviewed accounts.
  const backfilled = await db.$executeRawUnsafe(
    'UPDATE "User" SET "appliedAt" = COALESCE("reviewedAt", "createdAt") WHERE "appliedAt" IS NULL AND "reviewedAt" IS NOT NULL',
  );
  if (backfilled) console.log(`[bootstrap] backfilled appliedAt on ${backfilled} rows`);
  // One-time rename: the game is listed as "Aion" (was "Aion 2"). Safe to run on every start.
  const renamed = await Promise.all([
    db.user.updateMany({ where: { game: "Aion 2" }, data: { game: "Aion" } }),
    db.match.updateMany({ where: { game: "Aion 2" }, data: { game: "Aion" } }),
    db.mediaPost.updateMany({ where: { game: "Aion 2" }, data: { game: "Aion" } }),
    db.tryoutRequest.updateMany({ where: { game: "Aion 2" }, data: { game: "Aion" } }),
  ]);
  // Profile tags (2026-10-10): members now tick several listed games. Carry the old single game over once.
  const LISTED = ["Aion", "Apex Legends", "Enshrouded", "Project Zomboid", "Deadlock"];
  const LEGION = ["Aion"];
  const canonOf = (s) => LISTED.find((n) => n.toLowerCase() === String(s ?? "").trim().toLowerCase());
  const confirmedInGame = (json) => {
    try {
      return JSON.parse(json ?? "null")?.inGameLegion === "Yes";
    } catch {
      return false;
    }
  };
  const legacy = await db.user.findMany({ where: { playedGames: null, game: { not: null } }, select: { id: true, game: true, games: true, gameAnswers: true } });
  for (const u of legacy) {
    const canon = canonOf(u.game);
    const isLegionGame = !!canon && LEGION.includes(canon);
    const confirmed = confirmedInGame(u.gameAnswers); // applied to the legion earlier, then switched their single game
    const tags = new Set([...(canon ? [canon] : []), ...(confirmed ? [LEGION[0]] : [])]);
    await db.user.update({
      where: { id: u.id },
      data: {
        playedGames: JSON.stringify(LISTED.filter((n) => tags.has(n))),
        game: isLegionGame ? canon : confirmed ? LEGION[0] : null,
        ...(isLegionGame ? {} : { gameAnswers: confirmed ? '{"inGameLegion":"Yes"}' : null }),
        ...(canon ? {} : { games: [u.games, u.game].filter(Boolean).join(", ").slice(0, 300) }),
      },
    });
  }
  if (legacy.length) console.log(`[bootstrap] moved ${legacy.length} profiles to game tags`);
  // A listed game typed into "other games" becomes a tag (the profile form does the same on save).
  const typed = await db.user.findMany({ where: { games: { not: null } }, select: { id: true, games: true, playedGames: true, game: true } });
  let promoted = 0;
  for (const u of typed) {
    const parts = u.games.split(",").map((s) => s.trim()).filter(Boolean);
    const hits = parts.map(canonOf).filter(Boolean);
    if (!hits.length) continue;
    let tags = [];
    try {
      tags = JSON.parse(u.playedGames ?? "[]");
    } catch {
      tags = [];
    }
    const set = new Set([...(Array.isArray(tags) ? tags : []), ...hits]);
    if (u.playedGames == null && canonOf(u.game)) set.add(canonOf(u.game));
    await db.user.update({
      where: { id: u.id },
      data: { playedGames: JSON.stringify(LISTED.filter((n) => set.has(n))), games: parts.filter((p) => !canonOf(p)).join(", ") || null },
    });
    promoted++;
  }
  if (promoted) console.log(`[bootstrap] turned typed listed games into tags on ${promoted} profiles`);
  // Command roster fix (2026-10-08): Nugget is Alliance Leader & Founder and does not play Aion. Matches only while the old title is present.
  const nugget = await db.user.updateMany({ where: { username: "nugget", title: "Discord Server Leader" }, data: { title: "Alliance Leader & Founder", game: null, gameClass: null } });
  if (nugget.count) console.log("[bootstrap] updated Nugget title");
  const n = renamed.reduce((t, r) => t + r.count, 0);
  if (n) console.log(`[bootstrap] renamed Aion 2 → Aion on ${n} rows`);
} finally {
  await db.$disconnect();
}
