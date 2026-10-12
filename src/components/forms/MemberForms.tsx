"use client";

import { SOCIAL_PLATFORMS, type Socials } from "@/lib/social";
import { useActionState } from "react";
import { updateProfileAction, changePasswordAction } from "@/lib/actions/auth";
import { signupForMatchAction, applyForRoleAction } from "@/lib/actions/member";
import { POSITION } from "@/lib/constants";
import { Field, FormMessage } from "@/components/ui";
import { useFormDraft } from "@/lib/formDraft";
import { DraftNotice } from "./DraftNotice";
import { SubmitButton } from "./SubmitButton";

export function ProfileForm({
  initial,
}: {
  initial: { displayName: string; email: string; discord: string | null; socials: Socials };
}) {
  const [state, action] = useActionState(updateProfileAction, undefined);
  const [formRef, draft] = useFormDraft("account", state);
  const err = state && !state.ok ? state.errors : undefined;
  const fieldFor: Record<string, string> = { youtube: "socialYoutube", twitch: "socialTwitch", kick: "socialKick", tiktok: "socialTiktok", x: "socialX", instagram: "socialInstagram", facebook: "socialFacebook" };
  return (
    <form ref={formRef} action={action} className="space-y-5" noValidate>
      <DraftNotice draft={draft} />
      <FormMessage state={state} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Display name (what people see)" name="displayName" error={err?.displayName} hint="Shown on the roster, your profile, and your posts. Your gamer tag or the name people call you.">
          <input id="displayName" name="displayName" className="input" defaultValue={initial.displayName} required />
        </Field>
        <Field label="Email" name="email" error={err?.email} hint="You can sign in with it, and alliance emails go here. Never shown to other members.">
          <input id="email" name="email" type="email" className="input" defaultValue={initial.email} required />
        </Field>
      </div>
      <Field label="Discord username" name="discord" error={err?.discord} hint="Your handle in Discord (Settings, My Account). Shown on your profile so members can find you.">
        <input id="discord" name="discord" className="input" defaultValue={initial.discord ?? ""} />
      </Field>

      <fieldset className="border-t border-line pt-5">
        <legend className="label mb-1">Social links</legend>
        <p className="mb-4 text-xs text-dim">Paste a profile link or just your handle. They show as buttons on your public profile.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {SOCIAL_PLATFORMS.map((p) => {
            const name = fieldFor[p.key];
            return (
              <Field key={p.key} label={p.label} name={name} error={err?.[name]}>
                <input id={name} name={name} className="input" defaultValue={initial.socials[p.key] ?? ""} placeholder={p.placeholder} maxLength={200} />
              </Field>
            );
          })}
        </div>
      </fieldset>

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
  const [formRef, draft] = useFormDraft(`signup:${matchId}`, state);
  const err = state && !state.ok ? state.errors : undefined;
  return (
    <form ref={formRef} action={action} className="space-y-4" noValidate>
      <DraftNotice draft={draft} />
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
  const [formRef, draft] = useFormDraft(`role:${roleId}`, state);
  const err = state && !state.ok ? state.errors : undefined;
  return (
    <form ref={formRef} action={action} className="space-y-4" noValidate>
      <DraftNotice draft={draft} />
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
