$ErrorActionPreference = "Stop"
$src = "C:\Users\user\Desktop\GABOCHIE CORP\KLAGON OPERATIONS\klagon.org\supabase\migrations\20260914200000_fix_lessons_content_base64.sql"
$out = "C:\Users\user\Desktop\GABOCHIE CORP\KLAGON OPERATIONS\klagon.org\supabase\migrations\20260914210000_fix_lessons_content_title_keyed_norm.sql"

$text = [System.IO.File]::ReadAllText($src)
$dollarCheck = ([regex]::Matches($text, '\$')).Count
if ($dollarCheck -ne 0) { throw "SRC_HAS_DOLLARS=$dollarCheck" }

$v = $text.IndexOf("values")
if ($v -lt 0) { throw "NO_VALUES" }
$tail = $text.Substring($v)

$rowRe = New-Object System.Text.RegularExpressions.Regex("\(\s*'([^']*)'\s*,\s*'([^']*)'\s*,\s*convert_from\(decode\('([A-Za-z0-9+/=]+)'\s*,\s*'base64'\)\s*,\s*'utf8'\)\s*\)")
$ms = $rowRe.Matches($tail)
$n = $ms.Count
if ($n -ne 13) { throw "EXPECTED_13_GOT_$n" }

$rows = New-Object System.Collections.Generic.List[string]
foreach ($m in $ms) {
  $lesson = $m.Groups[2].Value
  $b64 = $m.Groups[3].Value
  $esc = $lesson -replace "'", "''"
  $norm = "regexp_replace(regexp_replace(lower('$esc'), chr(8212), '-', 'g'), chr(8211), '-', 'g')"
  $rows.Add("  (" + $norm + ", convert_from(decode('$b64', 'base64'), 'utf8'))")
}

$sb = New-Object System.Text.StringBuilder
[void]$sb.AppendLine("-- ============================================================")
[void]$sb.AppendLine("-- KlagonOrg — Lessons: seed content keyed by NORMALIZED title")
[void]$sb.AppendLine("-- ============================================================")
[void]$sb.AppendLine("-- WHAT'S DIFFERENT THIS TIME")
[void]$sb.AppendLine("--   Every previous attempt keyed content by a hardcoded uuid")
[void]$sb.AppendLine("--   (matched 0 rows) or by an exact title/course JOIN that")
[void]$sb.AppendLine("--   broke whenever the live DB used a hyphen where the seed")
[void]$sb.AppendLine("--   used an em-dash (or vice-versa) — a silent 0-row match.")
[void]$sb.AppendLine("--")
[void]$sb.AppendLine("--   This version keys on LESSON TITLE ONLY (titles are unique")
[void]$sb.AppendLine("--   across all 13 lessons) and FOLDS the em-dash/endash/hyphen")
[void]$sb.AppendLine("--   difference to a plain '-' on both sides, inside SQL")
[void]$sb.AppendLine("--   (chr(8212)=— , chr(8211)=–). So a dash glyph mismatch can")
[void]$sb.AppendLine("--   never cause a silent miss again: the comparison erases")
[void]$sb.AppendLine("--   the difference before it can matter.")
[void]$sb.AppendLine("--")
[void]$sb.AppendLine("--   Content travels as base64 (letters/digits/+//= only).")
[void]$sb.AppendLine("--   No dollar signs anywhere. Idempotent. Safe to re-run.")
[void]$sb.AppendLine("with lesson_content(c_lesson, body) as (")
[void]$sb.AppendLine("  values")
[void]$sb.AppendLine(($rows -join ",`r`n"))
[void]$sb.AppendLine(")")
[void]$sb.AppendLine("update public.lessons l")
[void]$sb.AppendLine("set content = lc.body")
[void]$sb.AppendLine("from lesson_content lc")
[void]$sb.AppendLine("where")
[void]$sb.AppendLine("  regexp_replace(regexp_replace(lower(l.title), chr(8212), '-', 'g'), chr(8211), '-', 'g')")
[void]$sb.AppendLine("  = lc.c_lesson;")
[void]$sb.AppendLine("")
[void]$sb.AppendLine("-- verify:")
[void]$sb.AppendLine("-- select title, (content is not null) as has_content from public.lessons order by sort_order;")

[System.IO.File]::WriteAllText($out, $sb.ToString(), (New-Object System.Text.UTF8Encoding($false)))

$ob = [System.IO.File]::ReadAllBytes($out)
$ot = [System.Text.Encoding]::UTF8.GetString($ob)
$d = ([regex]::Matches($ot, '\$')).Count
$rowsOut = ([regex]::Matches($ot, "\('")).Count
Write-Output ("ROWS_IN=$n  ROWS_OUT=$rowsOut  DOLLARS_OUT=$d  OUT=" + (Test-Path -LiteralPath $out))
