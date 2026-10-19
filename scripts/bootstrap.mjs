/* First-boot bootstrap for production: if the database has no users yet, run the live seed
   (creates the leadership accounts from SEED_* env vars). Safe to run on every start. */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
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
  // Founding members (2026-10-11): everyone who already had an account when the rank ladder became alliance-wide
  // is a Member. Recruit is for people who join after that. This runs ONCE: a marker file next to the database
  // records it, so an officer who later sets one of them back to Recruit is not overruled on the next boot.
  const FOUNDING_CUTOFF = new Date("2026-10-11T03:00:00Z");
  const dbFile = (process.env.DATABASE_URL || "").replace(/^file:/, "");
  if (dbFile) {
    const marker = path.join(path.dirname(path.isAbsolute(dbFile) ? dbFile : path.resolve("prisma", dbFile)), ".fixup-founding-members");
    if (!fs.existsSync(marker)) {
      const founding = await db.user.updateMany({ where: { role: "MEMBER", tier: "RECRUIT", createdAt: { lt: FOUNDING_CUTOFF } }, data: { tier: "MEMBER" } });
      fs.writeFileSync(marker, `${new Date().toISOString()} set ${founding.count} existing accounts to Member\n`);
      console.log(`[bootstrap] founding members: ${founding.count} existing accounts set to Member`);
    }
    // Second pass (2026-10-12): the owner confirmed everyone registered so far is a Member. Also runs once.
    const marker2 = path.join(path.dirname(marker), ".fixup-members-2026-10-12");
    if (!fs.existsSync(marker2)) {
      const more = await db.user.updateMany({ where: { role: "MEMBER", tier: "RECRUIT", createdAt: { lt: new Date("2026-10-12T21:20:00Z") } }, data: { tier: "MEMBER" } });
      fs.writeFileSync(marker2, `${new Date().toISOString()} set ${more.count} existing accounts to Member\n`);
      console.log(`[bootstrap] members as of 2026-10-12: ${more.count} existing accounts set to Member`);
    }
    // Owner approved kriegg into the Aion guild (Vstroz Legion) on 2026-10-18. Runs once.
    const marker4 = path.join(path.dirname(marker), ".fixup-kriegg-legion-2026-10-18");
    if (!fs.existsSync(marker4)) {
      const now = new Date();
      const k = await db.user.findUnique({ where: { username: "kriegg1970" }, select: { appliedAt: true } });
      const r = k ? await db.user.updateMany({ where: { username: "kriegg1970" }, data: { status: "APPROVED", reviewedAt: now, appliedAt: k.appliedAt ?? now } }) : { count: 0 };
      fs.writeFileSync(marker4, `${now.toISOString()} approved ${r.count}\n`);
      console.log(`[bootstrap] kriegg approved into the Vstroz Legion: ${r.count}`);
    }
    // Aion guild (2026-10-12, owner): Cybershvdow leads the guild; Nugget does not play Aion, so is not in it. Runs once.
    const marker3 = path.join(path.dirname(marker), ".fixup-aion-guild-2026-10-12");
    if (!fs.existsSync(marker3)) {
      const lead = await db.user.updateMany({ where: { username: "cybershvdow" }, data: { guildRank: "LEADER" } });
      const out = await db.user.updateMany({ where: { username: "nugget" }, data: { status: "PENDING", appliedAt: null, reviewedAt: null, guildRank: null, title: "Faction Owner" } });
      fs.writeFileSync(marker3, `${new Date().toISOString()} guild leader ${lead.count}, removed from guild ${out.count}\n`);
      console.log(`[bootstrap] Aion guild: leader set on ${lead.count}, removed from the guild ${out.count}`);
    }
  }
  // Owner's rule (2026-10-12): a website account is a Member; Recruit means "in the Discord, no account". Safe on every start.
  const lifted = await db.user.updateMany({ where: { tier: "RECRUIT" }, data: { tier: "MEMBER" } });
  if (lifted.count) console.log(`[bootstrap] ${lifted.count} accounts moved from Recruit to Member`);
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
  const LISTED = ["Aion", "Apex Legends", "Enshrouded", "Project Zomboid", "Deadlock", "Battlefield 6", "Call of Duty", "Fortnite"];
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
