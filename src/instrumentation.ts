/** Runs once when the server starts. Keeps the website and the Discord server in step every few minutes. */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { discordSyncConfigured, reconcileDiscord } = await import("@/lib/discord");
  if (!discordSyncConfigured()) return;
  const g = globalThis as unknown as { __vztDiscordTimer?: ReturnType<typeof setInterval>; __vztRolePlanLogged?: boolean };
  if (g.__vztDiscordTimer) return;
  const { site } = await import("@/lib/site");
  const roles = async () => {
    if (site.discordRoleSync === "off") return;
    if (site.discordRoleSync === "dry" && g.__vztRolePlanLogged) return; // the plan only needs printing once
    const { syncDiscordRoles } = await import("@/lib/discordRoles");
    const r = await syncDiscordRoles(site.discordRoleSync, site.discordRoleSyncOnly.length ? site.discordRoleSyncOnly : undefined);
    g.__vztRolePlanLogged = true;
    if (!r.ok) return console.error(`[discord-roles] ${r.mode}: FAILED ${r.error}`);
    if (r.mode === "dry" || r.changes.length || r.rolesCreated.length || r.skipped.length) {
      console.log(`[discord-roles] ${r.mode}: ${r.members} members, ${r.matched} matched to a website account, ${r.changes.length} changes`);
      if (r.rolesCreated.length) console.log(`[discord-roles] roles ${r.mode === "dry" ? "to create" : "created"}: ${r.rolesCreated.join(", ")}`);
      for (const line of r.changes.slice(0, 300)) console.log(`[discord-roles] ${line}`);
      for (const line of r.skipped) console.log(`[discord-roles] SKIPPED ${line}`);
    }
  };
  const run = () =>
    reconcileDiscord()
      .then(roles)
      .then(async () => {
        const feed = await import("@/lib/feed");
        await feed.announceFeedLive();
        await feed.announceClipOfTheWeek();
      })
      .catch((e) => console.error("[discord] sync failed", e));
  setTimeout(run, 20_000);
  g.__vztDiscordTimer = setInterval(run, 5 * 60_000);
  console.log("[discord] membership sync scheduled every 5 minutes");
}
