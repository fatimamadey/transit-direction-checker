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

Per Vercel's monorepo flow, import the GitHub repo and set the project `Root Directory` to `apps/web`.

Dashboard settings:

- Framework Preset: `Next.js`
- Root Directory: `apps/web`
- Install Command: leave default
- Build Command: leave default or set `npm run build`
- Output Directory: leave default

Environment variables:

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

Recommended production values:

- `NEXT_PUBLIC_APP_URL=https://your-vercel-domain.vercel.app`
- keep the Clerk route values exactly as listed above

Clerk dashboard updates after Vercel deploy:

- add your Vercel domain to Allowed Origins
- add `https://your-vercel-domain.vercel.app/sign-in`
- add `https://your-vercel-domain.vercel.app/sign-up`
- set the app home URL to `https://your-vercel-domain.vercel.app`

Supabase note:

- `NEXT_PUBLIC_SUPABASE_URL` should be your project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` should be the anon public JWT key
- `SUPABASE_SERVICE_ROLE_KEY` is used only on the server side by Next.js server actions

### Railway

This repo is a shared `npm` workspace monorepo, so the safest Railway setup is to deploy from the repository root and use worker-specific root commands.

Dashboard settings:

- Source Repo: `fatimamadey/transit-direction-checker`
- Root Directory: leave as `/`
- Build Command: `npm run build:worker`
- Start Command: `npm run start:worker`

Recommended watch paths:

- `/apps/worker/**`
- `/packages/shared/**`
- `/package.json`
- `/package-lock.json`

Environment variables:

- `SUPABASE_PROJECT_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CTA_TRAIN_TRACKER_API_KEY`
- `WORKER_POLL_INTERVAL_MS=60000`

Recommended service name:

- `take-this-one-worker`

Why root deploy instead of `apps/worker`:

- the worker depends on the local shared workspace package
- deploying from the repo root lets Railway install workspace dependencies correctly

### Current project values to copy into dashboards

Use the values from your local env files. Do not commit them.

For Vercel:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

For Railway:

- `SUPABASE_PROJECT_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CTA_TRAIN_TRACKER_API_KEY`
- `WORKER_POLL_INTERVAL_MS`

### Supabase setup before first deploy

Run these in the Supabase SQL editor:

1. `supabase/schema.sql`
2. `supabase/seed.sql`

Then open:

- Database -> Replication / Realtime

Confirm `live_arrivals` is enabled for Realtime.

### Clerk -> Supabase JWT template

Create a Clerk JWT template named `supabase` with claims shaped for Supabase row access.

Minimum claims:

- `sub`: Clerk user id
- `email`: user email
- `role`: `authenticated`

The browser client uses that template for Realtime subscriptions.

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
