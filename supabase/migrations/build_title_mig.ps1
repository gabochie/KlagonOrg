$ErrorActionPreference = "Stop"
$src = "C:\Users\user\Desktop\GABOCHIE CORP\KLAGON OPERATIONS\klagon.org\supabase\migrations\20260914200000_fix_lessons_content_base64.sql"
$out = "C:\Users\user\Desktop\GABOCHIE CORP\KLAGON OPERATIONS\klagon.org\supabase\migrations\20260914203000_fix_lessons_content_by_live_title.sql"

$text = [System.IO.File]::ReadAllText($src)
$v = $text.IndexOf("values")
if ($v -lt 0) { throw "NO_VALUES" }
$tail = $text.Substring($v)

$re = [regex]"[regex]Regex"
# per-row: ('course','lesson', convert_from(decode('base64','base64'),'utf8'))
$rowRe = New-Object System.Text.RegularExpressions.Regex("\('([^']*)',\s*'([^']*)',\s*convert_from\(decode\('([A-Za-z0-9+/=]+)','base64'\)\s*,\s*'utf8'\)\),?\s*")
$ms = $rowRe.Matches($tail)
$pairs = @{}
foreach ($m in $ms) {
    $course = $m.Groups[1].Value
    $lesson = $m.Groups[2].Value
    $b64 = $m.Groups[3].Value
    $pairs[$lesson] = @($course, $b64)
}
$pairCount = $pairs.Count

$liveTitles = @(
'Financial Literacy Basics — Getting Started',
'Leadership Foundations — Getting Started',
'Communication That Wins — Getting Started',
'Build Your Career Roadmap — Getting Started',
'Launch a Real Side Business in 90 Days - Getting Started',
'Introduction to AI — Getting Started',
'Find a Problem Worth Solving',
'Pick One Idea and Back It with Evidence',
'Price It Without Guessing',
'Sell Your First One',
'Keep the Money Straight',
'Make It Repeatable',
'Capstone - Your Proof'
)

$rows = New-Object System.Collections.Generic.List[string]
$missed = @()
foreach ($t in $liveTitles) {
    $key = $null
    foreach ($k in $pairs.Keys) {
        if ($k -eq $t) { $key = $k; break }
    }
    if (-not $key) { $missed += $t; continue }
    $b64 = $pairs[$key][1]
    $esc = $t -replace "'", "''"
    $rows.Add("  ('$esc', convert_from(decode('$b64', 'base64'), 'utf8'))")
}

$sb = New-Object System.Text.StringBuilder
[void]$sb.AppendLine("-- ============================================================")
[void]$sb.AppendLine("-- KlagonOrg - Lessons: seed content keyed by EXACT lesson title")
[void]$sb.AppendLine("-- ============================================================")
[void]$sb.AppendLine("-- 13 live lessons, 13 unique titles -> key purely on title.")
[void]$sb.AppendLine("-- Bodies travel as base64 (no dollar signs - nothing to corrupt).")
[void]$sb.AppendLine("-- Idempotent. Safe to re-run.")
[void]$sb.AppendLine()
[void]$sb.AppendLine("with lesson_body(c_lesson, body) as (")
[void]$sb.AppendLine("  values")
[void]$sb.AppendLine(($rows -join ",`r`n"))
[void]$sb.AppendLine(")")
[void]$sb.AppendLine("update public.lessons l")
[void]$sb.AppendLine("set content = lc.body")
[void]$sb.AppendLine("from lesson_body lc")
[void]$sb.AppendLine("where l.title = lc.c_lesson;")

[System.IO.File]::WriteAllText($out, $sb.ToString(), (New-Object System.Text.UTF8Encoding($false)))
$check = [System.IO.File]::ReadAllText($out)
$dollar = ([regex]::Matches($check, '\$')).Count
Write-Output ("SOURCE_PAIRS=" + $pairCount + "  OUT_ROWS=" + $rows.Count + "  MISSED=" + ($missed -join '|') + "  DOLLAR_SIGNS=" + $dollar)
$o = [System.IO.File]::ReadAllText($src) ; 