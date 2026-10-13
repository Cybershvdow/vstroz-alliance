"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { addCommentAction, deleteCommentAction, getReactionsAction, toggleLikeAction, type ClipReactions as Reactions } from "@/lib/actions/social";

/** Like button and comments under the clip that is playing. Loads fresh whenever the clip changes. */
export function ClipReactions({ postId }: { postId: string }) {
  const [data, setData] = useState<Reactions | null>(null);
  const [text, setText] = useState("");
  const [pending, start] = useTransition();

  useEffect(() => {
    let live = true;
    setData(null);
    setText("");
    getReactionsAction(postId)
      .then((r) => live && setData(r))
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [postId]);

  if (!data) return <p className="mt-5 text-xs text-dim">Loading reactions…</p>;
  const run = (fn: () => Promise<Reactions>) => start(async () => setData(await fn()));

  return (
    <div className="mt-5 border-t border-line pt-4">
      <div className="flex flex-wrap items-center gap-3">
        {data.signedIn ? (
          <button
            type="button"
            disabled={pending}
            aria-pressed={data.liked}
            onClick={() => run(() => toggleLikeAction(postId))}
            className={`cut-sm inline-flex min-h-11 items-center gap-2 border px-4 py-2 font-display text-xs font-bold uppercase tracking-[0.16em] transition ${data.liked ? "border-gold/70 bg-gold/15 text-gold" : "border-line-strong text-muted hover:border-gold/50 hover:text-text"}`}
          >
            <span aria-hidden>{data.liked ? "♥" : "♡"}</span> {data.liked ? "Liked" : "Like"}
          </button>
        ) : (
          <Link href="/login" className="cut-sm inline-flex min-h-11 items-center gap-2 border border-line-strong px-4 py-2 font-display text-xs font-bold uppercase tracking-[0.16em] text-muted transition hover:text-text">
            <span aria-hidden>♡</span> Sign in to like
          </Link>
        )}
        <span className="text-sm text-muted">
          {data.likes} {data.likes === 1 ? "like" : "likes"} · {data.comments.length} {data.comments.length === 1 ? "comment" : "comments"}
        </span>
      </div>

      {data.comments.length > 0 && (
        <ul className="mt-4 max-h-72 space-y-3 overflow-y-auto pr-1">
          {data.comments.map((c) => (
            <li key={c.id} className="text-sm">
              <p className="flex flex-wrap items-baseline gap-x-2">
                <Link href={`/members/${encodeURIComponent(c.username)}`} className="font-semibold text-text hover:text-gold">
                  {c.name}
                </Link>
                <span className="text-xs text-dim">{new Date(c.at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                {c.canDelete && (
                  <button type="button" disabled={pending} onClick={() => run(() => deleteCommentAction(c.id, postId))} className="text-xs text-dim underline underline-offset-2 hover:text-text">
                    Delete
                  </button>
                )}
              </p>
              <p className="mt-0.5 whitespace-pre-wrap text-muted [overflow-wrap:anywhere]">{c.body}</p>
            </li>
          ))}
        </ul>
      )}

      {data.signedIn && (
        <form
          className="mt-4 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const body = text.trim();
            if (!body) return;
            setText("");
            run(() => addCommentAction(postId, body));
          }}
        >
          <label className="sr-only" htmlFor={`comment-${postId}`}>
            Add a comment
          </label>
          <input id={`comment-${postId}`} value={text} onChange={(e) => setText(e.target.value)} maxLength={500} placeholder="Add a comment" className="input min-w-0 flex-1" />
          <button type="submit" disabled={pending || !text.trim()} className="cut-sm min-h-11 shrink-0 border border-gold/50 px-4 font-display text-xs font-bold uppercase tracking-[0.16em] text-gold transition hover:bg-gold/10 disabled:opacity-40">
            Post
          </button>
        </form>
      )}
    </div>
  );
}
