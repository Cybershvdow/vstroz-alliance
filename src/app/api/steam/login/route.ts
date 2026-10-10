import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { steamConfigured, steamLoginUrl } from "@/lib/steam";

export const dynamic = "force-dynamic";

/** Start "Connect Steam" for the signed-in member. */
export async function GET() {
  const base = (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
  const session = await getSession();
  if (!session?.userId) return NextResponse.redirect(new URL("/login?next=/dashboard/profile", base));
  if (!steamConfigured()) return NextResponse.redirect(new URL("/dashboard/profile?steam=off", base));
  return NextResponse.redirect(steamLoginUrl());
}
