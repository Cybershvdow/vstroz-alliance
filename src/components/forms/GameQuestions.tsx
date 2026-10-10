"use client";

import { useState } from "react";
import { GAME_CATALOG, questionsFor } from "@/lib/constants";
import { Field } from "@/components/ui";

const GENRE_LABEL: Record<string, string> = {
  MMO: "MMO",
  FPS: "Shooter",
  MOBA: "MOBA",
  BATTLE_ROYALE: "Battle royale",
  STRATEGY: "Strategy",
  OTHER: "Game",
};

/**
 * The question set for a game (in-game name, class, role…). Answers post as q_<key>, the game as `game`.
 * With one game there is nothing to choose, so it is fixed; with several a picker appears.
 */
export function GameQuestions({
  errors,
  games,
  initialGame,
  initialAnswers,
  optional = false,
}: {
  errors?: Record<string, string[] | undefined>;
  /** Games this block can be about (the legion's games). */
  games: readonly string[];
  initialGame?: string;
  initialAnswers?: Record<string, string>;
  /** Profile editing: nothing is required. Applying: required questions are enforced. */
  optional?: boolean;
}) {
  const [game, setGame] = useState(initialGame && games.includes(initialGame) ? initialGame : (games[0] ?? ""));
  const entry = GAME_CATALOG.find((g) => g.name === game);
  const questions = questionsFor(game);

  return (
    <div className="space-y-5">
      {games.length > 1 ? (
        <Field label="Which game?" name="game" error={errors?.game}>
          <select id="game" name="game" className="input" value={game} onChange={(e) => setGame(e.target.value)} required>
            {games.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </Field>
      ) : (
        <>
          <input type="hidden" name="game" value={game} />
          {errors?.game && <p className="text-xs text-danger">{errors.game[0]}</p>}
        </>
      )}

      {entry && (
        <p className="eyebrow">
          {GENRE_LABEL[entry.genre]} questions · {entry.name}
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        {questions.map((q) => {
          const name = `q_${q.key}`;
          const err = errors?.[name];
          const required = !!q.required && !optional;
          const wide = q.type === "text" && (q.key === "previousGuilds" || q.key === "previousTeams");
          return (
            <div key={`${game}-${q.key}`} className={wide ? "sm:col-span-2" : ""}>
              <Field label={q.label + (required ? "" : " (optional)")} name={name} error={err} hint={q.hint}>
                {q.type === "select" ? (
                  <select id={name} name={name} className="input" defaultValue={initialAnswers?.[q.key] ?? ""} required={required} aria-invalid={!!err}>
                    <option value="" disabled={required}>
                      {required ? "Select…" : "—"}
                    </option>
                    {q.options?.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input id={name} name={name} className="input" defaultValue={initialAnswers?.[q.key] ?? ""} placeholder={q.placeholder} required={required} maxLength={120} aria-invalid={!!err} />
                )}
              </Field>
            </div>
          );
        })}
      </div>
    </div>
  );
}
