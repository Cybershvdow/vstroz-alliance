export function DiscordIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M20.3 4.4A19.8 19.8 0 0 0 15.4 3l-.2.4a13 13 0 0 1 3.3 1.7 15.6 15.6 0 0 0-13 0A13 13 0 0 1 8.8 3.4L8.6 3a19.8 19.8 0 0 0-4.9 1.4C.6 9 0 13.4.3 17.8a20 20 0 0 0 6 3l1.3-2a12.7 12.7 0 0 1-2-1l.5-.4a14.2 14.2 0 0 0 11.8 0l.5.4-2 1 1.3 2a20 20 0 0 0 6-3c.4-5-.8-9.4-3.4-13.4ZM8.7 15.1c-1.2 0-2.2-1.1-2.2-2.4s1-2.4 2.2-2.4 2.2 1.1 2.2 2.4-1 2.4-2.2 2.4Zm6.6 0c-1.2 0-2.2-1.1-2.2-2.4s1-2.4 2.2-2.4 2.2 1.1 2.2 2.4-1 2.4-2.2 2.4Z" />
    </svg>
  );
}

export function ArrowIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function CheckIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="3" aria-hidden>
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}
