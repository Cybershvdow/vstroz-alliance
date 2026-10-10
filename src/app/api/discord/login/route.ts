import crypto from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { authorizeUrl, discordConfigured, STATE_COOKIE } from "@/lib/discord";

export const dynamic = "force-dynamic";

/** Start "Continue with Discord". ?link=1 attaches Discord to the signed-in account instead of signing in. */
export async function GET(req: NextRequest) {
  if (!discordConfigured()) return NextResponse.redirect(new URL("/login?error=discord_off", req.url));
  const link = req.nextUrl.searchParams.get("link") === "1";
  const state = crypto.randomBytes(16).toString("hex") + (link ? ".link" : "");
  const store = await cookies();
  store.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return NextResponse.redirect(authorizeUrl(state));
}
