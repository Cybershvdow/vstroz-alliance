"use client";

import { useActionState, useState } from "react";
import { createPlaySessionAction } from "@/lib/actions/social";
import { ENABLED_GAMES } from "@/lib/constants";
import { Field, FormMessage } from "@/components/ui";
import { SubmitButton } from "./SubmitButton";

/** "I'm playing X at this time." The time is picked in the member's own time zone and sent as an exact instant. */
export function PlayForm({ games }: { games: string[] }) {
  const [state, action] = useActionState(createPlaySessionAction, undefined);
  const [when, setWhen] = useState("");
  const err = state && !state.ok ? state.errors : undefined;
  const list = [...games, ...ENABLED_GAMES.map((g) => g.name).filter((n) => !games.includes(n))];
  const instant = when && !Number.isNaN(new Date(when).getTime()) ? new Date(when).toISOString() : "";
  return (
    <form action={action} className="space-y-4" noValidate>
      <FormMessage state={state} />
      <Field label="Game" name="play-game" error={err?.game}>
        <select id="play-game" name="game" className="input" defaultValue={list[0]}>
          {list.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </Field>
      <Field label="When" name="play-when" error={err?.when} hint="Your local time. Everyone else sees it in theirs.">
        <input id="play-when" type="datetime-local" className="input" value={when} onChange={(e) => setWhen(e.target.value)} required />
        <input type="hidden" name="startsAt" value={instant} />
      </Field>
      <Field label="Note (optional)" name="play-note">
        <input id="play-note" name="note" className="input" maxLength={140} placeholder="e.g. Ranked, need two more" />
      </Field>
      <SubmitButton pendingText="Posting…">Post it</SubmitButton>
    </form>
  );
}

/** Shows an instant in the viewer's own time zone. */
export function LocalTime({ iso }: { iso: string }) {
  return (
    <time dateTime={iso} suppressHydrationWarning>
      {new Date(iso).toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
    </time>
  );
}
