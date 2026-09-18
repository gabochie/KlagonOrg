-- Klagon Map — external stable key for imported points.
--
-- `map_points.entity_id` is a uuid reserved as a foreign key to domain
-- entities (e.g. projects.id). Import pipelines (OSM staging, business
-- registry) need a TEXT stable key for dedupe instead — hence a separate
-- nullable `external_id` (e.g. 'osm:way788490441'), unique where present.
-- The public view is unchanged: external keys stay internal.

alter table public.map_points
  add column if not exists external_id text;

create unique index if not exists map_points_external_id_uidx
  on public.map_points (external_id)
  where external_id is not null;
