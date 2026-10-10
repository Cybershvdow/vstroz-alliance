/* Profile pictures. The image lives in the Avatar table; User.avatarAt says one exists and versions its URL. */

/** URL of a member's profile picture, or null when they have not uploaded one. */
export function avatarUrl(u: { id: string; avatarAt?: Date | null } | null | undefined): string | null {
  if (!u?.avatarAt) return null;
  return `/api/avatar/${u.id}?v=${new Date(u.avatarAt).getTime()}`;
}

/** Stored size (square, pixels) and the largest upload the server accepts. The browser shrinks pictures before sending. */
export const AVATAR_SIZE = 256;
export const AVATAR_MAX_UPLOAD_BYTES = 900 * 1024;
