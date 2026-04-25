insert into users (clerk_user_id, email, github_login)
values
  ('seed-open-source-guide', 'seed-open-source-guide@pulseboard.dev', 'open-source-guide'),
  ('seed-campus-builders', 'seed-campus-builders@pulseboard.dev', 'campus-builders'),
  ('seed-design-watch', 'seed-design-watch@pulseboard.dev', 'design-watch')
on conflict (clerk_user_id) do update
set
  email = excluded.email,
  github_login = excluded.github_login;

with seeded_boards as (
  select
    u.id as user_id,
    board.slug,
    board.name,
    board.description
  from users u
  join (
    values
      ('seed-open-source-guide', 'ai-tooling-watch', 'AI Tooling Watch', 'OpenAI, Vercel, and model tooling repos in one board.'),
      ('seed-campus-builders', 'student-builders', 'Student Builders', 'A board for student projects and the people shipping them.'),
      ('seed-design-watch', 'design-engineering', 'Design Engineering', 'Design systems, frontend infra, and UI engineering activity.')
  ) as board(owner_clerk_user_id, slug, name, description)
    on board.owner_clerk_user_id = u.clerk_user_id
)
insert into boards (slug, name, description, created_by_user_id)
select slug, name, description, true, user_id
from seeded_boards
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  is_public = excluded.is_public;

insert into board_members (board_id, user_id)
select b.id, u.id
from boards b
join users u on u.id = b.created_by_user_id
where b.slug in ('ai-tooling-watch', 'student-builders', 'design-engineering')
on conflict (board_id, user_id) do nothing;

insert into sources (type, value, display_name)
values
  ('repo', 'vercel/next.js', 'vercel/next.js'),
  ('repo', 'openai/openai-node', 'openai/openai-node'),
  ('repo', 'openai/openai-python', 'openai/openai-python'),
  ('repo', 'supabase/supabase', 'supabase/supabase'),
  ('repo', 'tailwindlabs/tailwindcss', 'tailwindlabs/tailwindcss'),
  ('repo', 'shadcn-ui/ui', 'shadcn-ui/ui'),
  ('user', 'fatimamadey', 'fatimamadey'),
  ('user', 'gaearon', 'gaearon'),
  ('user', 'addyosmani', 'addyosmani')
on conflict (type, value) do update
set display_name = excluded.display_name;

with board_source_map as (
  select
    b.id as board_id,
    s.id as source_id,
    b.created_by_user_id as added_by_user_id
  from boards b
  join sources s
    on (
      b.slug = 'ai-tooling-watch' and (s.value in ('vercel/next.js', 'openai/openai-node', 'openai/openai-python', 'gaearon'))
    ) or (
      b.slug = 'student-builders' and (s.value in ('fatimamadey', 'supabase/supabase', 'tailwindlabs/tailwindcss'))
    ) or (
      b.slug = 'design-engineering' and (s.value in ('shadcn-ui/ui', 'tailwindlabs/tailwindcss', 'addyosmani', 'vercel/next.js'))
    )
)
insert into board_sources (board_id, source_id, added_by_user_id)
select board_id, source_id, added_by_user_id
from board_source_map
on conflict (board_id, source_id) do nothing;
