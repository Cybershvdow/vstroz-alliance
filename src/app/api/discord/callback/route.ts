import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { isOfficer } from "@/lib/constants";
import { createSession, getSession } from "@/lib/session";
import { createDiscordAccount, discordConfig, discordConfigured, exchangeCode, fetchDiscordUser, isGuildMember, STATE_COOKIE } from "@/lib/discord";

export const dynamic = "force-dynamic";

/**
 * Discord sends the user back here. Rules:
 * - not in the alliance server -> no account, sent back with an explanation
 * - ?link=1 flow -> attach Discord to the signed-in account
 * - known Discord id -> sign in (and restore the account if they had left)
 * - verified Discord email matching an existing account -> link + sign in
 * - otherwise -> create a community account and land on the legion page
 */
export async function GET(req: NextRequest) {
  // Behind Railway the request URL is the internal host, so public redirects are built from APP_URL.
  const base = discordConfig().appUrl;
  const fail = (e: string) => NextResponse.redirect(new URL(`/login?error=${e}`, base));
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const store = await cookies();
  const saved = store.get(STATE_COOKIE)?.value;
  store.delete(STATE_COOKIE);

  if (!discordConfigured()) return fail("discord_off");
  if (!code || !state || !saved || state !== saved) return fail("discord_state");

  const token = await exchangeCode(code);
  if (!token) return fail("discord_token");
  const du = await fetchDiscordUser(token);
  if (!du) return fail("discord_user");
  if (!(await isGuildMember(token))) return fail("not_in_discord");

  const link = state.endsWith(".link");
  const session = await getSession();
  const existing = await db.user.findFirst({ where: { discordId: du.id } });

  if (link && session?.userId) {
    if (existing && existing.id !== session.userId) return NextResponse.redirect(new URL("/dashboard/profile?discord=taken", base));
    await db.user.update({
      where: { id: session.userId },
      data: { discordId: du.id, discordUsername: du.username, discordLinkedAt: new Date(), discordLeftAt: null, discord: du.username },
    });
    return NextResponse.redirect(new URL("/dashboard/profile?discord=linked", base));
  }

  let user = existing;
  if (!user && du.email && du.verified) {
    const byEmail = await db.user.findUnique({ where: { email: du.email.toLowerCase() } });
    if (byEmail && !byEmail.discordId) {
      user = await db.user.update({
        where: { id: byEmail.id },
        data: { discordId: du.id, discordUsername: du.username, discordLinkedAt: new Date(), discord: byEmail.discord ?? du.username },
      });
    }
  }
  let fresh = false;
  if (!user) {
    user = await createDiscordAccount(du);
    fresh = true;
  } else if (user.discordLeftAt) {
    // They left the server and came back: community account again, legion must be re-applied for.
    user = await db.user.update({
      where: { id: user.id },
      data: { discordLeftAt: null, status: "PENDING", appliedAt: null, reviewedAt: null, reviewNote: null, discordUsername: du.username },
    });
  } else if (user.discordUsername !== du.username) {
    await db.user.update({ where: { id: user.id }, data: { discordUsername: du.username } });
  }

  await createSession(user.id);
  const dest = fresh ? "/dashboard/legion?welcome=1" : user.status === "APPROVED" && isOfficer(user.role) ? "/admin" : "/dashboard";
  return NextResponse.redirect(new URL(dest, base));
}
