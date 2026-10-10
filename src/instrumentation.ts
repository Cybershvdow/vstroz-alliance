/** Runs once when the server starts. Keeps the website in step with the Discord server every few minutes. */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { discordSyncConfigured, reconcileDiscord } = await import("@/lib/discord");
  if (!discordSyncConfigured()) return;
  const g = globalThis as unknown as { __vztDiscordTimer?: ReturnType<typeof setInterval> };
  if (g.__vztDiscordTimer) return;
  const run = () => reconcileDiscord().catch((e) => console.error("[discord] sync failed", e));
  setTimeout(run, 20_000);
  g.__vztDiscordTimer = setInterval(run, 5 * 60_000);
  console.log("[discord] membership sync scheduled every 5 minutes");
}
