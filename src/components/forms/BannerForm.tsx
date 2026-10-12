"use client";

import { startTransition, useEffect, useRef, useState, useTransition } from "react";
import { unstable_rethrow } from "next/navigation";
import { removeBannerAction, saveBannerAction } from "@/lib/actions/accounts";
import { Button } from "@/components/ui";

const MAX_SOURCE_BYTES = 25 * 1024 * 1024; // what we are willing to open in the browser
const MAX_SEND_BYTES = 850 * 1024; // stay under the server's limit
const W = 1500;
const OFFLINE = "Could not reach the server. Check your connection, or sign in again, then try once more.";

/** Crop the image to a centred 3:1 strip and shrink it, so even a large wallpaper uploads in a moment. */
async function toBannerJpeg(file: File): Promise<Blob> {
  let source: ImageBitmap | HTMLImageElement;
  try {
    source = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    source = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("unreadable"));
      };
      img.src = url;
    });
  }
  const w = source.width;
  const h = source.height;
  if (!w || !h) throw new Error("unreadable");
  // The widest 3:1 box that fits inside the picture, centred.
  const cropW = Math.min(w, h * 3);
  const cropH = cropW / 3;
  const outW = Math.min(W, Math.round(cropW));
  const outH = Math.round(outW / 3);
  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no canvas");
  ctx.fillStyle = "#0b0a10";
  ctx.fillRect(0, 0, outW, outH);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, (w - cropW) / 2, (h - cropH) / 2, cropW, cropH, 0, 0, outW, outH);
  if ("close" in source) source.close();
  const encode = (q: number) => new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("encode failed"))), "image/jpeg", q));
  // Busy images can come out large; step the quality down until the file fits.
  for (const q of [0.86, 0.75, 0.62, 0.5]) {
    const blob = await encode(q);
    if (blob.size <= MAX_SEND_BYTES) return blob;
  }
  throw new Error("too large");
}

/** Profile banner: choose, preview, save, or remove. */
export function BannerForm({ current }: { current: string | null }) {
  const [pending, setPending] = useState<{ url: string; blob: Blob } | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [busy, start] = useTransition();
  const input = useRef<HTMLInputElement>(null);
  const lastUrl = useRef<string | null>(null);
  const pick = useRef(0); // the latest file chosen; older decodes are ignored

  // Free the preview image when the form goes away.
  useEffect(
    () => () => {
      if (lastUrl.current) URL.revokeObjectURL(lastUrl.current);
    },
    [],
  );

  const drop = () => {
    if (lastUrl.current) URL.revokeObjectURL(lastUrl.current);
    lastUrl.current = null;
    setPending(null);
    if (input.current) input.current.value = "";
  };

  const choose = async (file: File | undefined) => {
    if (!file) return;
    const mine = ++pick.current;
    setMessage(null);
    if (!file.type.startsWith("image/")) return setMessage({ ok: false, text: "That is not a picture. Choose a JPG, PNG, or WebP." });
    if (file.size > MAX_SOURCE_BYTES) return setMessage({ ok: false, text: "That image is over 25 MB. Choose a smaller one." });
    setPreparing(true);
    try {
      const blob = await toBannerJpeg(file);
      if (mine !== pick.current) return;
      if (lastUrl.current) URL.revokeObjectURL(lastUrl.current);
      const url = URL.createObjectURL(blob);
      lastUrl.current = url;
      setPending({ url, blob });
    } catch {
      if (mine === pick.current) setMessage({ ok: false, text: "This browser could not open that image. Try a JPG or PNG (iPhone HEIC photos need converting first)." });
    } finally {
      if (mine === pick.current) setPreparing(false);
    }
  };

  const save = () => {
    if (!pending) return;
    const fd = new FormData();
    fd.set("banner", pending.blob, "banner.jpg");
    start(async () => {
      try {
        const r = await saveBannerAction(undefined, fd);
        startTransition(() => {
          setMessage(r ? { ok: r.ok, text: r.message ?? (r.ok ? "Saved." : "Could not save that image.") } : null);
          if (r?.ok) drop();
        });
      } catch (e) {
        unstable_rethrow(e); // a redirect to sign-in must still go through
        setMessage({ ok: false, text: OFFLINE });
      }
    });
  };

  const removeIt = () => {
    if (!window.confirm("Remove your profile banner?")) return;
    start(async () => {
      try {
        const r = await removeBannerAction();
        startTransition(() => setMessage(r ? { ok: r.ok, text: r.message ?? "" } : null));
      } catch (e) {
        unstable_rethrow(e);
        setMessage({ ok: false, text: OFFLINE });
      }
    });
  };

  const shown = pending?.url ?? current;

  return (
    <div>
      <div className="relative aspect-[3/1] w-full overflow-hidden border border-line-strong bg-[radial-gradient(circle_at_30%_25%,#2a2440,#0f0e16)]">
        {shown ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shown} alt={pending ? "New banner preview" : "Your profile banner"} className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-sm text-dim">No banner yet</span>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {pending ? (
          <>
            <Button type="button" onClick={save} disabled={busy} aria-busy={busy}>
              {busy ? "Saving…" : "Save banner"}
            </Button>
            <Button type="button" variant="ghost" onClick={drop} disabled={busy}>
              Cancel
            </Button>
          </>
        ) : (
          <>
            <label
              className={`cut-sm inline-flex items-center border border-gold/35 bg-white/[0.03] px-5 py-2.5 font-display text-sm font-bold uppercase tracking-[0.14em] text-text transition focus-within:border-gold focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent hover:border-gold/70 ${preparing || busy ? "pointer-events-none opacity-60" : "cursor-pointer"}`}
            >
              <input ref={input} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="sr-only" disabled={busy || preparing} onChange={(e) => choose(e.target.files?.[0])} />
              {preparing ? "Preparing…" : current ? "Change banner" : "Upload a banner"}
            </label>
            {current && (
              <Button type="button" variant="ghost" onClick={removeIt} disabled={busy || preparing}>
                Remove
              </Button>
            )}
          </>
        )}
      </div>
      <p aria-live="polite" className="mt-3 text-xs text-dim">
        {pending ? "Preview ready. This is how it will look across the top of your profile. Save it to keep it." : "JPG, PNG, WebP, or GIF. A wide image works best. It is cropped to a 3:1 strip from the middle."}
      </p>
      {message && (
        <p role="status" className={`mt-2 text-sm ${message.ok ? "text-success" : "text-danger"}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
