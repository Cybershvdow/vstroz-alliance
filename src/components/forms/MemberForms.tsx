"use client";

import { useActionState } from "react";
import { updateProfileAction, changePasswordAction } from "@/lib/actions/auth";
import { signupForMatchAction, applyForRoleAction } from "@/lib/actions/member";
import { GAME_CLASSES, POSITION } from "@/lib/constants";
import { Field, FormMessage } from "@/components/ui";
import { SubmitButton } from "./SubmitButton";

export function ProfileForm({
  initial,
}: {
  initial: { displayName: string; ign: string | null; gameClass: string | null; discord: string | null };
}) {
  const [state, action] = useActionState(updateProfileAction, undefined);
  const err = state && !state.ok ? state.errors : undefined;
  return (
    <form action={action} className="space-y-5" noValidate>
      <FormMessage state={state} />
      <Field label="Display name" name="displayName" error={err?.displayName}>
        <input id="displayName" name="displayName" className="input" defaultValue={initial.displayName} required />
      </Field>
      <div className="grid gap-5 sm:grid-cols-3">
        <Field label="In-game name" name="ign" error={err?.ign}>
          <input id="ign" name="ign" className="input" defaultValue={initial.ign ?? ""} />
        </Field>
        <Field label="Main class" name="gameClass" error={err?.gameClass}>
          <select id="gameClass" name="gameClass" className="input" defaultValue={initial.gameClass ?? ""}>
            <option value="">Select…</option>
            {GAME_CLASSES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Discord" name="discord" error={err?.discord}>
          <input id="discord" name="discord" className="input" defaultValue={initial.discord ?? ""} />
        </Field>
      </div>
      <SubmitButton pendingText="Saving…">Save profile</SubmitButton>
    </form>
  );
}

export function PasswordForm() {
  const [state, action] = useActionState(changePasswordAction, undefined);
  const err = state && !state.ok ? state.errors : undefined;
  return (
    <form action={action} className="space-y-5" noValidate>
      <FormMessage state={state} />
      <Field label="Current password" name="currentPassword" error={err?.currentPassword}>
        <input id="currentPassword" name="currentPassword" type="password" className="input" autoComplete="current-password" required />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="New password" name="newPassword" error={err?.newPassword}>
          <input id="newPassword" name="newPassword" type="password" className="input" autoComplete="new-password" required />
        </Field>
        <Field label="Confirm new password" name="confirmPassword" error={err?.confirmPassword}>
          <input id="confirmPassword" name="confirmPassword" type="password" className="input" autoComplete="new-password" required />
        </Field>
      </div>
      <SubmitButton variant="secondary" pendingText="Updating…">
        Update password
      </SubmitButton>
    </form>
  );
}

export function MatchSignupForm({
  matchId,
  existing,
  defaultPosition,
}: {
  matchId: string;
  existing?: { position: string; note: string | null } | null;
  defaultPosition?: string;
}) {
  const [state, action] = useActionState(signupForMatchAction, undefined);
  const err = state && !state.ok ? state.errors : undefined;
  return (
    <form action={action} className="space-y-4" noValidate>
      <FormMessage state={state} />
      <input type="hidden" name="matchId" value={matchId} />
      <Field label="Position" name="position" error={err?.position}>
        <select id="position" name="position" className="input" defaultValue={existing?.position ?? defaultPosition ?? "DPS"}>
          {POSITION.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Note for officers (optional)" name="note" error={err?.note}>
        <input id="note" name="note" className="input" defaultValue={existing?.note ?? ""} placeholder="e.g. can swap to healer if needed" maxLength={300} />
      </Field>
      <SubmitButton pendingText="Saving…">{existing ? "Update signup" : "Sign up"}</SubmitButton>
    </form>
  );
}

export function RoleApplyForm({ roleId }: { roleId: string }) {
  const [state, action] = useActionState(applyForRoleAction, undefined);
  const err = state && !state.ok ? state.errors : undefined;
  return (
    <form action={action} className="space-y-4" noValidate>
      <FormMessage state={state} />
      <input type="hidden" name="roleId" value={roleId} />
      <Field label="Why you?" name={`message-${roleId}`} error={err?.message}>
        <textarea id={`message-${roleId}`} name="message" className="input min-h-24" placeholder="Experience, availability, what you'd change." maxLength={1000} />
      </Field>
      <SubmitButton size="sm" pendingText="Sending…">
        Apply for role
      </SubmitButton>
    </form>
  );
}
