$ErrorActionPreference = "Stop"
$src = "C:\Users\user\Desktop\GABOCHIE CORP\KLAGON OPERATIONS\klagon.org\supabase\migrations\20260914200000_fix_lessons_content_base64.sql"
$out = "C:\Users\user\Desktop\GABOCHIE CORP\KLAGON OPERATIONS\klagon.org\supabase\migrations\20260914203000_fix_lessons_content_by_title_with_norm.sql"

$text = [System.IO.File]::ReadAllText($src)
$v = $text.IndexOf("values")
if ($v -lt 0) { throw "NO_VALUES" }
$tail = $text.Substring($v)

$rowRe = New-Object System.Text.RegularExpressions.Regex("\(\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*convert_from\(decode\('([A-Za-z0-9+/=]+)'\s*,\s*'base64'\)\s*,\s*'utf8'\)\s*\)")
$ms = $rowRe.Matches($tail)
$rows = New-Object System.Collections.Generic.List[string]
foreach ($m in $ms) {
  $lesson = $m.Groups[2].Value
  $b64 = $m.Groups[3].Value
  $esc = $lesson -replace "'", "''"
  $rows.Add("  ('$esc', convert_from(decode('$b64', 'base64'), 'utf8'))")
}
$n = $rows.Count

$sb = New-Object System.Text.StringBuilder
[void]$sb.AppendLine("-- ============================================================")
[void]$sb.AppendLine("-- KlagonOrg — Lessons content, keyed by LESSON TITLE")
[void]$sb.AppendLine("-- ============================================================")
[void]$sb.AppendLine("-- FAILED BEFORE because: (1) hardcoded uuid seeds matched 0")
[void]$sb.AppendLine("-- rows; (2) (course,lesson) pairs lost on dash-glyph mismatch")
[void]$sb.AppendLine("-- (your live DB mixes '-' and em-dash '—').")
[void]$sb.AppendLine("-- THIS VERSION: all 13 lesson titles are unique, so we key on")
[void]$sb.AppendLine("-- title alone and normalize the dash in SQL (em-dash and")
[void]$sb.AppendLine("-- hyphen become equal). No course join, no uuid, nothing to")
[void]$sb.AppendLine("-- mismatch. Content travels as base64 (no dollar signs).")
[void]$sb.AppendLine("-- Idempotent. Safe to re-run.")
[void]$sb.AppendLine("")
[void]$sb.AppendLine("with lesson_content(c_lesson, body) as (")
[void]$sb.AppendLine("  values")
[void]$sb.AppendLine(($rows -join ",`r`n"))
[void]$sb.AppendLine(")")
[void]$sb.AppendLine("update public.lessons l")
[void]$sb.AppendLine("set content = lc.body")
[void]$sb.AppendLine("from lesson_content lc")
[void]$sb.AppendLine("where lower(regexp_replace(l.title,  '[\u2014\u2013]', '-')) = lower(regexp_replace(lc.c_lesson, '[\u2014\u2013]', '-'));")
[void]$sb.AppendLine("")
[void]$sb.AppendLine("-- ---- proof query (run after) ----")
[void]$sb.AppendLine("-- select title, (content is not null) as has_content from public.lessons order by sort_order;")

[System.IO.File]::WriteAllText($out, $sb.ToString(), (New-Object System.Text.UTF8Encoding($false)))
$dollar = ([regex]::Matches([System.IO.File]::ReadAllText($out), '\$')).Count
Write-Output ("ROWS=" + $n + "  DOLLARS=" + $dollar + "  OUT=" + (Test-Path -LiteralPath $out))
