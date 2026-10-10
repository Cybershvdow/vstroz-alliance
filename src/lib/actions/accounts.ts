"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { APEX_PLATFORMS, apexConfigured, fetchApexStats } from "@/lib/apex";
import type { ActionState } from "@/lib/validation";

function clean(v: FormDataEntryValue | null) {
  return typeof v === "string" ? v : "";
}

/** Save the member's Apex account (platform + name) and pull stats right away. */
export async function saveApexAccountAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  const platform = clean(formData.get("apexPlatform")).trim();
  const name = clean(formData.get("apexName")).trim().slice(0, 40);

  if (!name) {
    await db.user.update({ where: { id: me.id }, data: { apexPlatform: null, apexName: null, apexStats: null, apexStatsAt: null, apexError: null } });
    revalidatePath("/", "layout");
    return { ok: true, message: "Apex account removed from your profile." };
  }
  if (!APEX_PLATFORMS.some((p) => p.key === platform)) return { ok: false, errors: { apexPlatform: ["Pick a platform"] } };
  if (!/^[A-Za-z0-9 _.\-#]{2,40}$/.test(name)) return { ok: false, errors: { apexName: ["Letters, numbers, spaces, _ . - # only"] } };

  if (!apexConfigured()) {
    await db.user.update({ where: { id: me.id }, data: { apexPlatform: platform, apexName: name, apexError: null } });
    revalidatePath("/", "layout");
    return { ok: true, message: "Saved. Stats start showing once the Apex stats key is set up." };
  }

  const r = await fetchApexStats(platform, name);
  await db.user.update({
    where: { id: me.id },
    data: {
      apexPlatform: platform,
      apexName: name,
      apexStats: r.stats ? JSON.stringify(r.stats) : null,
      apexStatsAt: new Date(),
      apexError: r.error ?? null,
    },
  });
  revalidatePath("/", "layout");
  if (r.error) return { ok: false, errors: { apexName: [r.error] }, message: "Saved the name, but no stats yet." };
  return { ok: true, message: `Found ${r.stats?.name}: level ${r.stats?.level ?? "?"}${r.stats?.rankName ? `, ${r.stats.rankName}` : ""}. Stats refresh every 15 minutes.` };
}

/** Unlink Steam from the member's account. */
export async function unlinkSteamAction() {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  await db.user.update({
    where: { id: me.id },
    data: { steamId: null, steamName: null, steamAvatar: null, steamLinkedAt: null, steamStats: null, steamStatsAt: null },
  });
  revalidatePath("/", "layout");
  redirect("/dashboard/profile?steam=unlinked");
}
