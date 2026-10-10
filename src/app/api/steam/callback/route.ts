import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { fetchSteamSnapshot, steamConfigured, verifySteamCallback } from "@/lib/steam";

export const dynamic = "force-dynamic";

/** Steam sends the member back here. Verifies with Steam, links the SteamID to the signed-in account, pulls a first snapshot. */
export async function GET(req: NextRequest) {
  const base = (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
  const to = (q: string) => NextResponse.redirect(new URL(`/dashboard/profile?steam=${q}`, base));
  const session = await getSession();
  if (!session?.userId) return NextResponse.redirect(new URL("/login?next=/dashboard/profile", base));
  if (!steamConfigured()) return to("off");

  const steamId = await verifySteamCallback(req.nextUrl.searchParams);
  if (!steamId) return to("error");

  const taken = await db.user.findFirst({ where: { steamId, NOT: { id: session.userId } }, select: { id: true } });
  if (taken) return to("taken");

  const snap = await fetchSteamSnapshot(steamId);
  await db.user.update({
    where: { id: session.userId },
    data: {
      steamId,
      steamLinkedAt: new Date(),
      steamName: snap?.name ?? null,
      steamAvatar: snap?.avatar ?? null,
      steamStats: snap ? JSON.stringify(snap) : null,
      steamStatsAt: snap ? new Date() : null,
    },
  });
  return to("linked");
}
