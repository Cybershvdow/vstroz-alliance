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
  // One-time rename: the game is listed as "Aion" (was "Aion 2"). Safe to run on every start.
  const renamed = await Promise.all([
    db.user.updateMany({ where: { game: "Aion 2" }, data: { game: "Aion" } }),
    db.match.updateMany({ where: { game: "Aion 2" }, data: { game: "Aion" } }),
    db.mediaPost.updateMany({ where: { game: "Aion 2" }, data: { game: "Aion" } }),
    db.tryoutRequest.updateMany({ where: { game: "Aion 2" }, data: { game: "Aion" } }),
  ]);
  const n = renamed.reduce((t, r) => t + r.count, 0);
  if (n) console.log(`[bootstrap] renamed Aion 2 → Aion on ${n} rows`);
} finally {
  await db.$disconnect();
}
