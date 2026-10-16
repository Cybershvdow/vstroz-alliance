"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireOfficer } from "@/lib/auth";
import { discordSyncConfigured, reconcileDiscord } from "@/lib/discord";
import { syncDiscordRoles } from "@/lib/discordRoles";
import { site } from "@/lib/site";

/** "Sync now" in Command center. */
export async function syncDiscordAction() {
  await requireOfficer();
  if (!discordSyncConfigured()) redirect("/admin?discord=off");
  const r = await reconcileDiscord();
  // Then push every website profile's rank, guild rank and game tags to Discord straight away.
  const roles = site.discordRoleSync === "off" ? null : await syncDiscordRoles(site.discordRoleSync);
  revalidatePath("/", "layout");
  redirect(r.ok && (!roles || roles.ok) ? `/admin?discord=synced&removed=${r.removed}&restored=${r.restored}` : "/admin?discord=error");
}
