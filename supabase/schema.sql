create extension if not exists pgcrypto;

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null unique,
  email text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists cta_stations (
  id uuid primary key default gen_random_uuid(),
  map_id text not null unique,
  stop_name text not null,
  lines text[] not null default '{}',
  directions text[] not null default '{}',
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists saved_trips (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null,
  label text not null,
  origin_station_id uuid not null references cta_stations(id),
  destination_station_id uuid not null references cta_stations(id),
  route text not null,
  preferred_direction text not null check (preferred_direction in ('Northbound', 'Southbound', 'Eastbound', 'Westbound')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (clerk_user_id, label),
  check (origin_station_id <> destination_station_id)
);

create table if not exists live_arrivals (
  id uuid primary key default gen_random_uuid(),
  saved_trip_id uuid not null references saved_trips(id) on delete cascade,
  cta_prediction_id text not null,
  route text not null,
  destination_name text,
  direction text not null,
  arrival_time timestamptz not null,
  minutes_away integer not null,
  is_right_direction boolean not null,
  status_label text not null check (status_label in ('RIGHT DIRECTION', 'WRONG DIRECTION')),
  status_message text not null,
  raw_payload jsonb not null default '{}'::jsonb,
  last_updated timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (saved_trip_id, cta_prediction_id)
);

create index if not exists live_arrivals_saved_trip_id_arrival_time_idx
  on live_arrivals (saved_trip_id, arrival_time);

create index if not exists live_arrivals_last_updated_idx
  on live_arrivals (last_updated desc);

create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_saved_trips_updated_at on saved_trips;
create trigger set_saved_trips_updated_at
before update on saved_trips
for each row
execute function update_updated_at_column();

alter table profiles enable row level security;
alter table cta_stations enable row level security;
alter table saved_trips enable row level security;
alter table live_arrivals enable row level security;

create policy "profiles_select_own"
on profiles
for select
using ((auth.jwt() ->> 'sub') = clerk_user_id);

create policy "profiles_insert_own"
on profiles
for insert
with check ((auth.jwt() ->> 'sub') = clerk_user_id);

create policy "profiles_update_own"
on profiles
for update
using ((auth.jwt() ->> 'sub') = clerk_user_id)
with check ((auth.jwt() ->> 'sub') = clerk_user_id);

create policy "stations_read_authenticated"
on cta_stations
for select
using ((auth.jwt() ->> 'role') = 'authenticated');

create policy "saved_trips_select_own"
on saved_trips
for select
using ((auth.jwt() ->> 'sub') = clerk_user_id);

create policy "saved_trips_insert_own"
on saved_trips
for insert
with check ((auth.jwt() ->> 'sub') = clerk_user_id);

create policy "saved_trips_update_own"
on saved_trips
for update
using ((auth.jwt() ->> 'sub') = clerk_user_id)
with check ((auth.jwt() ->> 'sub') = clerk_user_id);

create policy "saved_trips_delete_own"
on saved_trips
for delete
using ((auth.jwt() ->> 'sub') = clerk_user_id);

create policy "live_arrivals_read_own_trip"
on live_arrivals
for select
using (
  exists (
    select 1
    from saved_trips
    where saved_trips.id = live_arrivals.saved_trip_id
      and saved_trips.clerk_user_id = (auth.jwt() ->> 'sub')
  )
);

create policy "live_arrivals_read_demo_trip_public"
on live_arrivals
for select
using (
  exists (
    select 1
    from saved_trips
    where saved_trips.id = live_arrivals.saved_trip_id
      and saved_trips.clerk_user_id = 'demo-user'
  )
);

alter publication supabase_realtime add table live_arrivals;
