"use client";

import { useActionState } from "react";
import { raiseDisputeAction, requestTryoutAction, submitMediaAction } from "@/lib/actions/community";
import { ENABLED_GAMES } from "@/lib/constants";
import { Field, FormMessage } from "@/components/ui";
import { SubmitButton } from "./SubmitButton";

export function DisputeForm({ members }: { members: { id: string; displayName: string }[] }) {
  const [state, action] = useActionState(raiseDisputeAction, undefined);
  const err = state && !state.ok ? state.errors : undefined;
  return (
    <form action={action} className="space-y-4" noValidate>
      <FormMessage state={state} />
      <Field label="Subject" name="subject" error={err?.subject}>
        <input id="subject" name="subject" className="input" placeholder="e.g. No-show on Saturday siege" maxLength={120} required />
      </Field>
      <Field label="About a member (optional)" name="againstUserId">
        <select id="againstUserId" name="againstUserId" className="input" defaultValue="">
          <option value="">Not about a specific member</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.displayName}
            </option>
          ))}
        </select>
      </Field>
      <Field label="What happened" name="details" error={err?.details} hint="Facts, dates, who was there. Officers read this and record a decision.">
        <textarea id="details" name="details" className="input min-h-28" maxLength={3000} required />
      </Field>
      <SubmitButton pendingText="Sending…">Bring it to The Round Table</SubmitButton>
    </form>
  );
}

export function TryoutForm() {
  const [state, action] = useActionState(requestTryoutAction, undefined);
  const err = state && !state.ok ? state.errors : undefined;
  return (
    <form action={action} className="space-y-4" noValidate>
      <FormMessage state={state} />
      <Field label="Game" name="tryout-game" error={err?.game}>
        <select id="tryout-game" name="game" className="input" defaultValue={ENABLED_GAMES[0]?.name ?? ""}>
          {ENABLED_GAMES.map((g) => (
            <option key={g.name} value={g.name}>
              {g.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Why you" name="tryout-message" error={err?.message} hint="Role, rank, what you bring. Mic is required for competitive play.">
        <textarea id="tryout-message" name="message" className="input min-h-24" maxLength={1000} required />
      </Field>
      <SubmitButton pendingText="Requesting…">Request a tryout</SubmitButton>
    </form>
  );
}

export function MediaForm() {
  const [state, action] = useActionState(submitMediaAction, undefined);
  const err = state && !state.ok ? state.errors : undefined;
  return (
    <form action={action} className="space-y-4" noValidate>
      <FormMessage state={state} />
      <Field label="Title" name="media-title" error={err?.title}>
        <input id="media-title" name="title" className="input" placeholder="Fortress siege highlights" maxLength={120} required />
      </Field>
      <Field label="YouTube or Twitch link" name="media-url" error={err?.url} hint="Videos, Shorts, Twitch VODs, clips, or a channel.">
        <input id="media-url" name="url" className="input" placeholder="https://youtube.com/watch?v=…" required />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Game (optional)" name="media-game">
          <select id="media-game" name="game" className="input" defaultValue="">
            <option value="">—</option>
            {ENABLED_GAMES.map((g) => (
              <option key={g.name} value={g.name}>
                {g.name}
              </option>
            ))}
            <option value="Other">Other</option>
          </select>
        </Field>
      </div>
      <Field label="Description (optional)" name="media-description">
        <textarea id="media-description" name="description" className="input min-h-20" maxLength={1000} />
      </Field>
      <SubmitButton pendingText="Submitting…">Post content</SubmitButton>
    </form>
  );
}
