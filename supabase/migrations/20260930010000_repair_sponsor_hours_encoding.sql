-- ---------------------------------------------------------------------------
-- Repair en-dash mojibake in sponsor opening hours.
--
-- How this happened: sponsor rows were imported through a tool that decoded
-- the file as cp1252 instead of UTF-8, so every en dash was stored as its
-- three cp1252-decoded bytes. It renders as garbage on the public sponsor
-- profile pages (/business/<slug>).
--
-- U+2013 (en dash) is E2 80 93 in UTF-8. Read as cp1252 those three bytes
-- decode to U+00E2 U+20AC U+201C, which is what sits in the column today.
-- That exact three-character sequence is the only thing rewritten here: a
-- blanket re-encode would also mangle legitimately stored text, and sponsor
-- copy is hand-edited business data that must not be guessed at.
--
-- This file is deliberately pure ASCII. The corruption was caused by a tool
-- re-encoding bytes on the way in and out, so the fix must not itself depend
-- on raw non-ASCII surviving the round trip. Postgres U&'...' escapes let the
-- literals be written as code points instead.
-- ---------------------------------------------------------------------------

do $$
declare
  v_bad text := U&'\00E2\20AC\201C'; -- a-circumflex + euro sign + left double quote
  v_fix text := U&'\2013';           -- the en dash that was meant
  v_count int;
  v_left int;
begin
  -- position() rather than LIKE: no wildcard semantics to reason about, so a
  -- '%' or '_' inside the bad sequence can never widen the match.
  update public.sponsors
     set opening_hours = replace(opening_hours, v_bad, v_fix),
         updated_at = now()
   where opening_hours is not null
     and position(v_bad in opening_hours) > 0;

  get diagnostics v_count = row_count;
  raise notice 'sponsor opening_hours: repaired % row(s)', v_count;

  -- Safety net. If the literal above were ever wrong this update would match
  -- nothing and exit 0, which is the worst kind of failure for a data repair:
  -- it looks like it worked. Warn loudly instead if any bad bytes survive.
  select count(*) into v_left
    from public.sponsors
   where position(v_bad in opening_hours) > 0;

  if v_left > 0 then
    raise warning 'sponsor opening_hours: % row(s) still contain the bad sequence; pattern needs extending', v_left;
  end if;
end;
$$;
