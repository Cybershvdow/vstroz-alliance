/* Parse YouTube / Twitch links into embeddable ids. Runs on server and client. */

export type ParsedMedia = { provider: "YOUTUBE" | "TWITCH"; embedId: string; kind: "video" | "clip" | "channel" };

export function parseMediaUrl(input: string): ParsedMedia | null {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^www\.|^m\./, "");

  // YouTube
  if (host === "youtube.com" || host === "youtube-nocookie.com") {
    const v = url.searchParams.get("v");
    if (v) return { provider: "YOUTUBE", embedId: v, kind: "video" };
    const m = url.pathname.match(/^\/(?:shorts|embed|live)\/([A-Za-z0-9_-]{6,})/);
    if (m) return { provider: "YOUTUBE", embedId: m[1], kind: "video" };
    return null;
  }
  if (host === "youtu.be") {
    const id = url.pathname.slice(1).split("/")[0];
    return id ? { provider: "YOUTUBE", embedId: id, kind: "video" } : null;
  }

  // Twitch
  if (host === "twitch.tv") {
    const vid = url.pathname.match(/^\/videos\/(\d+)/);
    if (vid) return { provider: "TWITCH", embedId: vid[1], kind: "video" };
    const clip = url.pathname.match(/^\/(?:[^/]+\/)?clip\/([A-Za-z0-9_-]+)/);
    if (clip) return { provider: "TWITCH", embedId: clip[1], kind: "clip" };
    const chan = url.pathname.match(/^\/([A-Za-z0-9_]{3,25})\/?$/);
    if (chan) return { provider: "TWITCH", embedId: chan[1], kind: "channel" };
    return null;
  }
  if (host === "clips.twitch.tv") {
    const id = url.pathname.slice(1).split("/")[0];
    return id ? { provider: "TWITCH", embedId: id, kind: "clip" } : null;
  }
  return null;
}

/** Build the iframe src. `parent` is the site hostname, required by Twitch embeds. */
export function embedSrc(m: { provider: string; embedId: string; kind?: string }, parent: string, autoplay = false) {
  if (m.provider === "YOUTUBE") {
    return `https://www.youtube-nocookie.com/embed/${m.embedId}?rel=0&modestbranding=1${autoplay ? "&autoplay=1" : ""}`;
  }
  const p = `parent=${encodeURIComponent(parent)}&autoplay=${autoplay ? "true" : "false"}`;
  const kind = m.kind ?? (/^\d+$/.test(m.embedId) ? "video" : m.embedId.length > 25 || m.embedId.includes("-") ? "clip" : "channel");
  if (kind === "video") return `https://player.twitch.tv/?video=${m.embedId}&${p}`;
  if (kind === "clip") return `https://clips.twitch.tv/embed?clip=${m.embedId}&${p}`;
  return `https://player.twitch.tv/?channel=${m.embedId}&${p}`;
}

export function thumbnailFor(m: { provider: string; embedId: string }) {
  if (m.provider === "YOUTUBE") return `https://i.ytimg.com/vi/${m.embedId}/hqdefault.jpg`;
  return null;
}
