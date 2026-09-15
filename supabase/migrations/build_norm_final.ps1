$ErrorActionPreference = "Stop"
$srcdir = "C:\Users\user\Desktop\GABOCHIE CORP\KLAGON OPERATIONS\klagon.org\supabase\migrations"
$inFile  = Join-Path $srcdir "20260914200000_fix_lessons_content_base64.sql"
$outFile = Join-Path $srcdir "20260914210000_fix_lessons_content_by_title_normalized.sql"

$text = [System.IO.File]::ReadAllText($inFile)
$v = $text.IndexOf("values")
if ($v -lt 0) { throw "NO_VALUES" }
$tail = $text.Substring($v)

$rowRe = New-Object System.Text.RegularExpressions.Regex("\(\s*'([^']*)'\s*,\s*'([^']*)'\s*,\s*convert_from\(decode\('([A-Za-z0-9+/=]+)'\s*,\s*'base64'\)\s*,\s*'utf8'\)\s*\)")
$ms = $rowRe.Matches($tail)
$rows = New-Object System.Collections.Generic.List[string]
$bodies = New-Object System.Collections.Generic.List[string]

foreach ($m in $ms) {
    $course = $m.Groups[1].Value
    $lesson = $m.Groups[2].Value
    $b64    = $m.Groups[3].Value
    $bodies.Add($b64)
    $esc = $lesson -replace "'", "''"
    $rows.Add(("  ('" + $esc + "', convert_from(decode('" + $b64 + "', 'base64'), 'utf8'))"))
}

$sb = New-Object System.Text.StringBuilder
[void]$sb.AppendLine("-- ============================================================")
[void]$sb.AppendLine("-- KlagonOrg — Lessons: seed content, keyed by LESSON TITLE only")
[void]$sb.AppendLine("-- ============================================================")
[void]$sb.AppendLine("-- WHY KEY BY TITLE ALONE:")
[void]$sb.AppendLine("--   All 13 lesson titles are unique across courses, so a title")
[void]$sb.AppendLine("--   is a collision-proof handle by itself. We drop the course")
[void]$sb.AppendLine("--   join entirely, which kills the em-dash-vs-hyphen mismatch")
[void]$sb.AppendLine("--   that silently zero-matched previous attempts.")
[void]$sb.AppendLine("-- DASH NORMALIZATION:")
[void]$sb.AppendLine("--   Live rows use a MIX of '-' and the em-dash '\u2014'. We")
[void]$sb.AppendLine("--   normalize BOTH sides (lower + dash fold) inside SQL so")
[void]$sb.AppendLine("--   the two are byte-invisible and comparison always hits.")
[void]$sb.AppendLine("--   Idempotent, safe to re-run.")
[void]$sb.AppendLine()
[void]$sb.AppendLine("with lesson_body(c_lesson, body) as (")
[void]$sb.AppendLine("  values")
[void]$sb.AppendLine(($rows -join ",`r`n"))
[void]$sb.AppendLine(")")
[void]$sb.AppendLine("update public.lessons l")
[void]$sb.AppendLine("set content = lb.body")
[void]$sb.AppendLine("from lesson_body lb")
[void]$sb.AppendLine("where lower(replace(replace(l.title, E'\u2014', '-'), E'\u2013', '-')) = lower(replace(replace(lb.c_lesson, E'\u2014', '-'), E'\u2013', '-'));")

[void]$sb.AppendLine()
[void]$sb.AppendLine("-- proof:")
[void]$sb.AppendLine("-- select title, (content is not null) as has_content from public.lessons order by sort_order;")

[System.IO.File]::WriteAllText($outFile, $sb.ToString(), (New-Object System.Text.UTF8Encoding($false)))

$a = [System.IO.File]::ReadAllBytes($outFile)
$c = [System.Text.Encoding]::UTF8.GetString($a)
$n = ([regex]::Matches($c, "convert_from\(decode\(")).Count
$d = ([regex]::Matches($c, "\$")).Count
Write-Output ("OUT_ROWS=" + $n + "  DOLLARS=" + $d + "  OUT_EXISTS=" + (Test-Path -LiteralPath $outFile))
