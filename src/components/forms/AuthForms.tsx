"use client";

import Link from "next/link";
import { startTransition, useActionState } from "react";
import { registerAction, loginAction } from "@/lib/actions/auth";
import { Button, Field, FormMessage } from "@/components/ui";
import { useFormDraft } from "@/lib/formDraft";
import { DraftNotice } from "./DraftNotice";
import { SubmitButton } from "./SubmitButton";

/** Creates the account. That alone makes someone an alliance member with the Recruit rank; the legion is applied for from inside the account. */
export function RegisterForm() {
  const [state, formAction, pending] = useActionState(registerAction, undefined);
  const [formRef, draft] = useFormDraft("register", state);
  const err = state && !state.ok ? state.errors : undefined;

  return (
    <form
      ref={formRef}
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
      <DraftNotice draft={draft} />
      <FormMessage state={state} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Username (for signing in)"
          name="username"
          error={err?.username}
          hint="A new name you make up for this website. You sign in with it and it becomes your profile link (vstrozalliance.com/members/yourname). 3 to 20 letters, numbers, or underscores, no spaces. It does not have to match your Discord."
        >
          <input id="username" name="username" className="input" autoComplete="username" placeholder="e.g. nightraven_07" required aria-invalid={!!err?.username} />
        </Field>
        <Field
          label="Display name (what people see)"
          name="displayName"
          error={err?.displayName}
          hint="The name shown on the roster, your profile, and your posts. Use your gamer tag or the name people call you in Discord. Spaces and capitals are fine, and you can change it later."
        >
          <input id="displayName" name="displayName" className="input" placeholder="e.g. Night Raven" required aria-invalid={!!err?.displayName} />
        </Field>
      </div>
      <Field label="Email" name="email" error={err?.email} hint="Your own email address. You can also sign in with it. It is never shown to other members.">
        <input id="email" name="email" type="email" className="input" autoComplete="email" placeholder="you@example.com" required aria-invalid={!!err?.email} />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Password" name="password" error={err?.password} hint="Make a new password just for this website, at least 8 characters. Not your Discord password.">
          <input id="password" name="password" type="password" className="input" autoComplete="new-password" required aria-invalid={!!err?.password} />
        </Field>
        <Field label="Confirm password" name="confirmPassword" error={err?.confirmPassword} hint="Type the same password again.">
          <input id="confirmPassword" name="confirmPassword" type="password" className="input" autoComplete="new-password" required aria-invalid={!!err?.confirmPassword} />
        </Field>
      </div>
      <Field
        label="Discord username (optional)"
        name="discord"
        error={err?.discord}
        hint="Your handle in Discord, the one under your name in Discord's Settings, My Account. Shown on your profile so members can find you."
      >
        <input id="discord" name="discord" className="input" placeholder="e.g. nightraven" />
      </Field>

      <div>
        <label
          htmlFor="ageConfirm"
          className={`flex cursor-pointer items-start gap-3 border bg-bg-2 p-3 text-sm has-[:checked]:border-accent has-[:checked]:bg-accent/10 ${err?.ageConfirm ? "border-danger" : "border-line-strong"}`}
        >
          <input
            id="ageConfirm"
            type="checkbox"
            data-draft-skip
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
        Your account makes you a Member of the alliance. Once you are signed in you can add a profile picture and pick your games.
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
