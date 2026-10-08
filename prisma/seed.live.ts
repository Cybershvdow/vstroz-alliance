/* LIVE seed: wipes everything and creates only the real leadership.
   Run with: npm run db:seed
   Passwords come from .env: SEED_LEADER_PASSWORD (Cybershvdow) and SEED_NUGGET_PASSWORD (Nugget).
   Both should change their password after first sign-in (Profile → Password). */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const leaderPassword = process.env.SEED_LEADER_PASSWORD || "change-me";
  const nuggetPassword = process.env.SEED_NUGGET_PASSWORD || "change-me";

  await db.announcement.deleteMany();
  await db.vote.deleteMany();
  await db.nomination.deleteMany();
  await db.roleApplication.deleteMany();
  await db.matchSignup.deleteMany();
  await db.guildRole.deleteMany();
  await db.match.deleteMany();
  await db.user.deleteMany();

  const cyber = await db.user.create({
    data: {
      username: "cybershvdow",
      email: "leader@vstroz.gg",
      passwordHash: await bcrypt.hash(leaderPassword, 12),
      displayName: "Cybershvdow",
      ign: "Cybershvdow",
      discord: "cybershvdow",
      game: "Aion 2",
      status: "APPROVED",
      role: "LEADER",
      tier: "ELITE",
      title: "Alliance Leader & Founder",
      reviewedAt: new Date(),
    },
  });

  await db.user.create({
    data: {
      username: "nugget",
      email: "nugget@vstroz.gg",
      passwordHash: await bcrypt.hash(nuggetPassword, 12),
      displayName: "Nugget",
      ign: "Nugget",
      discord: "nugget",
      game: "Aion 2",
      status: "APPROVED",
      role: "LEADER",
      tier: "ELITE",
      title: "Discord Server Leader",
      reviewedAt: new Date(),
      reviewedById: cyber.id,
    },
  });

  // Guild role definitions members can apply for (no holders yet)
  await db.guildRole.createMany({
    data: [
      { name: "Class Lead — Templar", description: "Own the Templar guide, review builds, and lead tank positioning in sieges.", slots: 1 },
      { name: "Class Lead — Cleric", description: "Own the Cleric guide and coordinate healer rotations during sieges.", slots: 1 },
      { name: "Raid Leader", description: "Lead dungeon and raid groups on scheduled PvE nights.", slots: 3 },
      { name: "Recruiter", description: "Screen applicants, run intro calls, and onboard new members into Discord.", slots: 2 },
      { name: "Content Creator", description: "Record and edit highlights and guides for the alliance channel.", slots: 2 },
    ],
  });

  await db.announcement.create({
    data: {
      title: "Welcome to the Vstroz Alliance portal",
      body: "Sign up for matches, apply for roles, and keep your profile current here. Officers review applications within 48 hours. Rank promotions to Veteran and Elite are decided by vote.",
      pinned: true,
      authorId: cyber.id,
    },
  });

  console.log("Live seed complete: Cybershvdow and Nugget.");
  console.log("Logins: cybershvdow / (SEED_LEADER_PASSWORD), nugget / (SEED_NUGGET_PASSWORD)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
