insert into cta_stations (map_id, stop_name, lines, directions, display_order)
values
  ('41320', 'Belmont', '{Red,Brown}', '{Northbound,Southbound}', 1),
  ('41200', 'Argyle', '{Red}', '{Northbound,Southbound}', 2),
  ('41220', 'Fullerton', '{Red,Brown}', '{Northbound,Southbound}', 3),
  ('40380', 'Clark/Lake', '{Blue,Brown}', '{Northbound,Southbound,Eastbound,Westbound}', 4),
  ('40320', 'UIC-Halsted', '{Blue}', '{Eastbound,Westbound}', 5)
on conflict (map_id) do update set
  stop_name = excluded.stop_name,
  lines = excluded.lines,
  directions = excluded.directions,
  display_order = excluded.display_order,
  is_active = true;
