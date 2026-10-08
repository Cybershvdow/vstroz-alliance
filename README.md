# Vstroz Alliance — Guild Website & Member Portal

A production-grade website and members portal for the Vstroz Alliance, a multi-game community with **Aion** as its flagship title.

- **Public site**: home, games, roster, schedule, recruitment.
- **Accounts**: anyone can create an account and is part of the community right away: portal, media, rank votes, The Round Table, and a public profile at `/members/<username>` with social links.
- **Legion applications**: members fill in a player profile and apply to the Aion legion from `/dashboard/legion`; officers approve or deny with a note. Approval unlocks match signups, guild roles, and the roster.
- **Member portal** (unlocked on approval): match signups, guild-role applications, announcements, profile.
- **Command center** (officers/leader): applicant queue, member management, match creation and roster confirmation, guild roles, announcements.

## Stack

| Layer     | Choice                                   |
| --------- | ---------------------------------------- |
| Framework | Next.js 16 (App Router) + React 19 + TS  |
| Styling   | Tailwind CSS 4, custom esports theme     |
| Database  | Prisma 6 + SQLite (swap to Postgres for prod) |
| Auth      | Cookie sessions (signed JWT via `jose`), bcrypt password hashing |
| Forms     | Server Actions + `useActionState`, Zod validation |

## Quick start

```bash
npm install
npm run db:push      # create the SQLite database
npm run db:seed      # the two General accounts + role definitions (use db:seed:demo for fake data)
npm run dev          # http://localhost:3000
```

### Accounts

`npm run db:seed` creates the real leadership only:

| Account | Username | Password |
| --- | --- | --- |
| Alliance Leader | `cybershvdow` | `SEED_LEADER_PASSWORD` in `.env` |
| Alliance Leader & Founder | `nugget` | `SEED_NUGGET_PASSWORD` in `.env` |

Both should change their password after first sign-in (Profile → Password). Everyone else joins by applying on the site.

For a populated demo (fake members, matches, votes), run `npm run db:seed:demo` instead. Demo accounts use `Password123!`.

## Environment

Copy `.env.example` to `.env`:

```
DATABASE_URL="file:./dev.db"
SESSION_SECRET="<long random string>"      # node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
SEED_LEADER_PASSWORD="<leader password used by the seed>"
```

## Editing content

| What                         | Where                          |
| ---------------------------- | ------------------------------ |
| Site name, motto, Discord link, socials | `src/lib/site.ts`  |
| Games list, pillars, milestones, weekly rhythm, requirements | `src/lib/site.ts` |
| Aion classes, match types, positions | `src/lib/constants.ts` |
| Colors, fonts, effects       | `src/app/globals.css` (`@theme`) |
| Logo artwork                 | `scripts/build-logo.mjs` (run `npm run logo` to regenerate SVG/PNG exports and the inline component) |

Roster, matches, roles, and announcements are managed from the Command Center at `/admin`, not in code.

## Roles & permissions

| Role      | Can                                                                 |
| --------- | ------------------------------------------------------------------- |
| Member    | Sign up for matches, apply for guild roles, edit own profile        |
| Officer   | Everything above + approve/deny applicants, create matches, confirm rosters, manage roles and announcements, set member titles, remove members |
| Leader    | Everything above + promote/demote officers                          |

Pending and denied accounts can sign in but only see their application status.

## Scripts

| Script            | Purpose                                        |
| ----------------- | ---------------------------------------------- |
| `npm run dev`     | Development server                             |
| `npm run build`   | Production build                               |
| `npm run start`   | Serve the production build                     |
| `npm run db:push` | Apply the Prisma schema to the database        |
| `npm run db:seed` | Reset to the real leadership only (Cybershvdow, Nugget) |
| `npm run db:seed:demo` | Populate with demo members, matches, and votes |
| `npm run db:reset`| Drop, recreate, and reseed                     |
| `npm run db:studio` | Browse the database in Prisma Studio         |
| `npm run lint`    | ESLint                                         |
| `npm run logo`    | Rebuild logo exports in `public/brand/` and `src/app/icon.png` |

## Application questions per game

The application asks which game the person is applying for, then shows questions that fit that game type. Both live in `src/lib/constants.ts`:

- `GAME_CATALOG` lists games with a genre (`MMO`, `FPS`, `MOBA`, `BATTLE_ROYALE`, `STRATEGY`, `OTHER`) and an `enabled` flag. Only enabled games appear in the form. Add a line to add a game.
- `GENRE_QUESTIONS` holds the question set for each genre (role, rank, experience, hours per week, voice, previous teams, and so on). MMO games with a `classes` list get a class dropdown automatically.

Answers are stored with the application and shown to officers in the Applicants queue and in the notification email.

## The Round Table & Media

