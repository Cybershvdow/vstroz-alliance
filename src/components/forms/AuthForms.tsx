"use client";

import Link from "next/link";
import { startTransition, useActionState } from "react";
import { registerAction, loginAction } from "@/lib/actions/auth";
import { Button, Field, FormMessage } from "@/components/ui";
import { SubmitButton } from "./SubmitButton";

/** Creates the account. That alone makes someone a community member; the legion is applied for from inside the account. */
export function RegisterForm() {
  const [state, formAction, pending] = useActionState(registerAction, undefined);
  const err = state && !state.ok ? state.errors : undefined;

  return (
    <form
      action={formAction}
      // Submitting through startTransition keeps what was typed if validation fails.
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => formAction(fd));
      }}
      className="space-y-5"
      noValidate
    >
      <FormMessage state={state} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Username" name="username" error={err?.username} hint="Letters, numbers, underscores.">
          <input id="username" name="username" className="input" autoComplete="username" required aria-invalid={!!err?.username} />
        </Field>
        <Field label="Display name" name="displayName" error={err?.displayName} hint="Shown on the roster and your profile.">
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
      <Field label="Discord username (optional)" name="discord" error={err?.discord} hint="Shown on your profile so people can find you.">
        <input id="discord" name="discord" className="input" placeholder="yourname" />
      </Field>

      <div>
        <label
          htmlFor="ageConfirm"
          className={`flex cursor-pointer items-start gap-3 border bg-bg-2 p-3 text-sm has-[:checked]:border-accent has-[:checked]:bg-accent/10 ${err?.ageConfirm ? "border-danger" : "border-line-strong"}`}
        >
          <input
            id="ageConfirm"
            type="checkbox"
            name="ageConfirm"
            value="yes"
            className="mt-0.5 accent-[#9b4dff]"
            required
            aria-invalid={!!err?.ageConfirm}
            aria-describedby={err?.ageConfirm ? "ageConfirm-error" : undefined}
          />
          <span>
            I am 18 or older and I have read the{" "}
            <Link href="/rules" className="text-text underline-offset-4 hover:underline" target="_blank">
              rules
            </Link>
            .
          </span>
        </label>
        {err?.ageConfirm && (
          <p id="ageConfirm-error" className="mt-1.5 text-xs text-danger">
            {err.ageConfirm[0]}
          </p>
        )}
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={pending} aria-busy={pending}>
        {pending ? "Creating account…" : "Create account"}
      </Button>

      <p className="text-center text-xs text-muted">
        Your account makes you part of the community. Joining the Aion legion is a separate step from inside your account.
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
