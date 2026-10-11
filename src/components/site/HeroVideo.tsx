"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

const REDUCE = "(prefers-reduced-motion: reduce)";

/** True when the visitor's device asks for less motion. */
function useReducedMotion() {
  return useSyncExternalStore(
    (onChange) => {
      const m = window.matchMedia(REDUCE);
      m.addEventListener("change", onChange);
      return () => m.removeEventListener("change", onChange);
    },
    () => window.matchMedia(REDUCE).matches,
    () => false,
  );
}

/**
 * The homepage intro film, playing behind the hero as soon as the page loads.
 * Browsers only allow autoplay without sound, so it starts muted and loops; the button restarts it with sound.
 * It pauses when scrolled out of view, and stays a still image for visitors who ask their device for less motion
 * until they press play.
 */
export function HeroVideo({ src, mobileSrc, poster }: { src: string; mobileSrc?: string; poster: string }) {
  const video = useRef<HTMLVideoElement>(null);
  const reduced = useReducedMotion();
  const [muted, setMuted] = useState(true);
  const [started, setStarted] = useState(false); // the visitor pressed the button
  const still = reduced && !started;

  useEffect(() => {
    const el = video.current;
    if (!el) return;
    if (still) {
      el.pause();
      return;
    }
    el.play().catch(() => {
      /* autoplay refused: the poster stays and the button still works */
    });
    // Do not decode video nobody is looking at.
    const seen = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) el.play().catch(() => {});
        else el.pause();
      },
      { threshold: 0.15 },
    );
    seen.observe(el);
    return () => seen.disconnect();
  }, [still]);

  const toggleSound = () => {
    const el = video.current;
    if (!el) return;
    if (el.muted || el.paused) {
      // Turning sound on plays the film from the top with audio; it keeps looping after that.
      el.muted = false;
      el.currentTime = 0;
      el.play().catch(() => {});
      setMuted(false);
      setStarted(true);
    } else {
      el.muted = true;
      setMuted(true);
    }
  };

  return (
    <>
      <video ref={video} className="absolute inset-0 h-full w-full object-cover" poster={poster} muted loop playsInline preload="metadata" aria-hidden tabIndex={-1}>
        {mobileSrc && <source src={mobileSrc} type="video/mp4" media="(max-width: 767px)" />}
        <source src={src} type="video/mp4" />
      </video>

      <button
        type="button"
        onClick={toggleSound}
        aria-pressed={!muted}
        className="cut-sm absolute bottom-5 right-4 z-10 inline-flex items-center gap-2 border border-gold/40 bg-black/55 px-4 py-2 font-display text-[0.7rem] font-bold uppercase tracking-[0.18em] text-text backdrop-blur transition hover:border-gold/80 hover:bg-black/70 md:bottom-8 md:right-6"
      >
        <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" stroke="none" />
          {muted ? <path d="M16 9l5 6M21 9l-5 6" /> : <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />}
        </svg>
        {still ? "Play the trailer" : muted ? "Watch with sound" : "Sound on"}
      </button>
    </>
  );
}
