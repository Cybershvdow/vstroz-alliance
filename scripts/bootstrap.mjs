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
  // Accounts created before the legion flow: anyone already reviewed, or who filled in a profile, counts as applied.
  const backfilled = await db.$executeRawUnsafe(
    'UPDATE "User" SET "appliedAt" = COALESCE("reviewedAt", "createdAt") WHERE "appliedAt" IS NULL AND ("status" <> \'PENDING\' OR "playtime" IS NOT NULL)',
  );
  if (backfilled) console.log(`[bootstrap] backfilled appliedAt on ${backfilled} rows`);
  // One-time rename: the game is listed as "Aion" (was "Aion 2"). Safe to run on every start.
  const renamed = await Promise.all([
    db.user.updateMany({ where: { game: "Aion 2" }, data: { game: "Aion" } }),
    db.match.updateMany({ where: { game: "Aion 2" }, data: { game: "Aion" } }),
    db.mediaPost.updateMany({ where: { game: "Aion 2" }, data: { game: "Aion" } }),
    db.tryoutRequest.updateMany({ where: { game: "Aion 2" }, data: { game: "Aion" } }),
  ]);
  // Command roster fix (2026-10-08): Nugget is Alliance Leader & Founder and does not play Aion. Matches only while the old title is present.
  const nugget = await db.user.updateMany({ where: { username: "nugget", title: "Discord Server Leader" }, data: { title: "Alliance Leader & Founder", game: null, gameClass: null } });
  if (nugget.count) console.log("[bootstrap] updated Nugget title");
  const n = renamed.reduce((t, r) => t + r.count, 0);
  if (n) console.log(`[bootstrap] renamed Aion 2 → Aion on ${n} rows`);
} finally {
  await db.$disconnect();
}
