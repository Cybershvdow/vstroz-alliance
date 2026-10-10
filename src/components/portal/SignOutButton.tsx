"use client";

import { clearScope } from "@/lib/formDraft";

/** Sign-out submit button. Also drops the member's saved form drafts from this browser, so nothing is left on a shared computer. */
export function SignOutButton({ scope, className }: { scope: string; className?: string }) {
  return (
    <button type="submit" onClick={() => clearScope(scope)} className={className}>
      Sign out
    </button>
  );
}
