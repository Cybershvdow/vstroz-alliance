"use client";

import { useActionState } from "react";
import { requestPollAction } from "@/lib/actions/social";
import { Field, FormMessage } from "@/components/ui";
import { SubmitButton } from "./SubmitButton";

/** Ask for a vote: the question, up to four answers, and how long it runs. */
export function PollForm({ officer }: { officer: boolean }) {
  const [state, action] = useActionState(requestPollAction, undefined);
  const err = state && !state.ok ? state.errors : undefined;
  return (
    <form action={action} className="space-y-4" noValidate>
      <FormMessage state={state} />
      <Field label="Question" name="poll-question" error={err?.question}>
        <input id="poll-question" name="question" className="input" maxLength={300} placeholder="e.g. Should we start an Apex squad night?" required />
      </Field>
      <Field label="Answers" name="poll-option-0" error={err?.option} hint="Two to four. Leave the extra ones empty.">
        <div className="grid gap-2 sm:grid-cols-2">
          {["Yes", "No", "", ""].map((d, i) => (
            <input key={i} id={`poll-option-${i}`} name="option" aria-label={`Answer ${i + 1}`} className="input" maxLength={55} defaultValue={d} placeholder={`Answer ${i + 1}`} />
          ))}
        </div>
      </Field>
      <Field label="How long people can vote" name="poll-hours" error={err?.hours}>
        <select id="poll-hours" name="hours" className="input" defaultValue="48">
          <option value="24">1 day</option>
          <option value="48">2 days</option>
          <option value="72">3 days</option>
          <option value="168">1 week</option>
        </select>
      </Field>
      <SubmitButton pendingText="Sending…">{officer ? "Post the vote" : "Request the vote"}</SubmitButton>
    </form>
  );
}
