# CLAUDE.md

## Project Overview

`Pulseboard` is a GitHub activity dashboard where users join shared boards to watch live-ish GitHub activity from selected users and repositories.

This project uses polling, not WebSockets. The product should feel live, but it must honestly reflect the behavior of the GitHub Events API, which can lag by tens of seconds or more.

Recommended repo name:

- `github-activity-boards`

Current product name:

- `Pulseboard`

## Product Model

Primary action:

- users explore public boards
- users join boards
- users create boards

Each board shows a feed of GitHub activity from tracked sources:

- GitHub users
- GitHub repositories

Each source is deduplicated globally. Boards do not own their own polling jobs.

## Core Architecture

```text
GitHub REST API
  -> apps/worker polling loop (every 5s tick)
  -> deduplicated source polling with ETag support
  -> Supabase sources/events/board_events tables
  -> apps/web API routes
  -> frontend polling every 5s
  -> board feed UI
```

Important constraint:

- the worker wakes up every `~5s`
- individual sources are only polled when due
- due time is determined by:
  - `X-Poll-Interval` from GitHub
  - local backoff / last poll time
  - rate-limit protection

This avoids the naive and incorrect approach of polling per board.

## Architecture Diagram

```text
                       +----------------------+
                       |    Clerk Auth        |
                       |   GitHub OAuth       |
                       +----------+-----------+
                                  |
                                  v
+------------+          +---------+----------+          +----------------------+
|  Browser    |  poll   |   apps/web         |  SQL/API |      Supabase        |
|  board feed +-------->+  Next.js API       +--------->+  Postgres tables     |
|  every ~5s  |         |  board pages       |          |  boards, sources,    |
+-----+------+          +---------+----------+          |  events, board_events|
      ^                           ^                     +----------+-----------+
      |                           |                                ^
      |                           |                                |
      |                           |                                |
      |                 board CRUD / joins                         |
      |                           |                                |
      |                           v                                |
      |                  +--------+---------+                      |
      |                  |  apps/worker     |  poll due sources    |
      +------------------+  Railway worker  +----------------------+
                         |  tick every ~5s  |
                         +--------+---------+
                                  |
                                  v
                         +--------+---------+
                         | GitHub Events API|
                         | users/repos feed |
                         +------------------+
```

## Monorepo Responsibilities

- `apps/web`
  - public board discovery
  - board creation and join flows
  - authenticated source management
  - board event feed polling
- `apps/worker`
  - polls GitHub sources
  - respects ETags and poll intervals
  - stores and fans out events
- `packages/shared`
  - shared types for boards, sources, events, API payloads
- `supabase`
  - schema and seed/migration files

## Data Model

### `users`

Purpose:

- local profile rows keyed by Clerk user id

Key columns:

- `id uuid primary key`
- `clerk_user_id text unique not null`
- `github_login text`
- `created_at timestamptz`

### `boards`

Purpose:

- public collections of GitHub activity

Key columns:

- `id uuid primary key`
- `slug text unique not null`
- `name text not null`
- `description text`
- `created_by_user_id uuid references users(id)`
- `created_at timestamptz`

Rules:

- boards are public
- slugs are unique
- creator is the initial member

### `board_members`

Purpose:

- records which users joined which boards

Key columns:

- `board_id uuid references boards(id)`
- `user_id uuid references users(id)`
- `joined_at timestamptz`

Constraint:

- unique `(board_id, user_id)`

### `sources`

Purpose:

- globally deduplicated GitHub polling targets

Key columns:

- `id uuid primary key`
- `type text check in ('user', 'repo')`
- `value text unique not null`
- `display_name text not null`
- `last_etag text`
- `last_polled_at timestamptz`
- `next_poll_at timestamptz`
- `poll_interval_seconds integer`
- `last_status_code integer`
- `last_error text`
- `created_at timestamptz`

Examples:

- `('user', 'gaearon')`
- `('repo', 'vercel/next.js')`

### `board_sources`

Purpose:

- links boards to deduplicated sources

Key columns:

