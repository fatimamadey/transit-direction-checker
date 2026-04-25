# Pulseboard

`Pulseboard` is a GitHub activity dashboard built around named boards. A board is a clear group of tracked GitHub users and repositories. The product is organized around three surfaces:

- `/` shows a minimal product intro and real public boards immediately
- `/boards` is the public directory for exploring and joining boards
- `/boards/[slug]` is the live board workspace with the feed, tracked sources, and board controls

The frontend polls our own API. The worker polls GitHub sources with ETags and fanout.

## Stack

- `apps/web`: Next.js App Router, Tailwind CSS, Clerk, Recharts, Supabase
- `apps/worker`: Node.js worker running on Railway
- `packages/shared`: shared helpers and types
- Supabase Postgres
- Vercel for the web app
- Railway for the worker

## Product shape

- Boards can be public or private
- Users can create boards, join boards, rename boards, and add tracked sources
- Sources are globally deduplicated by `type + value`
- Worker polls GitHub sources, not boards
- Browser polls board snapshots every ~5 seconds
- UI uses a dark editor-style control-room aesthetic with rails, board rows, compact charts, and a feed-first board page
- Board listings always show:
  - board name
  - tracked repos/users
  - freshness
  - primary action
- Entry flow is split clearly:
  - `/` explains the app in one pass and shows real boards immediately
  - `/boards` is the public board directory
  - `/dashboard` is the signed-in workspace for your boards

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

If you already have an existing database, also run:

3. `supabase/migrations/add_board_visibility.sql`
4. `supabase/migrations/tighten_public_read_policies.sql`

The seed file creates a few public sample boards so the landing page and public directory are populated immediately.

### 4. Configure Clerk

Use Clerk for auth and allow the providers you want, currently Google and GitHub.

The current product uses polling and server-side API routes. Supabase Realtime and a Clerk JWT template are not required for the main flow.

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
  -> board rows, timeline strips, live feed
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

- `Recharts` is used for compact quantitative visuals.
- GitHub activity is not truly real-time, so the UI is intentionally honest about freshness.
- The app no longer reads Supabase directly from the browser; board data flows through Next.js API routes.
