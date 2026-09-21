-- ============================================================
-- Property seeds: listing_type backfill + body whitespace cleanup.
--
-- 1. The Properties vertical requires details.listing_type
--    (rent | sale | short_stay — see fields.ts). Derive it from the
--    deal/period markers the seed carried.
-- 2. Join wrapped lines in seed bodies (SQL heredoc indentation left
--    "newline + spaces" inside paragraphs). Paragraph breaks survive
--    via a unit-separator placeholder; runs of spaces collapse.
-- Scoped to seeded rows only (details ? 'deal').
-- ============================================================

update public.posts
set details = details || jsonb_build_object(
  'listing_type',
  case
    when details ->> 'period' = 'day' then 'short_stay'
    when details ->> 'deal' = 'sale' then 'sale'
    else 'rent'
  end
)
where type = 'classified'
  and category = 'Properties'
  and details ? 'deal'
  and not (details ? 'listing_time')
  and not (details ? 'listing_type');

update public.posts
set body = regexp_replace(
  replace(
    replace(
      replace(body, E'\n\n', chr(31)),
      E'\n', ' '
    ),
    chr(31), E'\n\n'
  ),
  ' {2,}', ' ', 'g'
)
where type = 'classified'
  and category = 'Properties'
  and details ? 'deal'
  and body like '%' || chr(10) || '%';
