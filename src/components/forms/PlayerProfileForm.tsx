"use client";

import { startTransition, useActionState, useState } from "react";
import { savePlayerProfileAction } from "@/lib/actions/auth";
import { PLAYTIME_OPTIONS, PLAYER_TYPES, INTEREST_OPTIONS, ENABLED_GAMES, LEGION_GAMES, playedGamesOf } from "@/lib/constants";
import { useFormDraft } from "@/lib/formDraft";
import { GameQuestions } from "./GameQuestions";
import { DraftNotice } from "./DraftNotice";
import { GameIcon } from "@/components/site/GameTag";
import { Button, Field, FormMessage } from "@/components/ui";

const playerTypeHelp: Record<(typeof PLAYER_TYPES)[number], string> = {
  Casual: "A few sessions a week, here for the people.",
  Softcore: "Regular play, shows up for events, no pressure.",
  Hardcore: "Daily grind, plays to improve, wants every event.",
  Competitive: "Top-end PvP and rankings. Voice, builds, discipline.",
};

export type PlayerProfileInitial = {
  game: string | null; // the legion game the answers below are about
  gameAnswers: string | null; // JSON keyed by question key
  playedGames: string | null; // JSON array of listed games (profile tags)
  ign: string | null;
  gameClass: string | null;
  playtime: string | null;
  playerType: string | null;
  interests: string | null; // comma-separated
  games: string | null; // free text: other games, not tags
  applicationNote: string | null;
};

const LEGION_NAMES = LEGION_GAMES.map((g) => g.name);

/**
 * The player profile: the games they play (tags), other games (free text), and how they play.
 * mode "apply" adds the legion game's questions and submits it as the Vstroz Legion application.
 * mode "profile" just saves; the legion game's questions appear (all optional) only while that game is ticked.
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
  // Both pages edit the same record, so saving either one drops the other's draft too.
  const [formRef, draft] = useFormDraft(`player-${mode}`, state, { alsoClear: ["player-apply", "player-profile"] });
  const err = state && !state.ok ? state.errors : undefined;
  const echoed = state && !state.ok ? state.values : undefined;
  const apply = mode === "apply";

  // Values to show: what the server echoed back after a validation error, else what is stored.
  const str = (k: string) => (echoed && typeof echoed[k] === "string" ? (echoed[k] as string) : undefined);
  const list = (k: string) => (echoed ? (Array.isArray(echoed[k]) ? (echoed[k] as string[]) : typeof echoed[k] === "string" && echoed[k] ? [echoed[k] as string] : []) : undefined);

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
  const played = new Set(list("playedGames") ?? playedGamesOf(initial));
  const chosenInterests = new Set(
    list("interests") ??
      (initial.interests ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
  );
  const playerType = str("playerType") ?? initial.playerType;
  // The legion block follows the legion game's checkbox: ticking it shows the character questions, unticking hides them.
  const [playsLegion, setPlaysLegion] = useState(() => LEGION_NAMES.some((n) => played.has(n)));
  const showLegion = apply || playsLegion;

  return (
    <form
      ref={formRef}
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
      <DraftNotice draft={draft} />
      <FormMessage state={state} />
      <input type="hidden" name="intent" value={apply ? "apply" : "save"} />

      {/* ---------- Games (profile tags) ---------- */}
      <section className="space-y-5">
        <p className="eyebrow">Games you play</p>
        <fieldset>
          <legend className="-mt-3 mb-3 text-sm text-muted">Tick every one you play. They show as tags on your profile.</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {ENABLED_GAMES.map((g) => {
              // The legion's game is part of the application, so it is locked on while applying. On the profile it is a free choice.
              const isLegionGame = LEGION_NAMES.includes(g.name);
              const locked = apply && isLegionGame;
              return (
                <label
                  key={g.name}
                  className={`flex items-center gap-3 border border-line-strong bg-bg-2 px-3 py-2.5 has-[:checked]:border-accent has-[:checked]:bg-accent/10 ${locked ? "" : "cursor-pointer"}`}
                >
                  <input
                    type="checkbox"
                    name="playedGames"
                    value={g.name}
                    defaultChecked={locked || played.has(g.name)}
                    disabled={locked}
                    onChange={
                      isLegionGame
                        ? (e) => {
                            const form = e.currentTarget.form;
                            setPlaysLegion(LEGION_NAMES.some((n) => !!form?.querySelector<HTMLInputElement>(`input[name="playedGames"][value="${n}"]`)?.checked));
                          }
                        : undefined
                    }
                    className="accent-[#9b4dff]"
                  />
                  <GameIcon game={g.name} />
                  <span className="text-sm">
                    {g.name}
                    {g.legion && <span className="ml-2 text-xs text-muted">Vstroz Legion</span>}
                  </span>
                </label>
              );
            })}
          </div>
          {err?.playedGames && <p className="mt-1.5 text-xs text-danger">{err.playedGames[0]}</p>}
        </fieldset>
        <Field label="Other games you play (optional)" name="games" error={err?.games} hint="Anything not on the list. Extra info only: it is not shown as a tag.">
          <input id="games" name="games" className="input" defaultValue={str("games") ?? initial.games ?? ""} placeholder="e.g. Throne and Liberty, Valorant, Lost Ark" maxLength={300} />
        </Field>
      </section>

      {/* ---------- Legion game details ---------- */}
      {showLegion ? (
        <section className="space-y-5 border-t border-line pt-6">
          <p className="eyebrow">{apply ? "Your legion application" : `Your ${LEGION_NAMES.join(" / ")} character`}</p>
          <p className="-mt-3 text-sm text-muted">
            {apply
              ? `The Vstroz Legion plays ${LEGION_NAMES.join(" / ")}. These answers are what the officers review.`
              : `Optional. Your ${LEGION_NAMES.join(" / ")} character name and class show on your profile and, in the legion, on the roster.`}
          </p>
          <GameQuestions errors={err} games={LEGION_NAMES} initialGame={str("game") ?? initial.game ?? undefined} initialAnswers={answers} optional={!apply} />
        </section>
      ) : (
        <section className="space-y-5 border-t border-line pt-6">
          <p className="eyebrow">In-game</p>
          <Field label="In-game name (optional)" name="ign" error={err?.ign} hint="The name other players see in-game: your character name or account tag, for example your Apex or Steam name. Shown on your profile.">
            <input id="ign" name="ign" className="input" defaultValue={str("ign") ?? initial.ign ?? ""} maxLength={32} />
          </Field>
        </section>
      )}

      {/* ---------- How you play ---------- */}
      <section className="space-y-5 border-t border-line pt-6">
        <p className="eyebrow">How you play</p>

        <Field label="How long have you been playing online games?" name="playtime" error={err?.playtime}>
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
              data-draft-skip
              defaultChecked={str("inGameLegion") === "yes" || answers.inGameLegion === "Yes"}
              className="mt-0.5 accent-[#9b4dff]"
              aria-invalid={!!err?.inGameLegion}
            />
            <span>
              I have joined the <span className="font-semibold text-text">Vstroz Legion</span> in-game. This application puts you on the legion roster here; the in-game
              legion is where you actually play.
            </span>
          </label>
          {err?.inGameLegion && <p className="mt-1.5 text-xs text-danger">{err.inGameLegion[0]}</p>}
        </div>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={pending} aria-busy={pending}>
        {pending ? (apply ? "Submitting…" : "Saving…") : (submitLabel ?? (apply ? "Apply to the Vstroz Legion" : "Save player profile"))}
      </Button>
    </form>
  );
}
