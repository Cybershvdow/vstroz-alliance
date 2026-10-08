"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registerAction, loginAction } from "@/lib/actions/auth";
import { Field, FormMessage } from "@/components/ui";
import { SubmitButton } from "./SubmitButton";

/** Step 1 of 2: the account. The player profile (game, in-game name, how they play) is filled in from inside the account. */
export function RegisterForm() {
  const [state, action] = useActionState(registerAction, undefined);
  const err = state && !state.ok ? state.errors : undefined;

  return (
    <form action={action} className="space-y-5" noValidate>
      <FormMessage state={state} />
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
      <Field label="Discord username (optional)" name="discord" error={err?.discord} hint="So an officer can reach you after review.">
        <input id="discord" name="discord" className="input" placeholder="yourname" />
      </Field>

      <label className="flex cursor-pointer items-start gap-3 border border-line-strong bg-bg-2 p-3 text-sm has-[:checked]:border-accent has-[:checked]:bg-accent/10">
        <input type="checkbox" name="ageConfirm" value="yes" className="mt-0.5 accent-[#9b4dff]" required />
        <span>
          I am 18 or older and I have read the{" "}
          <Link href="/rules" className="text-text underline-offset-4 hover:underline" target="_blank">
            rules
          </Link>
          .
        </span>
      </label>
      {err?.ageConfirm && <p className="-mt-3 text-xs text-danger">{err.ageConfirm[0]}</p>}

      <SubmitButton size="lg" className="w-full" pendingText="Creating account…">
        Create account
      </SubmitButton>

      <p className="text-center text-xs text-muted">
        Next: your player profile. Which game you play, your in-game name, and how you play. An officer reviews it and
        unlocks the member portal.
      </p>
      <p className="text-center text-sm text-muted">
        Already have an account?{" "}
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
          Create an account
        </Link>
      </p>
    </form>
  );
}
