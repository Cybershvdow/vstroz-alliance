/* Seed script: creates the leader account, sample officers/members, matches, roles, and announcements.
   Run with: npm run db:seed
   Leader password comes from SEED_LEADER_PASSWORD in .env. All other seeded accounts use "Password123!". */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const DEMO_PASSWORD = "Password123!";

function daysFromNow(days: number, hourUtc = 19, minute = 0) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  d.setUTCHours(hourUtc, minute, 0, 0);
  return d;
}

async function main() {
  const leaderPassword = process.env.SEED_LEADER_PASSWORD || "change-me";
  const leaderHash = await bcrypt.hash(leaderPassword, 12);
  const demoHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  // Wipe in dependency order so the seed is repeatable.
  await db.announcement.deleteMany();
  await db.vote.deleteMany();
  await db.nomination.deleteMany();
  await db.roleApplication.deleteMany();
  await db.matchSignup.deleteMany();
  await db.guildRole.deleteMany();
  await db.match.deleteMany();
  await db.user.deleteMany();

  const leader = await db.user.create({
    data: {
      username: "cybershvdow",
      email: "leader@vstroz.gg",
      passwordHash: leaderHash,
      displayName: "Cybershvdow",
      ign: "Cybershvdow",
      gameClass: "Gladiator",
      discord: "cybershvdow",
      playtime: "5+ years",
      playerType: "Hardcore",
      interests: "Sieges & Large-scale War, PvP, Dungeons & Raids",
      games: "Aion",
      status: "APPROVED",
      role: "LEADER",
      tier: "ELITE",
      title: "Alliance Leader & Founder",
      reviewedAt: new Date(),
    },
  });

  // Second leader: runs the Discord server
  await db.user.create({
    data: {
      username: "nugget",
      email: "nugget@vstroz.gg",
      passwordHash: demoHash,
      displayName: "Nugget",
      ign: "Nugget",
      discord: "nugget",
      playtime: "5+ years",
      playerType: "Hardcore",
      interests: "Community & Events, PvP, Dungeons & Raids",
      games: "Aion",
      status: "APPROVED",
      role: "LEADER",
      tier: "ELITE",
      title: "Discord Server Leader",
      reviewedAt: new Date(),
      reviewedById: leader.id,
    },
  });

  const officers = await Promise.all(
    [
      { username: "kaelith", displayName: "Kaelith", gameClass: "Cleric", title: "Diplomacy & Alliances" },
      { username: "draven", displayName: "Draven", gameClass: "Templar", title: "Siege & PvP Lead" },
      { username: "seraphi", displayName: "Seraphi", gameClass: "Sorcerer", title: "Recruitment & Onboarding" },
    ].map((o) =>
      db.user.create({
        data: {
          username: o.username,
          email: `${o.username}@vstroz.gg`,
          passwordHash: demoHash,
          displayName: o.displayName,
          ign: o.displayName,
          gameClass: o.gameClass,
          discord: o.username,
          status: "APPROVED",
          role: "OFFICER",
          tier: "ELITE",
          title: o.title,
          reviewedAt: new Date(),
          reviewedById: leader.id,
        },
      }),
    ),
  );

  const memberSeed = [
    ["nyxara", "Nyxara", "Assassin"],
    ["bronn", "Bronn", "Templar"],
    ["ilyana", "Ilyana", "Chanter"],
    ["torvek", "Torvek", "Ranger"],
    ["mireille", "Mireille", "Cleric"],
    ["ashgar", "Ashgar", "Gladiator"],
    ["lumen", "Lumen", "Spiritmaster"],
    ["ryker", "Ryker", "Assassin"],
    ["solenne", "Solenne", "Chanter"],
    ["grimwald", "Grimwald", "Templar"],
    ["veyra", "Veyra", "Ranger"],
    ["oskan", "Oskan", "Sorcerer"],
  ] as const;

  const members = await Promise.all(
    memberSeed.map(([username, displayName, gameClass], i) =>
      db.user.create({
        data: {
          username,
          email: `${username}@vstroz.gg`,
          passwordHash: demoHash,
          displayName,
          ign: displayName,
          gameClass,
          discord: username,
          status: "APPROVED",
          role: "MEMBER",
          tier: i < 3 ? "ELITE" : i < 7 ? "VETERAN" : i < 10 ? "MEMBER" : "RECRUIT",
          reviewedAt: new Date(),
          reviewedById: officers[i % officers.length].id,
          createdAt: daysFromNow(-120 + i * 8),
        },
      }),
    ),
  );

  // Pending applicants (what officers will see in the approval queue)
  await Promise.all(
    [
      ["thessaly", "Thessaly", "Cleric", "Healed for a top-10 legion in Aion Classic. Looking for a serious siege guild."],
      ["corvin", "Corvin", "Gladiator", "Returning MMO player, online every evening EU time. Have mic, will listen to calls."],
      ["elowen", "Elowen", "Undecided", "New to Aion but experienced in TL and BDO PvP. Happy to fill whatever role is needed."],
    ].map(([username, displayName, gameClass, note]) =>
      db.user.create({
        data: {
          username,
          email: `${username}@example.com`,
          passwordHash: demoHash,
          displayName,
          ign: displayName,
          gameClass,
          discord: `${username}#0001`,
          applicationNote: note,
          playtime: ["3–5 years", "1–3 years", "Less than 6 months"][["thessaly", "corvin", "elowen"].indexOf(username)] ?? "1–3 years",
          playerType: ["Hardcore", "Softcore", "Casual"][["thessaly", "corvin", "elowen"].indexOf(username)] ?? "Softcore",
          interests: ["Dungeons & Raids, Sieges & Large-scale War", "PvP, Sieges & Large-scale War", "Leveling & Questing, Community & Events"][["thessaly", "corvin", "elowen"].indexOf(username)],
          games: ["Aion Classic, Lost Ark", "Throne and Liberty, Black Desert", "Final Fantasy XIV, Valorant"][["thessaly", "corvin", "elowen"].indexOf(username)],
          game: "Aion",
          gameAnswers: JSON.stringify(
            [
              { ign: "Thessaly", mainClass: "Cleric", preferredRole: "Healer", focus: "Both equally", raidExperience: "Experienced", hoursPerWeek: "20+ hours", voice: "Yes, always", previousGuilds: "Ironveil (Aion Classic, 2 years)" },
              { ign: "Corvin", mainClass: "Gladiator", preferredRole: "DPS", focus: "PvP", raidExperience: "Some", hoursPerWeek: "10–20 hours", voice: "Yes, when needed" },
              { mainClass: "Undecided", preferredRole: "Flexible", focus: "PvE", raidExperience: "None yet", hoursPerWeek: "5–10 hours", voice: "Listen only" },
            ][["thessaly", "corvin", "elowen"].indexOf(username)],
          ),
          status: "PENDING",
        },
      }),
    ),
  );

  await db.user.create({
    data: {
      username: "marrok",
      email: "marrok@example.com",
      passwordHash: demoHash,
      displayName: "Marrok",
      gameClass: "Assassin",
      applicationNote: "hey can i join",
      status: "DENIED",
      reviewNote: "Application too thin. Re-apply with your Discord tag and availability.",
      reviewedAt: new Date(),
      reviewedById: officers[2].id,
    },
  });

  // Matches
  const siege = await db.match.create({
    data: {
      title: "Fortress Siege — Upper Abyss",
      game: "Aion",
      type: "SIEGE",
      startsAt: daysFromNow(4, 19),
      description: "Full mobilization. Be in voice 15 minutes early. Tanks and healers report to Draven for formation.",
      maxPlayers: 48,
    },
  });
  const council = await db.match.create({
    data: {
      title: "Weekly War Council",
      game: "Aion",
      type: "MEETING",
      startsAt: daysFromNow(2, 19),
      description: "Officers and class leads review the last siege and set next week's targets. Members welcome to listen.",
      isPublic: false,
    },
  });
  const dungeon = await db.match.create({
    data: {
      title: "Dungeon Night: Gear Push",
      game: "Aion",
      type: "PVE",
      startsAt: daysFromNow(3, 20),
      description: "Groups formed by role. Priority to recruits who need gear for siege eligibility.",
      maxPlayers: 24,
    },
  });
  const training = await db.match.create({
    data: {
      title: "Abyss PvP Training",
      game: "Aion",
      type: "TRAINING",
      startsAt: daysFromNow(6, 19, 30),
      description: "Open to all ranks. Positioning, target calling, and group movement drills.",
    },
  });
  await db.match.create({
    data: {
      title: "Game Council: Second Title Vote",
      game: "All Games",
      type: "COMMUNITY",
      startsAt: daysFromNow(12, 18),
      description: "Alliance-wide vote on our next shared game. Nominations close 48 hours before.",
    },
  });
  await db.match.create({
    data: {
      title: "Scrim vs. Ironveil Legion",
      game: "Aion",
      type: "SCRIM",
      startsAt: daysFromNow(-5, 20),
      description: "24v24 practice scrim in the Abyss.",
      status: "COMPLETED",
      result: "Victory 3–1",
      maxPlayers: 24,
    },
  });
  await db.match.create({
    data: {
      title: "Fortress Siege — Lower Abyss",
      game: "Aion",
      type: "SIEGE",
      startsAt: daysFromNow(-9, 19),
      description: "Defensive siege. Held the fortress through three counter-pushes.",
      status: "COMPLETED",
      result: "Victory — Fortress held",
      maxPlayers: 48,
    },
  });

  // Signups
  const positionFor = (cls: string | null) =>
    cls === "Templar" ? "TANK" : cls === "Cleric" ? "HEALER" : cls === "Chanter" ? "SUPPORT" : "DPS";

  const everyone = [leader, ...officers, ...members];
  await Promise.all(
    everyone.slice(0, 12).map((u, i) =>
      db.matchSignup.create({
        data: {
          matchId: siege.id,
          userId: u.id,
          position: positionFor(u.gameClass),
          status: i < 8 ? "CONFIRMED" : "PENDING",
        },
      }),
    ),
  );
  await Promise.all(
    members.slice(0, 6).map((u) =>
      db.matchSignup.create({
        data: { matchId: dungeon.id, userId: u.id, position: positionFor(u.gameClass), status: "PENDING" },
      }),
    ),
  );
  await Promise.all(
    members.slice(3, 8).map((u) =>
      db.matchSignup.create({
        data: { matchId: training.id, userId: u.id, position: positionFor(u.gameClass), status: "CONFIRMED" },
      }),
    ),
  );
  void council;

  // Guild roles
  const roles = await Promise.all(
    [
      ["Class Lead — Templar", "Own the Templar guide, review builds, and lead tank positioning in sieges.", 1],
      ["Class Lead — Cleric", "Own the Cleric guide and coordinate healer rotations during sieges.", 1],
      ["Raid Leader", "Lead dungeon and raid groups on scheduled PvE nights. Must know every boss.", 3],
      ["Recruiter", "Screen applicants, run intro calls, and onboard new members into Discord.", 2],
      ["Content Creator", "Record and edit siege highlights and guides for the alliance channel.", 2],
    ].map(([name, description, slots]) =>
      db.guildRole.create({ data: { name: String(name), description: String(description), slots: Number(slots) } }),
    ),
  );

  await db.roleApplication.create({
    data: {
      roleId: roles[0].id,
      userId: members[1].id, // Bronn, Templar
      message: "Been maining Templar since Aion 1. I already write the legion's tank notes in Discord and can lead the front line.",
    },
  });
  await db.roleApplication.create({
    data: {
      roleId: roles[2].id,
      userId: members[0].id, // Nyxara
      message: "I run most of the weekday dungeon groups already. Would like to make it official.",
      status: "APPROVED",
      reviewedAt: new Date(),
    },
  });
  await db.roleApplication.create({
    data: {
      roleId: roles[3].id,
      userId: members[4].id, // Mireille
      message: "Friendly, online most evenings, and I like talking to new people. Happy to run intro calls.",
    },
  });

  // Rank votes: one open nomination (Torvek → Elite) with a couple of votes in, one passed, one failed
  const nomOpen = await db.nomination.create({
    data: {
      userId: members[3].id, // Torvek (Veteran)
      tier: "ELITE",
      nominatedById: officers[1].id,
      reason: "Top damage in the last three sieges, never misses a call, and already helps run PvP training. Ready for the competitive roster.",
      closesAt: daysFromNow(2, 20),
    },
  });
  await db.vote.createMany({
    data: [
      { nominationId: nomOpen.id, voterId: members[0].id, choice: "YES", comment: "Carried the last scrim." },
      { nominationId: nomOpen.id, voterId: members[1].id, choice: "YES" },
      { nominationId: nomOpen.id, voterId: officers[0].id, choice: "ABSTAIN" },
    ],
  });
  const nomPassed = await db.nomination.create({
    data: { userId: members[4].id, tier: "VETERAN", nominatedById: officers[2].id, reason: "Reliable healer, mentors every recruit that joins.", status: "PASSED", closesAt: daysFromNow(-6), decidedAt: daysFromNow(-6), decidedById: leader.id },
  });
  await db.vote.createMany({ data: [members[0], members[1], members[2], officers[1]].map((u) => ({ nominationId: nomPassed.id, voterId: u.id, choice: "YES" })) });
  const nomFailed = await db.nomination.create({
    data: { userId: members[8].id, tier: "VETERAN", nominatedById: officers[0].id, reason: "Active and improving fast.", status: "FAILED", closesAt: daysFromNow(-12), decidedAt: daysFromNow(-12) },
  });
  await db.vote.createMany({ data: [{ nominationId: nomFailed.id, voterId: members[0].id, choice: "YES" }, { nominationId: nomFailed.id, voterId: members[1].id, choice: "NO", comment: "Too new, give it a month." }, { nominationId: nomFailed.id, voterId: members[2].id, choice: "NO" }] });

  // Announcements
  await db.announcement.create({
    data: {
      title: "Siege Saturday: mandatory for all confirmed players",
      body: "Confirmed roster for Saturday's siege is posted. If you are on it, be in voice by 18:45 UTC with consumables ready. If you cannot make it, withdraw your signup before Friday night so we can pull from the bench.",
      pinned: true,
      authorId: officers[1].id,
    },
  });
  await db.announcement.create({
    data: {
      title: "Second title vote opens next week",
      body: "Nominations for our second shared game are open in #game-council. Post your pick with one paragraph on why. The vote runs for 72 hours.",
      authorId: leader.id,
    },
  });
  await db.announcement.create({
    data: {
      title: "Welcome to the new members portal",
      body: "You can now sign up for matches, apply for roles, and keep your profile current here. Officers review everything within 48 hours.",
      authorId: officers[2].id,
    },
  });

  console.log("Seed complete.");
  console.log(`Leader login: cybershvdow / ${leaderPassword}`);
  console.log(`Discord leader login: nugget / ${DEMO_PASSWORD}`);
  console.log(`Officer logins: kaelith, draven, seraphi / ${DEMO_PASSWORD}`);
  console.log(`Member logins: nyxara, bronn, ... / ${DEMO_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
