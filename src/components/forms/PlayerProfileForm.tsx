"use client";

import { useActionState } from "react";
import { savePlayerProfileAction } from "@/lib/actions/auth";
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

export type PlayerProfileInitial = {
  game: string | null;
  gameAnswers: string | null; // JSON keyed by question key
  playtime: string | null;
  playerType: string | null;
  interests: string | null; // comma-separated
  games: string | null;
  applicationNote: string | null;
};

/**
 * The player profile: which game, in-game name, class, how they play.
 * mode "apply" = first submission (becomes the membership application); "profile" = editing later.
 */
export function PlayerProfileForm({
  initial,
  mode,
  submitLabel,
}: {
  initial: PlayerProfileInitial;
  mode: "apply" | "profile";
  submitLabel?: string;
}) {
  const [state, action] = useActionState(savePlayerProfileAction, undefined);
  const err = state && !state.ok ? state.errors : undefined;
  const apply = mode === "apply";

  let answers: Record<string, string> = {};
  try {
    answers = initial.gameAnswers ? JSON.parse(initial.gameAnswers) : {};
  } catch {
    answers = {};
  }
  const chosenInterests = new Set(
    (initial.interests ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );

  return (
    <form action={action} className="space-y-8" noValidate>
      <FormMessage state={state} />

      {/* ---------- Your game ---------- */}
      <section className="space-y-5">
        <p className="eyebrow">{apply ? "1 · Your game" : "Your game"}</p>
        <p className="-mt-3 text-sm text-muted">Pick the game you play. The questions change to fit that game.</p>
        <GameQuestions errors={err} initialGame={initial.game ?? undefined} initialAnswers={answers} />
      </section>

      {/* ---------- How you play ---------- */}
      <section className="space-y-5 border-t border-line pt-6">
        <p className="eyebrow">{apply ? "2 · How you play" : "How you play"}</p>

        <Field label="How long have you been playing MMOs?" name="playtime" error={err?.playtime}>
          <select id="playtime" name="playtime" className="input" defaultValue={initial.playtime ?? ""} required aria-invalid={!!err?.playtime}>
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
              <label
                key={t}
                className="flex cursor-pointer items-start gap-3 border border-line-strong bg-bg-2 p-3 has-[:checked]:border-accent has-[:checked]:bg-accent/10"
              >
                <input type="radio" name="playerType" value={t} defaultChecked={initial.playerType === t} className="mt-1 accent-[#9b4dff]" required />
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
              <label
                key={o}
                className="flex cursor-pointer items-center gap-3 border border-line-strong bg-bg-2 px-3 py-2.5 has-[:checked]:border-accent has-[:checked]:bg-accent/10"
              >
                <input type="checkbox" name="interests" value={o} defaultChecked={chosenInterests.has(o)} className="accent-[#9b4dff]" />
                <span className="text-sm">{o}</span>
              </label>
            ))}
          </div>
          {err?.interests && <p className="mt-1.5 text-xs text-danger">{err.interests[0]}</p>}
        </fieldset>

        <Field label="What other games do you play?" name="games" error={err?.games} hint="Anything else you play now or used to play seriously.">
          <input id="games" name="games" className="input" defaultValue={initial.games ?? ""} placeholder="e.g. Aion, Throne and Liberty, Valorant" maxLength={300} />
        </Field>
      </section>

      {/* ---------- Comments ---------- */}
      <section className="space-y-5 border-t border-line pt-6">
        <p className="eyebrow">{apply ? "3 · Anything else" : "Notes for the officers"}</p>
        <Field label="Comments" name="applicationNote" error={err?.applicationNote} hint="Availability, past guilds, why Vstroz, anything you want officers to know.">
          <textarea id="applicationNote" name="applicationNote" className="input min-h-28" defaultValue={initial.applicationNote ?? ""} maxLength={1000} />
        </Field>
      </section>

      <SubmitButton size="lg" className="w-full" pendingText={apply ? "Submitting…" : "Saving…"}>
        {submitLabel ?? (apply ? "Submit application" : "Save player profile")}
      </SubmitButton>
    </form>
  );
}
