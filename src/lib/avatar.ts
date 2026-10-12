/* Profile pictures. The image lives in the Avatar table; User.avatarAt says one exists and versions its URL. */

/** URL of a member's profile picture, or null when they have none (or their account is hidden after leaving the Discord). */
export function avatarUrl(u: { id: string; avatarAt?: Date | null; discordLeftAt?: Date | null } | null | undefined): string | null {
  if (!u?.avatarAt || u.discordLeftAt) return null;
  return `/api/avatar/${u.id}?v=${new Date(u.avatarAt).getTime()}`;
}

/** Stored size (square, pixels) and the largest upload the server accepts. The browser shrinks pictures before sending. */
export const AVATAR_SIZE = 256;
export const AVATAR_MAX_UPLOAD_BYTES = 900 * 1024;
/** The form sends at most 512x512; anything much larger is refused before it is decoded. */
export const AVATAR_MAX_INPUT_PIXELS = 1024 * 1024;

/* Profile banners work the same way: the Banner table holds the image, User.bannerAt says one exists. */

/** URL of a member's profile banner, or null when they have none (or their account is hidden). */
export function bannerUrl(u: { id: string; bannerAt?: Date | null; discordLeftAt?: Date | null } | null | undefined): string | null {
  if (!u?.bannerAt || u.discordLeftAt) return null;
  return `/api/banner/${u.id}?v=${new Date(u.bannerAt).getTime()}`;
}

/** Stored banner size (3:1). The browser crops and shrinks to this before sending. */
export const BANNER_WIDTH = 1500;
export const BANNER_HEIGHT = 500;
export const BANNER_MAX_UPLOAD_BYTES = 900 * 1024;
export const BANNER_MAX_INPUT_PIXELS = 1600 * 600;

/**
 * Identify a photo by its first bytes. This runs before any image library touches the upload, so formats with heavy
 * parsers (SVG, PDF, TIFF…) are turned away without being opened.
 */
export function sniffImageType(bytes: Uint8Array): "jpeg" | "png" | "gif" | "webp" | null {
  const at = (i: number) => bytes[i];
  const ascii = (from: number, text: string) => [...text].every((ch, i) => at(from + i) === ch.charCodeAt(0));
  if (bytes.length < 12) return null;
  if (at(0) === 0xff && at(1) === 0xd8 && at(2) === 0xff) return "jpeg";
  if (at(0) === 0x89 && ascii(1, "PNG") && at(4) === 0x0d && at(5) === 0x0a && at(6) === 0x1a && at(7) === 0x0a) return "png";
  if (ascii(0, "GIF87a") || ascii(0, "GIF89a")) return "gif";
  if (ascii(0, "RIFF") && ascii(8, "WEBP")) return "webp";
  return null;
}