- `id uuid primary key`
- `board_id uuid references boards(id)`
- `source_id uuid references sources(id)`
- `added_by_user_id uuid references users(id)`
- `created_at timestamptz`

Constraint:

- unique `(board_id, source_id)`

Decision:

- any board member can add a source in v1

### `events`

Purpose:

- stores deduplicated GitHub events once globally

Key columns:

- `id uuid primary key`
- `github_event_id text unique not null`
- `source_id uuid references sources(id)`
- `event_type text not null`
- `actor_login text`
- `repo_name text`
- `subject_title text`
- `subject_url text`
- `occurred_at timestamptz not null`
- `payload jsonb not null`
- `created_at timestamptz`

Notes:

- raw payload stays in `payload`
- normalized summary fields support fast rendering

### `board_events`

Purpose:

- fanout table linking global events to all affected boards

Key columns:

- `board_id uuid references boards(id)`
- `event_id uuid references events(id)`
- `source_id uuid references sources(id)`
- `created_at timestamptz`

Constraint:

- unique `(board_id, event_id)`

## Key Indexes

- `boards(slug)`
- `board_members(user_id, board_id)`
- `board_sources(board_id, source_id)`
- `sources(type, value)`
- `sources(next_poll_at)`
- `events(github_event_id)`
- `events(source_id, occurred_at desc)`
- `board_events(board_id, created_at desc)`
- `board_events(event_id)`

## Example Rows

### `boards`

- `slug = 'cmsc-220-ships'`
- `name = 'CMSC 220 Ships'`
- `description = 'Track instructor and TA repos for the class'`

### `sources`

- `type = 'repo', value = 'vercel/next.js'`
- `type = 'user', value = 'gaearon'`

### `events`

- `github_event_id = '47123456789'`
- `event_type = 'PushEvent'`
- `actor_login = 'gaearon'`
- `repo_name = 'facebook/react'`
- `subject_title = '3 commits pushed'`

## Worker Design

Worker tick:

- runs every `~5s`
- selects due sources where `next_poll_at <= now()`
- respects a small batch limit per tick

Polling rules:

- send `If-None-Match` when `last_etag` exists
- on `304`
  - update `last_polled_at`
  - update `next_poll_at`
  - keep stored events unchanged
- on `200`
  - parse events
  - deduplicate by `github_event_id`
  - insert new global events
  - attach new events to every related board
  - update `last_etag`, `last_polled_at`, `next_poll_at`
- on error or rate limit
  - record status/error
  - back off `next_poll_at`

### Worker Pseudocode

```text
loop every 5 seconds:
  dueSources = select sources
    where next_poll_at <= now()
    order by next_poll_at asc
    limit N

  for source in dueSources:
    request = build GitHub events URL for source
    headers = auth headers
    if source.last_etag:
      headers["If-None-Match"] = source.last_etag

    response = fetch(request, headers)

    pollInterval = response.X-Poll-Interval or defaultInterval

    if response.status == 304:
      update source:
        last_polled_at = now
        next_poll_at = now + pollInterval
        last_status_code = 304
      continue

    if response.status == 200:
      rawEvents = response.json()
      relatedBoards = select boards joined through board_sources for source.id

      for rawEvent in rawEvents:
        if events.github_event_id already exists:
          continue

        eventId = insert normalized event

        for board in relatedBoards:
          insert board_events(board.id, eventId, source.id)
          on conflict do nothing

      update source:
        last_etag = response.ETag
        last_polled_at = now
        next_poll_at = now + pollInterval
        last_status_code = 200
      continue

    if response.status indicates rate limit or error:
      update source:
        last_polled_at = now
        next_poll_at = now + backoff
        last_status_code = response.status
        last_error = response body summary
```

## Frontend Polling

The frontend polls our own backend, not GitHub.

Polling behavior:

- board page loads initial events server-side or via first client fetch
- browser polls every `~5s`
- requests `GET /api/boards/:slug/events?since=<cursor>`

`since` design:

