import "server-only";

/* Email notifications via Resend (https://resend.com — free tier: 3,000 emails/month).
   Configure in .env:
     RESEND_API_KEY  — from the Resend dashboard
     EMAIL_FROM      — e.g. "Vstroz Alliance <onboarding@resend.dev>" (or your own verified domain)
     NOTIFY_EMAIL    — where new applications are sent
     APP_URL         — public site URL used in links
   If RESEND_API_KEY is missing, emails are logged to the server console instead of sent,
   so the site keeps working without email configured. */

import { questionsFor } from "@/lib/constants";

const API = "https://api.resend.com/emails";

export const notifyEmail = process.env.NOTIFY_EMAIL || "";
export const appUrl = (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
const from = process.env.EMAIL_FROM || "Vstroz Alliance <onboarding@resend.dev>";

export async function sendEmail(opts: { to: string; subject: string; html: string; text?: string }) {
  const key = process.env.RESEND_API_KEY;
  if (!opts.to) return { ok: false, skipped: "no recipient" as const };
  if (!key) {
    console.log(`[email:skipped — no RESEND_API_KEY] to=${opts.to} subject="${opts.subject}"`);
    return { ok: false, skipped: "no api key" as const };
  }
  try {
    const res = await fetch(API, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [opts.to], subject: opts.subject, html: opts.html, text: opts.text }),
    });
    if (!res.ok) {
      console.error("[email] send failed", res.status, await res.text());
      return { ok: false as const };
    }
    return { ok: true as const };
  } catch (err) {
    console.error("[email] send error", err);
    return { ok: false as const };
  }
}

/* ---------- Templates ---------- */

const esc = (s: string | null | undefined) =>
  (s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);

function shell(title: string, body: string, cta?: { href: string; label: string }) {
  return `<!doctype html><html><body style="margin:0;background:#050507;font-family:Arial,Helvetica,sans-serif;color:#f1f0f6">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px">
    <p style="margin:0 0 6px;font-size:11px;letter-spacing:.28em;text-transform:uppercase;color:#c9ccd6">Vstroz Alliance</p>
    <h1 style="margin:0 0 18px;font-size:22px;line-height:1.2">${esc(title)}</h1>
    <div style="background:#0f0e16;border:1px solid rgba(155,77,255,.25);border-radius:4px;padding:18px 20px;font-size:14px;line-height:1.6">${body}</div>
    ${cta ? `<p style="margin:22px 0 0"><a href="${cta.href}" style="display:inline-block;background:#9b4dff;color:#1a1207;text-decoration:none;font-weight:bold;letter-spacing:.14em;text-transform:uppercase;font-size:12px;padding:12px 20px;border-radius:2px">${esc(cta.label)}</a></p>` : ""}
    <p style="margin:28px 0 0;font-size:11px;color:#67647a">Sent by the Vstroz Alliance website.</p>
  </div></body></html>`;
}

const row = (k: string, v: string | null | undefined) =>
  `<tr><td style="padding:4px 12px 4px 0;color:#a4a1b3;white-space:nowrap;vertical-align:top">${esc(k)}</td><td style="padding:4px 0">${esc(v) || "—"}</td></tr>`;

function gameRows(game: string | null | undefined, json: string | null | undefined) {
  if (!game || !json) return "";
  try {
    const answers = JSON.parse(json) as Record<string, string>;
    return questionsFor(game)
      .filter((q) => answers[q.key])
      .map((q) => row(q.label, answers[q.key]))
      .join("");
  } catch {
    return "";
  }
}

export type ApplicantEmailData = {
  displayName: string;
  username: string;
  email: string;
  discord?: string | null;
  playtime?: string | null;
  playerType?: string | null;
  interests?: string | null;
  games?: string | null;
  gameClass?: string | null;
  ign?: string | null;
  game?: string | null;
  gameAnswers?: string | null;
  applicationNote?: string | null;
};

/** To the officers' inbox when someone applies. */
export async function notifyNewApplication(a: ApplicantEmailData) {
  const body = `<table style="border-collapse:collapse;font-size:14px">
    ${row("Name", a.displayName)}${row("Username", a.username)}${row("Email", a.email)}${row("Discord", a.discord)}
    ${row("Playing MMOs", a.playtime)}${row("Player type", a.playerType)}${row("Wants to do", a.interests)}${row("Games", a.games)}
    ${row("Game", a.game)}${row("Class / IGN", [a.gameClass, a.ign].filter(Boolean).join(" · "))}
    ${gameRows(a.game, a.gameAnswers)}
  </table>
  ${a.applicationNote ? `<p style="margin:14px 0 0;padding-top:12px;border-top:1px solid rgba(155,77,255,.2)"><strong>Comments</strong><br>${esc(a.applicationNote).replace(/\n/g, "<br>")}</p>` : ""}`;
  return sendEmail({
    to: notifyEmail,
    subject: `New legion application: ${a.displayName} (${a.playerType ?? "player"})`,
    html: shell(`${a.displayName} applied to the legion`, body, { href: `${appUrl}/admin/applicants`, label: "Review in Command Center" }),
    text: `${a.displayName} (@${a.username}, ${a.email}) applied. Review: ${appUrl}/admin/applicants`,
  });
}

/** To the applicant when an officer decides. */
export async function notifyDecision(a: { displayName: string; email: string }, decision: "APPROVED" | "DENIED", note: string | null, discordInvite: string) {
  const approved = decision === "APPROVED";
  const body = approved
    ? `<p style="margin:0">You're in the legion, ${esc(a.displayName)}. An officer approved your application. Match signups, guild roles, rank votes, and the roster are now unlocked in your portal.</p>
       <p style="margin:12px 0 0">If you have not already, join the Discord: <a href="${discordInvite}" style="color:#c9ccd6">${discordInvite}</a></p>`
    : `<p style="margin:0">Thanks for applying, ${esc(a.displayName)}. An officer reviewed your application and did not approve it for the legion at this time. You are still part of the Vstroz Alliance community: Discord, media, and The Round Table stay open to you.</p>`;
  const noteHtml = note ? `<p style="margin:12px 0 0;padding-top:12px;border-top:1px solid rgba(155,77,255,.2)"><strong>Note from the officer</strong><br>${esc(note)}</p>` : "";
  return sendEmail({
    to: a.email,
    subject: approved ? "You're in the legion — Vstroz Alliance" : "Your Vstroz Alliance legion application",
    html: shell(approved ? "Legion application approved" : "Legion application update", body + noteHtml, approved ? { href: `${appUrl}/dashboard`, label: "Open the member portal" } : undefined),
  });
}

/** To the officers' inbox when a member applies for a guild role. */
export async function notifyRoleApplication(a: { displayName: string; roleName: string; message: string }) {
  return sendEmail({
    to: notifyEmail,
    subject: `Role application: ${a.displayName} → ${a.roleName}`,
    html: shell(`${a.displayName} applied for ${a.roleName}`, `<p style="margin:0">${esc(a.message).replace(/\n/g, "<br>")}</p>`, { href: `${appUrl}/admin/roles`, label: "Review role applications" }),
  });
}
