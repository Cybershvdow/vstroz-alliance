"use client";

import { useEffect } from "react";
import { clearDrafts, type FormDraft } from "@/lib/formDraft";

/** Shown inside a form when saved text was restored after a refresh. */
export function DraftNotice({ draft }: { draft: FormDraft }) {
  if (!draft.restored) return null;
  return (
    <p role="status" className="flex flex-wrap items-center justify-between gap-2 border border-line bg-bg-2 px-3 py-2 text-xs text-muted">
      <span>Picked up where you left off. Nothing is sent until you submit.</span>
      <button type="button" onClick={draft.discard} className="font-display font-bold uppercase tracking-[0.14em] text-gold transition hover:text-gold-bright">
        Start over
      </button>
    </p>
  );
}

/**
 * Drop one member's saved drafts once the thing they were for has been submitted (used on the page a form redirects to).
 * `scope` is the member's username, or "anon" for the signed-out sign-up form.
 * Also removes the marker query string so a later refresh does not clear a new draft.
 */
export function ClearDraft({ names, scope }: { names: string[]; scope: string }) {
  const joined = names.join("|");
  useEffect(() => {
    clearDrafts(joined.split("|"), scope);
    // Wait a tick so the app router has finished setting up history on a full page load.
    const t = window.setTimeout(() => {
      try {
        if (window.location.search) window.history.replaceState(null, "", window.location.pathname + window.location.hash);
      } catch {
        /* ignore */
      }
    }, 0);
    return () => window.clearTimeout(t);
  }, [joined, scope]);
  return null;
}
