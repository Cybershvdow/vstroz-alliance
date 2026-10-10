"use client";

import { useEffect, useRef, useState } from "react";

/*
  Form drafts: whatever someone types is kept in their browser (localStorage), so a refresh, a closed tab,
  or a validation error never wipes it. Drafts are per form and per signed-in member, expire after a week
  (a day for the signed-out sign-up form), are cleared when the form is saved or the member signs out,
  and never include passwords, hidden fields, or anything marked data-draft-skip.

  Usage in a client form:
    const [formRef, draft] = useFormDraft("dispute", state);
    <form ref={formRef} ...> <DraftNotice draft={draft} /> ... </form>
*/

const PREFIX = "vzt:draft:";
const ANON = "anon";
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const ANON_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const SKIP_TYPES = new Set(["password", "hidden", "file", "submit", "button", "reset", "image"]);

type DraftValues = Record<string, string | string[]>;
type FieldEl = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

const keyOf = (name: string, scope: string) => `${PREFIX}${name}:${scope}`;
const maxAgeFor = (key: string) => (key.endsWith(`:${ANON}`) ? ANON_MAX_AGE_MS : MAX_AGE_MS);

function fieldsOf(form: HTMLFormElement): FieldEl[] {
  return Array.from(form.elements).filter((el): el is FieldEl => {
    if (!(el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement)) return false;
    if (!el.name || el.disabled || el.dataset.draftSkip !== undefined) return false;
    if (el instanceof HTMLInputElement && SKIP_TYPES.has(el.type)) return false;
    return true;
  });
}

function serialize(form: HTMLFormElement): DraftValues {
  const out: DraftValues = {};
  for (const el of fieldsOf(form)) {
    if (el instanceof HTMLInputElement && el.type === "checkbox") {
      const prev = out[el.name];
      const list = Array.isArray(prev) ? prev : [];
      if (el.checked) list.push(el.value);
      out[el.name] = list;
    } else if (el instanceof HTMLInputElement && el.type === "radio") {
      if (el.checked) out[el.name] = el.value;
      else if (!(el.name in out)) out[el.name] = "";
    } else {
      out[el.name] = el.value;
    }
  }
  return out;
}

/** Put saved values back into the form. Checkboxes/radios/selects are changed through events so React stays in sync. */
function applyValues(form: HTMLFormElement, values: DraftValues) {
  for (const el of fieldsOf(form)) {
    if (!(el.name in values)) continue;
    const v = values[el.name];
    if (el instanceof HTMLInputElement && el.type === "checkbox") {
      const want = Array.isArray(v) ? v.includes(el.value) : v === el.value;
      if (el.checked !== want) el.click();
    } else if (el instanceof HTMLInputElement && el.type === "radio") {
      if (v === el.value && !el.checked) el.click();
    } else if (typeof v === "string" && el.value !== v) {
      if (el instanceof HTMLSelectElement) {
        if (!Array.from(el.options).some((o) => o.value === v)) continue;
        el.value = v;
        el.dispatchEvent(new Event("change", { bubbles: true }));
      } else {
        el.value = v;
      }
    }
  }
}

function scopeOf(form: HTMLFormElement) {
  return form.closest("[data-draft-scope]")?.getAttribute("data-draft-scope") || ANON;
}

function readDraft(key: string): DraftValues | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { t?: number; v?: DraftValues };
    if (!parsed?.v || typeof parsed.t !== "number" || Date.now() - parsed.t > maxAgeFor(key)) {
      window.localStorage.removeItem(key);
      return null;
    }
    return parsed.v;
  } catch {
    return null;
  }
}

function remove(key: string) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

/** Drop every expired draft on this browser. Runs once per page load. */
let swept = false;
function sweepExpired() {
  if (swept) return;
  swept = true;
  try {
    for (const k of Object.keys(window.localStorage)) {
      if (!k.startsWith(PREFIX)) continue;
      let fresh = false;
      try {
        const p = JSON.parse(window.localStorage.getItem(k) ?? "null") as { t?: number } | null;
        fresh = !!p && typeof p.t === "number" && Date.now() - p.t <= maxAgeFor(k);
      } catch {
        fresh = false;
      }
      if (!fresh) window.localStorage.removeItem(k);
    }
  } catch {
    /* ignore */
  }
}

/** Remove the named drafts for one member (`scope` is their username, or "anon" for the signed-out sign-up form). */
export function clearDrafts(names: readonly string[], scope: string) {
  for (const n of names) remove(keyOf(n, scope));
}

/** Remove every draft a member has on this browser (used on sign-out). */
export function clearScope(scope: string) {
  try {
    for (const k of Object.keys(window.localStorage)) {
      if (k.startsWith(PREFIX) && k.endsWith(`:${scope}`)) window.localStorage.removeItem(k);
    }
  } catch {
    /* ignore */
  }
}