- **The Round Table** (`/dashboard/table`, `/admin/table`): command (Generals and Captains) settles disputes and reviews tryouts here. Members bring disputes with a subject and details; officers record a decision (Resolved / Dismissed) that the member can see. Rank votes are linked from the same place.
- **Tryouts**: members request a tryout from The Round Table; officers mark them Scheduled / Passed / Failed, then open an Elite vote on the Ranks page.
- **Media** (`/media`): folder overview. A Vstroz Alliance folder (`/media/alliance`) holds posts flagged official; every member who posts gets a folder on their public profile (`/members/<username>`, `?v=<postId>` opens a video). Members post YouTube or Twitch links from `/dashboard/media`; officers approve, feature, hide, delete, or move posts between folders at `/admin/media`, and "Post as Vstroz Alliance" goes live immediately. Set `site.twitchChannel` in `src/lib/site.ts` to show a live Twitch player. Alliance social links live in `site.social`; members add their own on their profile.
- **Rules** (`/rules`): code of conduct, chain of command, and rank ladder, all from `rules` in `src/lib/site.ts`. Officer titles come from `ROLE_LABEL` in `src/lib/constants.ts` (General, Captain).

## Ranks & voting

Members climb a four-step ladder: **Recruit → Member → Veteran → Elite**. Elite is the competitive roster.

- Recruit → Member is an officer decision (Command Center → Ranks & votes).
- Veteran and Elite are decided by vote. An officer opens a nomination with a written case; everyone at the target rank or above, plus officers and leaders, can vote Yes / No / Abstain. Nominees cannot vote on themselves.
- Rules live in `src/lib/constants.ts` (`VOTE_RULES`): 72-hour window, quorum of 3 counted votes, two-thirds Yes to pass. Expired votes close automatically the next time anyone opens a votes page.
- Leaders can close a vote early, veto it, or override a rank directly. Officers can close a vote once its window has ended, or withdraw it.

Members see open votes and results under **Rank votes** in the portal. The public roster shows Elite and Veteran badges.

## Email notifications

When someone applies, the officers' inbox (`NOTIFY_EMAIL`) gets an email with every answer and a link to the approval queue. Applicants get an email when they are approved or denied, and role applications also notify the inbox. Sending uses [Resend](https://resend.com) (free tier: 3,000 emails/month).

1. Create a free Resend account with the inbox address, then create an API key.
2. Put it in `.env` as `RESEND_API_KEY`. Set `NOTIFY_EMAIL` to the inbox and `APP_URL` to the public site address.
3. Without a verified domain, Resend only delivers from `onboarding@resend.dev` to the account owner's own address, which is fine for the officer inbox. To email applicants at any address, add your domain in Resend and set `EMAIL_FROM` to it.

If `RESEND_API_KEY` is empty, the site logs the email to the server console instead of sending it.

## Deploying

SQLite is perfect for local use and for a single-server host with persistent disk (Railway, Render, Fly.io, a VPS). For serverless hosts like Vercel, switch to Postgres:

1. Create a Postgres database (Neon, Supabase, Railway).
2. In `prisma/schema.prisma` change `provider = "sqlite"` to `provider = "postgresql"`.
3. Set `DATABASE_URL` to the Postgres connection string.
4. Run `npx prisma db push` (or set up migrations with `npx prisma migrate dev`).
5. Set `SESSION_SECRET` in the host's environment variables.

Then `npm run build` and `npm run start`, or connect the repo to the host for automatic deploys.

### Railway notes (how the live site is set up)

- Production runs on Railway from this repository (branch `main`), built with the Dockerfile. Pushing to `main` redeploys automatically.
- Railway injects `PORT=8080`, so every domain in Settings → Networking must target port **8080**, not 3000.
- A volume is mounted at `/data`; `DATABASE_URL=file:/data/vstroz.db`. `scripts/bootstrap.mjs` creates the leadership accounts on first boot if the database is empty.
- Custom domains need two DNS records each at the registrar: the CNAME (or ALIAS for the root domain) Railway shows, **and** the `_railway-verify` TXT record. Each domain gets its own CNAME target.
- Railway stages changes; click **Deploy** (top bar) or they never apply.
- Live: https://vstrozalliance.com and https://www.vstrozalliance.com

## Logo

The official artwork is the raven crest in `public/brand/source-logo.webp`. `node scripts/import-logo.mjs <file>` turns any new version into the site assets: `logo-raven-1024.png` and `logo-raven-512.png` (edges faded to transparent so the crest floats on the dark theme), `logo-hero.png` for the home hero, `logo-tile-1024.png` on solid black for Discord and social avatars, and `src/app/icon.png` for the favicon and link previews. The site is themed to the logo: violet accent, silver type, black surfaces, in `src/app/globals.css`. Older artwork is kept in `public/brand/archive/`.

## Project structure

```
prisma/            schema + seed
src/app/(site)     public pages (home, games, roster, schedule, recruit)
src/app/(auth)     login, register
src/app/dashboard  member portal (gated on approval)
src/app/admin      command center (officers + leader)
src/lib            db, auth, session, validation, server actions, site content
src/components     brand (logo), ui primitives, site sections, forms, portal shell
src/proxy.ts       route protection (Next 16 "proxy", formerly middleware)
```
