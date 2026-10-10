"use client";

import { startTransition, useActionState } from "react";
import { savePlayerProfileAction } from "@/lib/actions/auth";
import { PLAYTIME_OPTIONS, PLAYER_TYPES, INTEREST_OPTIONS } from "@/lib/constants";
import { GameQuestions } from "./GameQuestions";
import { Button, Field, FormMessage } from "@/components/ui";

const playerTypeHelp: Record<(typeof PLAYER_TYPES)[number], string> = {
  Casual: "A few sessions a week, here for the people.",
  Softcore: "Regular play, shows up for events, no pressure.",
  Hardcore: "Daily grind, gear-focused, wants every siege.",
  Competitive: "Top-end PvP and rankings. Voice, builds, discipline.",
};

export type PlayerProfileInitial = {
  game: string | null;
  gameAnswers: string | null; // JSON keyed by question key
  ign: string | null;
  gameClass: string | null;
  playtime: string | null;
  playerType: string | null;
  interests: string | null; // comma-separated
  games: string | null;
  applicationNote: string | null;
};

/**
 * The player profile: which game, in-game name, class, how they play.
 * mode "apply" submits it as the legion application; "profile" just saves it.
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
  const [state, formAction, pending] = useActionState(savePlayerProfileAction, undefined);
  const err = state && !state.ok ? state.errors : undefined;
  const echoed = state && !state.ok ? state.values : undefined;
  const apply = mode === "apply";

  // Values to show: what the server echoed back after a validation error, else what is stored.
  const str = (k: string) => (echoed && typeof echoed[k] === "string" ? (echoed[k] as string) : undefined);

  let stored: Record<string, string> = {};
  try {
    stored = initial.gameAnswers ? JSON.parse(initial.gameAnswers) : {};
  } catch {
    stored = {};
  }
  const answers: Record<string, string> = {
    ...(initial.ign ? { ign: initial.ign } : {}),
    ...(initial.gameClass ? { mainClass: initial.gameClass } : {}),
    ...stored,
    ...(echoed
      ? Object.fromEntries(
          Object.entries(echoed)
            .filter(([k, v]) => k.startsWith("q_") && typeof v === "string")
            .map(([k, v]) => [k.slice(2), v as string]),
        )
      : {}),
  };
  const game = str("game") ?? initial.game ?? undefined;
  const chosenInterests = new Set(
    echoed
      ? Array.isArray(echoed.interests)
        ? echoed.interests
        : typeof echoed.interests === "string"
          ? [echoed.interests]
          : []
      : (initial.interests ?? "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
  );
  const playerType = str("playerType") ?? initial.playerType;

  return (
    <form
      action={formAction}
      // Submitting through startTransition keeps what the player typed if validation fails
      // (React resets uncontrolled forms after a direct form action).
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => formAction(fd));
      }}
      className="space-y-8"
      noValidate
    >
      <FormMessage state={state} />
      <input type="hidden" name="intent" value={apply ? "apply" : "save"} />

      {/* ---------- Your game ---------- */}
      <section className="space-y-5">
        <p className="eyebrow">Your game</p>
        <p className="-mt-3 text-sm text-muted">
          {apply ? "Pick the game you are applying with. The questions change to fit that game." : "Pick the game you play. The questions change to fit that game."}
        </p>
        <GameQuestions errors={err} initialGame={game} initialAnswers={answers} allowNone={!apply} />
      </section>

      {/* ---------- How you play ---------- */}
      <section className="space-y-5 border-t border-line pt-6">
        <p className="eyebrow">How you play</p>

        <Field label="How long have you been playing MMOs?" name="playtime" error={err?.playtime}>
          <select id="playtime" name="playtime" className="input" defaultValue={str("playtime") ?? initial.playtime ?? ""} required aria-invalid={!!err?.playtime}>
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
                <input type="radio" name="playerType" value={t} defaultChecked={playerType === t} className="mt-1 accent-[#9b4dff]" required />
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
          <input id="games" name="games" className="input" defaultValue={str("games") ?? initial.games ?? ""} placeholder="e.g. Aion, Throne and Liberty, Valorant" maxLength={300} />
        </Field>
      </section>

      {/* ---------- Comments ---------- */}
      <section className="space-y-5 border-t border-line pt-6">
        <p className="eyebrow">{apply ? "Anything else" : "Notes for the officers"}</p>
        <Field
          label="Comments"
          name="applicationNote"
          error={err?.applicationNote}
          hint={apply ? "Availability, past guilds, why Vstroz, anything you want officers to know." : "Availability, notes for officers."}
        >
          <textarea id="applicationNote" name="applicationNote" className="input min-h-28" defaultValue={str("applicationNote") ?? initial.applicationNote ?? ""} maxLength={1000} />
        </Field>
      </section>

      {apply && (
        <div>
          <label
            htmlFor="inGameLegion"
            className={`flex cursor-pointer items-start gap-3 border bg-bg-2 p-3 text-sm has-[:checked]:border-accent has-[:checked]:bg-accent/10 ${err?.inGameLegion ? "border-danger" : "border-line-strong"}`}
          >
            <input
              id="inGameLegion"
              type="checkbox"
              name="inGameLegion"
              value="yes"
              defaultChecked={str("inGameLegion") === "yes" || answers.inGameLegion === "Yes"}
              className="mt-0.5 accent-[#9b4dff]"
              aria-invalid={!!err?.inGameLegion}
            />
            <span>
              I have joined the <span className="font-semibold text-text">Vstroz Alliance</span> legion in-game. The website application is for the legion roster; the
              in-game legion is where you actually play.
            </span>
          </label>
          {err?.inGameLegion && <p className="mt-1.5 text-xs text-danger">{err.inGameLegion[0]}</p>}
        </div>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={pending} aria-busy={pending}>
        {pending ? (apply ? "Submitting…" : "Saving…") : (submitLabel ?? (apply ? "Apply to the legion" : "Save player profile"))}
      </Button>
    </form>
  );
}
