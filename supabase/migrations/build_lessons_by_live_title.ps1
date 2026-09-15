$ErrorActionPreference = "Stop"

$src = "C:\Users\user\Desktop\GABOCHIE CORP\KLAGON OPERATIONS\klagon.org\supabase\migrations\20260914200000_fix_lessons_content_base64.sql"
$out = "C:\Users\user\Desktop\GABOCHIE CORP\KLAGON OPERATIONS\klagon.org\supabase\migrations\20260914210000_fix_lessons_content_by_live_title.sql"

$text = [System.IO.File]::ReadAllText($src)
$lineStart = $text.IndexOf("with lesson_content")
$valuesStart = $text.IndexOf("  values", $lineStart)
$valuesText = $text.Substring($valuesStart)

$regex = [regex]"\(\s*'((?:[^']|'')*)'\s*,\s*'((?:[^']|'')*)'\s*,\s*convert_from\(decode\('([A-Za-z0-9+/=]+)'\s*,\s*'base64'\)\s*,\s*'utf8'\)\s*\)"
$matches = $regex.Matches($valuesText)

$filePairs = @{}
foreach ($m in $matches) {
  $course = $m.Groups[1].Value -replace "''", "'"
  $lesson = $m.Groups[2].Value -replace "''", "'"
  $b64 = $m.Groups[3].Value
  $filePairs[$lesson] = $b64
}

function NormTitle($t) {
  return ($t -replace '[—–]', '-' -replace '\s+', ' ' -replace '^ +| +$', '').ToLowerInvariant()
}

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

$sb = New-Object System.Text.StringBuilder
[void]$sb.AppendLine("-- ============================================================")
[void]$sb.AppendLine("-- KlagonOrg - Lessons: seed content keyed by EXACT live lesson title")
[void]$sb.AppendLine("-- ============================================================")
[void]$sb.AppendLine("-- WHY THIS VERSION (final)")
[void]$sb.AppendLine("--   The 13 lesson titles in the live DB are UNIQUE. So we key")
[void]$sb.AppendLine("--   purely on title - no course join, no sort_order (6 lessons")
[void]$sb.AppendLine("--   share sort_order = 0 in the live data). Bodies travel as")
[void]$sb.AppendLine("--   base64 (no dollar signs, nothing that can be mangled) and")
[void]$sb.AppendLine("--   decode in the database. Idempotent, safe to re-run.")
[void]$sb.AppendLine()
[void]$sb.AppendLine("with lesson_body(c_lesson, body) as (")
[void]$sb.AppendLine("  values")

$rows = New-Object System.Collections.Generic.List[string]
$missed = @()
foreach ($t in $liveTitles) {
  $nt = NormTitle $t
  $b64 = $null
  foreach ($k in $filePairs.Keys) {
    if ((NormTitle $k) -eq $nt) { $b64 = $filePairs[$k]; break }
  }
  if (-not $b64) { $missed += $t; continue }
  $esc = $t -replace "'", "''"
  $rows.Add("  ('$esc', convert_from(decode('$b64', 'base64'), 'utf8'))")
}

[void]$sb.AppendLine(($rows -join ",`r`n"))
[void]$sb.AppendLine(")")
[void]$sb.AppendLine("update public.lessons l")
[void]$sb.AppendLine("set content = lc.body")
[void]$sb.AppendLine("from lesson_body lc")
[void]$sb.AppendLine("where l.title = lc.c_lesson;")

[System.IO.File]::WriteAllText($out, $sb.ToString(), (New-Object System.Text.UTF8Encoding($false)))

$check = [System.IO.File]::ReadAllText($out)
$dollarCount = ([regex]::Matches($check, '\$')).Count
$b64count = ([regex]::Matches($check, "decode\('")).Count
Write-Output ("FILE_ROWS=" + $filePairs.Count + "  OUT_ROWS=" + $rows.Count + "  MIssed=" + ($missed -join '|') + "  DECODE=" + $b64count + "  DOLLARS=" + $dollarCount)
