drop policy if exists "boards_public_read" on boards;
drop policy if exists "board_members_read_public" on board_members;
drop policy if exists "sources_public_read" on sources;
drop policy if exists "board_sources_public_read" on board_sources;
drop policy if exists "events_public_read" on events;
drop policy if exists "board_events_public_read" on board_events;

create policy "boards_public_read"
on boards
for select
using (
  is_public
  or exists (
    select 1
    from board_members
    join users on users.id = board_members.user_id
    where board_members.board_id = boards.id
      and users.clerk_user_id = (auth.jwt() ->> 'sub')
  )
);
