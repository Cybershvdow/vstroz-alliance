"use client";

import { useSyncExternalStore } from "react";

/* A shared 1-second ticker exposed as an external store so the component
   never sets state inside an effect and stays hydration-safe (server snapshot is null). */
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;

function subscribe(cb: () => void) {
  listeners.add(cb);
  if (!timer) timer = setInterval(() => listeners.forEach((l) => l()), 1000);
  return () => {
    listeners.delete(cb);
    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}
const getSnapshot = () => Math.floor(Date.now() / 1000);
const getServerSnapshot = () => null;

function parts(seconds: number) {
  const total = Math.max(0, seconds);
  return {
    d: Math.floor(total / 86400),
    h: Math.floor((total % 86400) / 3600),
    m: Math.floor((total % 3600) / 60),
    s: total % 60,
  };
}

export function Countdown({ iso, compact = false }: { iso: string; compact?: boolean }) {
  const now = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const target = Math.floor(new Date(iso).getTime() / 1000);
  const p = now === null ? null : parts(target - now);
  const live = now !== null && target - now <= 0;

  if (live) {
    return (
      <span className="inline-flex items-center gap-2 font-display text-lg font-bold uppercase tracking-widest text-success">
        <span className="live-dot h-2.5 w-2.5 rounded-full bg-success" /> Live now
      </span>
    );
  }

  const cells: [string, number | null][] = [
    ["Days", p?.d ?? null],
    ["Hrs", p?.h ?? null],
    ["Min", p?.m ?? null],
    ["Sec", p?.s ?? null],
  ];

  return (
    <div className={`flex ${compact ? "gap-3" : "gap-4"}`} aria-live="off">
      {cells.map(([label, v]) => (
        <div key={label} className="text-center">
          <div className={`display tabular-nums ${compact ? "text-2xl" : "text-4xl md:text-5xl"}`}>
            {v === null ? "--" : String(v).padStart(2, "0")}
          </div>
          <div className="label mt-1">{label}</div>
        </div>
      ))}
    </div>
  );
}
