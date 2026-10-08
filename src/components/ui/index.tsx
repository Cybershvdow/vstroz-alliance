import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

/* ---------------- Button ---------------- */

type Variant = "primary" | "secondary" | "ghost" | "gold" | "danger";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 font-display font-bold uppercase tracking-[0.16em] transition-all duration-200 select-none disabled:opacity-50 disabled:pointer-events-none cut-sm";

const variants: Record<Variant, string> = {
  primary:
    "bg-[linear-gradient(180deg,#f8e2a0_0%,#dcb24d_48%,#b48a2b_100%)] text-[#1a1207] shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_10px_28px_-12px_rgba(230,185,90,0.75)] hover:brightness-[1.07] hover:-translate-y-px",
  secondary:
    "bg-white/[0.03] text-text border border-gold/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] hover:border-gold/70 hover:bg-white/[0.06] hover:-translate-y-px",
  ghost: "text-muted hover:text-text hover:bg-white/5",
  gold: "bg-[linear-gradient(180deg,#ff8a4d,#e04a14)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_10px_28px_-12px_rgba(255,90,31,0.8)] hover:brightness-110 hover:-translate-y-px",
  danger: "bg-danger/10 text-danger border border-danger/30 hover:bg-danger/20",
};

const sizes: Record<Size, string> = {
  sm: "text-[0.68rem] px-3.5 py-2",
  md: "text-[0.78rem] px-5 py-2.5",
  lg: "text-[0.86rem] px-7 py-3.5",
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className = "",
  href,
  ...props
}: Omit<ComponentProps<typeof Link>, "href"> & { href: string; variant?: Variant; size?: Size }) {
  return <Link href={href} className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props} />;
}

/* ---------------- Badge ---------------- */

type Tone = "neutral" | "accent" | "gold" | "success" | "warning" | "danger" | "cyan";

const tones: Record<Tone, string> = {
  neutral: "bg-white/[0.04] text-muted border-line-strong",
  accent: "bg-accent/12 text-[#ffb08a] border-accent/35",
  gold: "bg-gold/12 text-gold-bright border-gold/45",
  success: "bg-success/15 text-success border-success/40",
  warning: "bg-warning/15 text-warning border-warning/40",
  danger: "bg-danger/15 text-danger border-danger/40",
  cyan: "bg-cyan/15 text-cyan border-cyan/40",
};

export function Badge({ tone = "neutral", children, className = "" }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-[2px] border px-2 py-0.5 font-sans text-[0.62rem] font-bold uppercase tracking-[0.18em] ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function statusTone(status: string): Tone {
  switch (status) {
    case "APPROVED":
    case "CONFIRMED":
    case "OPEN":
    case "COMPLETED":
      return "success";
    case "PENDING":
    case "BENCH":
      return "warning";
    case "DENIED":
    case "DECLINED":
    case "CANCELLED":
      return "danger";
    case "LOCKED":
      return "neutral";
    default:
      return "neutral";
  }
}

export function roleTone(role: string): Tone {
  if (role === "LEADER") return "gold";
  if (role === "OFFICER") return "accent";
  return "neutral";
}

/* ---------------- Card ---------------- */

export function Card({ children, className = "", accent = false }: { children: ReactNode; className?: string; accent?: boolean }) {
  return <div className={`panel ${accent ? "panel-accent" : ""} p-5 md:p-6 ${className}`}>{children}</div>;
}

/* ---------------- Headings ---------------- */

export function SectionHeading({
  eyebrow,
  title,
  text,
  align = "left",
  className = "",
}: {
  eyebrow?: string;
  title: ReactNode;
  text?: ReactNode;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div className={`${align === "center" ? "text-center mx-auto" : ""} max-w-2xl ${className}`}>
      {eyebrow && <p className="eyebrow mb-4">{eyebrow}</p>}
      <h2 className="display text-3xl md:text-4xl lg:text-5xl">{title}</h2>
      <span className={`mt-5 block h-px w-16 bg-[linear-gradient(90deg,var(--color-gold),transparent)] ${align === "center" ? "mx-auto bg-[linear-gradient(90deg,transparent,var(--color-gold),transparent)]" : ""}`} />
      {text && <p className="mt-5 text-muted text-base md:text-lg leading-relaxed">{text}</p>}
    </div>
  );
}

export function PageHeader({ title, text, actions }: { title: ReactNode; text?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between border-b border-line pb-6 mb-8">
      <div>
        <h1 className="display text-2xl md:text-3xl">{title}</h1>
        {text && <p className="mt-2 text-muted max-w-2xl">{text}</p>}
      </div>
      {actions && <div className="flex gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

/* ---------------- Form bits ---------------- */

export function Field({
  label,
  name,
  error,
  hint,
  children,
}: {
  label: string;
  name: string;
  error?: string[];
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="label block">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-dim">{hint}</p>}
      {error && error.length > 0 && <p className="text-xs text-danger">{error[0]}</p>}
    </div>
  );
}

export function FormMessage({ state }: { state: { ok: boolean; message?: string } | undefined }) {
  if (!state?.message) return null;
  return (
    <div
      className={`border px-4 py-3 text-sm ${
        state.ok ? "border-success/40 bg-success/10 text-success" : "border-danger/40 bg-danger/10 text-danger"
      }`}
      role="status"
    >
      {state.message}
    </div>
  );
}

/* ---------------- Misc ---------------- */

export function EmptyState({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="panel border-dashed p-10 text-center">
      <p className="display text-2xl text-muted">{title}</p>
      {text && <p className="mt-2 text-sm text-dim max-w-md mx-auto">{text}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

export function Stat({ label, value, tone = "text" }: { label: string; value: ReactNode; tone?: "text" | "gold" | "accent" }) {
  const color = tone === "gold" ? "text-gold" : tone === "accent" ? "text-accent" : "text-text";
  return (
    <div className="panel p-5">
      <p className="label">{label}</p>
      <p className={`display mt-2 text-4xl ${color}`}>{value}</p>
    </div>
  );
}

export function Avatar({ name, size = "md", tone = "neutral" }: { name: string; size?: "sm" | "md" | "lg"; tone?: Tone }) {
  const sz = size === "sm" ? "h-8 w-8 text-xs" : size === "lg" ? "h-16 w-16 text-2xl" : "h-11 w-11 text-base";
  const ring = tone === "gold" ? "ring-gold" : tone === "accent" ? "ring-accent" : "ring-line-strong";
  return (
    <span
      className={`inline-flex ${sz} shrink-0 items-center justify-center rounded-full bg-[radial-gradient(circle_at_30%_25%,#2c2420,#120f0e)] font-display font-bold uppercase ring-1 ${ring}`}
      aria-hidden
    >
      {name.slice(0, 2)}
    </span>
  );
}