export type FormDraft = {
  /** True when saved text was put back into the form on load. */
  restored: boolean;
  /** Throw the draft away and reload the page with the saved values. */
  discard: () => void;
};

/**
 * Keep a form's typed values across refreshes.
 * @param name    stable id for this form (include a record id when the page shows several, e.g. `role:${roleId}`); null turns it off
 * @param state   the form's action state: `{ ok: true }` clears the draft, `{ ok: false }` puts the typed values back
 * @param options alsoClear: other forms that edit the same record, whose drafts are dropped too when this one saves
 */
export function useFormDraft(
  name: string | null,
  state?: { ok: boolean } | undefined,
  options?: { alsoClear?: readonly string[] },
): readonly [React.RefObject<HTMLFormElement | null>, FormDraft] {
  const formRef = useRef<HTMLFormElement | null>(null);
  const restoring = useRef(false);
  const dirty = useRef(false); // typed since the last save
  const submitted = useRef(false); // sent, and no error has come back
  const off = useRef(false); // discarded: stop saving until the reload
  const pristine = useRef<string | null>(null);
  const [restored, setRestored] = useState(false);
  const alsoClear = (options?.alsoClear ?? []).join("|");

  // Restore on load, then save on every change.
  useEffect(() => {
    const form = formRef.current;
    if (!form || !name) return;
    sweepExpired();
    const key = keyOf(name, scopeOf(form));
    let saveTimer: number | undefined;
    let passTimer: number | undefined;

    const save = () => {
      if (restoring.current || off.current) return;
      try {
        window.localStorage.setItem(key, JSON.stringify({ t: Date.now(), v: serialize(form) }));
      } catch {
        /* storage full or blocked: drafts are a convenience */
      }
      dirty.current = false;
    };
    const flush = () => {
      window.clearTimeout(saveTimer);
      if (dirty.current) save();
    };

    // What the page itself rendered, captured once before any draft is applied (effects can run twice in development).
    if (pristine.current === null) pristine.current = JSON.stringify(serialize(form));
    const draft = readDraft(key);
    if (draft) {
      restoring.current = true;
      applyValues(form, draft);
      // Second pass for fields that only appear after another field changed (e.g. game-specific questions).
      passTimer = window.setTimeout(() => {
        applyValues(form, draft);
        restoring.current = false;
        // Only announce it when the draft actually differs from what was already on the page.
        if (JSON.stringify(serialize(form)) !== pristine.current) setRestored(true);
        else remove(key);
      }, 60);
    }

    const onEdit = () => {
      if (restoring.current || off.current) return;
      dirty.current = true;
      submitted.current = false; // typing again after a submit starts a new draft
      window.clearTimeout(saveTimer);
      saveTimer = window.setTimeout(save, 250);
    };
    const onSubmit = () => {
      window.clearTimeout(saveTimer);
      submitted.current = true;
      save(); // React resets the form after an action; this is what gets put back if an error returns
    };
    const onHide = () => {
      if (document.visibilityState === "hidden") flush();
    };
    form.addEventListener("input", onEdit);
    form.addEventListener("change", onEdit);
    form.addEventListener("submit", onSubmit);
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      // Leaving the page: write the last keystrokes, unless the form was just sent (then the draft is done).
      if (submitted.current) remove(key);
      else flush();
      window.clearTimeout(saveTimer);
      window.clearTimeout(passTimer);
      restoring.current = false;
      form.removeEventListener("input", onEdit);
      form.removeEventListener("change", onEdit);
      form.removeEventListener("submit", onSubmit);
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, [name]);

  // After a submit: success clears the draft; an error puts the typed values back (React resets forms after an action).
  useEffect(() => {
    const form = formRef.current;
    if (!form || !name || !state) return;
    const scope = scopeOf(form);
    const key = keyOf(name, scope);
    if (state.ok) {
      remove(key);
      if (alsoClear) clearDrafts(alsoClear.split("|"), scope);
      dirty.current = false;
      submitted.current = false;
      const t = window.setTimeout(() => setRestored(false), 0);
      return () => window.clearTimeout(t);
    }
    submitted.current = false;
    const draft = readDraft(key);
    if (!draft) return;
    restoring.current = true;
    applyValues(form, draft);
    const t = window.setTimeout(() => {
      applyValues(form, draft);
      restoring.current = false;
    }, 60);
    return () => {
      window.clearTimeout(t);
      restoring.current = false;
    };
  }, [state, name, alsoClear]);

  const discard = () => {
    const form = formRef.current;
    off.current = true;
    dirty.current = false;
    if (form && name) remove(keyOf(name, scopeOf(form)));
    window.location.reload();
  };

  return [formRef, { restored, discard }] as const;
}
