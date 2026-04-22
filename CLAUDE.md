# CLAUDE.md

## Project Overview

`Take This One` is a small transit app focused on a single question:

> Am I about to get on the right train or the wrong one?

This repo is intentionally narrow and beginner-friendly. It uses CTA train predictions, not a broad transit planner.

## Architecture

### Monorepo packages

- `apps/web`: Next.js frontend with Clerk auth and a simple dashboard
- `apps/worker`: Node.js polling worker for CTA Train Tracker
- `packages/shared`: shared types, constants, and CTA station seed data
- `supabase`: SQL schema and seed files

## Data Flow

```text
CTA Train Tracker API
  -> apps/worker
  -> Supabase tables
  -> Supabase Realtime
  -> apps/web dashboard
```

## Core Tables

- `profiles`: maps Clerk users to local profile rows
- `cta_stations`: curated CTA station list for the MVP
- `saved_trips`: user-owned favorite trips
- `live_arrivals`: worker-produced arrival snapshots for each saved trip

## Auth Model

- Clerk handles signup, signin, and session management
- App tables use `clerk_user_id` as the user key
- Next.js server actions check the current Clerk user before writing to Supabase
- Supabase Realtime uses a Clerk JWT template named `supabase`

## Worker Behavior

- Poll every 60 seconds by default
- Load all active saved trips
- Group trips by CTA station `map_id`
- Fetch CTA predictions
- Mark each prediction as right or wrong for each trip
- Upsert into `live_arrivals`
- Remove stale rows for trips that were refreshed

## Frontend Behavior

- Landing page explains the product simply
- Dashboard shows saved trips in large cards
- Correct trains are green
- Wrong-direction trains are red
- Friendly copy reduces hesitation and confusion

## Design Intent

This should not feel like a generic transit dashboard.

It should feel:
- obvious
- reassuring
- uncluttered
- direction-focused

The main UI copy should sound like a calm person helping the user avoid a mistake.
