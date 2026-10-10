import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isOfficer } from "@/lib/constants";
import { discordSyncConfigured, reconcileDiscord } from "@/lib/discord";

export const dynamic = "force-dynamic";

/** Run a membership sync. Allowed for a signed-in officer, or with `Authorization: Bearer <DISCORD_SYNC_SECRET>` from a scheduler. */
export async function POST(req: NextRequest) {
  const secret = process.env.DISCORD_SYNC_SECRET?.trim();
  let allowed = !!secret && req.headers.get("authorization") === `Bearer ${secret}`;
  if (!allowed) {
    const me = await getCurrentUser();
    allowed = !!me && me.status === "APPROVED" && isOfficer(me.role);
  }
  if (!allowed) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!discordSyncConfigured()) return NextResponse.json({ error: "Discord sync is not configured" }, { status: 503 });
  return NextResponse.json(await reconcileDiscord());
}
