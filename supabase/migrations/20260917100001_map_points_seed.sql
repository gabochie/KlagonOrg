-- ============================================================
-- KlagonStudios - map_points seed (Klagon community POIs)
-- Source: OpenStreetMap (ODbL) via Overpass API, fetched
-- 2026-09-17 by scripts/fetch-klagon-osm.cjs.
-- Idempotent: osm-sourced rows are dropped then re-inserted so this
-- migration can safely replace itself. Manually added / reported
-- points (source <> 'osm') are never touched.
-- ============================================================

delete from public.map_points where source = 'osm';

insert into public.map_points
  (entity_type, entity_id, name, description, category, latitude, longitude,
   community_area, severity, icon, status, source)
values
  ('business', NULL, 'Agapet', 'From OpenStreetMap - Fuel Station in the Klagon area.', 'Fuel Station', 5.6692406, -0.0474157, 'Klagon', NULL, '⛽', 'approved', 'osm'),
  ('business', NULL, 'Fuel Station (Klagon)', 'From OpenStreetMap - Fuel Station in the Klagon area.', 'Fuel Station', 5.6613611, -0.0702562, 'Greater Klagon', NULL, '⛽', 'approved', 'osm'),
  ('business', NULL, 'Fuel Station (Klagon)', 'From OpenStreetMap - Fuel Station in the Klagon area.', 'Fuel Station', 5.6779698, -0.0465296, 'Greater Klagon', NULL, '⛽', 'approved', 'osm'),
  ('business', NULL, 'Gaso', 'From OpenStreetMap - Fuel Station in the Klagon area.', 'Fuel Station', 5.6600369, -0.0519814, 'Klagon', NULL, '⛽', 'approved', 'osm'),
  ('business', NULL, 'Goil', 'From OpenStreetMap - Fuel Station in the Klagon area.', 'Fuel Station', 5.6621246, -0.0656783, 'Klagon', NULL, '⛽', 'approved', 'osm'),
  ('business', NULL, 'Nshira Lodge', 'From OpenStreetMap - Guest House in the Klagon area.', 'Guest House', 5.6585163, -0.0664828, 'Greater Klagon', NULL, '🏨', 'approved', 'osm'),
  ('business', NULL, 'SOC', 'From OpenStreetMap - Fuel Station in the Klagon area.', 'Fuel Station', 5.6578484, -0.0524417, 'Klagon', NULL, '⛽', 'approved', 'osm'),
  ('business', NULL, 'Top Oil', 'From OpenStreetMap - Fuel Station in the Klagon area.', 'Fuel Station', 5.6762679, -0.0442892, 'Greater Klagon', NULL, '⛽', 'approved', 'osm'),
  ('business', NULL, 'Total', 'From OpenStreetMap - Fuel Station in the Klagon area.', 'Fuel Station', 5.6720415, -0.0460014, 'Klagon', NULL, '⛽', 'approved', 'osm'),
  ('facility', NULL, 'Sports Ground (Klagon)', 'From OpenStreetMap - Sports Ground in the Klagon area.', 'Sports Ground', 5.6482519, -0.0518474, 'Greater Klagon', NULL, '⚽', 'approved', 'osm'),
  ('facility', NULL, 'Sports Ground (Klagon)', 'From OpenStreetMap - Sports Ground in the Klagon area.', 'Sports Ground', 5.6483206, -0.05211, 'Greater Klagon', NULL, '⚽', 'approved', 'osm'),
  ('facility', NULL, 'Sports Ground (Klagon)', 'From OpenStreetMap - Sports Ground in the Klagon area.', 'Sports Ground', 5.6483985, -0.0522924, 'Greater Klagon', NULL, '⚽', 'approved', 'osm'),
  ('faith', NULL, 'Church of Pentecost', 'From OpenStreetMap - Place of Worship in the Klagon area.', 'Place of Worship', 5.6787023, -0.0591544, 'Greater Klagon', NULL, '⛪', 'approved', 'osm'),
  ('faith', NULL, 'Corpus Christy Church', 'From OpenStreetMap - Place of Worship in the Klagon area.', 'Place of Worship', 5.6546334, -0.0670386, 'Greater Klagon', NULL, '⛪', 'approved', 'osm'),
  ('faith', NULL, 'Deeper life church', 'From OpenStreetMap - Place of Worship in the Klagon area.', 'Place of Worship', 5.6786031, -0.0628087, 'Greater Klagon', NULL, '⛪', 'approved', 'osm'),
  ('faith', NULL, 'Kingsthrone Chapel', 'From OpenStreetMap - Place of Worship in the Klagon area.', 'Place of Worship', 5.6610374, -0.0488143, 'Klagon', NULL, '⛪', 'approved', 'osm'),
  ('faith', NULL, 'Kingsthrone School and Church', 'From OpenStreetMap - Place of Worship in the Klagon area.', 'Place of Worship', 5.6606977, -0.0474243, 'Klagon', NULL, '⛪', 'approved', 'osm'),
  ('faith', NULL, 'Place of Worship (Klagon)', 'From OpenStreetMap - Place of Worship in the Klagon area.', 'Place of Worship', 5.6494752, -0.0635003, 'Greater Klagon', NULL, '⛪', 'approved', 'osm'),
  ('faith', NULL, 'The Church of Pentecost, Lashibi, Upper Room Assembly', 'From OpenStreetMap - Place of Worship in the Klagon area.', 'Place of Worship', 5.6635908, -0.0458241, 'Klagon', NULL, '⛪', 'approved', 'osm'),
  ('governance', NULL, 'Klagon Police Station', 'From OpenStreetMap - Police Station in the Klagon area.', 'Police Station', 5.6607013, -0.0517496, 'Klagon', NULL, '🚔', 'approved', 'osm'),
  ('governance', NULL, 'Police Station (Klagon)', 'From OpenStreetMap - Police Station in the Klagon area.', 'Police Station', 5.6604729, -0.0518273, 'Klagon', NULL, '🚔', 'approved', 'osm'),
  ('health', NULL, 'Capa Chemist', 'From OpenStreetMap - Pharmacy in the Klagon area.', 'Pharmacy', 5.6520731, -0.0640532, 'Greater Klagon', NULL, '💊', 'approved', 'osm'),
  ('health', NULL, 'Charis Pharma', 'From OpenStreetMap - Pharmacy in the Klagon area.', 'Pharmacy', 5.6776032, -0.0467172, 'Greater Klagon', NULL, '💊', 'approved', 'osm'),
  ('health', NULL, 'Klagon Maternity Home and Clinic', 'From OpenStreetMap - Health Facility in the Klagon area.', 'Health Facility', 5.6646743, -0.0499192, 'Klagon', NULL, '🗥', 'approved', 'osm'),
  ('health', NULL, 'Rhino Pharmacy', 'From OpenStreetMap - Pharmacy in the Klagon area.', 'Pharmacy', 5.6537763, -0.0641564, 'Greater Klagon', NULL, '💊', 'approved', 'osm'),
  ('school', NULL, 'Adjei Kojo TWMA 2 Basic', 'From OpenStreetMap - School in the Klagon area.', 'School', 5.6803444, -0.0557155, 'Greater Klagon', NULL, '🏫', 'approved', 'osm'),
  ('school', NULL, 'Barbies Learning Center', 'From OpenStreetMap - School in the Klagon area.', 'School', 5.6564024, -0.0654207, 'Greater Klagon', NULL, '🏫', 'approved', 'osm'),
  ('school', NULL, 'Burgain International School', 'From OpenStreetMap - School in the Klagon area.', 'School', 5.6563597, -0.0663433, 'Greater Klagon', NULL, '🏫', 'approved', 'osm'),
  ('school', NULL, 'Eagle Nest Academy', 'From OpenStreetMap - School in the Klagon area.', 'School', 5.6756989, -0.0618354, 'Greater Klagon', NULL, '🏫', 'approved', 'osm'),
  ('school', NULL, 'School (Klagon)', 'From OpenStreetMap - School in the Klagon area.', 'School', 5.6788691, -0.0589084, 'Greater Klagon', NULL, '🏫', 'approved', 'osm'),
  ('school', NULL, 'Yesu Mo School', 'From OpenStreetMap - School in the Klagon area.', 'School', 5.6761486, -0.0611442, 'Greater Klagon', NULL, '🏫', 'approved', 'osm'),
  ('community', NULL, 'Klagon Community Hub', 'Klagon''s community hub for learning, projects and events.', 'Community Hub', 5.6637468, -0.0533245, 'Klagon', NULL, '🏠', 'approved', 'manual');