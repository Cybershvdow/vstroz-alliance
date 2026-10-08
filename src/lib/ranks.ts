import "server-only";
import { db } from "@/lib/db";
import { VOTE_RULES } from "@/lib/constants";

/** Tally a nomination's votes and decide whether it passes under VOTE_RULES. */
export function tally(votes: { choice: string }[]) {
  const yes = votes.filter((v) => v.choice === "YES").length;
  const no = votes.filter((v) => v.choice === "NO").length;
  const abstain = votes.filter((v) => v.choice === "ABSTAIN").length;
  const counted = yes + no;
  const ratio = counted ? yes / counted : 0;
  const quorum = counted >= VOTE_RULES.quorum;
  return { yes, no, abstain, counted, ratio, quorum, passing: quorum && ratio >= VOTE_RULES.passRatio };
}

/** Close any open nominations whose window has ended, applying the result. */
export async function closeExpiredNominations() {
  const expired = await db.nomination.findMany({ where: { status: "OPEN", closesAt: { lte: new Date() } }, include: { votes: true } });
  for (const nom of expired) {
    const t = tally(nom.votes);
    const status = t.passing ? "PASSED" : "FAILED";
    await db.$transaction([
      db.nomination.update({ where: { id: nom.id }, data: { status, decidedAt: new Date() } }),
      ...(t.passing ? [db.user.update({ where: { id: nom.userId }, data: { tier: nom.tier } })] : []),
    ]);
  }
  return expired.length;
}
