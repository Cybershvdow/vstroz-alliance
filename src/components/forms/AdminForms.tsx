"use client";

import { useActionState } from "react";
import { createMatchAction, createGuildRoleAction, createAnnouncementAction } from "@/lib/actions/admin";
import { GAMES, MATCH_TYPE, MATCH_TYPE_LABEL } from "@/lib/constants";
import { Field, FormMessage } from "@/components/ui";
import { SubmitButton } from "./SubmitButton";

export function CreateMatchForm() {
  const [state, action] = useActionState(createMatchAction, undefined);
  const err = state && !state.ok ? state.errors : undefined;
  return (
    <form action={action} className="space-y-4" noValidate>
      <FormMessage state={state} />
      <Field label="Title" name="title" error={err?.title}>
        <input id="title" name="title" className="input" placeholder="Fortress Siege — Upper Abyss" required />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Game" name="game" error={err?.game}>
          <select id="game" name="game" className="input" defaultValue={GAMES[0]}>
            {GAMES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Type" name="type" error={err?.type}>
          <select id="type" name="type" className="input" defaultValue="SIEGE">
            {MATCH_TYPE.map((t) => (
              <option key={t} value={t}>
                {MATCH_TYPE_LABEL[t]}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Starts at (UTC)" name="startsAt" error={err?.startsAt}>
          <input id="startsAt" name="startsAt" type="datetime-local" className="input" required />
        </Field>
        <Field label="Max players (optional)" name="maxPlayers" error={err?.maxPlayers}>
          <input id="maxPlayers" name="maxPlayers" type="number" min={1} className="input" placeholder="48" />
        </Field>
      </div>
      <Field label="Description" name="description" error={err?.description}>
        <textarea id="description" name="description" className="input min-h-24" placeholder="Briefing, requirements, voice channel…" />
      </Field>
      <label className="flex items-center gap-3 text-sm text-muted">
        <input type="checkbox" name="isPublic" defaultChecked className="h-4 w-4 accent-[#ff5a1f]" />
        Show on the public schedule
      </label>
      <SubmitButton pendingText="Creating…">Create match</SubmitButton>
    </form>
  );
}

export function CreateRoleForm() {
  const [state, action] = useActionState(createGuildRoleAction, undefined);
  const err = state && !state.ok ? state.errors : undefined;
  return (
    <form action={action} className="space-y-4" noValidate>
      <FormMessage state={state} />
      <Field label="Role name" name="name" error={err?.name}>
        <input id="name" name="name" className="input" placeholder="Class Lead — Templar" required />
      </Field>
      <Field label="Description" name="roleDescription" error={err?.description}>
        <textarea id="roleDescription" name="description" className="input min-h-20" placeholder="What this role owns and expects." />
      </Field>
      <Field label="Slots" name="slots" error={err?.slots}>
        <input id="slots" name="slots" type="number" min={1} defaultValue={1} className="input" />
      </Field>
      <SubmitButton pendingText="Creating…">Create role</SubmitButton>
    </form>
  );
}

export function AnnouncementForm() {
  const [state, action] = useActionState(createAnnouncementAction, undefined);
  const err = state && !state.ok ? state.errors : undefined;
  return (
    <form action={action} className="space-y-4" noValidate>
      <FormMessage state={state} />
      <Field label="Title" name="annTitle" error={err?.title}>
        <input id="annTitle" name="title" className="input" required />
      </Field>
      <Field label="Body" name="body" error={err?.body}>
        <textarea id="body" name="body" className="input min-h-28" required />
      </Field>
      <label className="flex items-center gap-3 text-sm text-muted">
        <input type="checkbox" name="pinned" className="h-4 w-4 accent-[#ff5a1f]" />
        Pin to the top of the portal
      </label>
      <SubmitButton pendingText="Posting…">Post announcement</SubmitButton>
    </form>
  );
}
