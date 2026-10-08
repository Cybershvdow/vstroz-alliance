import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { isOfficer } from "@/lib/constants";

export const getCurrentUser = cache(async () => {
  const session = await getSession();
  if (!session?.userId) return null;
  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      username: true,
      email: true,
      displayName: true,
      ign: true,
      gameClass: true,
      playerType: true,
      games: true,
      discord: true,
      status: true,
      role: true,
      tier: true,
      title: true,
      reviewNote: true,
      createdAt: true,
    },
  });
  return user;
});

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

/** Any signed-in account (including pending). */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    // A valid session token whose user no longer exists would loop between /login and /dashboard
    // (the proxy sees a token, the layout sees no user). Clear the cookie via a route handler instead.
    const session = await getSession();
    redirect(session ? "/api/session/clear" : "/login");
  }
  return user;
}

/** Signed in AND approved by an officer. */
export async function requireApproved() {
  const user = await requireUser();
  if (user.status !== "APPROVED") redirect("/dashboard");
  return user;
}

/** Officer or Leader. */
export async function requireOfficer() {
  const user = await requireApproved();
  if (!isOfficer(user.role)) redirect("/dashboard");
  return user;
}

/** Leader only. */
export async function requireLeader() {
  const user = await requireApproved();
  if (user.role !== "LEADER") redirect("/admin");
  return user;
}
