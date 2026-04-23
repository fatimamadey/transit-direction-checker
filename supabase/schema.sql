create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null unique,
  email text not null unique,
  github_login text,
  created_at timestamptz not null default now()
);

create table if not exists boards (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  created_by_user_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists board_members (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references boards(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique (board_id, user_id)
);

create table if not exists sources (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('user', 'repo')),
  value text not null,
  display_name text not null,
  last_etag text,
  last_polled_at timestamptz,
  next_poll_at timestamptz not null default now(),
  poll_interval_seconds integer not null default 60,
  last_status_code integer,
  last_error text,
  created_at timestamptz not null default now(),
  unique (type, value)
);

create table if not exists board_sources (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references boards(id) on delete cascade,
  source_id uuid not null references sources(id) on delete cascade,
  added_by_user_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (board_id, source_id)
);

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  github_event_id text not null unique,
  source_id uuid not null references sources(id) on delete cascade,
  event_type text not null,
  actor_login text,
  repo_name text,
  subject_title text,
  subject_url text,
  occurred_at timestamptz not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists board_events (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references boards(id) on delete cascade,
  event_id uuid not null references events(id) on delete cascade,
  source_id uuid not null references sources(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (board_id, event_id)
);

create index if not exists boards_slug_idx on boards (slug);
create index if not exists board_members_user_id_board_id_idx on board_members (user_id, board_id);
create index if not exists board_sources_board_id_source_id_idx on board_sources (board_id, source_id);
create index if not exists sources_type_value_idx on sources (type, value);
create index if not exists sources_next_poll_at_idx on sources (next_poll_at);
create index if not exists events_source_id_occurred_at_idx on events (source_id, occurred_at desc);
create index if not exists board_events_board_id_created_at_idx on board_events (board_id, created_at desc);
create index if not exists board_events_event_id_idx on board_events (event_id);

alter table users enable row level security;
alter table boards enable row level security;
alter table board_members enable row level security;
alter table sources enable row level security;
alter table board_sources enable row level security;
alter table events enable row level security;
alter table board_events enable row level security;

create policy "users_select_own"
on users
for select
using ((auth.jwt() ->> 'sub') = clerk_user_id);

create policy "users_insert_own"
on users
for insert
with check ((auth.jwt() ->> 'sub') = clerk_user_id);

create policy "users_update_own"
on users
for update
using ((auth.jwt() ->> 'sub') = clerk_user_id)
with check ((auth.jwt() ->> 'sub') = clerk_user_id);

create policy "boards_public_read"
on boards
for select
using (true);

create policy "board_members_read_public"
on board_members
for select
using (true);

create policy "sources_public_read"
on sources
for select
using (true);

create policy "board_sources_public_read"
on board_sources
for select
using (true);

create policy "events_public_read"
on events
for select
using (true);

create policy "board_events_public_read"
on board_events
for select
using (true);
