"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registerAction, loginAction } from "@/lib/actions/auth";
import { PLAYTIME_OPTIONS, PLAYER_TYPES, INTEREST_OPTIONS } from "@/lib/constants";
import { GameQuestions } from "./GameQuestions";
import { Field, FormMessage } from "@/components/ui";
import { SubmitButton } from "./SubmitButton";

const playerTypeHelp: Record<(typeof PLAYER_TYPES)[number], string> = {
  Casual: "A few sessions a week, here for the people.",
  Softcore: "Regular play, shows up for events, no pressure.",
  Hardcore: "Daily grind, gear-focused, wants every siege.",
  Competitive: "Top-end PvP and rankings. Voice, builds, discipline.",
};

export function RegisterForm() {
  const [state, action] = useActionState(registerAction, undefined);
  const err = state && !state.ok ? state.errors : undefined;

  return (
    <form action={action} className="space-y-8" noValidate>
      <FormMessage state={state} />

      {/* ---------- 1. Account ---------- */}
      <section className="space-y-5">
        <p className="eyebrow">1 · Your account</p>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Username" name="username" error={err?.username} hint="Letters, numbers, underscores.">
            <input id="username" name="username" className="input" autoComplete="username" required aria-invalid={!!err?.username} />
          </Field>
          <Field label="Display name" name="displayName" error={err?.displayName} hint="Shown on the roster.">
            <input id="displayName" name="displayName" className="input" required aria-invalid={!!err?.displayName} />
          </Field>
        </div>
        <Field label="Email" name="email" error={err?.email}>
          <input id="email" name="email" type="email" className="input" autoComplete="email" required aria-invalid={!!err?.email} />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Password" name="password" error={err?.password} hint="At least 8 characters.">
            <input id="password" name="password" type="password" className="input" autoComplete="new-password" required aria-invalid={!!err?.password} />
          </Field>
          <Field label="Confirm password" name="confirmPassword" error={err?.confirmPassword}>
            <input id="confirmPassword" name="confirmPassword" type="password" className="input" autoComplete="new-password" required aria-invalid={!!err?.confirmPassword} />
          </Field>
        </div>
        <Field label="Discord username" name="discord" error={err?.discord} hint="So an officer can reach you after review.">
          <input id="discord" name="discord" className="input" placeholder="yourname" />
        </Field>
      </section>

      {/* ---------- 2. About you as a player ---------- */}
      <section className="space-y-5 border-t border-line pt-6">
        <p className="eyebrow">2 · About you as a player</p>

        <Field label="How long have you been playing MMOs?" name="playtime" error={err?.playtime}>
          <select id="playtime" name="playtime" className="input" defaultValue="" required aria-invalid={!!err?.playtime}>
            <option value="" disabled>
              Select…
            </option>
            {PLAYTIME_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </Field>

        <fieldset>
          <legend className="label mb-2">What type of player are you?</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {PLAYER_TYPES.map((t) => (
              <label key={t} className="flex cursor-pointer items-start gap-3 border border-line-strong bg-bg-2 p-3 has-[:checked]:border-accent has-[:checked]:bg-accent/10">
                <input type="radio" name="playerType" value={t} className="mt-1 accent-[#9b4dff]" required />
                <span>
                  <span className="font-display text-base font-bold uppercase tracking-wider">{t}</span>
                  <span className="block text-xs text-muted">{playerTypeHelp[t]}</span>
                </span>
              </label>
            ))}
          </div>
          {err?.playerType && <p className="mt-1.5 text-xs text-danger">{err.playerType[0]}</p>}
        </fieldset>

        <fieldset>
          <legend className="label mb-2">What do you want to do in-game? (pick all that apply)</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {INTEREST_OPTIONS.map((o) => (
              <label key={o} className="flex cursor-pointer items-center gap-3 border border-line-strong bg-bg-2 px-3 py-2.5 has-[:checked]:border-accent has-[:checked]:bg-accent/10">
                <input type="checkbox" name="interests" value={o} className="accent-[#9b4dff]" />
                <span className="text-sm">{o}</span>
              </label>
            ))}
          </div>
          {err?.interests && <p className="mt-1.5 text-xs text-danger">{err.interests[0]}</p>}
        </fieldset>

        <Field label="What other games do you play?" name="games" error={err?.games} hint="Anything else you play now or used to play seriously.">
          <input id="games" name="games" className="input" placeholder="e.g. Aion, Throne and Liberty, Valorant" maxLength={300} />
        </Field>
      </section>

      {/* ---------- 3. Your game ---------- */}
      <section className="space-y-5 border-t border-line pt-6">
        <p className="eyebrow">3 · Your game</p>
        <p className="-mt-3 text-sm text-muted">Pick the game you are applying for. The questions change to fit that game.</p>
        <GameQuestions errors={err} />
      </section>

      {/* ---------- 4. Comments ---------- */}
      <section className="space-y-5 border-t border-line pt-6">
        <p className="eyebrow">4 · Anything else</p>
        <Field label="Comments" name="applicationNote" error={err?.applicationNote} hint="Availability, past guilds, why Vstroz, anything you want officers to know.">
          <textarea id="applicationNote" name="applicationNote" className="input min-h-28" maxLength={1000} />
        </Field>
      </section>

      <SubmitButton size="lg" className="w-full" pendingText="Submitting…">
        Submit application
      </SubmitButton>

      <p className="text-center text-sm text-muted">
        Already a member?{" "}
        <Link href="/login" className="text-text underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useActionState(loginAction, undefined);
  const err = state && !state.ok ? state.errors : undefined;

  return (
    <form action={action} className="space-y-5" noValidate>
      <FormMessage state={state} />
      {next && <input type="hidden" name="next" value={next} />}
      <Field label="Username or email" name="identifier" error={err?.identifier}>
        <input id="identifier" name="identifier" className="input" autoComplete="username" required autoFocus />
      </Field>
      <Field label="Password" name="password" error={err?.password}>
        <input id="password" name="password" type="password" className="input" autoComplete="current-password" required />
      </Field>
      <SubmitButton size="lg" className="w-full" pendingText="Signing in…">
        Sign in
      </SubmitButton>
      <p className="text-center text-sm text-muted">
        Not a member yet?{" "}
        <Link href="/register" className="text-text underline-offset-4 hover:underline">
          Apply to join
        </Link>
      </p>
    </form>
  );
}
