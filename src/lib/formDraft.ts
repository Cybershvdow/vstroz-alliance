"use client";

import { useEffect, useRef, useState } from "react";

/*
  Form drafts: whatever someone types is kept in their browser (localStorage), so a refresh, a closed tab,
  or a validation error never wipes it. Drafts are per form and per signed-in member, expire after a week,
  are cleared when the form is saved, and never include passwords or hidden fields.

  Usage in a client form:
    const [formRef, draft] = useFormDraft("dispute", state);
    <form ref={formRef} ...> <DraftNotice draft={draft} /> ... </form>
*/

const PREFIX = "vzt:draft:";
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const SKIP_TYPES = new Set(["password", "hidden", "file", "submit", "button", "reset", "image"]);

type DraftValues = Record<string, string | string[]>;
type FieldEl = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

function fieldsOf(form: HTMLFormElement): FieldEl[] {
  return Array.from(form.elements).filter((el): el is FieldEl => {
    if (!(el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement)) return false;
    if (!el.name || el.disabled) return false;
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

function keyFor(form: HTMLFormElement, name: string) {
  const scope = form.closest("[data-draft-scope]")?.getAttribute("data-draft-scope") || "anon";
  return `${PREFIX}${name}:${scope}`;
}

function readDraft(key: string): DraftValues | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { t?: number; v?: DraftValues };
    if (!parsed?.v || typeof parsed.t !== "number" || Date.now() - parsed.t > MAX_AGE_MS) {
      window.localStorage.removeItem(key);
      return null;
    }
    return parsed.v;
  } catch {
    return null;
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
 * @param name  stable id for this form (include a record id when the page shows several, e.g. `role:${roleId}`); null turns it off
 * @param state the form's action state: `{ ok: true }` clears the draft, `{ ok: false }` puts the typed values back
 */
export function useFormDraft(name: string | null, state?: { ok: boolean } | undefined): readonly [React.RefObject<HTMLFormElement | null>, FormDraft] {
  const formRef = useRef<HTMLFormElement | null>(null);
  const restoring = useRef(false);
  const pristine = useRef<string | null>(null);
  const [restored, setRestored] = useState(false);

  // Restore on load, then save on every change.
  useEffect(() => {
    const form = formRef.current;
    if (!form || !name) return;
    const key = keyFor(form, name);
    let saveTimer: number | undefined;
    let passTimer: number | undefined;

    const save = () => {
      if (restoring.current) return;
      try {
        window.localStorage.setItem(key, JSON.stringify({ t: Date.now(), v: serialize(form) }));
      } catch {
        /* storage full or blocked: drafts are a convenience */
      }
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
        else window.localStorage.removeItem(key);
      }, 60);
    }

    const onEdit = () => {
      if (restoring.current) return;
      window.clearTimeout(saveTimer);
      saveTimer = window.setTimeout(save, 250);
    };
    const onSubmit = () => {
      window.clearTimeout(saveTimer);
      save();
    };
    form.addEventListener("input", onEdit);
    form.addEventListener("change", onEdit);
    form.addEventListener("submit", onSubmit);
    return () => {
      window.clearTimeout(saveTimer);
      window.clearTimeout(passTimer);
      restoring.current = false;
      form.removeEventListener("input", onEdit);
      form.removeEventListener("change", onEdit);
      form.removeEventListener("submit", onSubmit);
    };
  }, [name]);

  // After a submit: success clears the draft; an error puts the typed values back (React resets forms after an action).
  useEffect(() => {
    const form = formRef.current;
    if (!form || !name || !state) return;
    const key = keyFor(form, name);
    if (state.ok) {
      try {
        window.localStorage.removeItem(key);
      } catch {
        /* ignore */
      }
      const t = window.setTimeout(() => setRestored(false), 0);
      return () => window.clearTimeout(t);
    }
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
  }, [state, name]);

  const discard = () => {
    const form = formRef.current;
    if (form && name) {
      try {
        window.localStorage.removeItem(keyFor(form, name));
      } catch {
        /* ignore */
      }
    }
    window.location.reload();
  };

  return [formRef, { restored, discard }] as const;
}

/** Remove saved drafts for the given form names (all members on this browser). */
export function clearDrafts(names: string[]) {
  try {
    for (const k of Object.keys(window.localStorage)) {
      if (names.some((n) => k.startsWith(`${PREFIX}${n}:`))) window.localStorage.removeItem(k);
    }
  } catch {
    /* ignore */
  }
}
