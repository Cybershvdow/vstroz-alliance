import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Serves a member's profile banner. Links carry ?v=<timestamp>, so a versioned URL can be cached for good.
 * Accounts hidden after leaving the Discord get a 404, the same as their profile page.
 */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const row = await db.banner.findFirst({ where: { userId: id, user: { discordLeftAt: null } }, select: { data: true, mime: true } });
  if (!row) return new Response(null, { status: 404 });
  const versioned = new URL(req.url).searchParams.has("v");
  return new Response(new Uint8Array(row.data), {
    headers: {
      "Content-Type": row.mime,
      "Content-Length": String(row.data.length),
      "Cache-Control": versioned ? "public, max-age=31536000, immutable" : "no-cache",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'",
    },
  });
}
