"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { APEX_PLATFORMS, apexConfigured, fetchApexStats } from "@/lib/apex";
import { AVATAR_MAX_INPUT_PIXELS, AVATAR_MAX_UPLOAD_BYTES, AVATAR_SIZE, BANNER_HEIGHT, BANNER_MAX_INPUT_PIXELS, BANNER_MAX_UPLOAD_BYTES, BANNER_WIDTH, sniffImageType } from "@/lib/avatar";
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
 * Save the member's profile picture. The browser sends a small square JPEG; whatever arrives is checked by its
 * first bytes, then decoded and re-encoded here to a 256px WebP, so only a real, clean photo is ever stored or served.
 */
export async function saveAvatarAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  if (me.discordLeftAt) return { ok: false, message: "Rejoin the Discord and sign in again before setting a picture." };
  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) return { ok: false, message: "Choose a picture first." };
  if (file.size > AVATAR_MAX_UPLOAD_BYTES) return { ok: false, message: "That picture is too large. Try a smaller one." };

  const NOT_A_PHOTO = "That file is not a picture we can read. Use a JPG, PNG, or WebP.";
  const input = Buffer.from(await file.arrayBuffer());
  // Photos only, decided from the file's own first bytes. Nothing else (SVG, PDF, TIFF…) reaches the image library.
  if (!sniffImageType(input)) return { ok: false, message: NOT_A_PHOTO };

  let image: Uint8Array<ArrayBuffer>;
  try {
    const sharp = (await import("sharp")).default;
    const out = await sharp(input, { failOn: "error", limitInputPixels: AVATAR_MAX_INPUT_PIXELS })
      .timeout({ seconds: 10 })
      .rotate() // honour the camera's orientation, then drop the metadata
      .resize(AVATAR_SIZE, AVATAR_SIZE, { fit: "cover", position: "centre" })
      .flatten({ background: "#0b0a10" })
      .webp({ quality: 82 })
      .toBuffer();
    image = new Uint8Array(out);
  } catch {
    return { ok: false, message: NOT_A_PHOTO };
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

/**
 * Save the member's profile banner. Same handling as the profile picture: checked by its first bytes, then decoded
 * and re-encoded here to a 1500x500 WebP, so only a real, clean photo is ever stored or served.
 */
export async function saveBannerAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  if (me.discordLeftAt) return { ok: false, message: "Rejoin the Discord and sign in again before setting a banner." };
  const file = formData.get("banner");
  if (!(file instanceof File) || file.size === 0) return { ok: false, message: "Choose an image first." };
  if (file.size > BANNER_MAX_UPLOAD_BYTES) return { ok: false, message: "That image is too large. Try a smaller one." };

  const NOT_A_PHOTO = "That file is not a picture we can read. Use a JPG, PNG, or WebP.";
  const input = Buffer.from(await file.arrayBuffer());
  if (!sniffImageType(input)) return { ok: false, message: NOT_A_PHOTO };

  let image: Uint8Array<ArrayBuffer>;
  try {
    const sharp = (await import("sharp")).default;
    const out = await sharp(input, { failOn: "error", limitInputPixels: BANNER_MAX_INPUT_PIXELS })
      .timeout({ seconds: 10 })
      .rotate()
      .resize(BANNER_WIDTH, BANNER_HEIGHT, { fit: "cover", position: "centre" })
      .flatten({ background: "#0b0a10" })
      .webp({ quality: 80 })
      .toBuffer();
    image = new Uint8Array(out);
  } catch {
    return { ok: false, message: NOT_A_PHOTO };
  }

  await db.$transaction([
    db.banner.upsert({ where: { userId: me.id }, create: { userId: me.id, data: image, mime: "image/webp" }, update: { data: image, mime: "image/webp" } }),
    db.user.update({ where: { id: me.id }, data: { bannerAt: new Date() } }),
  ]);
  revalidatePath("/", "layout");
  return { ok: true, message: "Banner updated." };
}

/** Remove the member's profile banner. */
export async function removeBannerAction(): Promise<ActionState> {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  await db.$transaction([db.banner.deleteMany({ where: { userId: me.id } }), db.user.update({ where: { id: me.id }, data: { bannerAt: null } })]);
  revalidatePath("/", "layout");
  return { ok: true, message: "Banner removed." };
}
