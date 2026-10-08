/* Member social links: accept a profile URL or a bare handle, store normalized https URLs as JSON on User.socials. Pure; runs on server and client. */

export const SOCIAL_PLATFORMS = [
  { key: "youtube", label: "YouTube", domains: ["youtube.com", "youtu.be"], placeholder: "@yourchannel or link", handleUrl: (h: string) => `https://www.youtube.com/@${h}` },
  { key: "twitch", label: "Twitch", domains: ["twitch.tv"], placeholder: "yourname or link", handleUrl: (h: string) => `https://www.twitch.tv/${h}` },
  { key: "tiktok", label: "TikTok", domains: ["tiktok.com"], placeholder: "@yourname or link", handleUrl: (h: string) => `https://www.tiktok.com/@${h}` },
  { key: "x", label: "X", domains: ["x.com", "twitter.com"], placeholder: "@yourname or link", handleUrl: (h: string) => `https://x.com/${h}` },
  { key: "instagram", label: "Instagram", domains: ["instagram.com"], placeholder: "@yourname or link", handleUrl: (h: string) => `https://www.instagram.com/${h}` },
] as const;

export type SocialKey = (typeof SOCIAL_PLATFORMS)[number]["key"];
export type Socials = Partial<Record<SocialKey, string>>;

/** Returns a normalized https URL, null when the field is empty, or an error message. */
export function normalizeSocial(key: SocialKey, raw: string): { url: string | null; error?: string } {
  const p = SOCIAL_PLATFORMS.find((x) => x.key === key);
  if (!p) return { url: null };
  const v = raw.trim();
  if (!v) return { url: null };
  if (/^https?:\/\//i.test(v)) {
    try {
      const u = new URL(v);
      const host = u.hostname.replace(/^www\.|^m\./, "");
      if (!p.domains.some((d) => host === d || host.endsWith("." + d))) return { url: null, error: `That is not a ${p.label} link` };
      u.protocol = "https:";
      return { url: u.toString() };
    } catch {
      return { url: null, error: "Enter a valid link" };
    }
  }
  const handle = v.replace(/^@/, "");
  if (!/^[A-Za-z0-9._-]{1,60}$/.test(handle)) return { url: null, error: `Enter your ${p.label} handle or profile link` };
  return { url: p.handleUrl(handle) };
}

export function parseSocials(json: string | null | undefined): Socials {
  if (!json) return {};
  try {
    const o = JSON.parse(json);
    return o && typeof o === "object" ? (o as Socials) : {};
  } catch {
    return {};
  }
}
