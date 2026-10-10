"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { APEX_PLATFORMS, apexConfigured, fetchApexStats } from "@/lib/apex";
import { AVATAR_MAX_UPLOAD_BYTES, AVATAR_SIZE } from "@/lib/avatar";
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

/**
 * Save the member's profile picture. The browser sends a small square JPEG; whatever arrives is decoded and
 * re-encoded here to a `AVATAR_SIZE` WebP, so only a real, clean image is ever stored or served.
 */
export async function saveAvatarAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) return { ok: false, message: "Choose a picture first." };
  if (file.size > AVATAR_MAX_UPLOAD_BYTES) return { ok: false, message: "That picture is too large. Try a smaller one." };

  let image: Uint8Array<ArrayBuffer>;
  try {
    const sharp = (await import("sharp")).default;
    const input = Buffer.from(await file.arrayBuffer());
    // Photos only. Anything else the decoder understands (SVG, PDF pages, TIFF…) is refused before it is rendered.
    const { format } = await sharp(input, { limitInputPixels: 4096 * 4096 }).metadata();
    if (!format || !["jpeg", "png", "webp", "gif"].includes(format)) throw new Error("unsupported format");
    const out = await sharp(input, { failOn: "error", limitInputPixels: 4096 * 4096 })
      .rotate() // honour the camera's orientation, then drop the metadata
      .resize(AVATAR_SIZE, AVATAR_SIZE, { fit: "cover", position: "centre" })
      .flatten({ background: "#0b0a10" })
      .webp({ quality: 82 })
      .toBuffer();
    image = new Uint8Array(out);
  } catch {
    return { ok: false, message: "That file is not a picture we can read. Use a JPG, PNG, or WebP." };
  }

  await db.$transaction([
    db.avatar.upsert({ where: { userId: me.id }, create: { userId: me.id, data: image, mime: "image/webp" }, update: { data: image, mime: "image/webp" } }),
    db.user.update({ where: { id: me.id }, data: { avatarAt: new Date() } }),
  ]);
  revalidatePath("/", "layout");
  return { ok: true, message: "Profile picture updated." };
}

/** Remove the member's profile picture; their initials show again. */
export async function removeAvatarAction(): Promise<ActionState> {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  await db.$transaction([db.avatar.deleteMany({ where: { userId: me.id } }), db.user.update({ where: { id: me.id }, data: { avatarAt: null } })]);
  revalidatePath("/", "layout");
  return { ok: true, message: "Profile picture removed." };
}
