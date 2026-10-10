"use client";

import { useActionState } from "react";
import { saveApexAccountAction } from "@/lib/actions/accounts";
import { Field, FormMessage } from "@/components/ui";
import { SubmitButton } from "./SubmitButton";

const PLATFORMS = [
  { key: "PC", label: "PC (EA / Steam)" },
  { key: "PS4", label: "PlayStation" },
  { key: "X1", label: "Xbox" },
];

/** Platform + EA/PSN/Xbox name. Saving pulls stats immediately. Clearing the name removes it. */
export function ApexAccountForm({ initial }: { initial: { platform: string | null; name: string | null } }) {
  const [state, action] = useActionState(saveApexAccountAction, undefined);
  const err = state && !state.ok ? state.errors : undefined;
  return (
    <form action={action} className="space-y-4" noValidate>
      <FormMessage state={state} />
      <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
        <Field label="Platform" name="apexPlatform" error={err?.apexPlatform}>
          <select id="apexPlatform" name="apexPlatform" className="input" defaultValue={initial.platform ?? "PC"}>
            {PLATFORMS.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Apex name" name="apexName" error={err?.apexName} hint="PC: your EA account name, even if you launch through Steam. Console: your PSN name or gamertag.">
          <input id="apexName" name="apexName" className="input" defaultValue={initial.name ?? ""} placeholder="EA / PSN / Xbox name" maxLength={40} />
        </Field>
      </div>
      <SubmitButton pendingText="Checking…" variant="secondary">
        {initial.name ? "Update & refresh stats" : "Save & pull stats"}
      </SubmitButton>
    </form>
  );
}
