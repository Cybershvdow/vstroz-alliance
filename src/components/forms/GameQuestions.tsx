"use client";

import { useState } from "react";
import { ENABLED_GAMES, GAME_CATALOG, questionsFor } from "@/lib/constants";
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
export function GameQuestions({ errors }: { errors?: Record<string, string[] | undefined> }) {
  const [game, setGame] = useState(ENABLED_GAMES[0]?.name ?? "");
  const entry = GAME_CATALOG.find((g) => g.name === game);
  const questions = questionsFor(game);

  return (
    <div className="space-y-5">
      <Field label="Which game are you applying for?" name="game" error={errors?.game} hint={ENABLED_GAMES.length === 1 ? "More games open as the alliance expands." : undefined}>
        <select id="game" name="game" className="input" value={game} onChange={(e) => setGame(e.target.value)} required>
          {ENABLED_GAMES.map((g) => (
            <option key={g.name} value={g.name}>
              {g.name}
            </option>
          ))}
        </select>
      </Field>

      {entry && (
        <p className="eyebrow">
          {GENRE_LABEL[entry.genre]} questions · {entry.name}
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
                  <select id={name} name={name} className="input" defaultValue="" required={q.required} aria-invalid={!!err}>
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
                  <input id={name} name={name} className="input" placeholder={q.placeholder} required={q.required} maxLength={120} aria-invalid={!!err} />
                )}
              </Field>
            </div>
          );
        })}
      </div>
    </div>
  );
}
