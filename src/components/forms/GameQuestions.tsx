"use client";

import { useState } from "react";
import { ENABLED_GAMES, GAME_CATALOG, OTHER_GAME, questionsFor } from "@/lib/constants";
import { Field } from "@/components/ui";

const GENRE_LABEL: Record<string, string> = {
  MMO: "MMO",
  FPS: "Shooter",
  MOBA: "MOBA",
  BATTLE_ROYALE: "Battle royale",
  STRATEGY: "Strategy",
  OTHER: "Game",
};

/** Game picker + the question set for that game's genre. Answers post as q_<key>. */
export function GameQuestions({
  errors,
  initialGame,
  initialOther = "",
  initialAnswers,
  allowNone = false,
  allowOther = false,
}: {
  errors?: Record<string, string[] | undefined>;
  /** A listed game name, OTHER_GAME, or "" (nothing). */
  initialGame?: string;
  /** The typed name when initialGame is OTHER_GAME. */
  initialOther?: string;
  initialAnswers?: Record<string, string>;
  /** Offer "Nothing right now" (profile editing). Applying always needs a game. */
  allowNone?: boolean;
  /** Offer "Another game" with a text box (profile editing). */
  allowOther?: boolean;
}) {
  const listed = (g?: string) => !!g && ENABLED_GAMES.some((e) => e.name === g);
  const [game, setGame] = useState(
    listed(initialGame) ? (initialGame as string) : initialGame === OTHER_GAME && allowOther ? OTHER_GAME : allowNone ? "" : (ENABLED_GAMES[0]?.name ?? ""),
  );
  const entry = GAME_CATALOG.find((g) => g.name === game);
  const questions = questionsFor(game);
  const other = game === OTHER_GAME;

  return (
    <div className="space-y-5">
      <Field
        label="Which game do you play?"
        name="game"
        error={errors?.game}
        hint={allowOther ? "Not on the list? Pick \"Another game\" and type it. Games that catch on get added to the site." : ENABLED_GAMES.length === 1 ? "More games open as the alliance expands." : undefined}
      >
        <select id="game" name="game" className="input" value={game} onChange={(e) => setGame(e.target.value)} required={!allowNone}>
          {allowNone && <option value="">Nothing right now</option>}
          {ENABLED_GAMES.map((g) => (
            <option key={g.name} value={g.name}>
              {g.name}
            </option>
          ))}
          {allowOther && <option value={OTHER_GAME}>Another game (type it below)</option>}
        </select>
      </Field>

      {other && (
        <Field label="What game?" name="gameOther" error={errors?.gameOther} hint="The exact name, e.g. Throne and Liberty, Valorant, Lost Ark.">
          <input id="gameOther" name="gameOther" className="input" defaultValue={initialOther} placeholder="Game name" maxLength={60} required aria-invalid={!!errors?.gameOther} />
        </Field>
      )}

      {(entry || other) && (
        <p className="eyebrow">
          {entry ? `${GENRE_LABEL[entry.genre]} questions · ${entry.name}` : "About you in that game"}
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        {questions.map((q) => {
          const name = `q_${q.key}`;
          const err = errors?.[name];
          const wide = q.type === "text" && (q.key === "previousGuilds" || q.key === "previousTeams");
          return (
            <div key={`${game}-${q.key}`} className={wide ? "sm:col-span-2" : ""}>
              <Field label={q.label + (q.required ? "" : " (optional)")} name={name} error={err} hint={q.hint}>
                {q.type === "select" ? (
                  <select id={name} name={name} className="input" defaultValue={initialAnswers?.[q.key] ?? ""} required={q.required} aria-invalid={!!err}>
                    <option value="" disabled={q.required}>
                      {q.required ? "Select…" : "—"}
                    </option>
                    {q.options?.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input id={name} name={name} className="input" defaultValue={initialAnswers?.[q.key] ?? ""} placeholder={q.placeholder} required={q.required} maxLength={120} aria-invalid={!!err} />
                )}
              </Field>
            </div>
          );
        })}
      </div>
    </div>
  );
}
