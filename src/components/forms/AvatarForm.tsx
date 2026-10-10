"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { removeAvatarAction, saveAvatarAction } from "@/lib/actions/accounts";
import { Button } from "@/components/ui";

const MAX_SOURCE_BYTES = 20 * 1024 * 1024; // what we are willing to open in the browser
const OUT = 512; // the browser sends a 512px square; the server stores 256px

/** Crop the picture to a centred square and shrink it, so even a large phone photo uploads in a moment. */
async function toSquareJpeg(file: File): Promise<Blob> {
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
  const side = Math.min(w, h);
  const out = Math.min(OUT, side);
  const canvas = document.createElement("canvas");
  canvas.width = out;
  canvas.height = out;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no canvas");
  ctx.fillStyle = "#0b0a10"; // see-through pictures get the site's dark background
  ctx.fillRect(0, 0, out, out);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, (w - side) / 2, (h - side) / 2, side, side, 0, 0, out, out);
  if ("close" in source) source.close();
  return new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("encode failed"))), "image/jpeg", 0.9));
}

/** Profile picture: choose, preview, save, or remove. */
export function AvatarForm({ name, current }: { name: string; current: string | null }) {
  const [pending, setPending] = useState<{ url: string; blob: Blob } | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, start] = useTransition();
  const input = useRef<HTMLInputElement>(null);
  const lastUrl = useRef<string | null>(null);

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
    setMessage(null);
    if (!file.type.startsWith("image/")) return setMessage({ ok: false, text: "That is not a picture. Choose a JPG, PNG, or WebP." });
    if (file.size > MAX_SOURCE_BYTES) return setMessage({ ok: false, text: "That picture is over 20 MB. Choose a smaller one." });
    try {
      const blob = await toSquareJpeg(file);
      if (lastUrl.current) URL.revokeObjectURL(lastUrl.current);
      const url = URL.createObjectURL(blob);
      lastUrl.current = url;
      setPending({ url, blob });
    } catch {
      setMessage({ ok: false, text: "This browser could not open that picture. Try a JPG or PNG." });
    }
  };

  const save = () => {
    if (!pending) return;
    const fd = new FormData();
    fd.set("avatar", pending.blob, "avatar.jpg");
    start(async () => {
      const r = await saveAvatarAction(undefined, fd);
      setMessage(r ? { ok: r.ok, text: r.message ?? (r.ok ? "Saved." : "Could not save that picture.") } : null);
      if (r?.ok) drop();
    });
  };

  const removeIt = () => {
    if (!window.confirm("Remove your profile picture?")) return;
    start(async () => {
      const r = await removeAvatarAction();
      setMessage(r ? { ok: r.ok, text: r.message ?? "" } : null);
    });
  };

  const shown = pending?.url ?? current;

  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
      <span className="relative inline-flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[radial-gradient(circle_at_30%_25%,#2a2440,#0f0e16)] font-display text-4xl font-bold uppercase ring-1 ring-line-strong">
        {shown ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shown} alt={pending ? "New picture preview" : "Your profile picture"} className="h-full w-full object-cover" />
        ) : (
          <span aria-hidden>{name.slice(0, 2)}</span>
        )}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap gap-2">
          {pending ? (
            <>
              <Button type="button" onClick={save} disabled={busy} aria-busy={busy}>
                {busy ? "Saving…" : "Save picture"}
              </Button>
              <Button type="button" variant="ghost" onClick={drop} disabled={busy}>
                Cancel
              </Button>
            </>
          ) : (
            <>
              {/* The file input sits inside the label so the button works with a click, a tap, or the keyboard. */}
              <label className="cut-sm inline-flex cursor-pointer items-center border border-gold/35 bg-white/[0.03] px-5 py-2.5 font-display text-sm font-bold uppercase tracking-[0.14em] text-text transition focus-within:border-gold focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent hover:border-gold/70">
                <input
                  ref={input}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="sr-only"
                  disabled={busy}
                  onChange={(e) => choose(e.target.files?.[0])}
                />
                {current ? "Change picture" : "Upload a picture"}
              </label>
              {current && (
                <Button type="button" variant="ghost" onClick={removeIt} disabled={busy}>
                  {busy ? "Removing…" : "Remove"}
                </Button>
              )}
            </>
          )}
        </div>
        <p className="mt-3 text-xs text-dim">
          {pending ? "This is how it will look. Save it to make it your picture." : "JPG, PNG, WebP, or GIF. It is cropped to a square and shown as a circle."}
        </p>
        {message && (
          <p role="status" className={`mt-2 text-sm ${message.ok ? "text-success" : "text-danger"}`}>
            {message.text}
          </p>
        )}
      </div>
    </div>
  );
}
