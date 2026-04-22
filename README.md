# Take This One

`Take This One` is a small full-stack transit app for people who only want one answer: am I about to board the right train?

The repo name is `transit-direction-checker`, but the product branding in the UI is `Take This One`.

## Tech Stack

- `apps/web`: Next.js App Router, Tailwind CSS, Clerk, Supabase
- `apps/worker`: Node.js worker that polls CTA Train Tracker
- `packages/shared`: shared types, station seeds, helpers
- Supabase Postgres + Realtime
- Vercel for the web app
- Railway for the worker

## Monorepo Structure

```text
.
├─ apps/
│  ├─ web
│  └─ worker
├─ packages/
│  └─ shared
└─ supabase/
   ├─ schema.sql
   └─ seed.sql
```

## Local Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create env files

Copy the root `.env.example` values into:

- `apps/web/.env.local`
- `apps/worker/.env.local`

Recommended split:

`apps/web/.env.local`

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

`apps/worker/.env.local`

```bash
SUPABASE_PROJECT_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
CTA_TRAIN_TRACKER_API_KEY=...
WORKER_POLL_INTERVAL_MS=60000
```

### 3. Configure Clerk -> Supabase JWT

Create a Clerk JWT template named `supabase`.

Use:

- `sub` = Clerk user id
- `email` = user email
- `role` = `authenticated`

Then the browser Supabase client can subscribe to Realtime using the Clerk-issued JWT.

### 4. Run SQL in Supabase

Run:

1. `supabase/schema.sql`
2. `supabase/seed.sql`

### 5. Start local dev

```bash
npm run dev:web
```

In another terminal:

```bash
npm run dev:worker
```

## Deploy

### Vercel

Project root:
- `apps/web`

Environment variables:
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL`
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL`
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Build command:

```bash
npm run build
```

### Railway

Project root:
- `apps/worker`

Environment variables:
- `SUPABASE_PROJECT_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CTA_TRAIN_TRACKER_API_KEY`
- `WORKER_POLL_INTERVAL_MS`

Start command:

```bash
npm run start
```

## Product Scope

- CTA trains only
- Small set of saved trips
- No route planner
- No map-first explorer
- Friendly dashboard focused on direction mistakes

## Notes

- The web app uses server actions for trip writes.
- The worker writes trip-specific live arrival rows into Supabase.
- Supabase Realtime pushes `live_arrivals` changes into the dashboard.