- use ISO timestamp from the newest event currently rendered
- backend returns only `board_events.created_at > since`
- results are sorted oldest-to-newest within the delta

How to avoid re-fetching old data:

- client stores newest seen timestamp
- each poll uses that timestamp
- backend uses indexed `board_events` and returns only new rows

How to keep UI smooth:

- prepend new items in a transition
- optionally show a `3 new events` pill before inserting
- animate entry subtly
- show `Last checked 5s ago`
- show `GitHub can lag by a minute or two` helper text

## Board System Decisions

### Discovery

Users discover boards through:

- `/boards` directory page
- search by board name or slug
- recent / popular boards

### Slugs

- boards must have unique slugs
- slug is the stable URL key
- generate from name, then suffix on collision

### Duplicate Boards

To avoid obvious duplicates:

- unique slug constraint
- creator sees similar existing boards during creation
- optional soft warning when names are very close

Do not over-engineer this for v1. A duplicate warning is enough.

### Source Creation

When a member adds a source:

1. normalize input into either `user` or `repo`
2. upsert into `sources`
3. insert into `board_sources`
4. worker picks it up automatically

## API Design

### `POST /api/boards`

Creates a board.

Request:

```json
{
  "name": "CMSC 220 Ships",
  "description": "Track class repos and maintainer activity"
}
```

Response:

```json
{
  "id": "board_uuid",
  "slug": "cmsc-220-ships",
  "name": "CMSC 220 Ships"
}
```

### `POST /api/boards/:slug/join`

Joins the current user to a board.

Response:

```json
{
  "ok": true,
  "boardSlug": "cmsc-220-ships"
}
```

### `GET /api/boards`

Returns public boards.

Response:

```json
{
  "boards": [
    {
      "slug": "cmsc-220-ships",
      "name": "CMSC 220 Ships",
      "memberCount": 18,
      "sourceCount": 4
    }
  ]
}
```

### `GET /api/boards/:slug/events?since=2026-04-22T18:00:00.000Z`

Returns new board events after `since`.

Response:

```json
{
  "events": [
    {
      "id": "event_uuid",
      "githubEventId": "47123456789",
      "eventType": "PullRequestEvent",
      "actorLogin": "fatimamadey",
      "repoName": "fatimamadey/github-activity-boards",
      "subjectTitle": "Opened PR #12",
      "occurredAt": "2026-04-22T18:00:04.000Z",
      "source": {
        "type": "repo",
        "value": "fatimamadey/github-activity-boards"
      }
    }
  ],
  "serverTime": "2026-04-22T18:00:10.000Z"
}
```

### `POST /api/boards/:slug/sources`

Adds a source to a board.

Request:

```json
{
  "type": "repo",
  "value": "vercel/next.js"
}
```

Response:

```json
{
  "ok": true,
  "source": {
    "id": "source_uuid",
    "type": "repo",
    "value": "vercel/next.js"
  }
}
```

## Scaling Notes

### When many boards share the same source

- source is polled once
- events are stored once
- fanout writes multiple `board_events` rows
- GitHub API usage stays bounded by unique source count, not board count

### When many users join one board

- backend poll cost does not change
- frontend load scales with polling requests to our own API
- indexed `board_events(board_id, created_at desc)` keeps feed fetch cheap

This is the right tradeoff for a class project:

- modest DB fanout cost
- much lower external API cost

## UX Notes

Because GitHub data is delayed:

- avoid claiming instant delivery
- use copy like `Updated moments ago`
- animate new rows so the feed feels alive
- show relative time and last refresh time
- make delays explicit in a subtle helper note

## Implementation Priorities

1. Replace transit schema with boards/sources/events schema
2. Replace CTA worker with GitHub source poller
3. Build board directory, board page, join/create flows
4. Add polling-based board feed API
5. Add source management UI for board members

## Working Rules

- Keep Clerk, Supabase, Vercel, and Railway
- Use GitHub OAuth only in Clerk
- Do not use WebSockets
- Build and run after meaningful changes
- Use Playwright against a reachable environment for workflow verification
