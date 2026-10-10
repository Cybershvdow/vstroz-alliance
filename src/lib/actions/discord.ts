"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireOfficer } from "@/lib/auth";
import { discordSyncConfigured, reconcileDiscord } from "@/lib/discord";

/** "Sync now" in Command center. */
export async function syncDiscordAction() {
  await requireOfficer();
  if (!discordSyncConfigured()) redirect("/admin?discord=off");
  const r = await reconcileDiscord();
  revalidatePath("/", "layout");
  redirect(r.ok ? `/admin?discord=synced&removed=${r.removed}&restored=${r.restored}` : "/admin?discord=error");
}
