"use client";

import { useActionState } from "react";
import { nominateAction } from "@/lib/actions/ranks";
import { VOTED_TIERS, TIER_LABEL, VOTE_RULES } from "@/lib/constants";
import { Field, FormMessage } from "@/components/ui";
import { SubmitButton } from "./SubmitButton";

export function NominateForm({ members }: { members: { id: string; displayName: string; tier: string }[] }) {
  const [state, action] = useActionState(nominateAction, undefined);
  return (
    <form action={action} className="space-y-4" noValidate>
      <FormMessage state={state} />
      <Field label="Member" name="userId">
        <select id="userId" name="userId" className="input" defaultValue="" required>
          <option value="" disabled>
            Select a member…
          </option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.displayName} ({TIER_LABEL[m.tier as keyof typeof TIER_LABEL] ?? m.tier})
            </option>
          ))}
        </select>
      </Field>
      <Field label="Nominate for" name="tier">
        <select id="tier" name="tier" className="input" defaultValue={VOTED_TIERS[0]}>
          {VOTED_TIERS.map((t) => (
            <option key={t} value={t}>
              {TIER_LABEL[t]}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Case for promotion" name="reason" hint={`Voters read this. The vote stays open ${VOTE_RULES.windowHours} hours.`}>
        <textarea id="reason" name="reason" className="input min-h-24" placeholder="Attendance, performance, attitude, what they bring to the roster…" maxLength={1000} required />
      </Field>
      <SubmitButton pendingText="Opening vote…">Open vote</SubmitButton>
    </form>
  );
}
