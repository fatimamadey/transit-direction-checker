# Pulseboard

`Pulseboard` is a GitHub activity dashboard where people join public boards and watch GitHub events as a visual pulse instead of a plain feed. Boards aggregate activity from tracked GitHub users and repositories. The frontend polls our own API, and the worker polls GitHub sources with ETags and fanout.

## Stack

- `apps/web`: Next.js App Router, Tailwind CSS, Clerk, Recharts, Supabase
- `apps/worker`: Node.js worker running on Railway
- `packages/shared`: shared helpers and types
- Supabase Postgres
- Vercel for the web app
- Railway for the worker

## Product shape

- Public boards only
- Users can create boards, join boards, and add tracked sources
- Sources are globally deduplicated by `type + value`
- Worker polls GitHub sources, not boards
- Browser polls board snapshots every ~5 seconds
- UI uses a dark Radical-inspired control-room aesthetic with charts, source orbit visuals, and an animated live ticker

## Local setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create env files

Create:

- `apps/web/.env.local`
- `apps/worker/.env.local`

Suggested web env:

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

Suggested worker env:

```bash
SUPABASE_PROJECT_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
GITHUB_TOKEN=...
WORKER_POLL_INTERVAL_MS=60000
```

### 3. Configure Supabase

Run:

1. `supabase/schema.sql`
2. `supabase/seed.sql`

### 4. Configure Clerk

Use Clerk for auth and allow the providers you want, currently Google and GitHub.

If you want Supabase Realtime later, create a Clerk JWT template named `supabase` with:

- `sub` = Clerk user id
- `email` = user email
- `role` = `authenticated`

The current board UI uses polling, so that JWT template is not required for the main redesigned flow.

### 5. Run locally

Web:

```bash
npm run dev:web
```

Worker:

```bash
npm run dev:worker
```

Build checks:

```bash
npm run build:web
npm run build:worker
```

## Data flow

```text
GitHub Events API
  -> worker tick
  -> poll due sources with ETag / X-Poll-Interval
  -> normalize and store global events
  -> fan out into board_events
  -> web API routes
  -> browser polling on board pages
  -> charts, orbit view, live ticker
```

## Important routes

- `GET /api/boards`
  - public board discovery
- `POST /api/boards`
  - create a new board
- `POST /api/boards/[slug]/join`
  - join a public board
- `POST /api/boards/[slug]/sources`
  - add a tracked GitHub user or repo
- `GET /api/boards/[slug]/snapshot?since=timestamp`
  - returns:
    - new events since cursor
    - board summary
    - timeline buckets
    - source node activity
    - `serverTime`

## Deploy

### Vercel

Import the repo and set:

- Root Directory: `apps/web`
- Framework Preset: `Next.js`

Set these env vars:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up`
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard`
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### Railway

Deploy from the repo root.

- Build Command: `npm run build:worker`
- Start Command: `npm run start:worker`

Set these env vars:

- `SUPABASE_PROJECT_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GITHUB_TOKEN`
- `WORKER_POLL_INTERVAL_MS=60000`

## Notes

- `Recharts` is used for the quantitative dashboard visuals.
- Custom SVG + Tailwind motion is used for source orbit and ticker-style UI.
- GitHub activity is not truly real-time, so the UI should feel live without pretending the source is instantaneous.
